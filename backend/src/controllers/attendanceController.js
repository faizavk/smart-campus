import crypto from "crypto";
import Attendance from "../models/Attendance.js";
import AttendanceSession from "../models/AttendanceSession.js";
import Course from "../models/Course.js";
import { startOfDay, endOfDay } from "../utils/time.js";

const RISK_THRESHOLD = 75;

const buildSummary = (records) => {
  const summary = {};

  records.forEach((record) => {
    if (!record.course) return;
    const courseId = record.course._id.toString();

    if (!summary[courseId]) {
      summary[courseId] = {
        courseId,
        course: record.course.title,
        total: 0,
        present: 0,
      };
    }

    summary[courseId].total += 1;
    if (record.status === "present") summary[courseId].present += 1;
  });

  return Object.values(summary).map((item) => ({
    ...item,
    percentage: Number(((item.present / item.total) * 100).toFixed(2)),
    atRisk: (item.present / item.total) * 100 < RISK_THRESHOLD,
  }));
};

export const markAttendance = async (req, res) => {
  try {
    const { course, student, status } = req.body;

    if (!course || !student || !status) {
      return res.status(400).json({ message: "Course, student and status are required" });
    }

    const courseDoc = await Course.findById(course);
    if (!courseDoc) return res.status(404).json({ message: "Course not found" });

    if (req.user.role === "faculty" && courseDoc.faculty.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only mark your own courses" });
    }

    const existing = await Attendance.findOne({
      course,
      student,
      date: { $gte: startOfDay(), $lte: endOfDay() },
    });

    if (existing) {
      existing.status = status;
      existing.method = "manual";
      await existing.save();
      return res.json({ message: "Attendance updated", attendance: existing });
    }

    const attendance = await Attendance.create({
      course,
      student,
      status,
      method: "manual",
    });

    res.status(201).json({ message: "Attendance marked", attendance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const bulkMarkAttendance = async (req, res) => {
  try {
    const { course, records } = req.body;
    if (!course || !Array.isArray(records)) {
      return res.status(400).json({ message: "Course and records are required" });
    }

    const results = [];
    for (const record of records) {
      const existing = await Attendance.findOne({
        course,
        student: record.student,
        date: { $gte: startOfDay(), $lte: endOfDay() },
      });

      if (existing) {
        existing.status = record.status;
        await existing.save();
        results.push(existing);
      } else {
        results.push(
          await Attendance.create({
            course,
            student: record.student,
            status: record.status,
            method: "manual",
          })
        );
      }
    }

    res.json({ message: "Attendance saved", count: results.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const startSession = async (req, res) => {
  try {
    const { course } = req.body;
    const courseDoc = await Course.findById(course);

    if (!courseDoc) return res.status(404).json({ message: "Course not found" });
    if (req.user.role === "faculty" && courseDoc.faculty.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    await AttendanceSession.updateMany(
      { course, faculty: req.user.id, isActive: true },
      { isActive: false }
    );

    const code = String(crypto.randomInt(100000, 1000000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const session = await AttendanceSession.create({
      course,
      faculty: req.user.id,
      code,
      expiresAt,
    });

    res.status(201).json({
      message: "Live attendance started",
      session: {
        id: session._id,
        code: session.code,
        expiresAt: session.expiresAt,
        course: courseDoc.title,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const checkIn = async (req, res) => {
  try {
    const { code } = req.body;
    const session = await AttendanceSession.findOne({
      code,
      isActive: true,
      expiresAt: { $gt: new Date() },
    }).populate("course", "title students");

    if (!session) {
      return res.status(400).json({ message: "Invalid or expired attendance code" });
    }

    const enrolled = session.course.students.some((id) => id.toString() === req.user.id);
    if (!enrolled) {
      return res.status(403).json({ message: "You are not enrolled in this course" });
    }

    const existing = await Attendance.findOne({
      course: session.course._id,
      student: req.user.id,
      date: { $gte: startOfDay(), $lte: endOfDay() },
    });

    if (existing) {
      return res.status(400).json({ message: "Already marked present today" });
    }

    const attendance = await Attendance.create({
      course: session.course._id,
      student: req.user.id,
      status: "present",
      method: "live-code",
    });

    res.json({
      message: `Checked in to ${session.course.title}`,
      attendance,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCourseAttendance = async (req, res) => {
  try {
    const { date } = req.query;
    const day = date ? new Date(date) : new Date();

    const records = await Attendance.find({
      course: req.params.courseId,
      date: { $gte: startOfDay(day), $lte: endOfDay(day) },
    }).populate("student", "name email");

    const course = await Course.findById(req.params.courseId).populate("students", "name email");
    res.json({ records, students: course?.students || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAttendanceSummary = async (req, res) => {
  try {
    const records = await Attendance.find({ student: req.user.id }).populate("course", "title");
    res.json({ summary: buildSummary(records) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getMyAttendance = async (req, res) => {
  try {
    const records = await Attendance.find({ student: req.user.id })
      .populate("course", "title code")
      .sort({ date: -1 });

    res.json({ records });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAtRiskStudents = async (req, res) => {
  try {
    const courseFilter = req.user.role === "faculty" ? { faculty: req.user.id } : {};
    const courses = await Course.find(courseFilter).populate("students", "name email");

    const risk = [];

    for (const course of courses) {
      for (const student of course.students) {
        const records = await Attendance.find({ course: course._id, student: student._id });
        if (!records.length) continue;

        const present = records.filter((item) => item.status === "present").length;
        const percentage = Number(((present / records.length) * 100).toFixed(2));

        if (percentage < RISK_THRESHOLD) {
          risk.push({
            student,
            course: { _id: course._id, title: course.title, code: course.code },
            percentage,
            present,
            total: records.length,
          });
        }
      }
    }

    res.json({ threshold: RISK_THRESHOLD, students: risk });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
