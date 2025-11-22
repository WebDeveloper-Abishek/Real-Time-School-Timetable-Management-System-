import mongoose from "mongoose";

const meetingSchema = new mongoose.Schema(
  {
    slot_id: { type: mongoose.Schema.Types.ObjectId, required: true }, // Can reference CounsellorSlot or TimetableSlot
    initiator_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiver_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    purpose: { type: String, required: true },
    accepted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Meeting", meetingSchema);
