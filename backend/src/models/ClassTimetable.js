import mongoose from "mongoose";

const classTimetableSchema = new mongoose.Schema(
  {
    class_id: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
    slot_id: { type: mongoose.Schema.Types.ObjectId, ref: "TimetableSlot", required: true },
    subject_id: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    teacher_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    day_of_week: { 
      type: String, 
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], 
      required: true 
    },
  },
  { timestamps: true }
);

classTimetableSchema.index({ class_id: 1, slot_id: 1, day_of_week: 1 }, { unique: true });

export default mongoose.model("ClassTimetable", classTimetableSchema);
