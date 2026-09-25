import mongoose from "mongoose";

const timetableSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    day: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    room: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Timetable", timetableSchema);
