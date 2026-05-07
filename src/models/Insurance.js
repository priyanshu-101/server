import mongoose from 'mongoose';

const insuranceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    company: { type: String, required: true },
    policyType: {
      type: String,
      enum: ['Life', 'Health', 'Term', 'ULIP', 'Vehicle', 'Other'],
      required: true,
    },
    policyNumber: { type: String, default: '' },
    sumAssured: { type: Number, default: 0 },
    annualPremium: { type: Number, default: 0 },
    startDate: { type: String, required: true },
    maturityDate: { type: String, required: true },
    premiumDueDate: { type: String, default: '' },
    nominee: { type: String, default: '' },
    createdAt: { type: String, required: true },
    history: { type: [mongoose.Schema.Types.Mixed], default: [] },
  },
  {
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id?.toString?.() ?? ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Insurance = mongoose.model('Insurance', insuranceSchema);
