const express = require('express');
const router = express.Router();
const { google } = require('googleapis'); // Ensure you've configured the Google Sheets API
const { OAuth2 } = google.auth;
const fs = require('fs');

// Assuming you have setup the Google Sheets API connection already
// OAuth2 Setup
const oauth2Client = new OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

// Function to fetch data from Google Sheets
const sheets = google.sheets({ version: 'v4', auth: oauth2Client });


router.get('/', async (req, res) => {
  try {
    // You would replace the spreadsheetId and range with your actual data
   const spreadsheetId = '1iOwYexBNqsdW3mTzeTHkKerC77y-h0dLHGSCqWBN82c'; // Replace with your Spreadsheet ID
   const range = 'Hybrid Plan!A1:JF126';

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
      auth: req.authClient, // Ensure authClient is set up for Google Sheets API
    });

    const rows = response.data.values;

    if (rows.length === 0) {
      return res.status(404).json({ message: 'No agents found' });
    }

    const agents = rows.map((row) => ({
      name: row[5], // Assuming first column contains agent names
    }));

    res.json(agents);
  } catch (error) {
    console.error('Error fetching agents:', error);
    res.status(500).json({ message: 'Error fetching agents' });
  }
});

module.exports = router;

