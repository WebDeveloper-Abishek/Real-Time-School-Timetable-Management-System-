import mongoose from "mongoose";

const mentalHealthReportSchema = new mongoose.Schema(
  {
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    teacher_or_counsellor_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true },
    submitted_at: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("MentalHealthReport", mentalHealthReportSchema);
