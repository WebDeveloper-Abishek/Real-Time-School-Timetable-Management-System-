import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    slot_id: { type: mongoose.Schema.Types.ObjectId, ref: "TimetableSlot", required: true },
    date: { type: Date, required: true },
    status: { 
      type: String, 
      enum: ["Present", "Absent", "Late"], 
      required: true 
    },
  },
  { timestamps: true }
);

// Compound index for efficient queries
attendanceSchema.index({ student_id: 1, slot_id: 1, date: 1 }, { unique: true });

export default mongoose.model("Attendance", attendanceSchema);
