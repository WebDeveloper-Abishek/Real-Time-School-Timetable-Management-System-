import mongoose from "mongoose";

const academicYearSchema = new mongoose.Schema(
  {
    year_label: { type: String, required: true, unique: true }, // e.g., 2025-2026
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("AcademicYear", academicYearSchema);


