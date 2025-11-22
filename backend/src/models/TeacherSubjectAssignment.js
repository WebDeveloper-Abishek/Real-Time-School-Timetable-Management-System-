import mongoose from "mongoose";

const teacherSubjectAssignmentSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Teacher
    subject_id: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    class_id: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
    course_limit: { type: Number, required: true },
  },
  { timestamps: true }
);

// Index to prevent duplicate assignments
teacherSubjectAssignmentSchema.index({ user_id: 1, subject_id: 1, class_id: 1 }, { unique: true });

export default mongoose.model("TeacherSubjectAssignment", teacherSubjectAssignmentSchema);
