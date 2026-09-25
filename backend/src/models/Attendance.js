import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    date: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["present", "absent"],
      required: true,
    },
    method: {
      type: String,
      enum: ["manual", "live-code"],
      default: "manual",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Attendance", attendanceSchema);
