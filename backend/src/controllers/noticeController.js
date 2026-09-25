import Notice from "../models/Notice.js";
import User from "../models/User.js";
import { notifyMany } from "../utils/notify.js";

export const createNotice = async (req, res) => {
  try {
    const { title, content, audience = "all", pinned = false } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: "Title and content are required" });
    }

    const notice = await Notice.create({
      title,
      content,
      audience,
      pinned,
      postedBy: req.user.id,
    });

    const users =
      audience === "all"
        ? await User.find().select("_id")
        : await User.find({ role: audience }).select("_id");

    await notifyMany(
      users.map((user) => user._id),
      {
        title: pinned ? `Pinned notice: ${title}` : `New notice: ${title}`,
        message: content.slice(0, 120),
        type: "notice",
        link: "/notices",
      }
    );

    res.status(201).json({ message: "Notice created", notice });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getNotices = async (req, res) => {
  try {
    const filter =
      req.user.role === "admin"
        ? {}
        : { audience: { $in: ["all", req.user.role] } };

    const notices = await Notice.find(filter)
      .sort({ pinned: -1, createdAt: -1 })
      .populate("postedBy", "name role");

    res.json({ notices });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteNotice = async (req, res) => {
  try {
    await Notice.findByIdAndDelete(req.params.id);
    res.json({ message: "Notice deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
