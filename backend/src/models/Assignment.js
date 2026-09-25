import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    dueDate: Date,
    maxMarks: { type: Number, default: 100 },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Assignment", assignmentSchema);
