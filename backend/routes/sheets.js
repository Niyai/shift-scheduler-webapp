// Import necessary modules
const { google } = require('googleapis');
const { OAuth2 } = google.auth;
const express = require('express');
const router = express.Router(); // <-- Define the router
require('dotenv').config(); // To use environment variables from .env file

// Create an OAuth2 client with your credentials
const oauth2Client = new OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Set the refresh token to keep the session active
oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,  // Your refresh token from .env
});

// Initialize Google Sheets API with OAuth2 client as auth
const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

// Route to fetch schedule data
router.get('/schedule', async (req, res) => {
    try {
        const spreadsheetId = '1iOwYexBNqsdW3mTzeTHkKerC77y-h0dLHGSCqWBN82c'; // Your actual spreadsheet ID
        const range = 'Hybrid Plan!A1:JF126'; // Define the range of data to fetch

        // Fetch the schedule data
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range,
        });

        res.json(response.data.values); // Return the fetched data as JSON
    } catch (error) {
        console.error('Error fetching schedule:', error);
        res.status(500).send('Error fetching schedule');
    }
});

module.exports = router;
