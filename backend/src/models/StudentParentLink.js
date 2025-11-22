import mongoose from "mongoose";

const studentParentLinkSchema = new mongoose.Schema(
  {
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    parent_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

studentParentLinkSchema.index({ student_id: 1, parent_id: 1 }, { unique: true });

export default mongoose.model("StudentParentLink", studentParentLinkSchema);
