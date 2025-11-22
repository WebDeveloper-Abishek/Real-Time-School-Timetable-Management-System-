import mongoose from "mongoose";

const counsellorSlotSchema = new mongoose.Schema(
  {
    counsellor_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    start_time: { type: String, required: true }, // Format: "HH:MM"
    end_time: { type: String, required: true }, // Format: "HH:MM"
    is_available: { type: Boolean, default: true },
  },
  { timestamps: true }
);

counsellorSlotSchema.index({ counsellor_id: 1, date: 1, start_time: 1 }, { unique: true });

export default mongoose.model("CounsellorSlot", counsellorSlotSchema);
