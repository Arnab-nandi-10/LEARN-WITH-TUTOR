import apiClient, { handleApiError } from './client';
import type {
  Question,
  QuestionFormData,
  QuestionOption,
  QuestionOptionInput,
} from '../types';

// ============================================================
// QUESTION API SERVICES
// ============================================================

const normalizeQuestionOption = (option: QuestionOptionInput): QuestionOption => {
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

const buildQuestionPayload = (data: QuestionFormData) => ({
  ...data,
  options: data.options.map((option) => normalizeQuestionOption(option)),
});

/**
 * Add question to exam (Faculty only)
 * Backend: POST /api/questions
 */
export const addQuestion = async (data: QuestionFormData): Promise<Question> => {
  try {
    const response = await apiClient.post('/api/questions', buildQuestionPayload(data));
    return normalizeQuestion(response.data.data);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Update question (Faculty only)
 * Backend: PATCH /api/questions/:id
 */
export const updateQuestion = async (
  questionId: string,
  data: Partial<QuestionFormData>
): Promise<Question> => {
  try {
    const payload =
      data.options === undefined
        ? data
        : {
            ...data,
            options: data.options.map((option) => normalizeQuestionOption(option)),
          };
    const response = await apiClient.patch(`/api/questions/${questionId}`, payload);
    return normalizeQuestion(response.data.data);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Delete question (Faculty only)
 * Backend: DELETE /api/questions/:id
 */
export const deleteQuestion = async (questionId: string): Promise<void> => {
  try {
    await apiClient.delete(`/api/questions/${questionId}`);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get questions for exam
 * Helper - questions are returned with GET /api/exams/:id
 */
export const getExamQuestions = async (examId: string): Promise<Question[]> => {
  try {
    // Import here to avoid circular dependency
    const { getExam } = await import('./exams');
    const examWithQuestions = await getExam(examId);
    return examWithQuestions.questions || [];
  } catch (error) {
    throw handleApiError(error);
  }
};
