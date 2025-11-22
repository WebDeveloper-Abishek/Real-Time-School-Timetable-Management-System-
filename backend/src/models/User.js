import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    nic_number: { 
      type: String, 
      required: true, 
      unique: true,
      trim: true,
      uppercase: true
    },
    date_of_birth: { type: Date },
    gender: { type: String, enum: ["Male", "Female", "Other"] },
    role: { 
      type: String, 
      enum: ["Student", "Teacher", "Parent", "Admin", "Counsellor"], 
      required: true 
    },
    profile_picture: { type: String },
    is_deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Virtual for accounts
userSchema.virtual('accounts', {
  ref: 'Account',
  localField: '_id',
  foreignField: 'user_id'
});

// Ensure virtual fields are included in JSON output
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

// Index for better query performance
userSchema.index({ role: 1, is_deleted: 1 });
userSchema.index({ name: 'text' });

const User = mongoose.model("User", userSchema);
export default User;
