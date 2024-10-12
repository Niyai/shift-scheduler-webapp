const express = require('express');
const router = express.Router();
const { google } = require('googleapis'); // Import the Google APIs
const { OAuth2 } = google.auth;
const fs = require('fs');
const db = require('../db');

// Set up OAuth2 Client
const oauth2Client = new OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Set the refresh token
oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

// Log changes function (now tracks changes to shifts, including agent name)
const logChange = async ({ agentName, changeType, changeDetails, shiftDate, emailStatus = 'Not Sent', notificationSent = false }) => {
    const query = `
        INSERT INTO logs (agent_name, change_type, change_details, timestamp, email_status, notification_sent)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4, $5)
    `;
    const values = [agentName, changeType, changeDetails, emailStatus, notificationSent];
    await db.query(query, values);
};

// Initialize Google Sheets API with OAuth2 client as auth
const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

// Helper function to load and parse existing sheet data
const fetchDataFromSheet = async () => {
  const spreadsheetId = '1iOwYexBNqsdW3mTzeTHkKerC77y-h0dLHGSCqWBN82c'; // Replace with your Spreadsheet ID
  const range = 'Hybrid Plan!A1:JF126'; // Define the range of data to fetch
  
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    return response.data.values; // Return fetched data from the sheet
  } catch (error) {
    console.error('Error fetching data from Google Sheet:', error);
    throw new Error('Could not fetch data from Google Sheet');
  }
};

// Helper function to calculate shift strength from sheet data
const calculateTeamStrengthFromSheet = (sheetData, hour, date) => {
  const shiftStartColumn = 14; // Assuming shift starts at column O (14th index)
  const dateRow = sheetData[2]; // Assuming dates are in row 3 (index 2)
  const shiftDataStartRow = 4; // Assuming shifts start at row 5 (index 4)

  // Find the column that matches the provided date
  const dateColumnIndex = dateRow.findIndex((d) => d === date);
  if (dateColumnIndex === -1) {
    throw new Error('Date not found in the sheet');
  }

  let agentCount = 0;
  // Check all rows (agents) for their shift timing
  for (let rowIndex = shiftDataStartRow; rowIndex < sheetData.length; rowIndex++) {
    const row = sheetData[rowIndex];
    const shiftType = row[dateColumnIndex];

    // Check if the agent's shift overlaps with the provided hour
    const shiftHours = getShiftHours(shiftType);
    if (shiftHours && hour >= shiftHours.start && hour <= shiftHours.end) {
      agentCount++;
    }
  }

  return agentCount;
};

// Helper function to get shift hours based on the shift type
const getShiftHours = (shiftType) => {
  switch (shiftType) {
    case 'MH':
      return { start: 7, end: 16 };
    case 'M':
      return { start: 8, end: 17 };
    case 'A':
      return { start: 10, end: 19 };
    case 'AH':
      return { start: 12, end: 21 };
    case 'N':
      return { start: 19.5, end: 7.5 }; // Night shift overlaps into the next day
    default:
      return null;
  }
};

// Route to calculate team strength
router.get('/team-strength', async (req, res) => {
  const { date, hour } = req.query;
  
  if (!date || !hour) {
    return res.status(400).json({ message: 'Date and hour must be provided' });
  }

  try {
    const sheetData = await fetchDataFromSheet(); // Fetch the sheet data
    const teamStrength = calculateTeamStrengthFromSheet(sheetData, parseInt(hour, 10), date);
    res.json({ date, hour, teamStrength });
  } catch (error) {
    console.error('Error calculating team strength:', error);
    res.status(500).json({ message: 'Error calculating team strength' });
  }
});

// Log changes to the shift (based on Google Sheet changes)
router.post('/sheets/log', async (req, res) => {
  const { changes } = req.body;
  const changeDetails = [];

  try {
    const sheetData = await fetchDataFromSheet();
    const dateRow = sheetData[2]; // Assuming row 3 contains the dates

    changes.forEach((change) => {
      const { row, column, newValue } = change;
      const agentName = sheetData[row - 1][5]; // Assuming agent names are in column F
      const date = dateRow[column - 1];

      // Determine the change type based on the column
      const changeType = column >= 14 ? 'shift' : sheetData[3][column - 1]; // Row 4 has headers for other columns

      const detail = `Shift Change Made: ${agentName} is now scheduled to work ${newValue} shift on ${date}`;
      changeDetails.push({ agentName, changeType, detail });
    });

    // Log changes to the database (implement this if you still want DB logging)
    for (const detail of changeDetails) {
      await logChange({
        userId: null, // Optional: ID of the user making changes if available
        changeType: detail.changeType,
        changeDetails: detail.detail,
        shiftDate: new Date(), // Assuming the change happened now
      });
    }

    res.status(201).json({ message: 'Changes logged successfully', changes: changeDetails });
  } catch (error) {
    console.error('Error logging changes:', error);
    res.status(500).json({ message: 'Error logging changes' });
  }
});

// Route to fetch all logged changes
router.get('/shifts/log', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM logs ORDER BY timestamp DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ message: 'Error fetching logs' });
  }
});

module.exports = router;
