import Timetable from "../models/Timetable.js";
import Course from "../models/Course.js";
import { overlaps, weekdayName } from "../utils/time.js";

export const createTimetable = async (req, res) => {
  try {
    const { course, faculty, day, startTime, endTime, room } = req.body;

    if (!course || !faculty || !day || !startTime || !endTime) {
      return res.status(400).json({ message: "All timetable fields are required" });
    }

    const existing = await Timetable.find({ day });
    const conflict = existing.find((slot) => {
      const timeClash = overlaps(startTime, endTime, slot.startTime, slot.endTime);
      const facultyClash = slot.faculty.toString() === faculty;
      const roomClash = room && slot.room && slot.room.toLowerCase() === room.toLowerCase();
      return timeClash && (facultyClash || roomClash);
    });

    if (conflict) {
      return res.status(409).json({
        message: "Smart conflict detected: faculty or room is already booked in this slot",
        conflict,
      });
    }

    const entry = await Timetable.create({
      course,
      faculty,
      day,
      startTime,
      endTime,
      room,
    });

    const populated = await Timetable.findById(entry._id)
      .populate("course", "title code")
      .populate("faculty", "name");

    res.status(201).json({ message: "Timetable created", entry: populated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTimetable = async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === "student") {
      const enrolled = await Course.find({ students: req.user.id }).select("_id");
      filter.course = { $in: enrolled.map((item) => item._id) };
    } else if (req.user.role === "faculty") {
      filter.faculty = req.user.id;
    }

    const timetable = await Timetable.find(filter)
      .populate("course", "title code")
      .populate("faculty", "name")
      .sort({ day: 1, startTime: 1 });

    res.json({
      timetable,
      today: weekdayName(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteTimetable = async (req, res) => {
  try {
    await Timetable.findByIdAndDelete(req.params.id);
    res.json({ message: "Slot removed" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
