import Event from "../models/Event.js";
import { notifyMany } from "../utils/notify.js";
import User from "../models/User.js";

export const createEvent = async (req, res) => {
  try {
    const { title, description, venue, startsAt, audience = "all" } = req.body;
    if (!title || !startsAt) {
      return res.status(400).json({ message: "Title and start time are required" });
    }

    const event = await Event.create({
      title,
      description,
      venue,
      startsAt,
      audience,
      createdBy: req.user.id,
    });

    const users =
      audience === "all"
        ? await User.find().select("_id")
        : await User.find({ role: audience }).select("_id");

    await notifyMany(
      users.map((user) => user._id),
      {
        title: `New event: ${title}`,
        message: venue ? `${venue} · ${new Date(startsAt).toLocaleString()}` : new Date(startsAt).toLocaleString(),
        type: "system",
        link: "/events",
      }
    );

    res.status(201).json({ message: "Event published", event });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getEvents = async (req, res) => {
  try {
    const filter =
      req.user.role === "admin"
        ? {}
        : { audience: { $in: ["all", req.user.role] } };

    const events = await Event.find(filter)
      .populate("createdBy", "name role")
      .populate("attendees", "name")
      .sort({ startsAt: 1 });

    res.json({
      events: events.map((event) => ({
        ...event.toObject(),
        going: event.attendees.some((person) => person._id.toString() === req.user.id),
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const rsvpEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const already = event.attendees.some((id) => id.toString() === req.user.id);
    if (already) {
      event.attendees = event.attendees.filter((id) => id.toString() !== req.user.id);
    } else {
      event.attendees.push(req.user.id);
    }
    await event.save();

    res.json({ message: already ? "RSVP removed" : "You're going", going: !already });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
