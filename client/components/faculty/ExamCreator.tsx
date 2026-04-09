'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Exam, ExamFormData } from '@/lib/types';
import { createExam } from '@/lib/api/exams';
import { 
  Plus, 
  Minus, 
  Save, 
  Clock, 
  FileQuestion, 
  Trash2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

// Question schema
const questionSchema = z.object({
  question_text: z.string().min(10, 'Question must be at least 10 characters'),
  options: z.array(z.string().min(1, 'Option cannot be empty')).min(2, 'Must have at least 2 options'),
  correct_answer: z.number().min(0, 'Must select correct answer'),
  marks: z.number().min(1, 'Marks must be at least 1'),
});

// Exam schema with questions
const examSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  course_id: z.string().min(1, 'Course is required'),
  module_id: z.string().optional(),
  total_marks: z.number().min(1, 'Total marks must be at least 1'),
  duration_minutes: z.number().min(5, 'Duration must be at least 5 minutes'),
  questions: z.array(questionSchema).min(1, 'Must have at least 1 question'),
});

type ExamFormValues = z.infer<typeof examSchema>;

interface ExamCreatorProps {
  courseId: string;
  moduleId?: string;
  onExamCreated: (exam: Exam) => void;
  onCancel: () => void;
}

export default function ExamCreator({ courseId, moduleId, onExamCreated, onCancel }: ExamCreatorProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ExamFormValues>({
    resolver: zodResolver(examSchema),
    defaultValues: {
      course_id: courseId,
      module_id: moduleId || '',
      duration_minutes: 60,
      questions: [
        {
          question_text: '',
          options: ['', ''],
          correct_answer: 0,
          marks: 1,
        }
      ]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'questions'
  });

  const calculateTotalMarks = () => {
    const questions = form.watch('questions');
    return questions.reduce((total, question) => total + (question.marks || 0), 0);
  };

  const addQuestion = () => {
    append({
      question_text: '',
      options: ['', ''],
      correct_answer: 0,
      marks: 1,
    });
  };

  const addOption = (questionIndex: number) => {
    const currentOptions = form.getValues(`questions.${questionIndex}.options`);
    const newOptions = [...currentOptions, ''];
    form.setValue(`questions.${questionIndex}.options`, newOptions);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const currentOptions = form.getValues(`questions.${questionIndex}.options`);
    if (currentOptions.length <= 2) {
      toast.error('Question must have at least 2 options');
      return;
    }
    
    const newOptions = currentOptions.filter((_, index) => index !== optionIndex);
    const correctAnswer = form.getValues(`questions.${questionIndex}.correct_answer`);
    
    // Adjust correct answer if needed
    if (correctAnswer >= optionIndex && correctAnswer > 0) {
      form.setValue(`questions.${questionIndex}.correct_answer`, Math.max(0, correctAnswer - 1));
    }
    
    form.setValue(`questions.${questionIndex}.options`, newOptions);
  };

  const onSubmit = async (data: ExamFormValues) => {
    try {
      setIsSubmitting(true);
      
      // Calculate total marks
      const totalMarks = calculateTotalMarks();
      
      const examData: ExamFormData = {
        title: data.title,
        course_id: data.course_id,
        module_id: data.module_id || undefined,
        total_marks: totalMarks,
        time_limit: data.duration_minutes,
        description: data.description,
      };
      
      const newExam = await createExam(examData);
      toast.success('Exam created successfully!');
      onExamCreated(newExam);
    } catch (error: any) {
      console.error('Failed to create exam:', error);
      toast.error(error.message || 'Failed to create exam');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600/20 rounded-lg">
              <FileQuestion className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Create New Exam</h2>
              <p className="text-gray-400">Add questions and configure exam settings</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <Clock className="h-4 w-4" />
            <span>Total: {calculateTotalMarks()} marks</span>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Exam Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Exam Title
              </label>
              <input
                {...form.register('title')}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., JavaScript Fundamentals Quiz"
              />
              {form.formState.errors.title && (
                <p className="mt-1 text-sm text-red-400">{form.formState.errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Duration (minutes)
              </label>
              <input
                {...form.register('duration_minutes', { valueAsNumber: true })}
                type="number"
                min="5"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="60"
              />
              {form.formState.errors.duration_minutes && (
                <p className="mt-1 text-sm text-red-400">{form.formState.errors.duration_minutes.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              {...form.register('description')}
              rows={3}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Describe what this exam covers..."
            />
            {form.formState.errors.description && (
              <p className="mt-1 text-sm text-red-400">{form.formState.errors.description.message}</p>
            )}
          </div>

          {/* Questions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Questions</h3>
              <button
                type="button"
                onClick={addQuestion}
                className="inline-flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </button>
            </div>

            <div className="space-y-6">
              {fields.map((field, questionIndex) => (
                <div key={field.id} className="bg-gray-700/30 rounded-lg p-4 border border-gray-600">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-white font-medium">Question {questionIndex + 1}</h4>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-2">
                        <label className="text-sm text-gray-400">Marks:</label>
                        <input
                          {...form.register(`questions.${questionIndex}.marks`, { valueAsNumber: true })}
                          type="number"
                          min="1"
                          className="w-16 px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm text-center"
                        />
                      </div>
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => remove(questionIndex)}
                          className="p-1.5 text-red-400 hover:bg-red-600/10 rounded transition-colors"
                          title="Delete Question"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Question Text */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Question Text
                    </label>
                    <textarea
                      {...form.register(`questions.${questionIndex}.question_text`)}
                      rows={2}
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="Enter your question here..."
                    />
                    {form.formState.errors.questions?.[questionIndex]?.question_text && (
                      <p className="mt-1 text-sm text-red-400">
                        {form.formState.errors.questions[questionIndex]?.question_text?.message}
                      </p>
                    )}
                  </div>

                  {/* Options */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-gray-300">
                        Answer Options
                      </label>
                      <button
                        type="button"
                        onClick={() => addOption(questionIndex)}
                        className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        + Add Option
                      </button>
                    </div>

                    <div className="space-y-2">
                      {form.watch(`questions.${questionIndex}.options`).map((_, optionIndex) => (
                        <div key={optionIndex} className="flex items-center space-x-3">
                          <input
                            {...form.register(`questions.${questionIndex}.correct_answer`, { valueAsNumber: true })}
                            type="radio"
                            value={optionIndex}
                            className="text-blue-600 focus:ring-blue-500"
                            title="Mark as correct answer"
                          />
                          <input
                            {...form.register(`questions.${questionIndex}.options.${optionIndex}`)}
                            className="flex-1 px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder={`Option ${optionIndex + 1}`}
                          />
                          {form.watch(`questions.${questionIndex}.options`).length > 2 && (
                            <button
                              type="button"
                              onClick={() => removeOption(questionIndex, optionIndex)}
                              className="p-2 text-red-400 hover:bg-red-600/10 rounded transition-colors"
                              title="Remove Option"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {form.formState.errors.questions?.[questionIndex]?.options && (
                      <p className="mt-2 text-sm text-red-400">
                        {form.formState.errors.questions[questionIndex]?.options?.message}
                      </p>
                    )}

                    <div className="mt-2 flex items-center space-x-2 text-sm text-gray-400">
                      <AlertCircle className="h-4 w-4" />
                      <span>Select the correct answer using the radio button</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {form.formState.errors.questions && (
              <p className="mt-2 text-sm text-red-400">
                {form.formState.errors.questions.message}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-600">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 text-gray-300 bg-transparent border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || calculateTotalMarks() === 0}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2 inline" />
                  Create Exam ({calculateTotalMarks()} marks)
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
