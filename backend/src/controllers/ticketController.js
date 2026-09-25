import Ticket from "../models/Ticket.js";
import { inferTicketCategory, inferTicketPriority } from "../utils/ticketPriority.js";
import { notify } from "../utils/notify.js";
import User from "../models/User.js";

export const createTicket = async (req, res) => {
  try {
    const { title, description, category } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    const priority = inferTicketPriority(title, description);
    const resolvedCategory = category || inferTicketCategory(title, description);

    const ticket = await Ticket.create({
      title,
      description,
      category: resolvedCategory,
      priority,
      createdBy: req.user.id,
    });

    const admins = await User.find({ role: "admin" }).select("_id");
    await Promise.all(
      admins.map((admin) =>
        notify(admin._id, {
          title: `${priority.toUpperCase()} ticket: ${title}`,
          message: "A new campus issue was auto-prioritized by Smart Campus.",
          type: "ticket",
          link: "/tickets",
        })
      )
    );

    res.status(201).json({ message: "Ticket created", ticket });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTickets = async (req, res) => {
  try {
    const { status, priority } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const tickets = await Ticket.find(filter)
      .sort({ createdAt: -1 })
      .populate("createdBy", "name email role");

    res.json({ tickets });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getMyTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ createdBy: req.user.id }).sort({ createdAt: -1 });
    res.json({ tickets });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateTicket = async (req, res) => {
  try {
    const { status } = req.body;
    const ticket = await Ticket.findByIdAndUpdate(req.params.id, { status }, { new: true });

    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    await notify(ticket.createdBy, {
      title: `Ticket "${ticket.title}" is now ${status}`,
      message: "Campus helpdesk updated your request.",
      type: "ticket",
      link: "/tickets",
    });

    res.json({ message: "Ticket updated", ticket });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteTicket = async (req, res) => {
  try {
    await Ticket.findByIdAndDelete(req.params.id);
    res.json({ message: "Ticket deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
