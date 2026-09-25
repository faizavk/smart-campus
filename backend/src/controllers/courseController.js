import Course from "../models/Course.js";

const courseQuery = () =>
  Course.find().populate("faculty", "name email").populate("students", "name email");

export const createCourse = async (req, res) => {
  try {
    const { title, description, code, department, credits } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Course title is required" });
    }

    const generatedCode =
      code ||
      title
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase() + Math.floor(100 + Math.random() * 900);

    const course = await Course.create({
      title,
      description,
      code: generatedCode,
      department: department || "General",
      credits: credits || 3,
      faculty: req.user.id,
    });

    res.status(201).json({ message: "Course created", course });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCourses = async (req, res) => {
  try {
    const { search, mine } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
        { department: { $regex: search, $options: "i" } },
      ];
    }

    if (mine === "true") {
      if (req.user.role === "faculty") filter.faculty = req.user.id;
      if (req.user.role === "student") filter.students = req.user.id;
    }

    const courses = await Course.find(filter)
      .populate("faculty", "name email")
      .populate("students", "name email")
      .sort({ createdAt: -1 });

    res.json({
      courses: courses.map((course) => ({
        ...course.toObject(),
        enrolled: course.students.some((student) => student._id.toString() === req.user.id),
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCourseById = async (req, res) => {
  try {
    const course = await courseQuery().findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json({ course });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const enrollCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (course.students.some((id) => id.toString() === req.user.id)) {
      return res.status(400).json({ message: "Already enrolled" });
    }

    course.students.push(req.user.id);
    await course.save();

    const populated = await courseQuery().findById(course._id);
    res.json({ message: "Enrolled successfully", course: populated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const unenrollCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    course.students = course.students.filter((id) => id.toString() !== req.user.id);
    await course.save();

    res.json({ message: "Left the course" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
