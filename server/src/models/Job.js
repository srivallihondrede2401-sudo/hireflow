import mongoose from "mongoose";

export const STATUSES = ["wishlist", "applied", "interview", "offer", "rejected"];
export const PRIORITIES = ["low", "medium", "high"];

const jobSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    company: { type: String, required: true, trim: true, maxlength: 80 },
    role: { type: String, required: true, trim: true, maxlength: 120 },
    location: { type: String, trim: true, default: "" },
    salary: { type: String, trim: true, default: "" },
    url: { type: String, trim: true, default: "" },
    status: { type: String, enum: STATUSES, default: "wishlist", index: true },
    priority: { type: String, enum: PRIORITIES, default: "medium" },
    order: { type: Number, default: 0 },
    appliedAt: { type: Date },
    interviewAt: { type: Date },
    notes: { type: String, default: "", maxlength: 4000 },
    tags: { type: [String], default: [] },
  },
  { timestamps: true },
);

jobSchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.owner;
    return ret;
  },
});

export const Job = mongoose.model("Job", jobSchema);
