import mongoose from "mongoose";

const schoolEventSchema = new mongoose.Schema(
  {
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("SchoolEvent", schoolEventSchema);
