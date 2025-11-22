import mongoose from "mongoose";

const timetableSlotSchema = new mongoose.Schema(
  {
    slot_number: { type: Number, required: true, min: 1, max: 10 },
    start_time: { type: String, required: true }, // e.g., "08:00"
    end_time: { type: String, required: true }, // e.g., "08:45"
    slot_type: { 
      type: String, 
      enum: ["Period", "Assembly", "Break", "Anthem"], 
      required: true 
    },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Index to prevent duplicate slot numbers
timetableSlotSchema.index({ slot_number: 1 }, { unique: true });

export default mongoose.model("TimetableSlot", timetableSlotSchema);