import mongoose from "mongoose";

const directMeetFeesSchema = new mongoose.Schema({
  studentID: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
  amount: { type: Number, required: true },
  paymentType: { type: String, enum: ["Online", "Offline"], required: true },
  course: { type: String, required: true },
  date: { type: Date, default: Date.now, required: true },
  meet_id: { type: mongoose.Schema.Types.ObjectId, ref: "CourseMeet", required: false },
  meet_title: { type: String, trim: true },
  payment_status: { type: String, enum: ["pending", "completed", "failed"], default: "completed" },
},{ timestamps:true });

const directMeetFees =  mongoose.model("DirectMeetFees", directMeetFeesSchema);
export default directMeetFees;
