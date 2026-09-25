import Course from "../models/Course.js";
import Notice from "../models/Notice.js";
import Assignment from "../models/Assignment.js";
import Ticket from "../models/Ticket.js";
import Timetable from "../models/Timetable.js";
import Attendance from "../models/Attendance.js";
import { weekdayName } from "../utils/time.js";

const STOP = new Set([
  "the", "and", "for", "are", "but", "not", "you", "all", "can", "how", "what",
  "when", "where", "who", "why", "this", "that", "with", "from", "have", "has",
]);

const tokenize = (text = "") =>
  text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 2 && !STOP.has(word));

const score = (haystack, tokens) => {
  const words = tokenize(haystack);
  return tokens.reduce((total, token) => {
    if (words.includes(token)) return total + 2;
    if (words.some((word) => word.includes(token))) return total + 1;
    return total;
  }, 0);
};

export const askAssistant = async (req, res) => {
  try {
    const question = (req.body.question || "").trim();
    if (!question) {
      return res.status(400).json({ message: "Ask a campus question" });
    }

    const tokens = tokenize(question);
    const today = weekdayName();
    const lower = question.toLowerCase();

    const [courses, notices, assignments, tickets, timetable, records] = await Promise.all([
      Course.find().populate("faculty", "name"),
      Notice.find().sort({ createdAt: -1 }).limit(12),
      Assignment.find().populate("course", "title"),
      req.user.role === "admin"
        ? Ticket.find().sort({ createdAt: -1 }).limit(12)
        : Ticket.find({ createdBy: req.user.id }).sort({ createdAt: -1 }).limit(12),
      Timetable.find().populate("course", "title").populate("faculty", "name"),
      Attendance.find({ student: req.user.id }).populate("course", "title"),
    ]);

    const sources = [];

    const pushMatches = (items, type, toText) => {
      items.forEach((item) => {
        const text = toText(item);
        const value = score(text, tokens);
        if (value > 0) sources.push({ type, score: value, text, raw: item });
      });
    };

    pushMatches(courses, "course", (item) => `${item.title} ${item.code} ${item.description} ${item.department}`);
    pushMatches(notices, "notice", (item) => `${item.title} ${item.content}`);
    pushMatches(assignments, "assignment", (item) => `${item.title} ${item.description} ${item.course?.title}`);
    pushMatches(tickets, "ticket", (item) => `${item.title} ${item.description} ${item.status} ${item.priority}`);
    pushMatches(timetable, "timetable", (item) => `${item.day} ${item.course?.title} ${item.room} ${item.faculty?.name}`);

    sources.sort((a, b) => b.score - a.score);
    const top = sources.slice(0, 4);

    let answer = "";

    if (/(hello|hi|hey|help)/.test(lower) && tokens.length < 3) {
      answer =
        `Hi, I'm Campus Copilot. I can check your timetable, attendance risk, assignments, notices, and helpdesk tickets. Try "what classes do I have today?"`;
    } else if (/(attendance|percent|eligibility|bunk)/.test(lower)) {
      const byCourse = {};
      records.forEach((record) => {
        if (!record.course) return;
        const key = record.course.title;
        if (!byCourse[key]) byCourse[key] = { total: 0, present: 0 };
        byCourse[key].total += 1;
        if (record.status === "present") byCourse[key].present += 1;
      });
      const lines = Object.entries(byCourse).map(([name, stats]) => {
        const pct = ((stats.present / stats.total) * 100).toFixed(1);
        return `${name}: ${pct}%${pct < 75 ? " (at risk)" : ""}`;
      });
      answer = lines.length
        ? `Your attendance snapshot:\n${lines.join("\n")}\nCampus policy flags anything under 75%.`
        : "No attendance has been marked for you yet. Once faculty start a live session or mark the register, it will show up here.";
    } else if (/(timetable|schedule|class|today|tomorrow)/.test(lower)) {
      const day = /tomorrow/.test(lower)
        ? weekdayName(new Date(Date.now() + 86400000))
        : today;
      const slots = timetable.filter((item) => item.day === day);
      answer = slots.length
        ? `${day}'s classes:\n${slots
            .map((item) => `${item.startTime}–${item.endTime} ${item.course?.title} (${item.room || "TBA"})`)
            .join("\n")}`
        : `I don't see any classes on ${day} in the current timetable.`;
    } else if (/(assignment|deadline|homework|due)/.test(lower)) {
      const upcoming = assignments
        .filter((item) => new Date(item.dueDate) >= new Date())
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .slice(0, 5);
      answer = upcoming.length
        ? `Upcoming deadlines:\n${upcoming
            .map((item) => `${item.title} (${item.course?.title}) — ${new Date(item.dueDate).toLocaleString()}`)
            .join("\n")}`
        : "No upcoming assignment deadlines right now.";
    } else if (/(ticket|wifi|hostel|lab|helpdesk|complaint)/.test(lower)) {
      if (tickets.length) {
        answer = `Your recent tickets:\n${tickets
          .slice(0, 4)
          .map((item) => `${item.title} — ${item.status} / ${item.priority}`)
          .join("\n")}\nYou can raise a new one from the Tickets page. Priority is assigned automatically from the wording.`;
      } else {
        answer =
          "You have no helpdesk tickets. Open Tickets to report wifi, lab, hostel, library, or academic issues. Urgent words like 'outage' or 'exam' raise the priority automatically.";
      }
    } else if (/(notice|announce|event|holiday)/.test(lower)) {
      answer = notices.length
        ? `Latest campus notices:\n${notices
            .slice(0, 4)
            .map((item) => `• ${item.title}: ${item.content.slice(0, 90)}`)
            .join("\n")}`
        : "No notices have been posted yet.";
    } else if (/(course|enroll|subject)/.test(lower)) {
      answer = courses.length
        ? `Available courses:\n${courses
            .slice(0, 6)
            .map((item) => `${item.code || "NA"} — ${item.title} (${item.faculty?.name || "TBA"})`)
            .join("\n")}\nStudents can enroll from the Courses page.`
        : "No courses have been created yet.";
    } else if (top.length) {
      answer = `Here's what I found in campus data:\n${top
        .map((item) => `• [${item.type}] ${item.text.slice(0, 140)}`)
        .join("\n")}`;
    } else {
      answer =
        "I couldn't match that to live campus records. Try asking about attendance, today's classes, assignment deadlines, notices, or tickets.";
    }

    res.json({
      answer,
      sources: top.map((item) => ({ type: item.type, snippet: item.text.slice(0, 160) })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
