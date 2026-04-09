'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  BookOpen, 
  CheckCircle, 
  ClipboardList,
  Download,
  Layers3,
  NotebookText,
  PlayCircle, 
  Sparkles,
  FileText,
  Video,
  ChevronDown,
  ChevronUp,
  Loader2
} from 'lucide-react';
import { Card, CardContent } from '@/client/components/ui/Card';
import { Button } from '@/client/components/ui/Button';
import { Badge } from '@/client/components/ui/Badge';
import { Spinner } from '@/client/components/ui/Spinner';
import RefundRequestPanel from '@/client/components/student/RefundRequestPanel';
import * as coursesApi from '@/lib/api/courses';
import * as enrollmentsApi from '@/lib/api/enrollments';
import * as progressApi from '@/lib/api/progress';
import type { Course, ModuleWithLessons, Lesson } from '@/lib/types';
import { toast } from 'sonner';

interface CourseData {
  course: Course;
  modules: ModuleWithLessons[];
  access_mode?: 'full' | 'preview';
}

type LearningTab = 'overview' | 'resources' | 'notes';

const formatDuration = (minutes: number) => {
  if (!minutes) {
    return 'Self-paced';
  }

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes ? `${hours} hr ${remainingMinutes} min` : `${hours} hr`;
};

const getCourseSelectionState = (
  modules: ModuleWithLessons[],
  preferredLessonId?: string | null
) => {
  let fallbackModuleId: string | null = modules[0]?._id || null;
  let fallbackLesson: Lesson | null = null;

  for (const module of modules) {
    if (!fallbackLesson && module.lessons?.length) {
      fallbackLesson = module.lessons[0];
      fallbackModuleId = module._id;
    }

    if (!preferredLessonId) {
      continue;
    }

    const preferredLesson =
      module.lessons?.find((lesson) => lesson._id === preferredLessonId) || null;

    if (preferredLesson) {
      return {
        expandedModules: new Set([module._id]),
        selectedLesson: preferredLesson,
      };
    }
  }

  return {
    expandedModules: fallbackModuleId ? new Set([fallbackModuleId]) : new Set<string>(),
    selectedLesson: fallbackLesson,
  };
};

export default function CoursePlayerPage() {
  const params = useParams();
  const courseId = params.id as string;

  const [courseData, setCourseData] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [markingComplete, setMarkingComplete] = useState(false);
  const [activeTab, setActiveTab] = useState<LearningTab>('overview');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<number | null>(null);

  const applyCourseData = (data: CourseData, preferredLessonId?: string | null) => {
    setCourseData(data);

    const nextSelection = getCourseSelectionState(data.modules || [], preferredLessonId);
    setExpandedModules(nextSelection.expandedModules);
    setSelectedLesson(nextSelection.selectedLesson);
  };

  useEffect(() => {
    let cancelled = false;

    const fetchCourseData = async () => {
      setLoading(true);

      try {
        setLoadError(null);
        setErrorCode(null);

        const [courseResult, enrollmentsResult] = await Promise.allSettled([
          coursesApi.getFullCourse(courseId),
          enrollmentsApi.getMyEnrollments(),
        ]);

        if (cancelled) {
          return;
        }

        if (courseResult.status === 'rejected') {
          throw courseResult.reason;
        }

        const data = courseResult.value;
        applyCourseData(data);

        const enrollment =
          enrollmentsResult.status === 'fulfilled'
            ? enrollmentsResult.value.find((item) => item.course_id === courseId)
            : null;

        setIsEnrolled(Boolean(enrollment));

        if (enrollment) {
          try {
            await progressApi.getCourseProgress(courseId);

            if (cancelled) {
              return;
            }

            const completed = new Set(
              progressApi.getCachedCompletedLessonIdsForCourse(courseId)
            );
            setCompletedLessons(completed);
          } catch {
            if (!cancelled) {
              setCompletedLessons(new Set());
            }
          }
        } else {
          setCompletedLessons(new Set());
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error('Failed to fetch course:', error);
        const message =
          error instanceof Error ? error.message : 'Failed to load course';
        const statusCode =
          typeof error === 'object' &&
          error !== null &&
          'statusCode' in error &&
          typeof (error as { statusCode?: number }).statusCode === 'number'
            ? (error as { statusCode: number }).statusCode
            : null;
        setCourseData(null);
        setIsEnrolled(false);
        setSelectedLesson(null);
        setExpandedModules(new Set());
        setCompletedLessons(new Set());
        setErrorCode(statusCode);
        setLoadError(message);
        toast.error(message);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    if (courseId) {
      fetchCourseData();
    }

    return () => {
      cancelled = true;
    };
  }, [courseId]);

  useEffect(() => {
    if (!selectedLesson) {
      return;
    }

    if (selectedLesson.type === 'file') {
      setActiveTab('resources');
      return;
    }

    if (selectedLesson.type === 'text') {
      setActiveTab('notes');
      return;
    }

    setActiveTab('overview');
  }, [selectedLesson]);

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      setLoadError(null);
      await enrollmentsApi.enrollInCourse(courseId);
      setIsEnrolled(true);

      const refreshedCourse = await coursesApi.getFullCourse(courseId);
      applyCourseData(refreshedCourse, selectedLesson?._id);

      try {
        await progressApi.getCourseProgress(courseId);
        setCompletedLessons(
          new Set(progressApi.getCachedCompletedLessonIdsForCourse(courseId))
        );
      } catch {
        setCompletedLessons(new Set());
      }

      toast.success('Successfully enrolled in course!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to enroll');
    } finally {
      setEnrolling(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!selectedLesson || !isEnrolled) return;

    setMarkingComplete(true);
    try {
      await progressApi.markLessonComplete(selectedLesson._id);
      setCompletedLessons(prev => {
        const next = new Set(prev);
        next.add(selectedLesson._id);
        return next;
      });
      toast.success('Lesson marked as complete!');

      // Auto-advance to next lesson
      if (courseData?.modules) {
        let foundCurrent = false;
        for (const module of courseData.modules) {
          if (module.lessons) {
            for (const lesson of module.lessons) {
              if (foundCurrent) {
                setSelectedLesson(lesson);
                setExpandedModules(prev => {
                  const next = new Set(prev);
                  next.add(module._id);
                  return next;
                });
                return;
              }
              if (lesson._id === selectedLesson._id) {
                foundCurrent = true;
              }
            }
          }
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to mark complete');
    } finally {
      setMarkingComplete(false);
    }
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  const getCompletionPercentage = () => {
    if (!courseData?.modules) return 0;
    let total = 0;
    let completed = 0;
    for (const module of courseData.modules) {
      if (module.lessons) {
        total += module.lessons.length;
        completed += module.lessons.filter(l => completedLessons.has(l._id)).length;
      }
    }
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const course = courseData?.course;
  const modules = courseData?.modules;
  const accessMode = courseData?.access_mode || (isEnrolled ? 'full' : 'preview');
  const isPreviewMode = accessMode === 'preview' && !isEnrolled;
  const completionPercentage = getCompletionPercentage();
  const totalLessons =
    modules?.reduce((sum, module) => sum + (module.lessons?.length || 0), 0) || 0;
  const completedCount = completedLessons.size;
  const selectedModule = useMemo(() => {
    if (!modules || !selectedLesson) return null;
    return (
      modules.find((module) =>
        module.lessons?.some((lesson) => lesson._id === selectedLesson._id)
      ) || null
    );
  }, [modules, selectedLesson]);
  const resourceLessons = useMemo(() => {
    if (!selectedModule?.lessons) return [];
    return selectedModule.lessons.filter((lesson) => lesson.type === 'file');
  }, [selectedModule]);
  const noteLessons = useMemo(() => {
    if (!selectedModule?.lessons) return [];
    return selectedModule.lessons.filter((lesson) => lesson.type === 'text');
  }, [selectedModule]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!courseData || !course) {
    return (
      <Card className="rounded-[28px] border-[#1E1E1E] bg-[#111111]">
        <CardContent className="py-12 text-center">
          <BookOpen className="mx-auto mb-4 h-12 w-12 text-[#555555]" />
          <h3
            className="mb-2 text-lg font-semibold text-[#FAFAFA]"
            style={{ fontFamily: 'Syne, sans-serif' }}
          >
            {errorCode === 403 ? 'Course not currently available' : 'Course not found'}
          </h3>
          <p className="mb-4 text-[#888888]">
            {errorCode === 403
              ? 'This course is no longer available to students. It may be unpublished, rejected, or removed from the live catalog.'
              : loadError || "This course may have been removed or doesn't exist."}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/student/courses">
              <Button variant="primary">Browse Courses</Button>
            </Link>
            <Button
              variant="secondary"
              onClick={() => window.location.reload()}
              className="border-[#1E1E1E] bg-[#161616] text-[#FAFAFA]"
            >
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/student/courses"
          className="inline-flex items-center gap-2 text-sm text-[#888888] transition-colors hover:text-[#FAFAFA]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Courses
        </Link>

        {isEnrolled ? (
          <Link href={`/student/courses/${courseId}/exams`}>
            <Button
              variant="secondary"
              className="border-[#1E1E1E] bg-[#111111] text-[#FAFAFA] hover:border-[#2A2A2A] hover:bg-[#161616]"
            >
              <ClipboardList className="h-4 w-4" />
              View Assessments
            </Button>
          </Link>
        ) : course.price === 0 ? (
          <Button variant="primary" onClick={handleEnroll} disabled={enrolling}>
            {enrolling ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enrolling...
              </>
            ) : (
              <>Enroll Free</>
            )}
          </Button>
        ) : (
          <Link href={`/student/checkout/${courseId}`}>
            <Button variant="primary">
              Buy now ₹{course.price.toLocaleString()}
            </Button>
          </Link>
        )}
      </div>

      <section className="rounded-[30px] border border-[#1E1E1E] bg-[#0F0F0F] p-6 sm:p-8">
        <div className="mb-8 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <Badge
                variant="default"
                className="rounded-sm border border-[#2A2A2A] bg-[#121212] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[#FF5C00]"
              >
                {course.category}
              </Badge>
              <span className="text-xs uppercase tracking-[0.16em] text-[#555555]">
                Tutor Learning Console
              </span>
            </div>
            <h1
              className="text-3xl font-semibold leading-tight text-[#FAFAFA] sm:text-4xl"
              style={{ fontFamily: 'Syne, sans-serif' }}
            >
              {course.title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#888888] sm:text-base">
              {course.description}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[420px]">
            <StatBlock label="Modules" value={String(modules?.length || 0)} />
            <StatBlock label="Lessons" value={String(totalLessons)} />
            <StatBlock label="Duration" value={formatDuration(course.total_duration)} />
          </div>
        </div>

        {isEnrolled && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.14em] text-[#888888]">
              <span>Your Progress</span>
              <span>{completionPercentage}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#161616]">
              <div
                className="h-full rounded-full bg-[#FF5C00] transition-all"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        )}

        {isPreviewMode ? (
          <div className="mt-6 rounded-[22px] border border-[#FF5C00]/20 bg-[#FF5C00]/5 p-4 text-sm text-[#F3C2A5]">
            You are viewing preview content only. Enroll to unlock the full lesson library,
            assessments, and progress tracking for this course.
          </div>
        ) : null}
      </section>

      {isEnrolled && course.price > 0 ? (
        <RefundRequestPanel
          courseId={courseId}
          courseTitle={course.title}
          completionPercentage={completionPercentage}
        />
      ) : null}

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1">

          {selectedLesson ? (
            <Card className="overflow-hidden rounded-[30px] border-[#1E1E1E] bg-[#101010] p-0">
              <CardContent className="p-0">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1E1E1E] px-5 py-4 sm:px-6">
                  <div className="flex items-center gap-3 text-xs text-[#666666]">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#FF5C00]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#2A2A2A]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#2A2A2A]" />
                    </div>
                    <span>{selectedModule?.title || 'Current Module'} — {selectedLesson.title}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-[#2A2A2A] px-3 py-1 text-xs text-[#A3A3A3]">
                      {selectedLesson.type.toUpperCase()}
                    </span>
                    <span className="rounded-full border border-[#2A2A2A] px-3 py-1 text-xs text-[#A3A3A3]">
                      {formatDuration(selectedLesson.duration)}
                    </span>
                    {completedLessons.has(selectedLesson._id) ? (
                      <span className="rounded-full border border-[#1C5A34] bg-[#0F1B14] px-3 py-1 text-xs text-[#4ADE80]">
                        Completed
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="line-grid border-b border-[#1E1E1E] bg-[#0B0B0B] p-4 sm:p-6">
                  <div className="mb-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[#FF5C00]">
                      Current lesson
                    </p>
                    <h2
                      className="mt-2 text-2xl font-semibold text-[#FAFAFA]"
                      style={{ fontFamily: 'Syne, sans-serif' }}
                    >
                      {selectedLesson.title}
                    </h2>
                  </div>

                  <div className="overflow-hidden rounded-[24px] border border-[#1E1E1E] bg-[#0E0E0E]">
                    {selectedLesson.type === 'video' && selectedLesson.video_url ? (
                      <div className="aspect-video bg-black">
                        <video
                          src={selectedLesson.video_url}
                          controls
                          playsInline
                          preload="metadata"
                          className="h-full w-full object-contain"
                        />
                      </div>
                    ) : selectedLesson.type === 'text' ? (
                      <div className="min-h-[360px] p-8">
                        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#1E1E1E] bg-[#121212] px-3 py-1 text-xs text-[#888888]">
                          <NotebookText className="h-3.5 w-3.5 text-[#FF5C00]" />
                          Lesson Notes
                        </div>
                        <div className="max-w-3xl whitespace-pre-wrap text-sm leading-8 text-[#CFCFCF]">
                          {selectedLesson.content || 'No content available for this lesson.'}
                        </div>
                      </div>
                    ) : (
                      <div className="flex min-h-[360px] flex-col items-center justify-center gap-4 p-8 text-center">
                        <div className="rounded-full border border-[#2A2A2A] bg-[#121212] p-5">
                          <FileText className="h-10 w-10 text-[#FF5C00]" />
                        </div>
                        <div>
                          <h3
                            className="text-xl font-semibold text-[#FAFAFA]"
                            style={{ fontFamily: 'Syne, sans-serif' }}
                          >
                            Resource lesson
                          </h3>
                          <p className="mt-2 max-w-md text-sm leading-7 text-[#888888]">
                            This lesson is attached as a downloadable file. Open it in a new tab or
                            keep it saved alongside the module while you study.
                          </p>
                        </div>
                        {selectedLesson.file_url ? (
                          <a href={selectedLesson.file_url} target="_blank" rel="noopener noreferrer">
                            <Button variant="primary">
                              <Download className="h-4 w-4" />
                              Download File
                            </Button>
                          </a>
                        ) : null}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 h-1 overflow-hidden rounded-full bg-[#161616]">
                    <div
                      className="h-full rounded-full bg-[#FF5C00]"
                      style={{ width: `${Math.max(completionPercentage, 8)}%` }}
                    />
                  </div>
                </div>

                <div className="px-5 py-5 sm:px-6">
                  <div className="mb-5 flex flex-wrap gap-2 border-b border-[#1E1E1E] pb-4">
                    {(['overview', 'resources', 'notes'] as LearningTab[]).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveTab(tab)}
                        className={`rounded-sm border px-4 py-2 text-sm transition-colors ${
                          activeTab === tab
                            ? 'border-[#FF5C00] bg-[#FF5C00]/10 text-[#FAFAFA]'
                            : 'border-transparent text-[#777777] hover:border-[#1E1E1E] hover:bg-[#141414] hover:text-[#FAFAFA]'
                        }`}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    ))}
                  </div>

                  {activeTab === 'overview' ? (
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                      <div className="rounded-[22px] border border-[#1E1E1E] bg-[#111111] p-5">
                        <div className="mb-3 inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-[#FF5C00]">
                          <Sparkles className="h-3.5 w-3.5" />
                          Learning Snapshot
                        </div>
                        <p className="text-sm leading-7 text-[#A3A3A3]">
                          {selectedLesson.type === 'video'
                            ? 'If the lesson URL points directly to an accessible video object, it will play inline here with native browser controls.'
                            : selectedLesson.type === 'text'
                              ? selectedLesson.content || course.description
                              : 'Use this lesson as a companion resource while you progress through the module.'}
                        </p>
                      </div>

                      <div className="rounded-[22px] border border-[#1E1E1E] bg-[#111111] p-5">
                        <p className="mb-3 text-[11px] uppercase tracking-[0.16em] text-[#888888]">
                          Progress
                        </p>
                        <div className="space-y-3 text-sm text-[#A3A3A3]">
                          <div className="flex items-center justify-between">
                            <span>Completed</span>
                            <span>{completedCount}/{totalLessons}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Module</span>
                            <span>{selectedModule?.title || '—'}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Lesson Type</span>
                            <span className="capitalize">{selectedLesson.type}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {activeTab === 'resources' ? (
                    <div className="space-y-3">
                      {resourceLessons.length > 0 ? (
                        resourceLessons.map((lesson) => (
                          <a
                            key={lesson._id}
                            href={lesson.file_url || lesson.content_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between gap-4 rounded-[20px] border border-[#1E1E1E] bg-[#111111] px-5 py-4 transition-colors hover:border-[#2A2A2A] hover:bg-[#151515]"
                          >
                            <div className="min-w-0">
                              <p
                                className="truncate text-base font-medium text-[#FAFAFA]"
                                style={{ fontFamily: 'Syne, sans-serif' }}
                              >
                                {lesson.title}
                              </p>
                              <p className="mt-1 text-sm text-[#777777]">
                                {formatDuration(lesson.duration)} resource
                              </p>
                            </div>
                            <Download className="h-4 w-4 flex-shrink-0 text-[#888888]" />
                          </a>
                        ))
                      ) : (
                        <div className="rounded-[22px] border border-dashed border-[#1E1E1E] bg-[#111111] p-5 text-sm text-[#777777]">
                          No additional resources are attached to this module yet.
                        </div>
                      )}
                    </div>
                  ) : null}

                  {activeTab === 'notes' ? (
                    <div className="space-y-3">
                      {selectedLesson.type === 'text' && selectedLesson.content ? (
                        <div className="rounded-[22px] border border-[#1E1E1E] bg-[#111111] p-5 whitespace-pre-wrap text-sm leading-7 text-[#CFCFCF]">
                          {selectedLesson.content}
                        </div>
                      ) : noteLessons.length > 0 ? (
                        noteLessons.map((lesson) => (
                          <button
                            key={lesson._id}
                            type="button"
                            onClick={() => setSelectedLesson(lesson)}
                            className="w-full rounded-[20px] border border-[#1E1E1E] bg-[#111111] px-5 py-4 text-left transition-colors hover:border-[#2A2A2A] hover:bg-[#151515]"
                          >
                            <p
                              className="text-base font-medium text-[#FAFAFA]"
                              style={{ fontFamily: 'Syne, sans-serif' }}
                            >
                              {lesson.title}
                            </p>
                            <p className="mt-1 text-sm text-[#777777]">
                              Open this text lesson inside the player
                            </p>
                          </button>
                        ))
                      ) : (
                        <div className="rounded-[22px] border border-dashed border-[#1E1E1E] bg-[#111111] p-5 text-sm text-[#777777]">
                          No separate lesson notes are available yet. Use the course description and
                          module resources as your reference for now.
                        </div>
                      )}
                    </div>
                  ) : null}

                  {isEnrolled && !completedLessons.has(selectedLesson._id) && (
                    <div className="mt-6 flex justify-end">
                      <Button variant="primary" onClick={handleMarkComplete} disabled={markingComplete}>
                        {markingComplete ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            Mark as Complete
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-[28px] border-[#1E1E1E] bg-[#111111]">
              <CardContent className="py-12 text-center">
                <PlayCircle className="mx-auto mb-4 h-12 w-12 text-[#555555]" />
                <p className="text-[#888888]">
                  {isPreviewMode
                    ? 'This course does not have any preview lessons yet. Enroll to unlock the full content.'
                    : 'Select a lesson from the sidebar to start learning.'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="w-full flex-shrink-0 lg:w-80">
          <Card className="sticky top-24 rounded-[30px] border-[#1E1E1E] bg-[#101010] p-0">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[#888888]">
                    Course Content
                  </p>
                  <h3
                    className="mt-2 text-xl font-semibold text-[#FAFAFA]"
                    style={{ fontFamily: 'Syne, sans-serif' }}
                  >
                    Structured Path
                  </h3>
                </div>
                <Layers3 className="h-5 w-5 text-[#FF5C00]" />
              </div>

              {modules && modules.length > 0 ? (
                <div className="space-y-3">
                  {modules.map((module, idx) => (
                    <div
                      key={module._id}
                      className="overflow-hidden rounded-[22px] border border-[#1E1E1E] bg-[#111111]"
                    >
                      <button
                        onClick={() => toggleModule(module._id)}
                        className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition-colors hover:bg-[#151515]"
                      >
                        <div className="min-w-0">
                          <p className="text-xs text-[#FF5C00]">Module {idx + 1}</p>
                          <p
                            className="mt-1 truncate text-sm font-medium text-[#FAFAFA]"
                            style={{ fontFamily: 'Syne, sans-serif' }}
                          >
                            {module.title}
                          </p>
                        </div>
                        {expandedModules.has(module._id) ? (
                          <ChevronUp className="h-4 w-4 flex-shrink-0 text-[#777777]" />
                        ) : (
                          <ChevronDown className="h-4 w-4 flex-shrink-0 text-[#777777]" />
                        )}
                      </button>

                      {expandedModules.has(module._id) && module.lessons && (
                        <div className="border-t border-[#1E1E1E] px-3 py-2">
                          {module.lessons.map((lesson, lessonIdx) => {
                            const isSelected = selectedLesson?._id === lesson._id;
                            const isComplete = completedLessons.has(lesson._id);

                            return (
                              <button
                                key={lesson._id}
                                onClick={() => setSelectedLesson(lesson)}
                                className={`flex w-full items-start gap-3 rounded-[16px] px-3 py-3 text-left transition-colors ${
                                  isSelected
                                    ? 'bg-[#FF5C00]/10 text-[#FAFAFA]'
                                    : 'text-[#A3A3A3] hover:bg-[#151515]'
                                }`}
                              >
                                {isComplete ? (
                                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                                ) : lesson.type === 'video' ? (
                                  <Video className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#888888]" />
                                ) : (
                                  <FileText className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#888888]" />
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm">
                                    {lessonIdx + 1}. {lesson.title}
                                  </p>
                                  <p
                                    className={`mt-1 text-xs ${
                                      isSelected ? 'text-[#F3C2A5]' : 'text-[#666666]'
                                    }`}
                                  >
                                    {formatDuration(lesson.duration)}
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-4 text-center text-sm text-[#666666]">
                  No modules available yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-[#1E1E1E] bg-[#111111] p-4">
      <p className="text-[11px] uppercase tracking-[0.16em] text-[#666666]">
        {label}
      </p>
      <p
        className="mt-2 text-lg font-semibold text-[#FAFAFA]"
        style={{ fontFamily: 'Syne, sans-serif' }}
      >
        {value}
      </p>
    </div>
  );
}
