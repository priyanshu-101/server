import express from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

export const usersRouter = express.Router();

// Signup endpoint
usersRouter.post('/signup', async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Create new user
    const user = new User({ name, email, password });
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      user: user.toJSON(),
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Signup failed' });
  }
});

// Get current user profile (protected)
usersRouter.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user.toJSON());
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Failed to fetch profile' });
  }
});

// Edit user profile (protected)
usersRouter.put('/edit', authenticateToken, async (req, res) => {
  try {
    const { name, email } = req.body;

    // Validation
    if (!name && !email) {
      return res.status(400).json({ error: 'At least one field (name or email) is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update name if provided
    if (name && name.trim()) {
      user.name = name.trim();
    }

    // Check if email is already taken (if changed)
    if (email && email.trim()) {
      const emailLower = email.toLowerCase().trim();
      if (emailLower !== user.email.toLowerCase()) {
        const existingUser = await User.findOne({ email: emailLower });
        if (existingUser) {
          return res.status(409).json({ error: 'Email already in use' });
        }
        user.email = emailLower;
      }
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: user.toJSON(),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Failed to update profile' });
  }
});

// Change password (protected)
usersRouter.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'New passwords do not match' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isPasswordCorrect = await user.comparePassword(currentPassword);
    if (!isPasswordCorrect) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    user.updatedAt = new Date();
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Failed to change password' });
  }
});

// Logout endpoint (protected) - simply invalidates token on client side
usersRouter.post('/logout', authenticateToken, (req, res) => {
  try {
    // Token invalidation is handled on client-side
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Logout failed' });
  }
});

// Login endpoint
usersRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      user: user.toJSON(),
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Login failed' });
  }
});
