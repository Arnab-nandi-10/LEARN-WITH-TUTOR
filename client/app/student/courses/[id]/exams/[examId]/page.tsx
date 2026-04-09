'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileQuestion,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/client/components/ui/Badge';
import { Button } from '@/client/components/ui/Button';
import { Card, CardContent } from '@/client/components/ui/Card';
import * as attemptsApi from '@/lib/api/attempts';
import * as examsApi from '@/lib/api/exams';
import { useCourseExamSummaries } from '@/lib/hooks';
import type { AttemptResult, ExamWithQuestions } from '@/lib/types';

const formatAttemptMessage = (result: AttemptResult | null): string => {
  if (!result) {
    return 'Submit this assessment to see your result.';
  }

  return result.passed
    ? 'You passed this assessment.'
    : 'You completed this assessment but did not reach the passing score.';
};

export default function StudentExamPage() {
  const params = useParams();
  const courseId = params.id as string;
  const examId = params.examId as string;

  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [attemptNotice, setAttemptNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number | null>(null);

  const {
    courseData,
    summaries,
    isEnrolled,
    isLoading: contextLoading,
    error: contextError,
  } = useCourseExamSummaries(courseId);

  const selectedSummary = useMemo(
    () => summaries.find((summary) => summary.exam._id === examId) || null,
    [examId, summaries]
  );

  const course = courseData?.course || null;
  const exam = selectedSummary?.exam || null;
  const isExamLocked = selectedSummary?.availability === 'locked';

  const examDetailQuery = useQuery<ExamWithQuestions>({
    queryKey: ['exam', 'detail', examId],
    queryFn: () => examsApi.getExam(examId),
    enabled: Boolean(examId) && Boolean(exam) && !isExamLocked,
    staleTime: 60_000,
  });

  const activeExam = examDetailQuery.data || exam;
  const questions = examDetailQuery.data?.questions || [];
  const loading =
    contextLoading || (Boolean(exam) && !isExamLocked && examDetailQuery.isLoading);

  const lockedMessage = useMemo(() => {
    if (contextError instanceof Error) {
      return contextError.message;
    }

    if (examDetailQuery.error instanceof Error) {
      return examDetailQuery.error.message;
    }

    if (!courseData && !contextLoading) {
      return 'Failed to load this assessment.';
    }

    if (!selectedSummary && !contextLoading) {
      return 'This assessment could not be found for the selected course.';
    }

    if (!isEnrolled) {
      return 'Enroll in the course to unlock assessments.';
    }

    if (selectedSummary && isExamLocked) {
      return `Reach ${selectedSummary.requiredCompletionPercentage}% course completion to unlock this assessment. Your current progress is ${selectedSummary.currentCompletionPercentage}%.`;
    }

    return null;
  }, [
    contextError,
    contextLoading,
    courseData,
    isEnrolled,
    isExamLocked,
    examDetailQuery.error,
    selectedSummary,
  ]);

  useEffect(() => {
    setResult(attemptsApi.getCachedAttemptResult(examId));
    setAttemptNotice(null);
  }, [examId]);

  useEffect(() => {
    let cancelled = false;

    const hydrateAttemptResult = async () => {
      if (!activeExam?._id) {
        return;
      }

      try {
        const backendResult = await attemptsApi.getAttemptResultForExam(activeExam._id, {
          total_marks: activeExam.total_marks,
          passing_marks: activeExam.passing_marks,
        });

        if (cancelled || !backendResult) {
          return;
        }

        attemptsApi.cacheAttemptResult(activeExam._id, backendResult);
        setResult(backendResult);
        setAttemptNotice('This assessment was already submitted. Showing your saved result.');
      } catch (error: any) {
        if (cancelled) {
          return;
        }

        const cachedResult = attemptsApi.getCachedAttemptResult(activeExam._id);
        if (cachedResult) {
          setResult(cachedResult);
          setAttemptNotice('This assessment was already submitted. Showing your cached result.');
          return;
        }

        if (error?.statusCode && error.statusCode >= 500) {
          toast.error(error.message || 'Failed to load your saved assessment result.');
        }
      }
    };

    hydrateAttemptResult();

    return () => {
      cancelled = true;
    };
  }, [activeExam?._id, activeExam?.passing_marks, activeExam?.total_marks]);

  useEffect(() => {
    setCurrentQuestionIndex(0);
    setTimeRemainingSeconds(activeExam?.time_limit ? activeExam.time_limit * 60 : null);
  }, [activeExam?._id, activeExam?.time_limit]);

  const unansweredCount = useMemo(() => {
    return questions.filter((question) => answers[question._id] === undefined).length;
  }, [answers, questions]);
  const currentQuestion = questions[currentQuestionIndex] || null;
  const answeredCount = questions.length - unansweredCount;
  const progressPercentage = questions.length > 0 ? Math.round(((currentQuestionIndex + 1) / questions.length) * 100) : 0;
  const remainingCount = Math.max(questions.length - answeredCount, 0);
  const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F'];
  const formatTimer = (value: number | null) => {
    if (value === null) return 'No limit';
    const minutes = Math.floor(value / 60).toString().padStart(2, '0');
    const seconds = (value % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  const handleSubmit = async () => {
    if (!activeExam) return;
    if (questions.length === 0) {
      toast.error('This assessment has no questions yet.');
      return;
    }
    if (unansweredCount > 0) {
      toast.error('Answer all questions before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const attemptResult = await attemptsApi.submitAttempt(
        activeExam._id,
        {
          answers: questions.map((question) => ({
            question_id: question._id,
            selected_option: answers[question._id],
          })),
        }
      );
      const nextResult = {
        ...attemptResult,
        submitted_at: new Date().toISOString(),
      };
      attemptsApi.cacheAttemptResult(activeExam._id, nextResult);
      setResult(nextResult);
      toast.success('Assessment submitted successfully.');
    } catch (error: any) {
      const cachedResult = attemptsApi.getCachedAttemptResult(activeExam._id);
      if (error.message?.toLowerCase().includes('already attempted')) {
        try {
          const backendResult = await attemptsApi.getAttemptResultForExam(activeExam._id, {
            total_marks: activeExam.total_marks,
            passing_marks: activeExam.passing_marks,
          });

          const resolvedResult = backendResult || cachedResult;

          if (backendResult) {
            attemptsApi.cacheAttemptResult(activeExam._id, backendResult);
          }

          setResult(resolvedResult);
          setAttemptNotice(
            resolvedResult
              ? 'This assessment was already submitted. Showing your saved result.'
              : 'This assessment was already submitted.'
          );
        } catch (fetchError: any) {
          setResult(cachedResult);
          setAttemptNotice(
            cachedResult
              ? 'This assessment was already submitted. Showing your cached result.'
              : fetchError?.message || 'This assessment was already submitted.'
          );
        }
      } else {
        toast.error(error.message || 'Failed to submit assessment.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (timeRemainingSeconds === null || result || loading) {
      return;
    }

    if (timeRemainingSeconds <= 0) {
      if (activeExam && !submitting) {
        toast.info('Time is up. Submitting your current answers.');
        const submitNow = async () => {
          try {
            setSubmitting(true);
            const attemptResult = await attemptsApi.submitAttempt(
              activeExam._id,
              {
                answers: questions
                  .filter((question) => answers[question._id] !== undefined)
                  .map((question) => ({
                    question_id: question._id,
                    selected_option: answers[question._id],
                  })),
              }
            );
            const nextResult = {
              ...attemptResult,
              submitted_at: new Date().toISOString(),
            };
            attemptsApi.cacheAttemptResult(activeExam._id, nextResult);
            setResult(nextResult);
          } catch (error: any) {
            toast.error(error.message || 'Failed to submit assessment.');
          } finally {
            setSubmitting(false);
          }
        };
        submitNow();
      }
      return;
    }

    const timer = window.setTimeout(() => {
      setTimeRemainingSeconds((prev) => (prev === null ? prev : prev - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [activeExam, answers, loading, questions, result, submitting, timeRemainingSeconds]);

  if (loading) {
    return (
      <div className="space-y-4">
        <p className="text-text-secondary">Loading assessment...</p>
      </div>
    );
  }

  const bannerMessage = attemptNotice || lockedMessage;

  return (
    <div className="space-y-6">
      <Link
        href={`/student/courses/${courseId}`}
        className="inline-flex items-center gap-2 text-sm text-[#8A949F] transition-colors hover:text-[#FAFAFA]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Course
      </Link>

      {bannerMessage && (
        <Card className="rounded-[24px] border-yellow-500/20 bg-yellow-500/5 p-0">
          <CardContent className="py-4 text-sm text-yellow-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{bannerMessage}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {activeExam && questions.length > 0 ? (
        <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="overflow-hidden rounded-[28px] border border-[#1E1E1E] bg-[#0A0A0A]">
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
              <div>
                <p className="text-sm font-display font-semibold text-text-primary">{activeExam.title}</p>
                <p className="text-xs font-mono text-[#555555]">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </p>
              </div>
              {result ? (
                <div className="flex items-center gap-2 rounded-sm border border-green-500/30 bg-green-500/5 px-3 py-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                  <span className="text-xs font-mono font-medium text-green-300">Completed</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-sm border border-accent/30 px-3 py-1.5">
                  <Clock className="h-3.5 w-3.5 text-accent" />
                  <span className="text-xs font-mono font-medium text-accent">{formatTimer(timeRemainingSeconds)}</span>
                </div>
              )}
            </div>

            <div className="h-0.5 bg-[#1E1E1E]"><div className="h-full bg-accent transition-all" style={{ width: `${progressPercentage}%` }} /></div>

            <div className="p-6">
              {currentQuestion && (
                <>
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm leading-relaxed text-text-primary">{currentQuestion.question_text}</p>
                      <p className="mt-2 text-xs font-mono text-text-muted">{currentQuestion.marks} mark{currentQuestion.marks === 1 ? '' : 's'}</p>
                    </div>
                    {answers[currentQuestion._id] !== undefined && <Badge variant="info">answered</Badge>}
                  </div>

                  <div className="flex flex-col gap-2.5">
                    {currentQuestion.options.map((option, optionIndex) => {
                      const isSelected = answers[currentQuestion._id] === optionIndex;
                      return (
                        <button key={optionIndex} type="button" disabled={!!result} onClick={() => setAnswers((prev) => ({ ...prev, [currentQuestion._id]: optionIndex }))} className={`flex items-start gap-3 rounded-sm border px-4 py-3 text-left transition-all ${isSelected ? 'border-accent bg-accent/10' : 'border-border hover:border-[#2A2A2A]'} ${result ? 'cursor-not-allowed opacity-80' : ''}`}>
                          <span className={`flex h-6 w-6 items-center justify-center rounded-sm border text-xs font-mono ${isSelected ? 'border-accent text-accent' : 'border-[#2A2A2A] text-[#555555]'}`}>{optionLabels[optionIndex] || optionIndex + 1}</span>
                          <span className={`text-sm ${isSelected ? 'text-text-primary' : 'text-text-secondary'}`}>{option.text}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-5 border-t border-border pt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-5 text-xs font-mono text-[#555555]">
                      <span className="text-accent">{answeredCount} answered</span>
                      <span>{remainingCount} remaining</span>
                      <span>{questions.length} total</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setCurrentQuestionIndex((prev) => Math.max(prev - 1, 0))} disabled={currentQuestionIndex === 0}>Previous</Button>
                      {currentQuestionIndex < questions.length - 1 ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setCurrentQuestionIndex((prev) => Math.min(prev + 1, questions.length - 1))}
                          disabled={submitting}
                        >
                          {result ? 'Review Next' : 'Next'}
                        </Button>
                      ) : (
                        <Button variant="primary" size="sm" onClick={handleSubmit} disabled={submitting || unansweredCount > 0 || !!result}>{submitting ? 'Submitting...' : result ? 'Submitted' : 'Submit'}</Button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[24px] border border-[#1E1E1E] bg-[#0A0A0A] p-5">
              <p className="section-label mb-3">Assessment</p>
              <h2 className="text-3xl font-display font-bold leading-tight text-text-primary">Exam workspace</h2>
              <p className="mt-4 text-sm leading-relaxed text-text-secondary">
                {course
                  ? `${course.title} shows one question at a time with answer tracking and instant result handling.`
                  : 'This workspace is connected to the backend exam submission flow.'}
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {[
                  'Enrollment required',
                  'One attempt only',
                  'Instant result',
                  activeExam.time_limit ? `${activeExam.time_limit} min timer` : 'No time limit',
                ].map((label) => (
                  <div
                    key={label}
                    className="rounded-[18px] border border-border px-4 py-3 text-sm text-text-secondary"
                  >
                    {label}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-accent/20 bg-accent/5 p-5">
              <p className="mb-2 text-xs font-mono uppercase tracking-[0.18em] text-accent">Rules</p>
              <p className="text-sm leading-relaxed text-text-secondary">
                Passing score is {activeExam.passing_marks} out of {activeExam.total_marks}. The current backend allows one submission per student and returns the score immediately after completion.
              </p>
            </div>

            <div className="rounded-[24px] border border-border bg-[#0A0A0A] p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-display text-xl font-bold text-text-primary">Question Navigator</p>
                  <p className="text-sm text-text-secondary">Jump between questions while you work.</p>
                </div>
                <FileQuestion className="h-5 w-5 text-accent" />
              </div>
              <div className="grid grid-cols-5 gap-2">{questions.map((question, index) => <button key={question._id} onClick={() => setCurrentQuestionIndex(index)} className={`rounded-sm border px-3 py-3 text-xs font-mono transition-colors ${currentQuestionIndex === index ? 'border-accent bg-accent/10 text-accent' : answers[question._id] !== undefined ? 'border-green-500/30 text-green-400' : 'border-border text-text-muted hover:border-accent/30'}`}>{index + 1}</button>)}</div>
            </div>

            {result && <div className={`rounded-sm border p-5 ${result.passed ? 'border-green-500/30 bg-green-500/5' : 'border-yellow-500/20 bg-yellow-500/5'}`}><div className="mb-3 flex items-center gap-2"><CheckCircle2 className={`h-5 w-5 ${result.passed ? 'text-green-500' : 'text-yellow-500'}`} /><p className="font-display text-xl font-bold text-text-primary">Assessment Result</p></div><p className="text-sm text-text-secondary">{formatAttemptMessage(result)}</p><div className="mt-4 flex items-center justify-between gap-4"><p className="text-3xl font-display font-bold text-text-primary">{result.score}/{result.total}</p><p className="text-xs text-text-muted">{result.submitted_at ? `Submitted ${new Date(result.submitted_at).toLocaleString()}` : 'Submitted in this session'}</p></div></div>}
          </div>
        </div>
      ) : (
        <Card><CardContent className="py-10 text-center text-text-secondary">{bannerMessage || 'This assessment does not have any questions yet.'}</CardContent></Card>
      )}
    </div>
  );
}
