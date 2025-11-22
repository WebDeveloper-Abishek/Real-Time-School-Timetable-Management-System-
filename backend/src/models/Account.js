import mongoose from "mongoose";

const accountSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, unique: true, sparse: true, lowercase: true },
    phone: { type: String },
    password: { type: String, required: true },
    is_active: { type: Boolean, default: true },
    is_deleted: { type: Boolean, default: false }, // Soft delete flag
    deleted_at: { type: Date }, // When the account was deleted
    deleted_reason: { type: String }, // Reason for deletion
  },
  { timestamps: true }
);

export default mongoose.model("Account", accountSchema);
