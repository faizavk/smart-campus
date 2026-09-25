import Course from "../models/Course.js";
import Notice from "../models/Notice.js";
import Ticket from "../models/Ticket.js";
import Assignment from "../models/Assignment.js";
import Event from "../models/Event.js";
import User from "../models/User.js";

export const searchCampus = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (q.length < 2) {
      return res.json({ courses: [], notices: [], tickets: [], assignments: [], events: [], people: [] });
    }

    const filter = {
      $or: [
        { title: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { content: { $regex: q, $options: "i" } },
        { code: { $regex: q, $options: "i" } },
        { venue: { $regex: q, $options: "i" } },
      ],
    };

    const ticketFilter =
      req.user.role === "admin" ? filter : { ...filter, createdBy: req.user.id };

    const [courses, notices, tickets, assignments, events] = await Promise.all([
      Course.find({
        $or: [
          { title: { $regex: q, $options: "i" } },
          { description: { $regex: q, $options: "i" } },
          { code: { $regex: q, $options: "i" } },
          { department: { $regex: q, $options: "i" } },
        ],
      })
        .populate("faculty", "name")
        .limit(6),
      Notice.find({
        $or: [{ title: { $regex: q, $options: "i" } }, { content: { $regex: q, $options: "i" } }],
      }).limit(6),
      Ticket.find(ticketFilter).limit(6),
      Assignment.find({
        $or: [{ title: { $regex: q, $options: "i" } }, { description: { $regex: q, $options: "i" } }],
      })
        .populate("course", "title")
        .limit(6),
      Event.find({
        $or: [
          { title: { $regex: q, $options: "i" } },
          { description: { $regex: q, $options: "i" } },
          { venue: { $regex: q, $options: "i" } },
        ],
      }).limit(6),
    ]);

    let people = [];
    if (["admin", "faculty"].includes(req.user.role)) {
      people = await User.find({
        $or: [
          { name: { $regex: q, $options: "i" } },
          { email: { $regex: q, $options: "i" } },
          { department: { $regex: q, $options: "i" } },
        ],
      })
        .select("-password")
        .limit(6);
    }

    res.json({ courses, notices, tickets, assignments, events, people });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
