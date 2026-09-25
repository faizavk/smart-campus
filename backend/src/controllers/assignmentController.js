import Assignment from "../models/Assignment.js";
import Submission from "../models/Submission.js";
import Course from "../models/Course.js";
import { notifyMany, notify } from "../utils/notify.js";

export const createAssignment = async (req, res) => {
  try {
    const { title, description, dueDate, course, maxMarks } = req.body;

    if (!title || !course || !dueDate) {
      return res.status(400).json({ message: "Title, course and due date are required" });
    }

    const courseDoc = await Course.findById(course);
    if (!courseDoc) return res.status(404).json({ message: "Course not found" });

    if (req.user.role === "faculty" && courseDoc.faculty.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only assign work for your courses" });
    }

    const assignment = await Assignment.create({
      title,
      description,
      dueDate,
      course,
      maxMarks: maxMarks || 100,
      createdBy: req.user.id,
    });

    await notifyMany(courseDoc.students, {
      title: `New assignment: ${title}`,
      message: `Due ${new Date(dueDate).toLocaleString()} in ${courseDoc.title}`,
      type: "assignment",
      link: "/assignments",
    });

    res.status(201).json({ message: "Assignment created", assignment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAssignments = async (req, res) => {
  try {
    const filter = {};

    if (req.user.role === "student") {
      const enrolled = await Course.find({ students: req.user.id }).select("_id");
      filter.course = { $in: enrolled.map((item) => item._id) };
    } else if (req.user.role === "faculty") {
      filter.createdBy = req.user.id;
    }

    const assignments = await Assignment.find(filter)
      .populate("course", "title code")
      .populate("createdBy", "name")
      .sort({ dueDate: 1 });

    if (req.user.role === "student") {
      const submissions = await Submission.find({ student: req.user.id });
      const byAssignment = Object.fromEntries(
        submissions.map((item) => [item.assignment.toString(), item])
      );

      return res.json({
        assignments: assignments.map((item) => ({
          ...item.toObject(),
          submission: byAssignment[item._id.toString()] || null,
          overdue: new Date() > new Date(item.dueDate),
        })),
      });
    }

    res.json({ assignments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const submitAssignment = async (req, res) => {
  try {
    const { content } = req.body;
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    if (!content?.trim()) {
      return res.status(400).json({ message: "Submission content is required" });
    }

    const existing = await Submission.findOne({
      assignment: req.params.id,
      student: req.user.id,
    });

    if (existing) {
      return res.status(400).json({ message: "Already submitted" });
    }

    const late = new Date() > new Date(assignment.dueDate);

    const submission = await Submission.create({
      assignment: req.params.id,
      student: req.user.id,
      content,
      late,
    });

    await notify(assignment.createdBy, {
      title: "New submission received",
      message: `${late ? "Late " : ""}submission for ${assignment.title}`,
      type: "assignment",
      link: "/assignments",
    });

    res.status(201).json({ message: late ? "Submitted late" : "Submitted", submission });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getSubmissions = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: "Assignment not found" });

    if (req.user.role === "faculty" && assignment.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const submissions = await Submission.find({ assignment: req.params.id })
      .populate("student", "name email")
      .populate("assignment", "title maxMarks");

    res.json({ submissions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const gradeSubmission = async (req, res) => {
  try {
    const { grade, feedback } = req.body;
    const submission = await Submission.findById(req.params.submissionId).populate("assignment");

    if (!submission) return res.status(404).json({ message: "Submission not found" });

    if (
      req.user.role === "faculty" &&
      submission.assignment.createdBy.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    submission.grade = grade;
    submission.feedback = feedback || "";
    await submission.save();

    await notify(submission.student, {
      title: `Graded: ${submission.assignment.title}`,
      message: `You scored ${grade}/${submission.assignment.maxMarks || 100}`,
      type: "assignment",
      link: "/assignments",
    });

    res.json({ message: "Graded", submission });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
