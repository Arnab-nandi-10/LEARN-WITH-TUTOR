const Course = require("../../models/course_model.js");
const { ApiError } = require("../../utils/ApiError.js");
const { ApiResponse } = require("../../utils/ApiResponce.js");
const { asyncHandler } = require("../../utils/asyncHandler.js");

const getAllApprovedCourses = asyncHandler(async (req, res) => {
  const allApprovedCourses = await Course.find({ isApproved: true }).populate(
    "faculty_id",
    "-password"
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        allApprovedCourses,
        "Approved courses fetched successfully"
      )
    );
});

const getAllRejectedCourses = asyncHandler(async (req, res) => {
  const allRejectedCourses = await Course.find({ isApproved: { $ne: true } }).populate(
    "faculty_id",
    "-password"
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        allRejectedCourses,
        "Not approved courses fetched successfully"
      )
    );
});

const getCourseById = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.courseId).populate(
    "faculty_id",
    "-password"
  );

  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, course, "Course fetched successfully"));
});

const toggleCourseApproval = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.courseId);

  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  course.isApproved = !course.isApproved;
  await course.save({ validateBeforeSave: false });

  return res.status(200).json(
    new ApiResponse(
      200,
      { isApproved: course.isApproved },
      `Course ${course.isApproved ? "approved" : "rejected"}`
    )
  );
});

const updateCoursePrice = asyncHandler(async (req, res) => {
  const { price } = req.body;

  if (price < 0) {
    throw new ApiError(400, "Price can not be negetive");
  }

  const course = await Course.findByIdAndUpdate(
    req.params.id,
    { price },
    { new: true }
  );

  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { price: course.price }, "Course price updated"));
});

const deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findByIdAndDelete(req.params.id);

  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Course deleted successfully"));
});

module.exports = {
  getAllApprovedCourses,
  getAllRejectedCourses,
  getCourseById,
  toggleCourseApproval,
  updateCoursePrice,
  deleteCourse,
};
