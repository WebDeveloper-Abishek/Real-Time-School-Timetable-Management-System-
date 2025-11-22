import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema(
  {
    subject_name: { type: String, required: true, trim: true },
    course_limit: { type: Number, default: 1, min: 1 },
    term_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Term' },
    is_active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// Index for better performance
subjectSchema.index({ subject_name: 1 });
subjectSchema.index({ term_id: 1 });
subjectSchema.index({ is_active: 1 });

export default mongoose.model("Subject", subjectSchema);


