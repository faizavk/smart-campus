import { useState } from "react";
import API, { errorMessage } from "../services/api";

const starters = [
  "What classes do I have today?",
  "Show my attendance risk",
  "Any assignment deadlines?",
  "Latest campus notices",
];

export default function CampusAssistant() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "I'm Campus Copilot. I answer from live courses, timetable, attendance, notices and tickets.",
    },
  ]);
  const [loading, setLoading] = useState(false);

  const ask = async (text = question) => {
    const q = text.trim();
    if (!q) return;

    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setQuestion("");
    setLoading(true);

    try {
      const res = await API.post("/assistant/ask", { question: q });
      setMessages((prev) => [...prev, { role: "bot", text: res.data.answer }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: errorMessage(err, "Assistant is unavailable") },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button className="assistant-fab" onClick={() => setOpen((v) => !v)}>
        {open ? "×" : "✦"}
      </button>

      {open && (
        <section className="assistant-panel">
          <header>
            <div>
              <strong>Campus Copilot</strong>
              <p>Retrieval over live campus data</p>
            </div>
          </header>

          <div className="assistant-thread">
            {messages.map((msg, index) => (
              <div key={index} className={`bubble ${msg.role}`}>
                {msg.text}
              </div>
            ))}
            {loading && <div className="bubble bot">Thinking from campus records…</div>}
          </div>

          <div className="starter-row">
            {starters.map((item) => (
              <button key={item} type="button" onClick={() => ask(item)}>
                {item}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask();
            }}
          >
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask about class, tickets, deadlines…"
            />
            <button type="submit">Ask</button>
          </form>
        </section>
      )}
    </>
  );
}
