const user_service = require("../services/user_service")

const get_all_users = async (req, res, next) => {
  try {
    const data = await user_service.get_all_users()
    res.status(200).json({ success: true, data })
  } catch (err) {
    next(err)
  }
}

const get_user_by_id = async (req, res, next) => {
  try {
    const data = await user_service.get_user_by_id(req.params.id)
    res.status(200).json({ success: true, data })
  } catch (err) {
    next(err)
  }
}

const get_user_enrollments = async (req, res, next) => {
  try {
    const data = await user_service.get_user_enrollments(req.params.id)
    res.status(200).json({ success: true, data })
  } catch (err) {
    next(err)
  }
}

module.exports = {
  get_all_users,
  get_user_by_id,
  get_user_enrollments
}
