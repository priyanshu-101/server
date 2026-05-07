import mongoose from 'mongoose';

const historyEntrySchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    amount: Number,
    rate: Number,
    startDate: String,
    maturityDate: String,
    fdType: String,
    updatedAt: String,
  },
  { _id: false }
);

const fdSchema = new mongoose.Schema(
  {
    parentId: { type: String },
    bank: { type: String, required: true },
    holder: { type: String, default: '' },
    amount: { type: Number, required: true },
    rate: { type: Number, required: true },
    startDate: { type: String, required: true },
    maturityDate: { type: String, required: true },
    fdType: { type: String, enum: ['Cumulative', 'Non-Cumulative'], required: true },
    nominee: { type: String, default: '' },
    fdNumber: { type: String, default: '' },
    createdAt: { type: String, required: true },
    history: { type: [historyEntrySchema], default: [] },
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

export const FD = mongoose.model('FD', fdSchema);
