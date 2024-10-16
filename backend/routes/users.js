const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db'); // Ensure this points to your db connection
const router = express.Router();
require('dotenv').config();
const pool = require('../db'); // Assuming pool is defined in 'db.js'

router.options('/login', (req, res) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.sendStatus(204); // No content
});

// Register a new user
router.post('/register', async (req, res) => {
    const { username, email, password, title } = req.body;

    // Check if the user already exists
    const userExists = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
        return res.status(400).json({ message: 'User already exists' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    try {
        // Insert the new user into the database
        const result = await db.query(
            'INSERT INTO users (username, email, password_hash, title) VALUES ($1, $2, $3, $4) RETURNING *',
            [username, email, password_hash, title]
        );

        // Create a JWT token for authentication
        const token = jwt.sign({ userId: result.rows[0].id }, process.env.JWT_SECRET, {
            expiresIn: '1h',
        });

        res.status(201).json({ token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Test DB connection in the users.js route
router.get('/test-connection', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({ success: true, message: 'Connection successful', time: result.rows[0].now });
    } catch (err) {
        console.error('Error testing connection:', err);
        res.status(500).json({ success: false, message: 'Error connecting to the database' });
    }
});


// User login
router.post('/login', async (req, res) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
   
    const { email, password } = req.body;

    try {
        // Check if the user exists
        const user = await db.query('SELECT * FROM users WHERE email = $1', [email]);

        if (user.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Compare the entered password with the hashed password
        const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);
        if (!validPassword) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Create a JWT token
        const token = jwt.sign({ userId: user.rows[0].id }, process.env.JWT_SECRET, {
            expiresIn: '1h',
        });

        // Send the token with a 200 status code
        return res.status(200).json({ token }); // <-- Added 200 status code
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
