const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const userRoutes = require('./routes/users');
const { Pool } = require('pg');

dotenv.config(); // Load environment variables from .env file

const app = express();
app.use(bodyParser.json());
app.use('/api/users', userRoutes);
const PORT = process.env.PORT || 5000;
app.use('/api/users', require('./routes/users'));
app.use('/api/shifts', require('./routes/shifts'));

// Middleware
app.use(cors());
app.use(express.json());

// Sample route to test server
app.get('/', (req, res) => {
    res.send('Server is running!');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Add authRoutes
const authRoutes = require('./routes/auth');
app.use(authRoutes);

// Importing the routes from routes/sheets.js
const sheetsRoutes = require('./routes/sheets');

// Set up the '/sheets' endpoint prefix for your sheet routes
app.use('/sheets', sheetsRoutes);

// PostgreSQL connection setup
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://myuser:mypassword@localhost:5432/shift_scheduler',
});

// Test connection endpoint
app.get('/api/testconnection', async (req, res) => {
    try {
        await pool.connect();
        res.status(200).json({ message: 'Connected to the database' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// User registration endpoint
app.post('/api/users/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query('INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *', [username, password]);
        res.status(201).json({ user: result.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
