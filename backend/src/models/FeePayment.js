import mongoose from "mongoose";

const feePaymentSchema = new mongoose.Schema(
  {
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    term_id: { type: mongoose.Schema.Types.ObjectId, ref: "Term", required: true },
    payment_date: { type: Date, required: true },
    amount: { type: Number, required: true },
    status: { 
      type: String, 
      enum: ["Paid", "Unpaid"],
      required: true 
    },
  },
  { timestamps: true }
);

feePaymentSchema.index({ student_id: 1, term_id: 1 });

export default mongoose.model("FeePayment", feePaymentSchema);
