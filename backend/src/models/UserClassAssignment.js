import mongoose from "mongoose";

const userClassAssignmentSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    class_id: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
    is_class_teacher: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Index to prevent duplicate assignments
userClassAssignmentSchema.index({ user_id: 1, class_id: 1 }, { unique: true });

export default mongoose.model("UserClassAssignment", userClassAssignmentSchema);
