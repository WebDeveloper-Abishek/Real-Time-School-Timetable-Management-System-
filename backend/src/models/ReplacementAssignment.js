import mongoose from "mongoose";

const replacementAssignmentSchema = new mongoose.Schema(
  {
    original_teacher_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    replacement_teacher_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    class_id: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
    subject_id: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    slot_id: { type: mongoose.Schema.Types.ObjectId, ref: "TimetableSlot", required: true },
    date: { type: Date, required: true },
    accepted: { type: Boolean, default: false },
    reason_declined: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("ReplacementAssignment", replacementAssignmentSchema);
