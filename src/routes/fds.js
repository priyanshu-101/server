import { Router } from 'express';
import mongoose from 'mongoose';
import { FD } from '../models/FD.js';

export const fdsRouter = Router();

function buildFdSelector(idOrFdNumber) {
  const value = String(idOrFdNumber ?? '').trim();
  if (!value) return null;
  if (mongoose.isValidObjectId(value)) {
    return { $or: [{ _id: value }, { fdNumber: value }] };
  }
  return { fdNumber: value };
}

fdsRouter.get('/', async (_req, res, next) => {
  try {
    const docs = await FD.find().sort({ createdAt: -1 }).lean();
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

fdsRouter.post('/', async (req, res, next) => {
  try {
    const body = req.body;
    if (!body?.bank) {
      return res.status(400).json({ error: 'bank is required' });
    }
    const { id: _ignored, ...sanitized } = body ?? {};
    const fd = await FD.create(sanitized);
    res.status(201).json(fd.toJSON());
  } catch (e) {
    next(e);
  }
});

fdsRouter.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const selector = buildFdSelector(id);
    if (!selector) return res.status(400).json({ error: 'id is required' });
    const updates = { ...req.body };
    delete updates.id;
    const fd = await FD.findOneAndUpdate(selector, { $set: updates }, { new: true, runValidators: true });
    if (!fd) return res.status(404).json({ error: 'FD not found' });
    res.json(fd.toJSON());
  } catch (e) {
    next(e);
  }
});

fdsRouter.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const selector = buildFdSelector(id);
    if (!selector) return res.status(400).json({ error: 'id is required' });
    const r = await FD.deleteOne(selector);
    if (r.deletedCount === 0) return res.status(404).json({ error: 'FD not found' });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});
