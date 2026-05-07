import { Router } from 'express';
import mongoose from 'mongoose';
import { Insurance } from '../models/Insurance.js';

export const insurancesRouter = Router();

function buildInsuranceSelector(idOrPolicyNumber) {
  const value = String(idOrPolicyNumber ?? '').trim();
  if (!value) return null;
  if (mongoose.isValidObjectId(value)) {
    return { $or: [{ _id: value }, { policyNumber: value }] };
  }
  return { policyNumber: value };
}

insurancesRouter.get('/', async (_req, res, next) => {
  try {
    const docs = await Insurance.find().sort({ createdAt: -1 }).lean();
    const data = docs.map((d) => {
      d.id = d._id?.toString?.() ?? d._id;
      delete d._id;
      delete d.__v;
      return d;
    });
    res.json(data);
  } catch (e) {
    next(e);
  }
});

insurancesRouter.post('/', async (req, res, next) => {
  try {
    const body = req.body;
    if (!body?.name || !body?.company) {
      return res.status(400).json({ error: 'name and company are required' });
    }
    const { id: _ignored, parentId: _ignoredParent, ...sanitized } = body ?? {};
    const ins = await Insurance.create(sanitized);
    res.status(201).json(ins.toJSON());
  } catch (e) {
    next(e);
  }
});

insurancesRouter.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const selector = buildInsuranceSelector(id);
    if (!selector) return res.status(400).json({ error: 'id is required' });
    const updates = { ...req.body };
    delete updates.id;
    delete updates.parentId;
    const ins = await Insurance.findOneAndUpdate(selector, { $set: updates }, { new: true, runValidators: true });
    if (!ins) return res.status(404).json({ error: 'Insurance not found' });
    res.json(ins.toJSON());
  } catch (e) {
    next(e);
  }
});

insurancesRouter.delete('/:id', async (req, res, next) => {
  try {
    const selector = buildInsuranceSelector(req.params.id);
    if (!selector) return res.status(400).json({ error: 'id is required' });
    const r = await Insurance.deleteOne(selector);
    if (r.deletedCount === 0) return res.status(404).json({ error: 'Insurance not found' });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});
