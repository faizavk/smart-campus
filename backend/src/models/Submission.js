import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    content: String,
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    late: { type: Boolean, default: false },
    grade: { type: Number, min: 0, max: 100, default: null },
    feedback: { type: String, default: "" },
  },
  { timestamps: true }
);

submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

export default mongoose.model("Submission", submissionSchema);
