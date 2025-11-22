import mongoose from "mongoose";

const examMarkSchema = new mongoose.Schema(
  {
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    subject_id: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    term_id: { type: mongoose.Schema.Types.ObjectId, ref: "Term", required: true },
    marks_obtained: { type: Number, required: true },
    total_marks: { type: Number, required: true },
  },
  { timestamps: true }
);

// Compound index for efficient queries
examMarkSchema.index({ student_id: 1, subject_id: 1, term_id: 1 }, { unique: true });

export default mongoose.model("ExamMark", examMarkSchema);
