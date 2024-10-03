const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config(); // Load environment variables from .env file

const app = express();
const PORT = process.env.PORT || 5000;

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
