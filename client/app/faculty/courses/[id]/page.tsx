'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  ClipboardList,
  Plus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronUp,
  Loader2,
  Check,
  Users,
  TrendingUp,
  Upload,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/client/components/ui/Card';
import { Button } from '@/client/components/ui/Button';
import { Badge } from '@/client/components/ui/Badge';
import { Input } from '@/client/components/ui/Input';
import { Textarea } from '@/client/components/ui/Textarea';
import { toast } from 'sonner';
import * as coursesApi from '@/lib/api/courses';
import * as modulesApi from '@/lib/api/modules';
import * as lessonsApi from '@/lib/api/lessons';
import * as uploadApi from '@/lib/api/upload';
import type { Course, ModuleWithLessons, Lesson, LessonType } from '@/lib/types';
import {
  buildCourseAnalyticsSummary,
  type CourseAnalyticsSummary,
} from '@/lib/analytics/faculty';

interface CourseData {
  course: Course;
  modules: ModuleWithLessons[];
}

interface LessonUploadState {
  isUploading: boolean;
  progress: number;
  fileName: string;
}

export default function CourseEditorPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [courseData, setCourseData] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [moduleTitle, setModuleTitle] = useState('');
  const [lessonDrafts, setLessonDrafts] = useState<
    Record<
      string,
      {
        title: string;
        type: LessonType;
        duration: number;
        content_url: string;
        content_text: string;
      }
    >
  >({});
  const [lessonUploads, setLessonUploads] = useState<Record<string, LessonUploadState>>({});
  const [courseAnalytics, setCourseAnalytics] =
    useState<CourseAnalyticsSummary | null>(null);
  const [reorderingModuleId, setReorderingModuleId] = useState<string | null>(null);
  const [reorderingLessonKey, setReorderingLessonKey] = useState<string | null>(null);
  const deleteActionsAvailable = false;

  const defaultLessonDraft = {
    title: '',
    type: 'text' as LessonType,
    duration: 0,
    content_url: '',
    content_text: '',
  };

  const moveItem = <T,>(items: T[], fromIndex: number, toIndex: number): T[] => {
    const nextItems = [...items];
    const [item] = nextItems.splice(fromIndex, 1);
    nextItems.splice(toIndex, 0, item);
    return nextItems;
  };

  const buildModuleReorderPayload = (modulesToReorder: ModuleWithLessons[]) => ({
    modules: modulesToReorder.map((module, index) => ({
      id: module._id,
      order: index + 1,
    })),
  });

  const buildLessonReorderPayload = (lessonsToReorder: Lesson[]) => ({
    lessons: lessonsToReorder.map((lesson, index) => ({
      id: lesson._id,
      order: index + 1,
    })),
  });

  const getLessonDraft = (moduleId: string) => {
    return lessonDrafts[moduleId] || defaultLessonDraft;
  };

  const updateLessonDraft = (
    moduleId: string,
    patch: Partial<{
      title: string;
      type: LessonType;
      duration: number;
      content_url: string;
      content_text: string;
    }>
  ) => {
    setLessonDrafts((prev) => ({
      ...prev,
      [moduleId]: {
        ...(prev[moduleId] || defaultLessonDraft),
        ...patch,
      },
    }));
  };

  const resetLessonDraft = (moduleId: string) => {
    setLessonDrafts((prev) => {
      const next = { ...prev };
      delete next[moduleId];
      return next;
    });
  };

  const getLessonUpload = (moduleId: string): LessonUploadState => {
    return (
      lessonUploads[moduleId] || {
        isUploading: false,
        progress: 0,
        fileName: '',
      }
    );
  };

  const updateLessonUpload = (
    moduleId: string,
    patch: Partial<LessonUploadState>
  ) => {
    setLessonUploads((prev) => ({
      ...prev,
      [moduleId]: {
        ...(prev[moduleId] || {
          isUploading: false,
          progress: 0,
          fileName: '',
        }),
        ...patch,
      },
    }));
  };

  const resetLessonUpload = (moduleId: string) => {
    setLessonUploads((prev) => {
      const next = { ...prev };
      delete next[moduleId];
      return next;
    });
  };

  const loadCourse = async (expandedIds?: Iterable<string>) => {
    const data = await coursesApi.getFullCourse(courseId);
    setCourseData(data);

    if (data.modules && data.modules.length > 0) {
      const nextExpanded = new Set(
        expandedIds && Array.from(expandedIds).length > 0
          ? Array.from(expandedIds).filter(Boolean)
          : [data.modules[0]._id]
      );
      setExpandedModules(nextExpanded);
      return data;
    }

    setExpandedModules(new Set());
    return data;
  };

  const handleLessonAssetUpload = async (
    moduleId: string,
    lessonType: LessonType,
    file?: File | null
  ) => {
    if (!file) {
      return;
    }

    if (lessonType === 'video' && !file.type.startsWith('video/')) {
      toast.error('Please choose a valid video file');
      return;
    }

    updateLessonUpload(moduleId, {
      isUploading: true,
      progress: 0,
      fileName: file.name,
    });

    try {
      const uploadedUrl = await uploadApi.uploadFile(file, (progress) => {
        updateLessonUpload(moduleId, { progress });
      });

      updateLessonDraft(moduleId, { content_url: uploadedUrl });
      updateLessonUpload(moduleId, {
        isUploading: false,
        progress: 100,
      });
      toast.success(
        lessonType === 'video'
          ? 'Video uploaded successfully'
          : 'File uploaded successfully'
      );
    } catch (error: any) {
      resetLessonUpload(moduleId);
      toast.error(
        error.message ||
          (lessonType === 'video'
            ? 'Failed to upload video'
            : 'Failed to upload file')
      );
    }
  };

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        await loadCourse();
      } catch (error: any) {
        console.error('Failed to fetch course:', error);
        toast.error(error.message || 'Failed to load course');
        if (error.statusCode === 403) {
          router.replace('/faculty/courses');
        }
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchCourse();
    }
  }, [courseId, router]);

  useEffect(() => {
    if (!courseData) {
      setCourseAnalytics(null);
      return;
    }

    setCourseAnalytics(buildCourseAnalyticsSummary(courseData));
  }, [courseData]);

  const handleAddModule = async () => {
    if (!courseData || !moduleTitle.trim()) {
      toast.error('Module title is required');
      return;
    }

    try {
      const createdModule = await modulesApi.createModule(courseId, {
        title: moduleTitle,
      });
      const createdModuleId =
        (createdModule as { _id?: string; id?: string })._id ||
        (createdModule as { _id?: string; id?: string }).id;
      const expandedIds = new Set(expandedModules);
      if (createdModuleId) {
        expandedIds.add(createdModuleId);
      }
      const refreshedCourse = await loadCourse(expandedIds);
      if (!createdModuleId && refreshedCourse.modules.length > 0) {
        setExpandedModules((prev) => {
          const next = new Set(prev);
          next.add(refreshedCourse.modules[refreshedCourse.modules.length - 1]._id);
          return next;
        });
      }
      setModuleTitle('');
      toast.success('Module added successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add module');
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!deleteActionsAvailable) {
      toast.info('Module deletion is not available with the current backend yet.');
      return;
    }

    if (!confirm('Are you sure you want to delete this module?')) return;

    try {
      await modulesApi.deleteModule(courseId, moduleId);
      setCourseData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          modules: prev.modules.filter((m) => m._id !== moduleId),
        };
      });
      toast.success('Module deleted');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete module');
    }
  };

  const handlePublish = async () => {
    try {
      await coursesApi.publishCourse(courseId);
      setCourseData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          course: { ...prev.course, status: 'published' },
        };
      });
      toast.success('Course published successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to publish course');
    }
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  const handleMoveModule = async (
    moduleId: string,
    direction: 'up' | 'down'
  ) => {
    if (!courseData) return;

    const currentIndex = courseData.modules.findIndex((module) => module._id === moduleId);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= courseData.modules.length) return;

    const previousModules = courseData.modules;
    const reorderedModules = moveItem(previousModules, currentIndex, targetIndex);

    setCourseData({
      ...courseData,
      modules: reorderedModules,
    });
    setReorderingModuleId(moduleId);

    try {
      await modulesApi.reorderModules(courseId, buildModuleReorderPayload(reorderedModules));
      toast.success('Module order updated');
    } catch (error: any) {
      setCourseData({
        ...courseData,
        modules: previousModules,
      });
      toast.error(error.message || 'Failed to reorder modules');
    } finally {
      setReorderingModuleId(null);
    }
  };

  const handleMoveLesson = async (
    moduleId: string,
    lessonId: string,
    direction: 'up' | 'down'
  ) => {
    if (!courseData) return;

    const moduleIndex = courseData.modules.findIndex((module) => module._id === moduleId);
    if (moduleIndex === -1) return;

    const module = courseData.modules[moduleIndex];
    const lessons = module.lessons || [];
    const currentIndex = lessons.findIndex((lesson) => lesson._id === lessonId);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= lessons.length) return;

    const previousLessons = lessons;
    const reorderedLessons = moveItem(previousLessons, currentIndex, targetIndex);
    const updatedModules = courseData.modules.map((item) =>
      item._id === moduleId ? { ...item, lessons: reorderedLessons } : item
    );

    setCourseData({
      ...courseData,
      modules: updatedModules,
    });
    setReorderingLessonKey(lessonId);

    try {
      await lessonsApi.reorderLessons(moduleId, buildLessonReorderPayload(reorderedLessons));
      toast.success('Lesson order updated');
    } catch (error: any) {
      setCourseData({
        ...courseData,
        modules: courseData.modules.map((item) =>
          item._id === moduleId ? { ...item, lessons: previousLessons } : item
        ),
      });
      toast.error(error.message || 'Failed to reorder lessons');
    } finally {
      setReorderingLessonKey(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!courseData) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <BookOpen className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            Course not found
          </h3>
          <Link href="/faculty/courses">
            <Button variant="primary">Back to Courses</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const course = courseData.course;
  const modules = courseData.modules;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        href="/faculty/courses"
        className="inline-flex items-center text-text-secondary hover:text-text-primary"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Courses
      </Link>

      {/* Course Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="mb-2">{course.title}</CardTitle>
              <Badge
                variant={course.status === 'published' ? 'success' : 'default'}
              >
                {course.status}
              </Badge>
            </div>
            {course.status === 'draft' && (
              <Button variant="primary" onClick={handlePublish} className="w-full sm:w-auto">
                <Check className="w-4 h-4 mr-2" />
                Publish Course
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-text-secondary mb-4">{course.description}</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm text-text-muted">Modules</p>
              <p className="text-2xl font-bold text-text-primary">
                {modules.length}
              </p>
            </div>
            <div>
              <p className="text-sm text-text-muted">Total Lessons</p>
              <p className="text-2xl font-bold text-text-primary">
                {modules.reduce((sum, m) => sum + (m.lessons?.length || 0), 0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-text-muted">Duration</p>
              <p className="text-2xl font-bold text-text-primary">
                {course.total_duration} min
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg">Student Progress</CardTitle>
              <p className="mt-1 text-sm text-text-secondary">
                Student enrollments, lesson completion, and assessment activity are summarized here.
              </p>
            </div>
            <Link href="/faculty/analytics">
              <Button variant="secondary" size="sm">
                View Analytics
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-bg-elevated p-4">
              <p className="text-sm text-text-muted">Students</p>
              <p className="mt-1 flex items-center gap-2 text-2xl font-bold text-text-primary">
                <Users className="w-5 h-5 text-accent" />
                {courseAnalytics?.enrolledStudents || 0}
              </p>
              {courseAnalytics && courseAnalytics.trackedStudents < courseAnalytics.enrolledStudents && (
                <p className="mt-1 text-xs text-text-muted">
                  {courseAnalytics.trackedStudents} tracked in this browser
                </p>
              )}
            </div>
            <div className="rounded-lg bg-bg-elevated p-4">
              <p className="text-sm text-text-muted">Completed</p>
              <p className="mt-1 flex items-center gap-2 text-2xl font-bold text-green-500">
                <Check className="w-5 h-5" />
                {courseAnalytics?.completedStudents || 0}
              </p>
            </div>
            <div className="rounded-lg bg-bg-elevated p-4">
              <p className="text-sm text-text-muted">Average Progress</p>
              <p className="mt-1 flex items-center gap-2 text-2xl font-bold text-accent">
                <TrendingUp className="w-5 h-5" />
                {courseAnalytics?.averageCompletion || 0}%
              </p>
            </div>
          </div>

          {courseAnalytics && courseAnalytics.studentProgress.length > 0 ? (
            <div className="space-y-3">
              {courseAnalytics.studentProgress.slice(0, 4).map((student) => (
                <div
                  key={student.userId}
                  className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-text-primary">
                      {student.name}
                    </p>
                    <p className="truncate text-sm text-text-muted">
                      {student.email || `User ID: ${student.userId}`}
                    </p>
                  </div>
                  <div className="w-full sm:max-w-xs">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-text-secondary">
                        {student.completedLessons}/{student.totalLessons} lessons
                      </span>
                      <span className="font-semibold text-text-primary">
                        {student.progressPercentage}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-bg-elevated">
                      <div
                        className="h-full rounded-full bg-accent transition-all"
                        style={{ width: `${student.progressPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-4 text-sm text-text-muted">
              Student progress will appear here after learners enroll and complete lessons.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modules and Lessons */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display font-semibold text-text-primary">
            Course Content
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/faculty/courses/${courseId}/assessments`}>
              <Button variant="primary" size="sm">
                <ClipboardList className="w-4 h-4 mr-2" />
                Create Exam
              </Button>
            </Link>
            <Link href={`/faculty/courses/${courseId}/edit`}>
              <Button variant="secondary" size="sm">
                Edit Details
              </Button>
            </Link>
          </div>
        </div>

        {/* Add Module Form */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                placeholder="New module title..."
                value={moduleTitle}
                onChange={(e) => setModuleTitle(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddModule()}
              />
              <Button variant="primary" onClick={handleAddModule} className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Add Module
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Modules List */}
        {modules.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <p className="text-text-secondary">
                Add modules to structure your course content.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {modules.map((module, idx) => (
              <div
                key={module._id}
                className="border border-border rounded-lg overflow-hidden"
              >
                {/* Module Header */}
                <div className="bg-bg-elevated p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      onClick={() => toggleModule(module._id)}
                      className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="text-sm font-medium text-accent">
                          {idx + 1}.
                        </span>
                        <span className="truncate font-medium text-text-primary">
                          {module.title}
                        </span>
                        <Badge variant="info" className="shrink-0 text-xs">
                          {module.lessons?.length || 0} lessons
                        </Badge>
                      </div>
                      {expandedModules.has(module._id) ? (
                        <ChevronUp className="w-4 h-4 text-text-muted flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-text-muted flex-shrink-0" />
                      )}
                    </button>

                    <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={idx === 0 || reorderingModuleId === module._id}
                        onClick={() => handleMoveModule(module._id, 'up')}
                        title="Move module up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={idx === modules.length - 1 || reorderingModuleId === module._id}
                        onClick={() => handleMoveModule(module._id, 'down')}
                        title="Move module down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteModule(module._id)}
                        title={
                          deleteActionsAvailable
                            ? 'Delete module'
                            : 'Module deletion is not available with the current backend'
                        }
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Lessons */}
                {expandedModules.has(module._id) && (
                  <div className="border-t border-border">
                    {/* Add Lesson */}
                    <div className="p-4 bg-bg-primary border-b border-border">
                      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_150px_120px_auto]">
                        {(() => {
                          const moduleId = module._id;
                          const lessonDraft = getLessonDraft(moduleId);
                          const lessonUpload = getLessonUpload(moduleId);

                          return (
                            <>
                              <Input
                                placeholder="New lesson title..."
                                value={lessonDraft.title}
                                onChange={(e) =>
                                  updateLessonDraft(moduleId, {
                                    title: e.target.value,
                                  })
                                }
                              />
                              <select
                                value={lessonDraft.type}
                                onChange={(e) =>
                                  updateLessonDraft(moduleId, {
                                    type: e.target.value as 'video' | 'text' | 'file',
                                  })
                                }
                                className="w-full rounded-md border border-border bg-bg-elevated px-4 py-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                              >
                                <option value="text">Text Lesson</option>
                                <option value="video">Video Lesson</option>
                                <option value="file">File Lesson</option>
                              </select>
                              <Input
                                type="number"
                                min={0}
                                placeholder="Duration"
                                value={lessonDraft.duration}
                                onChange={(e) =>
                                  updateLessonDraft(moduleId, {
                                    duration: Number(e.target.value) || 0,
                                  })
                                }
                              />
                              <Button
                                variant="primary"
                                size="sm"
                                className="w-full lg:w-auto"
                                disabled={lessonUpload.isUploading}
                                onClick={async () => {
                                  if (!moduleId) {
                                    toast.error('Module is still syncing. Refresh the page and try again.');
                                    return;
                                  }

                                  if (lessonUpload.isUploading) {
                                    toast.error('Wait for the upload to finish before saving the lesson');
                                    return;
                                  }

                                  if (!lessonDraft.title.trim()) {
                                    toast.error('Lesson title is required');
                                    return;
                                  }

                                  if (lessonDraft.type === 'video' && !lessonDraft.content_url.trim()) {
                                    toast.error('Video lesson needs a video URL');
                                    return;
                                  }

                                  if (lessonDraft.type === 'file' && !lessonDraft.content_url.trim()) {
                                    toast.error('File lesson needs a file URL');
                                    return;
                                  }

                                  if (lessonDraft.type === 'text' && !lessonDraft.content_text.trim()) {
                                    toast.error('Text lesson needs lesson content');
                                    return;
                                  }

                                  try {
                                    await lessonsApi.createLesson(moduleId, {
                                      title: lessonDraft.title,
                                      type: lessonDraft.type,
                                      duration: lessonDraft.duration,
                                      content_url: lessonDraft.content_url || undefined,
                                      content_text: lessonDraft.content_text || undefined,
                                    });
                                    resetLessonDraft(moduleId);
                                    const nextExpandedModules = new Set(expandedModules);
                                    nextExpandedModules.add(moduleId);
                                    await loadCourse(nextExpandedModules);
                                    toast.success('Lesson added');
                                  } catch (error: any) {
                                    toast.error(error.message || 'Failed to add lesson');
                                  }
                                }}
                              >
                                {lessonUpload.isUploading ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Plus className="w-4 h-4" />
                                )}
                              </Button>
                            </>
                          );
                        })()}
                      </div>
                      {(() => {
                        const moduleId = module._id;
                        const lessonDraft = getLessonDraft(moduleId);
                        const lessonUpload = getLessonUpload(moduleId);
                        const needsUrl =
                          lessonDraft.type === 'video' || lessonDraft.type === 'file';

                        return (
                          <div className="mt-3 grid grid-cols-1 gap-3">
                            {needsUrl ? (
                              <>
                                <Input
                                  placeholder={
                                    lessonDraft.type === 'video'
                                      ? 'Paste AWS S3 / Google Cloud video URL or upload below...'
                                      : 'Paste file URL or upload below...'
                                  }
                                  value={lessonDraft.content_url}
                                  onChange={(e) =>
                                    updateLessonDraft(moduleId, {
                                      content_url: e.target.value,
                                    })
                                  }
                                />
                                <div className="rounded-lg border border-dashed border-border bg-bg-elevated p-4">
                                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                      <p className="text-sm font-medium text-text-primary">
                                        {lessonDraft.type === 'video'
                                          ? 'Upload video to S3 or paste a Google Cloud URL'
                                          : 'Upload file to S3'}
                                      </p>
                                      <p className="text-xs text-text-muted">
                                        {lessonUpload.isUploading
                                          ? `Uploading ${lessonUpload.fileName} (${lessonUpload.progress}%)`
                                          : lessonDraft.content_url
                                            ? 'Upload complete. The lesson will use the URL above.'
                                            : 'Choose a file to populate the lesson URL automatically.'}
                                      </p>
                                    </div>
                                    {lessonUpload.isUploading ? (
                                      <Loader2 className="h-4 w-4 animate-spin text-accent" />
                                    ) : (
                                      <Upload className="h-4 w-4 text-text-muted" />
                                    )}
                                  </div>
                                  <input
                                    type="file"
                                    accept={lessonDraft.type === 'video' ? 'video/*' : undefined}
                                    disabled={lessonUpload.isUploading}
                                    onChange={async (event) => {
                                      const file = event.target.files?.[0];
                                      event.currentTarget.value = '';
                                      await handleLessonAssetUpload(
                                        moduleId,
                                        lessonDraft.type,
                                        file
                                      );
                                    }}
                                    className="mt-3 block w-full text-sm text-text-secondary file:mr-4 file:rounded-md file:border-0 file:bg-accent file:px-3 file:py-2 file:text-sm file:font-medium file:text-white disabled:cursor-not-allowed disabled:opacity-60"
                                  />
                                  {lessonUpload.isUploading ? (
                                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-bg-primary">
                                      <div
                                        className="h-full rounded-full bg-accent transition-all"
                                        style={{ width: `${lessonUpload.progress}%` }}
                                      />
                                    </div>
                                  ) : null}
                                </div>
                              </>
                            ) : (
                              <Textarea
                                placeholder="Write lesson content..."
                                value={lessonDraft.content_text}
                                onChange={(e) =>
                                  updateLessonDraft(moduleId, {
                                    content_text: e.target.value,
                                  })
                                }
                                className="min-h-[120px]"
                              />
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Lessons List */}
                    {module.lessons && module.lessons.length > 0 ? (
                      <div>
                        {module.lessons.map((lesson, lessonIdx) => (
                          <div
                            key={lesson._id}
                            className="flex flex-col gap-3 border-b border-border p-3 transition-colors hover:bg-bg-elevated sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <span className="text-xs font-medium text-text-muted">
                                {lessonIdx + 1}.
                              </span>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-text-primary">
                                  {lesson.title}
                                </p>
                                <p className="text-xs text-text-muted">
                                  Type: {lesson.type} • {lesson.duration} min
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2 self-end sm:self-auto">
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={lessonIdx === 0 || reorderingLessonKey === lesson._id}
                                onClick={() => handleMoveLesson(module._id, lesson._id, 'up')}
                                title="Move lesson up"
                              >
                                <ArrowUp className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={
                                  lessonIdx === module.lessons.length - 1 ||
                                  reorderingLessonKey === lesson._id
                                }
                                onClick={() => handleMoveLesson(module._id, lesson._id, 'down')}
                                title="Move lesson down"
                              >
                                <ArrowDown className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={async () => {
                                  if (!deleteActionsAvailable) {
                                    toast.info('Lesson deletion is not available with the current backend yet.');
                                    return;
                                  }

                                  try {
                                    await lessonsApi.deleteLesson(module._id, lesson._id);
                                    setCourseData((prev) => {
                                      if (!prev) return prev;
                                      return {
                                        ...prev,
                                        modules: prev.modules.map((item) =>
                                          item._id === module._id
                                            ? {
                                                ...item,
                                                lessons: item.lessons.filter(
                                                  (itemLesson) => itemLesson._id !== lesson._id
                                                ),
                                              }
                                            : item
                                        ),
                                      };
                                    });
                                    toast.success('Lesson deleted');
                                  } catch (error: any) {
                                    toast.error(error.message || 'Failed to delete lesson');
                                  }
                                }}
                                title={
                                  deleteActionsAvailable
                                    ? 'Delete lesson'
                                    : 'Lesson deletion is not available with the current backend'
                                }
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-text-muted text-sm">
                        No lessons yet. Add one to get started!
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
