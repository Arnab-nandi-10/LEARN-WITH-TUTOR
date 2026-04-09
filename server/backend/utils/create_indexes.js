/**
 * Create MongoDB Indexes for better performance
 * Run this once at server startup
 */
const create_indexes = async () => {
  try {
    const Course = require("../models/course_model")
    const Module = require("../models/module_model")
    const Lesson = require("../models/lesson_model")
    const Enrollment = require("../models/enrollment_model")
    const Progress = require("../models/progress_model")

    // Course indexes
    if (Course?.collection) {
      await Course.collection.createIndex({ faculty_id: 1, status: 1 }).catch(() => {})
      await Course.collection.createIndex({ status: 1, createdAt: -1 }).catch(() => {})
    }

    // Module indexes
    if (Module?.collection) {
      await Module.collection.createIndex({ course_id: 1, order: 1 }).catch(() => {})
    }

    // Lesson indexes
    if (Lesson?.collection) {
      await Lesson.collection.createIndex({ module_id: 1, order: 1 }).catch(() => {})
    }

    // Enrollment indexes
    if (Enrollment?.collection) {
      await Enrollment.collection.createIndex({ user_id: 1, course_id: 1 }).catch(() => {})
    }

    // Progress indexes
    if (Progress?.collection) {
      await Progress.collection.createIndex({ user_id: 1, course_id: 1 }).catch(() => {})
    }

    console.log("✅ Database indexes created")
  } catch (err) {
    console.warn("⚠️  Index creation skipped:", err.message)
  }
}

module.exports = create_indexes

