'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Course, Module, Lesson } from '@/lib/types';
import { getCourseById } from '@/lib/api/courses';
import { getModules, createModule, deleteModule } from '@/lib/api/modules';
import { getLessons, createLesson, deleteLesson } from '@/lib/api/lessons';
import { useAuth } from '@/lib/stores/authStore';
import { 
  ArrowLeft, 
  Plus, 
  BookOpen, 
  Video, 
  FileText, 
  File, 
  Edit, 
  Trash2, 
  GripVertical,
  Loader2,
  Save,
  X
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Validation schemas
const moduleSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
});

const lessonSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  content_type: z.enum(['video', 'text', 'file']),
  content_url: z.string().url('Please enter a valid URL').min(1, 'Content URL is required'),
});

type ModuleFormData = z.infer<typeof moduleSchema>;
type LessonFormData = z.infer<typeof lessonSchema>;

interface ModuleWithLessons extends Module {
  lessons: Lesson[];
}

export default function CourseEditor() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<ModuleWithLessons[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [showLessonForm, setShowLessonForm] = useState<string | null>(null);

  // Module form
  const moduleForm = useForm<ModuleFormData>({
    resolver: zodResolver(moduleSchema),
  });

  // Lesson form
  const lessonForm = useForm<LessonFormData>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      content_type: 'video',
    },
  });

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'faculty') {
      router.push('/login');
      return;
    }

    if (courseId) {
      loadCourseData();
    }
  }, [isAuthenticated, user, courseId, router]);

  const loadCourseData = async () => {
    try {
      setIsLoading(true);
      
      // Load course
      const courseData = await getCourseById(courseId);
      setCourse(courseData);

      // Load modules
      const modulesData = await getModules(courseId);
      
      // Load lessons for each module
      const modulesWithLessons = await Promise.all(
        modulesData.map(async (module) => {
          try {
            const lessons = await getLessons(module._id);
            return { ...module, lessons };
          } catch (error) {
            return { ...module, lessons: [] };
          }
        })
      );

      setModules(modulesWithLessons);
    } catch (error: any) {
      console.error('Failed to load course data:', error);
      toast.error('Failed to load course data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateModule = async (data: ModuleFormData) => {
    try {
      const newModule = await createModule(courseId, data);
      
      setModules(prev => [...prev, { ...newModule, lessons: [] }]);
      setShowModuleForm(false);
      moduleForm.reset();
      toast.success('Module created successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create module');
    }
  };

  const handleCreateLesson = async (data: LessonFormData, moduleId: string) => {
    try {
      const newLesson = await createLesson(moduleId, {
        title: data.title,
        type: data.content_type,
        content_url: data.content_url,
      });
      
      setModules(prev => prev.map(module => 
        module._id === moduleId 
          ? { ...module, lessons: [...module.lessons, newLesson] }
          : module
      ));
      
      setShowLessonForm(null);
      lessonForm.reset();
      toast.success('Lesson created successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create lesson');
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm('Are you sure? This will delete the module and all its lessons.')) {
      return;
    }

    try {
      await deleteModule(courseId, moduleId);
      setModules(prev => prev.filter(module => module._id !== moduleId));
      toast.success('Module deleted successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete module');
    }
  };

  const handleDeleteLesson = async (lessonId: string, moduleId: string) => {
    if (!confirm('Are you sure you want to delete this lesson?')) {
      return;
    }

    try {
      await deleteLesson(moduleId, lessonId);
      setModules(prev => prev.map(module => 
        module._id === moduleId 
          ? { ...module, lessons: module.lessons.filter(lesson => lesson._id !== lessonId) }
          : module
      ));
      toast.success('Lesson deleted successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete lesson');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl text-white mb-4">Course not found</h1>
          <Link href="/faculty/dashboard" className="text-blue-400 hover:text-blue-300">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800/50 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/faculty/dashboard"
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">{course.title}</h1>
                <p className="text-gray-400">Course Editor</p>
              </div>
            </div>
            <button
              onClick={() => setShowModuleForm(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Module
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Modules */}
        <div className="space-y-6">
          {modules.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No modules yet</h3>
              <p className="text-gray-400 mb-6">Start building your course by adding modules</p>
              <button
                onClick={() => setShowModuleForm(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Module
              </button>
            </div>
          ) : (
            modules.map((module, moduleIndex) => (
              <div
                key={module._id}
                className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden"
              >
                {/* Module Header */}
                <div className="px-6 py-4 border-b border-gray-700/50 bg-gray-800/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <GripVertical className="h-5 w-5 text-gray-400" />
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {moduleIndex + 1}. {module.title}
                        </h3>
                        <p className="text-sm text-gray-400">{module.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setShowLessonForm(module._id)}
                        className="p-2 text-blue-400 hover:bg-blue-600/10 rounded-lg transition-colors"
                        title="Add Lesson"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() =>
                          toast.info('Editing existing modules is not available yet.')
                        }
                        className="p-2 text-gray-400 hover:bg-gray-600/20 rounded-lg transition-colors"
                        title="Edit Module"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteModule(module._id)}
                        className="p-2 text-red-400 hover:bg-red-600/10 rounded-lg transition-colors"
                        title="Delete Module"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Lessons */}
                <div className="px-6 py-4">
                  {module.lessons.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-gray-600 rounded-lg">
                      <Video className="mx-auto h-8 w-8 text-gray-400 mb-3" />
                      <p className="text-gray-400 mb-4">No lessons in this module</p>
                      <button
                        onClick={() => setShowLessonForm(module._id)}
                        className="inline-flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        <Plus className="h-3 w-3 mr-2" />
                        Add Lesson
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {module.lessons.map((lesson, lessonIndex) => (
                        <div
                          key={lesson._id}
                          className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <GripVertical className="h-4 w-4 text-gray-400" />
                            <div className="p-2 rounded-lg bg-gray-600/30">
                              {lesson.content_type === 'video' && <Video className="h-4 w-4 text-blue-400" />}
                              {lesson.content_type === 'text' && <FileText className="h-4 w-4 text-green-400" />}
                              {lesson.content_type === 'file' && <File className="h-4 w-4 text-yellow-400" />}
                            </div>
                            <div>
                              <p className="text-white font-medium">
                                {lessonIndex + 1}. {lesson.title}
                              </p>
                              <p className="text-xs text-gray-400 capitalize">{lesson.content_type || lesson.type}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() =>
                                toast.info('Editing existing lessons is not available yet.')
                              }
                              className="p-1.5 text-gray-400 hover:bg-gray-600/20 rounded transition-colors"
                              title="Edit Lesson"
                            >
                              <Edit className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteLesson(lesson._id, module._id)}
                              className="p-1.5 text-red-400 hover:bg-red-600/10 rounded transition-colors"
                              title="Delete Lesson"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add Lesson Form */}
                {showLessonForm === module._id && (
                  <div className="px-6 py-4 border-t border-gray-700/50 bg-gray-800/20">
                    <form onSubmit={lessonForm.handleSubmit((data) => handleCreateLesson(data, module._id))} className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-medium text-white">Add New Lesson</h4>
                        <button
                          type="button"
                          onClick={() => {
                            setShowLessonForm(null);
                            lessonForm.reset();
                          }}
                          className="p-1.5 text-gray-400 hover:bg-gray-600/20 rounded transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Lesson Title
                          </label>
                          <input
                            {...lessonForm.register('title')}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="e.g., Introduction to React Hooks"
                          />
                          {lessonForm.formState.errors.title && (
                            <p className="mt-1 text-sm text-red-400">{lessonForm.formState.errors.title.message}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Content Type
                          </label>
                          <select
                            {...lessonForm.register('content_type')}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="video">Video</option>
                            <option value="text">Text/Article</option>
                            <option value="file">File Download</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Content URL
                        </label>
                        <input
                          {...lessonForm.register('content_url')}
                          type="url"
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="https://example.com/video.mp4"
                        />
                        {lessonForm.formState.errors.content_url && (
                          <p className="mt-1 text-sm text-red-400">{lessonForm.formState.errors.content_url.message}</p>
                        )}
                      </div>

                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => {
                            setShowLessonForm(null);
                            lessonForm.reset();
                          }}
                          className="px-4 py-2 text-gray-300 bg-transparent border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={lessonForm.formState.isSubmitting}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                          {lessonForm.formState.isSubmitting ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin inline" />
                              Adding...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2 inline" />
                              Add Lesson
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Add Module Form */}
        {showModuleForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Add New Module</h3>
                <button
                  onClick={() => {
                    setShowModuleForm(false);
                    moduleForm.reset();
                  }}
                  className="p-1.5 text-gray-400 hover:bg-gray-600/20 rounded transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={moduleForm.handleSubmit(handleCreateModule)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Module Title
                  </label>
                  <input
                    {...moduleForm.register('title')}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Introduction to JavaScript"
                  />
                  {moduleForm.formState.errors.title && (
                    <p className="mt-1 text-sm text-red-400">{moduleForm.formState.errors.title.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    {...moduleForm.register('description')}
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Describe what this module covers..."
                  />
                  {moduleForm.formState.errors.description && (
                    <p className="mt-1 text-sm text-red-400">{moduleForm.formState.errors.description.message}</p>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModuleForm(false);
                      moduleForm.reset();
                    }}
                    className="px-4 py-2 text-gray-300 bg-transparent border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={moduleForm.formState.isSubmitting}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {moduleForm.formState.isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin inline" />
                        Creating...
                      </>
                    ) : (
                      'Add Module'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
