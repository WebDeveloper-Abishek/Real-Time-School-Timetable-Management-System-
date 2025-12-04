import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    slot_id: { type: mongoose.Schema.Types.ObjectId, ref: "TimetableSlot", required: true },
    class_id: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
    subject_id: { type: mongoose.Schema.Types.ObjectId, ref: "Subject" }, // Optional for class teacher attendance
    date: { type: Date, required: true },
    status: { 
      type: String, 
      enum: ["Present", "Absent", "Late"], 
      required: true 
    },
    marked_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Teacher who marked attendance
    attendance_type: {
      type: String,
      enum: ["class_teacher", "subject_teacher"],
      required: true
    }
  },
  { timestamps: true }
);

// Compound index for efficient queries - updated to include class_id and subject_id
attendanceSchema.index({ student_id: 1, slot_id: 1, date: 1, subject_id: 1 }, { unique: true });
attendanceSchema.index({ class_id: 1, date: 1 });
attendanceSchema.index({ subject_id: 1, date: 1 });
attendanceSchema.index({ student_id: 1, date: 1 });

export default mongoose.model("Attendance", attendanceSchema);
