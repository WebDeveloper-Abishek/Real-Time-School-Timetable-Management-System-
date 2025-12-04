import mongoose from "mongoose";

const leaveRecordSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Teacher
    term_id: { type: mongoose.Schema.Types.ObjectId, ref: "Term", required: false }, // Optional: link to term
    leave_type: { 
      type: String, 
      enum: ["Full", "Half"],
      required: true 
    },
    half_day_type: { 
      type: String, 
      enum: ["First", "Second"],
      required: function() { return this.leave_type === "Half"; }
    },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    reason: { type: String, required: true },
    approved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("LeaveRecord", leaveRecordSchema);
