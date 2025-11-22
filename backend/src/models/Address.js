import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    district: { type: String, required: true },
    postal_code: { type: String, required: true },
    country: { type: String, required: true },
  },
  { timestamps: true }
);

addressSchema.index({ user_id: 1 }, { unique: true });

export default mongoose.model("Address", addressSchema);
