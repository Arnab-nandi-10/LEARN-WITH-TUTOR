const user_repo = require("../repositories/user_repository")
const enrollment_repo = require("../repositories/enrollment_repository")
const AppError = require("../utils/app_error")

const sanitize_user = (user) => {
  const user_obj = user.toObject ? user.toObject() : { ...user }
  delete user_obj.password
  return user_obj
}

const normalize_enrollment = (enrollment) => {
  const enrollment_obj = enrollment.toObject ? enrollment.toObject() : { ...enrollment }
  const populated_course =
    enrollment_obj.course_id && typeof enrollment_obj.course_id === "object"
      ? enrollment_obj.course_id
      : null

  return {
    ...enrollment_obj,
    course_id:
      populated_course?._id?.toString() ||
      enrollment_obj.course_id?.toString?.() ||
      enrollment_obj.course_id,
    course: populated_course || undefined
  }
}

const get_all_users = async () => {
  const users = await user_repo.find_all_users()
  return users.map(sanitize_user)
}

const get_user_by_id = async (user_id) => {
  const user = await user_repo.find_user_by_id(user_id)
  if (!user) throw new AppError("user not found", 404)

  return sanitize_user(user)
}

const get_user_enrollments = async (user_id) => {
  const user = await user_repo.find_user_by_id(user_id)
  if (!user) throw new AppError("user not found", 404)

  const enrollments = await enrollment_repo.get_user_enrollments_with_courses(user_id)
  return enrollments.map(normalize_enrollment)
}

module.exports = {
  get_all_users,
  get_user_by_id,
  get_user_enrollments
}
