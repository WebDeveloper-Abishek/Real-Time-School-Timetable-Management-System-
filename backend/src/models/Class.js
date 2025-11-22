import mongoose from "mongoose";

const classSchema = new mongoose.Schema(
  {
    term_id: { type: mongoose.Schema.Types.ObjectId, ref: "Term", required: true },
    grade: { type: Number, required: true },
    section: { type: String, required: true },
    class_name: { type: String, required: true }, // e.g., 9A
  },
  { timestamps: true }
);

classSchema.index({ term_id: 1, class_name: 1 }, { unique: true });

export default mongoose.model("Class", classSchema);
