import Notification from "../models/Notification.js";

export async function notify(userId, { title, message, type = "system", link = "/" }) {
  if (!userId) return null;
  return Notification.create({ user: userId, title, message, type, link });
}

export async function notifyMany(userIds, payload) {
  const unique = [...new Set(userIds.filter(Boolean).map((id) => id.toString()))];
  if (!unique.length) return [];
  return Notification.insertMany(unique.map((user) => ({ user, ...payload })));
}
