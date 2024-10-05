// Import necessary modules
const { google } = require('googleapis');
const { OAuth2 } = google.auth;
const express = require('express');
const router = express.Router();
const cron = require('node-cron');
const fs = require('fs');

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

// Load the previously saved Google Sheets data from a file
const loadPreviousData = () => {
    try {
        const data = fs.readFileSync('previousData.json', 'utf8'); // File where previous data is stored
        return JSON.parse(data); // Return parsed JSON data
    } catch (error) {
        console.error('Error loading previous data:', error);
        return []; // Return empty array if no previous data exists
    }
};

// Save the new Google Sheets data to a file
const saveNewData = (newData) => {
    try {
        fs.writeFileSync('previousData.json', JSON.stringify(newData, null, 2)); // Save data to file
        console.log('New data saved successfully.');
    } catch (error) {
        console.error('Error saving new data:', error);
    }
};

// Compare old and new data to detect changes
const compareData = (oldData, newData) => {
    const changes = [];

    const dateRow = newData[2]; // Row 3 contains the dates, array index 2 since rows are zero-indexed.

    // Compare oldData and newData cell by cell
    newData.forEach((newRow, rowIndex) => {
        if (rowIndex > 2) { // Skip the first three rows, where row 3 (dates) is included
            newRow.forEach((newCell, colIndex) => {
                const oldCell = (oldData[rowIndex] && oldData[rowIndex][colIndex]) || ''; // Get old cell value or empty if undefined
                if (newCell !== oldCell) {
                    const date = dateRow[colIndex]; // Get the date from row 3 at the same column index
                    changes.push({
                        row: rowIndex + 1, // Excel/Sheets is 1-indexed
                        column: colIndex + 1,
                        oldValue: oldCell,
                        newValue: newCell,
                        date: date, // Corresponding date from row 3
                    });
                }
            });
        }
    });

    return changes;
};

// Function to periodically fetch and compare the data
const fetchAndCompareData = async () => {
    try {
        const spreadsheetId = '1iOwYexBNqsdW3mTzeTHkKerC77y-h0dLHGSCqWBN82c';
        const range = 'Hybrid Plan!A1:JF126';

        // Fetch new data from Google Sheets
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range,
        });

        const newData = response.data.values || [];
        const oldData = loadPreviousData();  // Load previous data from file

        const changes = compareData(oldData, newData); // Compare old and new data

        // Log changes
        if (changes.length > 0) {
            console.log('Detected changes:', changes);
        } else {
            console.log('No changes detected.');
        }

        // Save new data for future comparisons
        saveNewData(newData);  // Save new data to file
    } catch (error) {
        console.error('Error fetching schedule:', error);
    }
};

// Schedule the fetch every minute
cron.schedule('* * * * *', () => {
    console.log('Fetching schedule data every minute...');
    fetchAndCompareData(); // Call the async function within the cron job
});

module.exports = router;
