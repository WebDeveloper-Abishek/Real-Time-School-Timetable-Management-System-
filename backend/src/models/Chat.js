import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    sender_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiver_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true },
    message_type: { 
      type: String, 
      enum: ['text', 'image', 'file', 'audio', 'video'], 
      default: 'text' 
    },
    file_url: { type: String },
    file_name: { type: String },
    file_size: { type: Number },
    sent_at: { type: Date, default: Date.now },
    read_status: { type: Boolean, default: false },
    read_at: { type: Date },
    delivered_status: { type: Boolean, default: false },
    delivered_at: { type: Date },
    reactions: [{
      user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      emoji: { type: String },
      created_at: { type: Date, default: Date.now }
    }],
    reply_to: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },
    is_edited: { type: Boolean, default: false },
    edited_at: { type: Date },
    is_deleted: { type: Boolean, default: false },
    deleted_at: { type: Date }
  },
  { timestamps: true }
);

// Indexes for better performance
chatSchema.index({ sender_id: 1, receiver_id: 1, sent_at: -1 });
chatSchema.index({ receiver_id: 1, read_status: 1 });
chatSchema.index({ sent_at: -1 });

export default mongoose.model("Chat", chatSchema);
