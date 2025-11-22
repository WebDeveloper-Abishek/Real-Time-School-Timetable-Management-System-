import mongoose from "mongoose";

const termSchema = new mongoose.Schema(
  {
    academic_year_id: { type: mongoose.Schema.Types.ObjectId, ref: "AcademicYear", required: true },
    term_number: { type: Number, enum: [1, 2, 3], required: true },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

termSchema.index({ academic_year_id: 1, term_number: 1 }, { unique: true });

export default mongoose.model("Term", termSchema);


