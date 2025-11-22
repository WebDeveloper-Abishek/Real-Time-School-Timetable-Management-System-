import mongoose from "mongoose";

const teacherTimetableSchema = new mongoose.Schema(
  {
    teacher_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    slot_id: { type: mongoose.Schema.Types.ObjectId, ref: "TimetableSlot", required: true },
    class_id: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
    subject_id: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    day_of_week: { 
      type: String, 
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], 
      required: true 
    },
  },
  { timestamps: true }
);

// Index to prevent duplicate timetable entries
teacherTimetableSchema.index({ teacher_id: 1, slot_id: 1, day_of_week: 1 }, { unique: true });

export default mongoose.model("TeacherTimetable", teacherTimetableSchema);
