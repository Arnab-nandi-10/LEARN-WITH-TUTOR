'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  BookOpen,
  ClipboardList,
  Clock3,
  FileQuestion,
  GraduationCap,
  Loader2,
  Plus,
  Sparkles,
  Target,
  Trophy,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import * as coursesApi from '@/lib/api/courses';
import * as examsApi from '@/lib/api/exams';
import * as questionsApi from '@/lib/api/questions';
import type { Exam, ExamAttempt, FullCourse, Question } from '@/lib/types';

const FINAL_EXAM_VALUE = '__final__';

interface ExamFormState {
  title: string;
  target: string;
  timeLimit: string;
  passingMarks: string;
}

interface QuestionFormState {
  questionText: string;
  options: string[];
  correctAnswer: string;
  marks: string;
}

interface ExamWorkspaceCache {
  questions: Question[];
  attempts: ExamAttempt[];
}

const getDefaultExamForm = (): ExamFormState => ({
  title: '',
  target: FINAL_EXAM_VALUE,
  timeLimit: '',
  passingMarks: '',
});

const getDefaultQuestionForm = (): QuestionFormState => ({
  questionText: '',
  options: ['', '', '', ''],
  correctAnswer: '0',
  marks: '1',
});

const getModuleOrder = (courseData: FullCourse, exam: Exam) => {
  if (!exam.module_id) {
    return -1;
  }

  return courseData.modules.findIndex((module) => module._id === exam.module_id);
};

const sortExamList = (courseData: FullCourse, exams: Exam[]) => {
  return [...exams].sort((left, right) => {
    const leftOrder = getModuleOrder(courseData, left);
    const rightOrder = getModuleOrder(courseData, right);

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }

    return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
  });
};

const getExamScopeLabel = (courseData: FullCourse | null, exam: Exam) => {
  if (!exam.module_id) {
    return 'Final course assessment';
  }

  return (
    courseData?.modules.find((module) => module._id === exam.module_id)?.title ||
    'Module assessment'
  );
};

const getAttemptStudentLabel = (attempt: ExamAttempt, index: number) => {
  if (!attempt.user_id) {
    return `Student ${index + 1}`;
  }

  if (typeof attempt.user_id === 'string') {
    return `Student ${attempt.user_id.slice(-4).toUpperCase()}`;
  }

  return (attempt.user_id as { name?: string }).name || `Student ${index + 1}`;
};

export default function FacultyAssessmentsPage() {
  const params = useParams();
  const courseId = params.id as string;

  const [courseData, setCourseData] = useState<FullCourse | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [workspaceCache, setWorkspaceCache] = useState<
    Record<string, ExamWorkspaceCache>
  >({});
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingWorkspaceId, setLoadingWorkspaceId] = useState<string | null>(null);
  const [creatingExam, setCreatingExam] = useState(false);
  const [addingQuestion, setAddingQuestion] = useState(false);
  const [examForm, setExamForm] = useState<ExamFormState>(getDefaultExamForm());
  const [questionForm, setQuestionForm] =
    useState<QuestionFormState>(getDefaultQuestionForm());

  useEffect(() => {
    let cancelled = false;

    const loadAssessmentWorkspace = async () => {
      try {
        setLoading(true);
        const [fullCourse, examData] = await Promise.all([
          coursesApi.getFullCourse(courseId),
          examsApi.getCourseExams(courseId).catch(() => []),
        ]);

        if (cancelled) {
          return;
        }

        const orderedExams = sortExamList(fullCourse, examData);
        setCourseData(fullCourse);
        setExams(orderedExams);
        setSelectedExamId((current) => current || orderedExams[0]?._id || null);
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error('Failed to load assessments:', error);
        toast.error('Failed to load assessment workspace.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    if (courseId) {
      void loadAssessmentWorkspace();
    }

    return () => {
      cancelled = true;
    };
  }, [courseId]);

  const loadSelectedExamWorkspace = async (examId: string, force = false) => {
    if (!force && workspaceCache[examId]) {
      return;
    }

    try {
      setLoadingWorkspaceId(examId);
      const [examDetail, attempts] = await Promise.all([
        examsApi.getExam(examId),
        examsApi.getStudentExamAttempts(examId).catch(() => []),
      ]);

      setWorkspaceCache((current) => ({
        ...current,
        [examId]: {
          questions: examDetail.questions || [],
          attempts,
        },
      }));

      setExams((current) => {
        const next = current.map((exam) =>
          exam._id === examDetail._id ? { ...exam, ...examDetail } : exam
        );

        return courseData ? sortExamList(courseData, next) : next;
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to load assessment details');
    } finally {
      setLoadingWorkspaceId(null);
    }
  };

  useEffect(() => {
    if (!selectedExamId) {
      return;
    }

    void loadSelectedExamWorkspace(selectedExamId);
  }, [selectedExamId]);

  const selectedExam = useMemo(
    () => exams.find((exam) => exam._id === selectedExamId) || null,
    [exams, selectedExamId]
  );

  const selectedQuestions = selectedExamId
    ? workspaceCache[selectedExamId]?.questions || []
    : [];
  const selectedAttempts = selectedExamId
    ? workspaceCache[selectedExamId]?.attempts || []
    : [];

  const availableTargets = useMemo(() => {
    if (!courseData) {
      return [];
    }

    const takenModuleIds = new Set(
      exams
        .map((exam) => exam.module_id)
        .filter(Boolean)
        .map((moduleId) => String(moduleId))
    );

    const options = [];

    if (!exams.some((exam) => !exam.module_id)) {
      options.push({
        value: FINAL_EXAM_VALUE,
        label: 'Final course assessment',
      });
    }

    for (const module of courseData.modules) {
      if (!takenModuleIds.has(module._id)) {
        options.push({
          value: module._id,
          label: `Module assessment: ${module.title}`,
        });
      }
    }

    return options;
  }, [courseData, exams]);

  useEffect(() => {
    if (availableTargets.length === 0) {
      return;
    }

    if (!availableTargets.some((option) => option.value === examForm.target)) {
      setExamForm((current) => ({
        ...current,
        target: availableTargets[0].value,
      }));
    }
  }, [availableTargets, examForm.target]);

  const workspaceMetrics = useMemo(() => {
    const knownQuestions = Object.values(workspaceCache).reduce(
      (sum, workspace) => sum + workspace.questions.length,
      0
    );
    const knownAttempts = Object.values(workspaceCache).reduce(
      (sum, workspace) => sum + workspace.attempts.length,
      0
    );

    return {
      totalAssessments: exams.length,
      moduleCoverage: exams.filter((exam) => exam.module_id).length,
      knownQuestions,
      knownAttempts,
    };
  }, [exams, workspaceCache]);

  const selectedExamStats = useMemo(() => {
    if (!selectedExam || selectedAttempts.length === 0) {
      return {
        averageScore: '0.0',
        passRate: '0',
        highestScore: '0',
      };
    }

    const averageScore =
      selectedAttempts.reduce((sum, attempt) => sum + attempt.score, 0) /
      selectedAttempts.length;
    const passedCount = selectedAttempts.filter(
      (attempt) => attempt.score >= selectedExam.passing_marks
    ).length;

    return {
      averageScore: averageScore.toFixed(1),
      passRate: ((passedCount / selectedAttempts.length) * 100).toFixed(0),
      highestScore: String(Math.max(...selectedAttempts.map((attempt) => attempt.score))),
    };
  }, [selectedAttempts, selectedExam]);

  const handleCreateExam = async () => {
    if (!courseData || !examForm.title.trim()) {
      toast.error('Assessment title is required.');
      return;
    }

    try {
      setCreatingExam(true);
      const createdExam = await examsApi.createExam({
        course_id: courseId,
        module_id:
          examForm.target === FINAL_EXAM_VALUE ? undefined : examForm.target || undefined,
        title: examForm.title.trim(),
        total_marks: 0,
        time_limit: examForm.timeLimit ? Number(examForm.timeLimit) : undefined,
        passing_marks: examForm.passingMarks ? Number(examForm.passingMarks) : 0,
      });

      setExams((current) => sortExamList(courseData, [...current, createdExam]));
      setWorkspaceCache((current) => ({
        ...current,
        [createdExam._id]: {
          questions: [],
          attempts: [],
        },
      }));
      setSelectedExamId(createdExam._id);
      setExamForm(getDefaultExamForm());
      toast.success('Assessment created successfully.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create assessment');
    } finally {
      setCreatingExam(false);
    }
  };

  const handleAddQuestion = async () => {
    if (!selectedExam) {
      toast.error('Select an assessment first.');
      return;
    }

    const options = questionForm.options.map((option) => option.trim());

    if (!questionForm.questionText.trim()) {
      toast.error('Question text is required.');
      return;
    }

    if (options.some((option) => !option)) {
      toast.error('Fill in all answer options.');
      return;
    }

    try {
      setAddingQuestion(true);
      await questionsApi.addQuestion({
        exam_id: selectedExam._id,
        question_text: questionForm.questionText.trim(),
        options,
        correct_answer: Number(questionForm.correctAnswer),
        marks: Number(questionForm.marks) || 1,
      });

      await loadSelectedExamWorkspace(selectedExam._id, true);
      setQuestionForm(getDefaultQuestionForm());
      toast.success('Question added to assessment.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add question');
    } finally {
      setAddingQuestion(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-text-secondary">Loading assessment workspace...</p>;
  }

  if (!courseData) {
    return (
      <Card className="rounded-[28px] border-[#1E1E1E] bg-[#101214]">
        <CardContent className="py-12 text-center text-text-secondary">
          Course not found.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <Link
        href={`/faculty/courses/${courseId}`}
        className="inline-flex items-center gap-2 text-sm text-[#8A949F] transition-colors hover:text-[#FAFAFA]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Course
      </Link>

      <section className="overflow-hidden rounded-[32px] border border-[#1E1E1E] bg-[radial-gradient(circle_at_top_left,rgba(255,92,0,0.18),transparent_32%),linear-gradient(180deg,#101214_0%,#0B0D10_100%)] p-6 sm:p-8">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.15fr)_420px] xl:items-end">
          <div>
            <p
              className="text-[11px] uppercase tracking-[0.2em] text-[#FF6A2A]"
              style={{ fontFamily: 'DM Mono, monospace' }}
            >
              Assessment Studio
            </p>
            <h1
              className="mt-4 text-3xl font-semibold text-[#FAFAFA] sm:text-4xl"
              style={{ fontFamily: 'Syne, sans-serif' }}
            >
              Build, review, and monitor exams for {courseData.course.title}
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[#8E98A4]">
              This workspace keeps creation, question authoring, and live student
              attempt review in one place. Assessment details now load per selection
              instead of duplicating the entire course fetch cycle.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Badge variant="info">{courseData.modules.length} modules</Badge>
              <Badge variant="success">{exams.length} assessments</Badge>
              <Badge className="border-[#2A3038] bg-[#14181D] text-[#A9B4BF]">
                {availableTargets.length} open slots
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <WorkspaceMetric
              icon={<ClipboardList className="h-4 w-4" />}
              label="Assessments"
              value={String(workspaceMetrics.totalAssessments)}
            />
            <WorkspaceMetric
              icon={<BookOpen className="h-4 w-4" />}
              label="Module coverage"
              value={String(workspaceMetrics.moduleCoverage)}
            />
            <WorkspaceMetric
              icon={<FileQuestion className="h-4 w-4" />}
              label="Known questions"
              value={String(workspaceMetrics.knownQuestions)}
            />
            <WorkspaceMetric
              icon={<Users className="h-4 w-4" />}
              label="Known attempts"
              value={String(workspaceMetrics.knownAttempts)}
            />
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card className="rounded-[28px] border-[#1E1E1E] bg-[#101317] p-0">
            <CardContent className="space-y-5 p-6">
              <div>
                <p className="text-sm text-[#8A949F]">Create assessment</p>
                <h2
                  className="mt-1 text-2xl font-semibold text-[#FAFAFA]"
                  style={{ fontFamily: 'Syne, sans-serif' }}
                >
                  New exam slot
                </h2>
              </div>

              <Input
                label="Assessment title"
                placeholder="Enter assessment title"
                value={examForm.title}
                onChange={(event) =>
                  setExamForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                className="rounded-[16px] border-[#252A31] bg-[#11161B] text-[#FAFAFA]"
              />

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#FAFAFA]">
                  Assessment target
                </label>
                <select
                  value={examForm.target}
                  onChange={(event) =>
                    setExamForm((current) => ({
                      ...current,
                      target: event.target.value,
                    }))
                  }
                  className="w-full rounded-[16px] border border-[#252A31] bg-[#11161B] px-4 py-3 text-sm text-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-[#FF6A2A]"
                  disabled={availableTargets.length === 0}
                >
                  {availableTargets.length === 0 ? (
                    <option value={FINAL_EXAM_VALUE}>
                      All assessment slots are already used
                    </option>
                  ) : (
                    availableTargets.map((target) => (
                      <option key={target.value} value={target.value}>
                        {target.label}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Time limit (minutes)"
                  type="number"
                  min={0}
                  placeholder="Optional"
                  value={examForm.timeLimit}
                  onChange={(event) =>
                    setExamForm((current) => ({
                      ...current,
                      timeLimit: event.target.value,
                    }))
                  }
                  className="rounded-[16px] border-[#252A31] bg-[#11161B] text-[#FAFAFA]"
                />
                <Input
                  label="Passing marks"
                  type="number"
                  min={0}
                  placeholder="Optional"
                  value={examForm.passingMarks}
                  onChange={(event) =>
                    setExamForm((current) => ({
                      ...current,
                      passingMarks: event.target.value,
                    }))
                  }
                  className="rounded-[16px] border-[#252A31] bg-[#11161B] text-[#FAFAFA]"
                />
              </div>

              <Button
                variant="primary"
                onClick={handleCreateExam}
                disabled={creatingExam || availableTargets.length === 0}
                className="h-12 w-full rounded-[16px]"
              >
                {creatingExam ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating assessment...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Create assessment
                  </>
                )}
              </Button>

              <p className="text-xs leading-6 text-[#6E7782]">
                Editing and deleting assessments are still limited by the current backend,
                so this screen optimizes creation, question authoring, and review.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-[#1E1E1E] bg-[#101317] p-0">
            <CardContent className="p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-[#8A949F]">Assessment queue</p>
                  <h2
                    className="mt-1 text-2xl font-semibold text-[#FAFAFA]"
                    style={{ fontFamily: 'Syne, sans-serif' }}
                  >
                    Existing exams
                  </h2>
                </div>
                <div className="rounded-full border border-[#212831] bg-[#12171C] px-3 py-1 text-xs uppercase tracking-[0.14em] text-[#8A949F]">
                  {exams.length} total
                </div>
              </div>

              <div className="space-y-3">
                {exams.length === 0 ? (
                  <div className="rounded-[22px] border border-dashed border-[#272D35] bg-[#0F1419] px-4 py-6 text-sm leading-7 text-[#8A949F]">
                    No assessments yet. Create the first one from the panel above.
                  </div>
                ) : (
                  exams.map((exam) => {
                    const isSelected = exam._id === selectedExamId;
                    const questionCount = workspaceCache[exam._id]?.questions.length;

                    return (
                      <button
                        key={exam._id}
                        onClick={() => setSelectedExamId(exam._id)}
                        className={`w-full rounded-[22px] border p-4 text-left transition-all ${
                          isSelected
                            ? 'border-[#2B323C] bg-[#14181D]'
                            : 'border-[#1E242C] bg-[#10151A] hover:border-[#313845] hover:bg-[#12181E]'
                        }`}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={exam.module_id ? 'info' : 'success'}>
                            {exam.module_id ? 'module' : 'final'}
                          </Badge>
                          <Badge className="border-[#24303B] bg-[#141A20] text-[#A7B6C2]">
                            {questionCount !== undefined
                              ? `${questionCount} questions`
                              : 'Not loaded'}
                          </Badge>
                        </div>
                        <p className="mt-3 text-base font-medium text-[#FAFAFA]">
                          {exam.title}
                        </p>
                        <p className="mt-1 text-sm text-[#8A949F]">
                          {getExamScopeLabel(courseData, exam)}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-4 text-xs text-[#6E7782]">
                          <span>{exam.total_marks} marks</span>
                          <span>{exam.passing_marks} pass</span>
                          <span>
                            {exam.time_limit ? `${exam.time_limit} min` : 'No timer'}
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {!selectedExam ? (
            <Card className="rounded-[28px] border-[#1E1E1E] bg-[#101317] p-0">
              <CardContent className="flex min-h-[280px] flex-col items-center justify-center gap-4 px-6 py-10 text-center">
                <Sparkles className="h-8 w-8 text-[#FF6A2A]" />
                <div>
                  <p
                    className="text-2xl font-semibold text-[#FAFAFA]"
                    style={{ fontFamily: 'Syne, sans-serif' }}
                  >
                    Select an assessment to start managing it
                  </p>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-[#8A949F]">
                    Choose an exam from the left to load questions, attempt insights, and
                    the authoring form.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="rounded-[30px] border-[#1E1E1E] bg-[linear-gradient(140deg,rgba(255,92,0,0.2),rgba(18,22,28,0.96)_34%,rgba(11,14,18,0.98)_76%)] p-0">
                <CardContent className="p-6 sm:p-7">
                  <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                    <div className="max-w-3xl">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <Badge variant={selectedExam.module_id ? 'info' : 'success'}>
                          {selectedExam.module_id ? 'module assessment' : 'final assessment'}
                        </Badge>
                        <Badge className="border-[#3B241A] bg-[#1A110E] text-[#FFB48C]">
                          {getExamScopeLabel(courseData, selectedExam)}
                        </Badge>
                      </div>
                      <h2
                        className="text-3xl font-semibold text-[#FAFAFA]"
                        style={{ fontFamily: 'Syne, sans-serif' }}
                      >
                        {selectedExam.title}
                      </h2>
                      <p className="mt-3 max-w-3xl text-sm leading-7 text-[#9AA3AD]">
                        Manage question quality, review attempt signals, and tune the
                        exam experience from one focused panel.
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3 xl:w-[420px]">
                      <WorkspaceMetric
                        icon={<Target className="h-4 w-4" />}
                        label="Questions"
                        value={String(selectedQuestions.length)}
                      />
                      <WorkspaceMetric
                        icon={<Users className="h-4 w-4" />}
                        label="Attempts"
                        value={String(selectedAttempts.length)}
                      />
                      <WorkspaceMetric
                        icon={<Trophy className="h-4 w-4" />}
                        label="Pass rate"
                        value={`${selectedExamStats.passRate}%`}
                      />
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    <InsightPill
                      icon={<Clock3 className="h-4 w-4" />}
                      label="Timer"
                      value={
                        selectedExam.time_limit
                          ? `${selectedExam.time_limit} minutes`
                          : 'No time limit'
                      }
                    />
                    <InsightPill
                      icon={<FileQuestion className="h-4 w-4" />}
                      label="Pass mark"
                      value={`${selectedExam.passing_marks} out of ${selectedExam.total_marks}`}
                    />
                    <InsightPill
                      icon={<GraduationCap className="h-4 w-4" />}
                      label="Average score"
                      value={selectedExamStats.averageScore}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="space-y-6">
                  <Card className="rounded-[28px] border-[#1E1E1E] bg-[#101317] p-0">
                    <CardContent className="space-y-5 p-6">
                      <div>
                        <p className="text-sm text-[#8A949F]">Question authoring</p>
                        <h3
                          className="mt-1 text-2xl font-semibold text-[#FAFAFA]"
                          style={{ fontFamily: 'Syne, sans-serif' }}
                        >
                          Add a new question
                        </h3>
                      </div>

                      <Textarea
                        label="Question text"
                        placeholder="Write the question prompt"
                        value={questionForm.questionText}
                        onChange={(event) =>
                          setQuestionForm((current) => ({
                            ...current,
                            questionText: event.target.value,
                          }))
                        }
                        className="min-h-[120px] rounded-[16px] border-[#252A31] bg-[#11161B] text-[#FAFAFA]"
                      />

                      <div className="grid gap-4 sm:grid-cols-2">
                        {questionForm.options.map((option, index) => (
                          <Input
                            key={index}
                            label={`Option ${index + 1}`}
                            placeholder={`Option ${index + 1}`}
                            value={option}
                            onChange={(event) =>
                              setQuestionForm((current) => {
                                const nextOptions = [...current.options];
                                nextOptions[index] = event.target.value;

                                return {
                                  ...current,
                                  options: nextOptions,
                                };
                              })
                            }
                            className="rounded-[16px] border-[#252A31] bg-[#11161B] text-[#FAFAFA]"
                          />
                        ))}
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-[#FAFAFA]">
                            Correct answer
                          </label>
                          <select
                            value={questionForm.correctAnswer}
                            onChange={(event) =>
                              setQuestionForm((current) => ({
                                ...current,
                                correctAnswer: event.target.value,
                              }))
                            }
                            className="w-full rounded-[16px] border border-[#252A31] bg-[#11161B] px-4 py-3 text-sm text-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-[#FF6A2A]"
                          >
                            {questionForm.options.map((_, index) => (
                              <option key={index} value={index}>
                                Option {index + 1}
                              </option>
                            ))}
                          </select>
                        </div>
                        <Input
                          label="Marks"
                          type="number"
                          min={1}
                          value={questionForm.marks}
                          onChange={(event) =>
                            setQuestionForm((current) => ({
                              ...current,
                              marks: event.target.value,
                            }))
                          }
                          className="rounded-[16px] border-[#252A31] bg-[#11161B] text-[#FAFAFA]"
                        />
                      </div>

                      <Button
                        variant="primary"
                        onClick={handleAddQuestion}
                        disabled={addingQuestion}
                        className="h-12 w-full rounded-[16px]"
                      >
                        {addingQuestion ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Adding question...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4" />
                            Add question
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="rounded-[28px] border-[#1E1E1E] bg-[#101317] p-0">
                    <CardContent className="p-6">
                      <div className="mb-5 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm text-[#8A949F]">Question bank</p>
                          <h3
                            className="mt-1 text-2xl font-semibold text-[#FAFAFA]"
                            style={{ fontFamily: 'Syne, sans-serif' }}
                          >
                            Current questions
                          </h3>
                        </div>
                        {loadingWorkspaceId === selectedExam._id ? (
                          <div className="inline-flex items-center gap-2 rounded-full border border-[#2A3038] bg-[#14181D] px-3 py-1 text-xs uppercase tracking-[0.14em] text-[#8A949F]">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Loading
                          </div>
                        ) : null}
                      </div>

                      <div className="space-y-4">
                        {selectedQuestions.length === 0 ? (
                          <div className="rounded-[22px] border border-dashed border-[#272D35] bg-[#0F1419] px-4 py-6 text-sm leading-7 text-[#8A949F]">
                            No questions yet for this assessment. Add the first one from
                            the form above.
                          </div>
                        ) : (
                          selectedQuestions.map((question, questionIndex) => (
                            <div
                              key={question._id}
                              className="rounded-[22px] border border-[#1E242C] bg-[#0F1419] p-4"
                            >
                              <div className="mb-3 flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-medium text-[#FAFAFA]">
                                    {questionIndex + 1}. {question.question_text}
                                  </p>
                                  <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[#7E8791]">
                                    {question.marks} mark
                                    {question.marks === 1 ? '' : 's'}
                                  </p>
                                </div>
                                <FileQuestion className="h-4.5 w-4.5 text-[#FF6A2A]" />
                              </div>

                              <div className="space-y-2">
                                {question.options.map((option, optionIndex) => (
                                  <div
                                    key={optionIndex}
                                    className={`rounded-[16px] border px-4 py-3 text-sm ${
                                      question.correct_answer === optionIndex
                                        ? 'border-green-500/30 bg-green-500/10 text-green-300'
                                        : 'border-[#20262E] bg-[#11171D] text-[#9AA3AD]'
                                    }`}
                                  >
                                    {String.fromCharCode(65 + optionIndex)}. {option.text}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="rounded-[28px] border-[#1E1E1E] bg-[#101317] p-0">
                  <CardContent className="p-6">
                    <div className="mb-5">
                      <p className="text-sm text-[#8A949F]">Attempt review</p>
                      <h3
                        className="mt-1 text-2xl font-semibold text-[#FAFAFA]"
                        style={{ fontFamily: 'Syne, sans-serif' }}
                      >
                        Student performance
                      </h3>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                      <WorkspaceMetric
                        icon={<Users className="h-4 w-4" />}
                        label="Attempt count"
                        value={String(selectedAttempts.length)}
                      />
                      <WorkspaceMetric
                        icon={<GraduationCap className="h-4 w-4" />}
                        label="Average score"
                        value={selectedExamStats.averageScore}
                      />
                      <WorkspaceMetric
                        icon={<Trophy className="h-4 w-4" />}
                        label="Highest score"
                        value={selectedExamStats.highestScore}
                      />
                    </div>

                    <div className="mt-6 space-y-3">
                      {selectedAttempts.length === 0 ? (
                        <div className="rounded-[22px] border border-dashed border-[#272D35] bg-[#0F1419] px-4 py-6 text-sm leading-7 text-[#8A949F]">
                          No students have attempted this assessment yet.
                        </div>
                      ) : (
                        selectedAttempts.map((attempt, index) => {
                          const hasPassed = attempt.score >= selectedExam.passing_marks;

                          return (
                            <div
                              key={attempt._id}
                              className="rounded-[20px] border border-[#1E242C] bg-[#0F1419] p-4"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-medium text-[#FAFAFA]">
                                    {getAttemptStudentLabel(attempt, index)}
                                  </p>
                                  <p className="mt-1 text-sm text-[#8A949F]">
                                    {new Date(attempt.createdAt).toLocaleString()}
                                  </p>
                                </div>
                                <Badge variant={hasPassed ? 'success' : 'warning'}>
                                  {hasPassed ? 'passed' : 'needs review'}
                                </Badge>
                              </div>

                              <div className="mt-4 grid grid-cols-2 gap-3">
                                <InsightPill
                                  icon={<Target className="h-4 w-4" />}
                                  label="Score"
                                  value={`${attempt.score}/${selectedExam.total_marks}`}
                                />
                                <InsightPill
                                  icon={<Trophy className="h-4 w-4" />}
                                  label="Percent"
                                  value={
                                    selectedExam.total_marks > 0
                                      ? `${(
                                          (attempt.score / selectedExam.total_marks) *
                                          100
                                        ).toFixed(0)}%`
                                      : '0%'
                                  }
                                />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function WorkspaceMetric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[20px] border border-[#1E242C] bg-[#11161B] px-4 py-4">
      <div className="flex items-center gap-2 text-[#FF6A2A]">{icon}</div>
      <p className="mt-3 text-[11px] uppercase tracking-[0.16em] text-[#768390]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-[#FAFAFA]">{value}</p>
    </div>
  );
}

function InsightPill({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[18px] border border-[#1E242C] bg-[#10151A] px-4 py-3">
      <div className="flex items-center gap-2 text-[#FF6A2A]">{icon}</div>
      <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-[#768390]">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-[#FAFAFA]">{value}</p>
    </div>
  );
}
