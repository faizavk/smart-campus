import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "./models/User.js";
import Course from "./models/Course.js";
import Ticket from "./models/Ticket.js";
import Notice from "./models/Notice.js";
import Assignment from "./models/Assignment.js";
import Submission from "./models/Submission.js";
import Attendance from "./models/Attendance.js";
import Timetable from "./models/Timetable.js";
import Notification from "./models/Notification.js";
import Event from "./models/Event.js";

dotenv.config();

const daysAgo = (n) => {
  const date = new Date();
  date.setDate(date.getDate() - n);
  date.setHours(10, 0, 0, 0);
  return date;
};

const daysFromNow = (n) => {
  const date = new Date();
  date.setDate(date.getDate() + n);
  date.setHours(23, 59, 0, 0);
  return date;
};

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);

  await Promise.all([
    User.deleteMany({}),
    Course.deleteMany({}),
    Ticket.deleteMany({}),
    Notice.deleteMany({}),
    Assignment.deleteMany({}),
    Submission.deleteMany({}),
    Attendance.deleteMany({}),
    Timetable.deleteMany({}),
    Notification.deleteMany({}),
    Event.deleteMany({}),
  ]);

  const password = await bcrypt.hash("campus123", 10);

  const [
    admin,
    faculty1,
    faculty2,
    faculty3,
    student1,
    student2,
    student3,
    student4,
    student5,
    student6,
  ] = await User.create([
    { name: "Aisha Rahman", email: "admin@campus.edu", password, role: "admin", department: "Administration" },
    { name: "Dr. Kabir Mehta", email: "faculty@campus.edu", password, role: "faculty", department: "Computer Science" },
    { name: "Prof. Neha Iyer", email: "neha@campus.edu", password, role: "faculty", department: "Electronics" },
    { name: "Dr. Arjun Sen", email: "arjun@campus.edu", password, role: "faculty", department: "Design" },
    { name: "Ananya Pillai", email: "student@campus.edu", password, role: "student", department: "Computer Science" },
    { name: "Rahul Das", email: "rahul@campus.edu", password, role: "student", department: "Computer Science" },
    { name: "Meera Joseph", email: "meera@campus.edu", password, role: "student", department: "Electronics" },
    { name: "Dev Kapoor", email: "dev@campus.edu", password, role: "student", department: "Computer Science" },
    { name: "Fatima Noor", email: "fatima@campus.edu", password, role: "student", department: "Electronics" },
    { name: "Ishaan Roy", email: "ishaan@campus.edu", password, role: "student", department: "Design" },
  ]);

  const [cs, db, iot, design] = await Course.create([
    {
      title: "Data Structures",
      code: "CS201",
      description: "Trees, graphs, hashing and complexity analysis with weekly labs.",
      department: "Computer Science",
      credits: 4,
      faculty: faculty1._id,
      students: [student1._id, student2._id, student4._id],
    },
    {
      title: "Database Systems",
      code: "CS305",
      description: "Relational modeling, SQL, indexing and transactions.",
      department: "Computer Science",
      credits: 3,
      faculty: faculty1._id,
      students: [student1._id, student2._id, student3._id, student4._id],
    },
    {
      title: "IoT Lab",
      code: "EC220",
      description: "Sensors, MQTT and campus telemetry prototypes.",
      department: "Electronics",
      credits: 3,
      faculty: faculty2._id,
      students: [student3._id, student1._id, student5._id],
    },
    {
      title: "Interaction Design",
      code: "DS110",
      description: "User research, wireframes and accessibility for campus products.",
      department: "Design",
      credits: 3,
      faculty: faculty3._id,
      students: [student6._id, student5._id],
    },
  ]);

  const [a1, a2] = await Assignment.create([
    {
      title: "Binary Tree Visualizer",
      description: "Implement traversals and explain time complexity.",
      dueDate: daysFromNow(4),
      course: cs._id,
      createdBy: faculty1._id,
      maxMarks: 20,
    },
    {
      title: "ER Diagram for Library",
      description: "Design an ER model and write 8 meaningful SQL queries.",
      dueDate: daysFromNow(8),
      course: db._id,
      createdBy: faculty1._id,
      maxMarks: 25,
    },
    {
      title: "Campus app usability audit",
      description: "Review three student journeys and list friction points.",
      dueDate: daysFromNow(6),
      course: design._id,
      createdBy: faculty3._id,
      maxMarks: 15,
    },
  ]);

  await Submission.create([
    {
      assignment: a2._id,
      student: student2._id,
      content: "Attached ER diagram plus SQL for inventory, fines and reservations.",
      late: false,
    },
    {
      assignment: a1._id,
      student: student4._id,
      content: "GitHub link for tree visualizer with BFS/DFS toggles.",
      late: false,
    },
  ]);

  await Ticket.create([
    {
      title: "Hostel wifi outage on 2nd floor",
      description: "No internet since last night, cannot submit assignment.",
      category: "wifi",
      priority: "high",
      status: "open",
      createdBy: student1._id,
    },
    {
      title: "Lab projector not working",
      description: "CS201 morning slot projector stays blank.",
      category: "lab",
      priority: "medium",
      status: "in-progress",
      createdBy: student2._id,
    },
    {
      title: "Library access card issue",
      description: "Card is not scanning at the gate.",
      category: "library",
      priority: "low",
      status: "resolved",
      createdBy: student3._id,
    },
    {
      title: "Studio lights flickering",
      description: "Design lab lights drop every few minutes.",
      category: "lab",
      priority: "medium",
      status: "open",
      createdBy: student6._id,
    },
  ]);

  await Notice.create([
    {
      title: "Mid-sem timetable released",
      content: "Exams begin next week. Check the Timetable page and keep attendance above 75%.",
      audience: "all",
      pinned: true,
      postedBy: admin._id,
    },
    {
      title: "IoT workshop this Friday",
      content: "Hands-on MQTT session in Lab 3 from 3 PM. Faculty and students welcome.",
      audience: "all",
      pinned: false,
      postedBy: faculty2._id,
    },
    {
      title: "Faculty meeting",
      content: "Department review on Monday at 11 AM in the conference room.",
      audience: "faculty",
      pinned: false,
      postedBy: admin._id,
    },
  ]);

  const weekday = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  await Timetable.create([
    { course: cs._id, faculty: faculty1._id, day: weekday[0], startTime: "10:00", endTime: "11:00", room: "CS-101" },
    { course: db._id, faculty: faculty1._id, day: weekday[2], startTime: "11:00", endTime: "12:00", room: "CS-204" },
    { course: iot._id, faculty: faculty2._id, day: weekday[4], startTime: "14:00", endTime: "16:00", room: "EC-Lab-3" },
    { course: cs._id, faculty: faculty1._id, day: weekday[3], startTime: "09:00", endTime: "10:00", room: "CS-101" },
    { course: design._id, faculty: faculty3._id, day: weekday[1], startTime: "13:00", endTime: "15:00", room: "DS-Studio" },
  ]);

  await Event.create([
    {
      title: "Placement briefing",
      description: "Resume clinic and company shortlist for final-year students.",
      venue: "Auditorium A",
      startsAt: daysFromNow(3),
      audience: "student",
      createdBy: admin._id,
      attendees: [student1._id, student4._id, student5._id],
    },
    {
      title: "Open campus hack night",
      description: "Build a campus micro-tool. Mentors from CS and Design will be around.",
      venue: "Innovation Lab",
      startsAt: daysFromNow(5),
      audience: "all",
      createdBy: faculty1._id,
      attendees: [student2._id, student6._id],
    },
    {
      title: "Faculty pedagogy circle",
      description: "Share one classroom experiment from this semester.",
      venue: "Conference room",
      startsAt: daysFromNow(2),
      audience: "faculty",
      createdBy: admin._id,
      attendees: [faculty2._id],
    },
  ]);

  const mark = async (courseId, studentId, days, status) => {
    await Attendance.create({
      course: courseId,
      student: studentId,
      date: daysAgo(days),
      status,
      method: "manual",
    });
  };

  for (let i = 1; i <= 10; i += 1) {
    await mark(cs._id, student1._id, i, i % 5 === 0 ? "absent" : "present");
    await mark(cs._id, student2._id, i, i % 2 === 0 ? "absent" : "present");
    await mark(cs._id, student4._id, i, i % 4 === 0 ? "absent" : "present");
    await mark(db._id, student1._id, i, "present");
    await mark(db._id, student3._id, i, i % 3 === 0 ? "absent" : "present");
    await mark(iot._id, student5._id, i, i % 2 === 0 ? "present" : "absent");
  }

  await Notification.create([
    {
      user: student1._id,
      title: "New assignment: Binary Tree Visualizer",
      message: "Due in 4 days for Data Structures",
      type: "assignment",
      link: "/assignments",
    },
    {
      user: admin._id,
      title: "HIGH ticket: Hostel wifi outage on 2nd floor",
      message: "A new campus issue was auto-prioritized by Smart Campus.",
      type: "ticket",
      link: "/tickets",
    },
    {
      user: student4._id,
      title: "New event: Placement briefing",
      message: "Auditorium A · 3 days",
      type: "system",
      link: "/events",
    },
  ]);

  console.log("Smart Campus demo data ready");
  console.log("Login as:");
  console.log("  admin@campus.edu / campus123");
  console.log("  faculty@campus.edu / campus123");
  console.log("  student@campus.edu / campus123");

  await mongoose.disconnect();
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
