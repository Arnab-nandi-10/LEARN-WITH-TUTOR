const User = require("../../models/user_model.js");
const { ApiError } = require("../../utils/ApiError.js");
const { ApiResponse } = require("../../utils/ApiResponce.js");
const { asyncHandler } = require("../../utils/asyncHandler.js");

const getUsersByRole = async (role, page) => {
  const limit = 20;
  const skip = (page - 1) * limit;
  const keyMap = {
    admin: "allAdmins",
    faculty: "allFaculties",
    student: "allStudents",
  };
  const totalKeyMap = {
    admin: "totalAdmins",
    faculty: "totalFaculty",
    student: "totalStudents",
  };

  const users = await User.find({ role })
    .select("-password")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await User.countDocuments({ role });

  return {
    page,
    limit,
    [totalKeyMap[role]]: total,
    totalPages: Math.ceil(total / limit),
    [keyMap[role]]: users,
  };
};

const getCurrentAdminUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Fetched current admin details successfully"));
});

const getAdminById = asyncHandler(async (req, res) => {
  const adminUser = await User.findOne({
    _id: req.params.id,
    role: "admin",
  }).select("-password");

  if (!adminUser) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, adminUser, "User details fetched successfully"));
});

const getFacultyById = asyncHandler(async (req, res) => {
  const faculty = await User.findOne({
    _id: req.params.id,
    role: "faculty",
  }).select("-password");

  if (!faculty) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, faculty, "Faculty details fetched successfully"));
});

const getStudentById = asyncHandler(async (req, res) => {
  const student = await User.findOne({
    _id: req.params.id,
    role: "student",
  }).select("-password");

  if (!student) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, student, "Student details fetched successfully"));
});

const getAllAdmins = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const data = await getUsersByRole("admin", page);

  return res
    .status(200)
    .json(new ApiResponse(200, data, "All admin members fetched successfully"));
});

const getAllFaculty = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const data = await getUsersByRole("faculty", page);

  return res
    .status(200)
    .json(new ApiResponse(200, data, "All faculties are fetched successfully"));
});

const getAllStudents = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const data = await getUsersByRole("student", page);

  return res
    .status(200)
    .json(new ApiResponse(200, data, "All students fetched successfully"));
});

const toggleVerification = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.is_verified = !user.is_verified;
  await user.save({ validateBeforeSave: false });

  return res.status(200).json(
    new ApiResponse(
      200,
      { is_verified: user.is_verified },
      `User is ${user.is_verified ? "verified" : "rejected"}`
    )
  );
});

module.exports = {
  getCurrentAdminUser,
  getAdminById,
  getFacultyById,
  getStudentById,
  getAllAdmins,
  getAllFaculty,
  getAllStudents,
  toggleVerification,
};
