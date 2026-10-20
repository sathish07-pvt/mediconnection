const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

exports.login = async (req, res) => {
  try {
    const { id, password } = req.body;
    // id could be email or user_id
    const query = 'SELECT * FROM users WHERE user_id = ? OR email = ?';
    const connection = await db.getConnection();
    const [users] = await connection.query(query, [id, id]);
    connection.release();

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const payload = {
      user: {
        id: user.id,
        user_id: user.user_id,
        role: user.role,
        name: user.name
      }
    };

    jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '5d' }, (err, token) => {
      if (err) throw err;
      res.json({ token, user: payload.user });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error. Please ensure MySQL is configured correctly in backend/.env' });
  }
};

exports.forgotPassword = async (req, res) => {
  // Mock forgot password flow
  const { email } = req.body;
  console.log(`Sending reset token to ${email}`);
  res.json({ message: 'Password reset link sent to email (Development Mode: Check console)' });
};

exports.getMe = async (req, res) => {
  // Requires auth middleware to extract user from token
  res.json(req.user);
};
