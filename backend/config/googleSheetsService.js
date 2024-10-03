const { google } = require('googleapis');
const { OAuth2 } = google.auth;
const dotenv = require('dotenv');

dotenv.config(); // Load environment variables

// Setup OAuth2 client
const oauth2Client = new OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:5000'
);

// Get Google Sheets instance
const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

// Export the Google Sheets instance for use in routes
module.exports = sheets;
