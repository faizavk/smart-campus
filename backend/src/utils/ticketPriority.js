const CRITICAL = [
  "emergency",
  "fire",
  "flood",
  "outage",
  "blackout",
  "accident",
  "medical",
  "danger",
  "unsafe",
];

const HIGH = [
  "exam",
  "deadline",
  "broken",
  "not working",
  "down",
  "leak",
  "power",
  "locked out",
  "no internet",
  "server",
  "urgent",
];

const MEDIUM = ["slow", "request", "issue", "problem", "help", "repair"];

export function inferTicketPriority(title = "", description = "") {
  const text = `${title} ${description}`.toLowerCase();

  if (CRITICAL.some((word) => text.includes(word))) return "critical";
  if (HIGH.some((word) => text.includes(word))) return "high";
  if (MEDIUM.some((word) => text.includes(word))) return "medium";
  return "low";
}

export function inferTicketCategory(title = "", description = "", fallback = "other") {
  const text = `${title} ${description}`.toLowerCase();
  if (/(wifi|internet|network|lan)/.test(text)) return "wifi";
  if (/(lab|computer|equipment|projector)/.test(text)) return "lab";
  if (/(hostel|room|mess|warden)/.test(text)) return "hostel";
  if (/(library|book|journal)/.test(text)) return "library";
  if (/(exam|assignment|grade|class|faculty)/.test(text)) return "academics";
  return fallback;
}
