const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const userRoutes = require('./routes/users');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const leaveRoutes = require('./routes/leave');
dotenv.config(); // Load environment variables from .env file
const agentRoutes = require('./routes/agents');

const app = express();
app.use(bodyParser.json());

// Enable CORS before your route definitions
const corsOptions = {
    origin: 'http://localhost:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204,
};
app.use(cors(corsOptions));
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Add routes
app.use('/api/users', userRoutes);
app.use('/api/shifts', require('./routes/shifts'));
app.use('/api/leave', leaveRoutes);
app.use('/api/agents', agentRoutes);

// Sample route to test server
app.get('/', (req, res) => {
    res.send('Server is running!');
});

// Protected route example
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) {
        return res.status(403).json({ message: 'No token provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Failed to authenticate token' });
        }
        req.userId = decoded.id;
        next();
    });
};

app.get('/protected/data', verifyToken, (req, res) => {
    res.json({ message: 'This is protected data', userId: req.userId });
});

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
