import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['info', 'success', 'warning', 'error', 'system', 'academic', 'attendance', 'exam', 'fee', 'event'], 
      default: 'info' 
    },
    priority: { 
      type: String, 
      enum: ['low', 'medium', 'high', 'urgent'], 
      default: 'medium' 
    },
    category: { 
      type: String, 
      enum: ['general', 'academic', 'attendance', 'exam', 'fee', 'event', 'system', 'security'], 
      default: 'general' 
    },
    read_status: { type: Boolean, default: false },
    read_at: { type: Date },
    action_url: { type: String },
    action_text: { type: String },
    action_data: { type: mongoose.Schema.Types.Mixed },
    scheduled_at: { type: Date },
    expires_at: { type: Date },
    is_system: { type: Boolean, default: false },
    sender_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    related_entity_type: { type: String },
    related_entity_id: { type: mongoose.Schema.Types.ObjectId },
    metadata: { type: mongoose.Schema.Types.Mixed },
    is_deleted: { type: Boolean, default: false },
    deleted_at: { type: Date }
  },
  { timestamps: true }
);

// Index for efficient queries
notificationSchema.index({ user_id: 1, read_status: 1, createdAt: -1 });
notificationSchema.index({ type: 1, priority: 1 });
notificationSchema.index({ scheduled_at: 1 });
notificationSchema.index({ expires_at: 1 });

export default mongoose.model("Notification", notificationSchema);