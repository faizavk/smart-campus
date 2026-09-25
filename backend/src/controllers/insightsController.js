import Course from "../models/Course.js";
import Assignment from "../models/Assignment.js";
import Submission from "../models/Submission.js";
import Attendance from "../models/Attendance.js";
import Ticket from "../models/Ticket.js";
import Timetable from "../models/Timetable.js";
import User from "../models/User.js";
import Notice from "../models/Notice.js";
import { weekdayName } from "../utils/time.js";

const RISK_THRESHOLD = 75;

const attendancePercent = (records) => {
  if (!records.length) return null;
  const present = records.filter((item) => item.status === "present").length;
  return Number(((present / records.length) * 100).toFixed(2));
};

export const getInsights = async (req, res) => {
  try {
    const role = req.user.role;
    const today = weekdayName();

    if (role === "student") {
      const courses = await Course.find({ students: req.user.id }).populate("faculty", "name");
      const courseIds = courses.map((item) => item._id);

      const [assignments, tickets, records, timetable, notices] = await Promise.all([
        Assignment.find({ course: { $in: courseIds } }).populate("course", "title"),
        Ticket.find({ createdBy: req.user.id }),
        Attendance.find({ student: req.user.id }).populate("course", "title"),
        Timetable.find({ course: { $in: courseIds }, day: today })
          .populate("course", "title")
          .sort({ startTime: 1 }),
        Notice.find({ audience: { $in: ["all", "student"] } }).sort({ createdAt: -1 }).limit(3),
      ]);

      const submissions = await Submission.find({ student: req.user.id });
      const submittedIds = new Set(submissions.map((item) => item.assignment.toString()));

      const pending = assignments.filter(
        (item) => !submittedIds.has(item._id.toString()) && new Date(item.dueDate) >= new Date()
      );
      const overdue = assignments.filter(
        (item) => !submittedIds.has(item._id.toString()) && new Date(item.dueDate) < new Date()
      );

      const byCourse = {};
      records.forEach((record) => {
        if (!record.course) return;
        const key = record.course._id.toString();
        if (!byCourse[key]) byCourse[key] = { course: record.course.title, records: [] };
        byCourse[key].records.push(record);
      });

      const attendance = Object.values(byCourse).map((item) => ({
        course: item.course,
        percentage: attendancePercent(item.records),
      }));

      const avg =
        attendance.length > 0
          ? Number(
              (
                attendance.reduce((sum, item) => sum + (item.percentage || 0), 0) /
                attendance.length
              ).toFixed(2)
            )
          : 0;

      const insights = [];
      attendance
        .filter((item) => item.percentage !== null && item.percentage < RISK_THRESHOLD)
        .forEach((item) =>
          insights.push({
            tone: "danger",
            title: `Attendance risk in ${item.course}`,
            body: `${item.percentage}% — below the ${RISK_THRESHOLD}% eligibility line.`,
          })
        );

      if (overdue.length) {
        insights.push({
          tone: "warning",
          title: `${overdue.length} overdue assignment${overdue.length > 1 ? "s" : ""}`,
          body: "Submit them as soon as possible to avoid grade loss.",
        });
      } else if (pending.length) {
        insights.push({
          tone: "info",
          title: `${pending.length} assignment${pending.length > 1 ? "s" : ""} due soon`,
          body: pending[0].title,
        });
      }

      if (timetable.length) {
        insights.push({
          tone: "success",
          title: `${timetable.length} class${timetable.length > 1 ? "es" : ""} today`,
          body: `Next: ${timetable[0].course?.title} at ${timetable[0].startTime}`,
        });
      }

      if (!insights.length) {
        insights.push({
          tone: "success",
          title: "You're on track",
          body: "No urgent academic or campus alerts right now.",
        });
      }

      return res.json({
        role,
        stats: {
          courses: courses.length,
          attendanceAvg: avg,
          pendingAssignments: pending.length,
          openTickets: tickets.filter((item) => item.status !== "resolved").length,
        },
        insights,
        attendance,
        upcomingDeadlines: pending.slice(0, 5),
        todaySchedule: timetable,
        notices,
      });
    }

    if (role === "faculty") {
      const courses = await Course.find({ faculty: req.user.id }).populate("students", "name");
      const courseIds = courses.map((item) => item._id);
      const assignments = await Assignment.find({ createdBy: req.user.id });
      const submissions = await Submission.find({
        assignment: { $in: assignments.map((item) => item._id) },
      }).populate("student", "name").populate("assignment", "title");

      const ungraded = submissions.filter((item) => item.grade === null || item.grade === undefined);
      const risk = [];

      for (const course of courses) {
        for (const student of course.students) {
          const records = await Attendance.find({ course: course._id, student: student._id });
          const percentage = attendancePercent(records);
          if (percentage !== null && percentage < RISK_THRESHOLD) {
            risk.push({
              student,
              course: course.title,
              percentage,
            });
          }
        }
      }

      const insights = [];
      if (risk.length) {
        insights.push({
          tone: "danger",
          title: `${risk.length} student${risk.length > 1 ? "s" : ""} below ${RISK_THRESHOLD}%`,
          body: "Reach out before they lose exam eligibility.",
        });
      }
      if (ungraded.length) {
        insights.push({
          tone: "warning",
          title: `${ungraded.length} submission${ungraded.length > 1 ? "s" : ""} waiting for grades`,
          body: "Students can see results as soon as you grade them.",
        });
      }
      insights.push({
        tone: "info",
        title: `${courses.length} course${courses.length === 1 ? "" : "s"} assigned to you`,
        body: `${courses.reduce((sum, item) => sum + item.students.length, 0)} enrolled students`,
      });

      return res.json({
        role,
        stats: {
          courses: courses.length,
          students: courses.reduce((sum, item) => sum + item.students.length, 0),
          pendingGrading: ungraded.length,
          atRisk: risk.length,
        },
        insights,
        atRiskStudents: risk,
        pendingGrading: ungraded.slice(0, 6),
        courses,
      });
    }

    const [users, courses, tickets, assignments, notices] = await Promise.all([
      User.find().select("-password"),
      Course.find().populate("students", "_id").populate("faculty", "name"),
      Ticket.find(),
      Assignment.find(),
      Notice.find().sort({ createdAt: -1 }).limit(5),
    ]);

    const ticketsByCategory = tickets.reduce((acc, ticket) => {
      acc[ticket.category] = (acc[ticket.category] || 0) + 1;
      return acc;
    }, {});

    const ticketsByPriority = tickets.reduce((acc, ticket) => {
      acc[ticket.priority] = (acc[ticket.priority] || 0) + 1;
      return acc;
    }, {});

    const enrollment = courses.map((course) => ({
      name: course.code || course.title,
      students: course.students.length,
    }));

    const allRecords = await Attendance.find();
    const campusAttendance = attendancePercent(allRecords) || 0;

    const insights = [
      {
        tone: tickets.filter((item) => item.priority === "critical" && item.status !== "resolved").length
          ? "danger"
          : "info",
        title: `${tickets.filter((item) => item.status === "open").length} open helpdesk tickets`,
        body: "Critical items are auto-flagged from the ticket text.",
      },
      {
        tone: campusAttendance < RISK_THRESHOLD ? "warning" : "success",
        title: `Campus attendance ${campusAttendance}%`,
        body: campusAttendance < RISK_THRESHOLD ? "Overall attendance is slipping." : "Campus attendance is healthy.",
      },
    ];

    return res.json({
      role,
      stats: {
        users: users.length,
        students: users.filter((item) => item.role === "student").length,
        faculty: users.filter((item) => item.role === "faculty").length,
        courses: courses.length,
        openTickets: tickets.filter((item) => item.status !== "resolved").length,
        assignments: assignments.length,
        attendanceAvg: campusAttendance,
      },
      insights,
      ticketsByCategory,
      ticketsByPriority,
      enrollment,
      notices,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
