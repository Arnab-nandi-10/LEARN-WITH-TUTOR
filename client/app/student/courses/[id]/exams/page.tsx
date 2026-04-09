'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Clock,
  Lock,
  Trophy,
} from 'lucide-react';
import { Badge } from '@/client/components/ui/Badge';
import { Button } from '@/client/components/ui/Button';
import { Card, CardContent } from '@/client/components/ui/Card';
import { useCourseExamSummaries } from '@/lib/hooks';

const getAvailabilityCopy = (
  availability: 'locked' | 'available' | 'completed',
  requiredCompletionPercentage: number,
  currentCompletionPercentage: number
): string => {
  if (availability === 'completed') {
    return 'You have already completed this assessment in this browser session.';
  }

  if (availability === 'available') {
    return 'This assessment is unlocked and ready to start.';
  }

  return `Unlocks at ${requiredCompletionPercentage}% course completion. Your current progress is ${currentCompletionPercentage}%.`;
};

export default function StudentCourseExamsPage() {
  const params = useParams();
  const courseId = params.id as string;
  const { courseData, summaries, isEnrolled, progressSummary, isLoading, error } =
    useCourseExamSummaries(courseId);

  const availableCount = summaries.filter(
    (summary) => summary.availability === 'available'
  ).length;
  const completedCount = summaries.filter(
    (summary) => summary.availability === 'completed'
  ).length;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <p className="text-text-secondary">Loading assessments...</p>
      </div>
    );
  }

  if (error || !courseData) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-text-secondary">
            {error instanceof Error
              ? error.message
              : 'Failed to load course assessments.'}
          </p>
          <div className="mt-4">
            <Link href={`/student/courses/${courseId}`}>
              <Button variant="secondary">Back to Course</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href={`/student/courses/${courseId}`}
        className="inline-flex items-center gap-2 text-sm text-[#8A949F] transition-colors hover:text-[#FAFAFA]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Course
      </Link>

      <section className="overflow-hidden rounded-[32px] border border-[#1E1E1E] bg-[radial-gradient(circle_at_top_left,rgba(255,92,0,0.18),transparent_32%),linear-gradient(180deg,#101214_0%,#0B0D10_100%)] p-6 sm:p-8">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.1fr)_380px] xl:items-end">
          <div>
            <p
              className="text-[11px] uppercase tracking-[0.18em] text-[#FF6A2A]"
              style={{ fontFamily: 'DM Mono, monospace' }}
            >
              Assessment Center
            </p>
            <h1
              className="mt-4 text-3xl font-semibold text-[#FAFAFA] sm:text-4xl"
              style={{ fontFamily: 'Syne, sans-serif' }}
            >
              {courseData.course.title} exams and milestone checks
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[#8E98A4]">
              Full exams unlock as you move through the course. Your progress and past
              attempts are tracked here so you always know what is ready next.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <MetricCard label="Your Progress" value={`${progressSummary?.percentage ?? 0}%`} tone="text-[#FAFAFA]" />
            <MetricCard label="Unlocked" value={String(availableCount)} tone="text-[#FF6A2A]" />
            <MetricCard label="Completed" value={String(completedCount)} tone="text-green-400" />
          </div>
        </div>
      </section>

      {!isEnrolled ? (
        <Card className="rounded-[28px] border-[#1E1E1E] bg-[#101317] p-0">
          <CardContent className="py-10 text-center">
            <Lock className="mx-auto mb-4 h-10 w-10 text-text-muted" />
            <h2 className="text-xl font-semibold text-text-primary">
              Enroll To Unlock Assessments
            </h2>
            <p className="mt-2 text-text-secondary">
              Students can only access course assessments after enrolling.
            </p>
            <div className="mt-4">
              <Link href={`/student/courses/${courseId}`}>
                <Button variant="primary">Return to Course</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : summaries.length === 0 ? (
        <Card className="rounded-[28px] border-[#1E1E1E] bg-[#101317] p-0">
          <CardContent className="py-10 text-center">
            <ClipboardList className="mx-auto mb-4 h-10 w-10 text-text-muted" />
            <h2 className="text-xl font-semibold text-text-primary">
              No Assessments Yet
            </h2>
            <p className="mt-2 text-text-secondary">
              Your faculty has not added a module assessment or final exam for this
              course yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {summaries.map((summary) => {
            const isLocked = summary.availability === 'locked';
            const isCompleted = summary.availability === 'completed';
            const badgeVariant = isCompleted
              ? 'success'
              : isLocked
                ? 'warning'
                : 'info';

            return (
              <Card
                key={summary.exam._id}
                className="overflow-hidden rounded-[28px] border-[#1E1E1E] bg-[#101317] p-0"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <Badge variant={badgeVariant}>
                          {summary.availability}
                        </Badge>
                        <Badge
                          variant={summary.exam.module_id ? 'info' : 'success'}
                        >
                          {summary.exam.module_id ? 'module' : 'final'}
                        </Badge>
                      </div>

                      <h2
                        className="text-2xl font-semibold text-[#FAFAFA]"
                        style={{ fontFamily: 'Syne, sans-serif' }}
                      >
                        {summary.exam.title}
                      </h2>
                      <p className="mt-1 text-sm text-[#9AA3AD]">
                        {summary.label}
                      </p>
                      <p className="mt-3 text-sm leading-7 text-[#8A949F]">
                        {getAvailabilityCopy(
                          summary.availability,
                          summary.requiredCompletionPercentage,
                          summary.currentCompletionPercentage
                        )}
                      </p>

                      <div className="mt-5 flex flex-wrap items-center gap-4 text-xs uppercase tracking-[0.14em] text-[#69727D]">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {summary.exam.time_limit
                            ? `${summary.exam.time_limit} min`
                            : 'No time limit'}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Trophy className="h-3.5 w-3.5" />
                          {summary.exam.passing_marks}/{summary.exam.total_marks} to pass
                        </span>
                        <span>
                          Unlock at {summary.requiredCompletionPercentage}% completion
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 lg:w-64">
                      <div className="rounded-[22px] border border-[#1E242C] bg-[#11161B] p-4">
                        <p className="text-xs uppercase tracking-[0.16em] text-[#768390]">
                          Course Progress
                        </p>
                        <p className="mt-2 text-3xl font-semibold text-[#FAFAFA]">
                          {summary.currentCompletionPercentage}%
                        </p>
                      </div>

                      {isLocked ? (
                        <Button variant="secondary" disabled>
                          <Lock className="h-4 w-4" />
                          Locked
                        </Button>
                      ) : (
                        <Link href={`/student/courses/${courseId}/exams/${summary.exam._id}`}>
                          <Button
                            variant={isCompleted ? 'secondary' : 'primary'}
                            className="w-full"
                          >
                            {isCompleted ? (
                              <>
                                <CheckCircle2 className="h-4 w-4" />
                                Review Result
                              </>
                            ) : (
                              <>
                                <ClipboardList className="h-4 w-4" />
                                Start Assessment
                              </>
                            )}
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="rounded-[22px] border border-[#1E242C] bg-[#11161B] p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-[#768390]">{label}</p>
      <p className={`mt-2 text-3xl font-semibold ${tone}`}>{value}</p>
    </div>
  );
}
