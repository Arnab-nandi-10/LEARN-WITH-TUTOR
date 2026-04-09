import apiClient, { handleApiError } from './client';
import type {
  Exam,
  ExamAttempt,
  ExamFormData,
  ExamWithQuestions,
  Question,
  QuestionOption,
} from '../types';

// ============================================================
// EXAM API SERVICES
// ============================================================

const normalizeQuestionOption = (
  option: QuestionOption | string | null | undefined
): QuestionOption => {
  if (typeof option === 'string') {
    return { text: option };
  }

  return {
    text: option?.text || '',
  };
};

const normalizeQuestion = (question: Question): Question => ({
  ...question,
  options: Array.isArray(question.options)
    ? question.options.map((option) => normalizeQuestionOption(option))
    : [],
});

const normalizeExam = (exam: Exam): Exam => ({
  ...exam,
  module_id: exam.module_id || undefined,
  time_limit: exam.time_limit ?? exam.duration_minutes,
  passing_marks: exam.passing_marks ?? 0,
});

const buildExamPayload = (data: ExamFormData) => {
  const timeLimit = data.time_limit ?? data.duration_minutes;

  return {
    title: data.title,
    course_id: data.course_id,
    ...(data.module_id ? { module_id: data.module_id } : {}),
    ...(data.total_marks !== undefined ? { total_marks: data.total_marks } : {}),
    ...(timeLimit !== undefined ? { time_limit: timeLimit } : {}),
    ...(data.passing_marks !== undefined ? { passing_marks: data.passing_marks } : {}),
  };
};

const buildExamUpdatePayload = (data: Partial<ExamFormData>) => {
  const timeLimit = data.time_limit ?? data.duration_minutes;

  return {
    ...(data.title !== undefined ? { title: data.title } : {}),
    ...(data.course_id !== undefined ? { course_id: data.course_id } : {}),
    ...(data.module_id !== undefined ? { module_id: data.module_id } : {}),
    ...(data.total_marks !== undefined ? { total_marks: data.total_marks } : {}),
    ...(timeLimit !== undefined ? { time_limit: timeLimit } : {}),
    ...(data.passing_marks !== undefined ? { passing_marks: data.passing_marks } : {}),
  };
};

/**
 * Create a new exam (Faculty only)
 * Backend: POST /api/exams
 */
export const createExam = async (data: ExamFormData): Promise<Exam> => {
  try {
    const response = await apiClient.post('/api/exams', buildExamPayload(data));
    return normalizeExam(response.data.data);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Update exam (Faculty only)
 * Backend: PUT /api/exams/:id
 */
export const updateExam = async (
  examId: string,
  data: Partial<ExamFormData>
): Promise<Exam> => {
  try {
    const response = await apiClient.put(
      `/api/exams/${examId}`,
      buildExamUpdatePayload(data)
    );
    return normalizeExam(response.data.data);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Delete exam (Faculty only)
 * Backend: DELETE /api/exams/:id
 */
export const deleteExam = async (examId: string): Promise<void> => {
  try {
    await apiClient.delete(`/api/exams/${examId}`);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get exam with all questions
 * Backend: GET /api/exams/:id
 * Returns: { exam, questions }
 */
export const getExam = async (examId: string): Promise<ExamWithQuestions> => {
  try {
    const response = await apiClient.get(`/api/exams/${examId}`);
    const { exam, questions } = response.data.data;
    return {
      ...normalizeExam(exam),
      questions: Array.isArray(questions)
        ? questions.map((question: Question) => normalizeQuestion(question))
        : [],
    };
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get all exams for a course
 * Backend: GET /api/exams/course/:course_id
 */
export const getCourseExams = async (courseId: string): Promise<Exam[]> => {
  try {
    const response = await apiClient.get(`/api/exams/course/${courseId}`);
    return Array.isArray(response.data.data)
      ? response.data.data.map((exam: Exam) => normalizeExam(exam))
      : [];
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get exam questions
 * Helper function - questions are returned with getExam()
 */
export const getExamQuestions = async (examId: string): Promise<Question[]> => {
  try {
    const examWithQuestions = await getExam(examId);
    return examWithQuestions.questions || [];
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get exam attempts (for faculty to see student attempts)
 * Backend: GET /api/attempts/exam/:exam_id
 */
export const getStudentExamAttempts = async (
  examId: string
): Promise<ExamAttempt[]> => {
  try {
    const response = await apiClient.get(`/api/attempts/exam/${examId}`);
    const data = response.data.data;
    return Array.isArray(data) ? data : data ? [data] : [];
  } catch (error) {
    throw handleApiError(error);
  }
};
