import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/postgres.js';
import { config } from '../config/env.js';

export async function register(req, res) {
  try {
    const { name, email, password, preferred_language = 'en', role = 'customer' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: 'Name, email, and password are required',
        errorKn: 'ಹೆಸರು, ಇಮೇಲ್ ಮತ್ತು ಪಾಸ್‌ವರ್ಡ್ ಕಡ್ಡಾಯವಾಗಿದೆ',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (existing.rows.length > 0) {
      return res.status(400).json({
        error: 'Email already registered',
        errorKn: 'ಈ ಇಮೇಲ್ ಈಗಾಗಲೇ ನೋಂದಾಯಿಸಲ್ಪಟ್ಟಿದೆ',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userId = uuidv4();

    await query(
      'INSERT INTO users (id, name, email, password_hash, role, preferred_language) VALUES ($1, $2, $3, $4, $5, $6)',
      [userId, name, normalizedEmail, passwordHash, role, preferred_language]
    );

    const token = jwt.sign(
      { id: userId, email: normalizedEmail, role, preferred_language },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    res.status(201).json({
      message: 'Registration successful',
      messageKn: 'ನೋಂದಣಿ ಯಶಸ್ವಿಯಾಗಿದೆ',
      token,
      user: {
        id: userId,
        name,
        email: normalizedEmail,
        role,
        preferred_language,
      }
    });
  } catch (err) {
    console.error('[Auth] Register error:', err);
    res.status(500).json({
      error: 'Failed to register account',
      errorKn: 'ಖಾತೆ ನೋಂದಾಯಿಸಲು ವಿಫಲವಾಗಿದೆ',
    });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
        errorKn: 'ಇಮೇಲ್ ಮತ್ತು ಪಾಸ್‌ವರ್ಡ್ ಕಡ್ಡಾಯವಾಗಿದೆ',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const result = await query('SELECT * FROM users WHERE email = $1', [normalizedEmail]);

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Invalid credentials',
        errorKn: 'ಅಮಾನ್ಯ ಇಮೇಲ್ ಅಥವಾ ಪಾಸ್‌ವರ್ಡ್',
      });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        error: 'Invalid credentials',
        errorKn: 'ಅಮಾನ್ಯ ಇಮೇಲ್ ಅಥವಾ ಪಾಸ್‌ವರ್ಡ್',
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, preferred_language: user.preferred_language },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    res.json({
      message: 'Login successful',
      messageKn: 'ಲಾಗಿನ್ ಯಶಸ್ವಿಯಾಗಿದೆ',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        preferred_language: user.preferred_language,
      }
    });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    res.status(500).json({
      error: 'Login failed',
      errorKn: 'ಲಾಗಿನ್ ಪ್ರಕ್ರಿಯೆ ವಿಫಲವಾಗಿದೆ',
    });
  }
}

export async function getProfile(req, res) {
  try {
    const result = await query('SELECT id, name, email, role, preferred_language, created_at FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found', errorKn: 'ಬಳಕೆದಾರರು ಕಂಡುಬಂದಿಲ್ಲ' });
    }
    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

export async function updateLanguage(req, res) {
  try {
    const { preferred_language } = req.body;
    if (!preferred_language || !['en', 'kn'].includes(preferred_language)) {
      return res.status(400).json({ error: 'Invalid language. Choose en or kn' });
    }

    await query('UPDATE users SET preferred_language = $1 WHERE id = $2', [preferred_language, req.user.id]);
    res.json({
      message: 'Language preference saved',
      messageKn: 'ಭಾಷೆಯ ಆದ್ಯತೆ ಉಳಿಸಲಾಗಿದೆ',
      preferred_language,
    });
  } catch (err) {
    res.status(500).json({ error: 'Could not update language preference' });
  }
}
