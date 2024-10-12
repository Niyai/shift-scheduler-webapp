const express = require('express');
const router = express.Router();
const { google } = require('googleapis'); // Import the Google APIs
const { OAuth2 } = google.auth;
const fs = require('fs');
const db = require('../db');
const nodemailer = require('nodemailer');
// Configure transporter for email notifications
const transporter = nodemailer.createTransport({
  service: 'gmail', // Or use another service like SendGrid or Mailgun
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Function to send email
const sendNotificationEmail = async (to, subject, text) => {
  const mailOptions = {
    from: process.env.EMAIL_USERNAME,
    to, // recipient's email
    subject,
    text
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent to:', to);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

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
const logChange = async ({ agentName, changeType, changeDetails, shiftDate, userEmail }) => {
    const query = `
        INSERT INTO logs (agent_name, change_type, change_details, timestamp, email_status, notification_sent)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP, 'Not Sent', false)
        RETURNING id
    `;
    const values = [agentName, changeType, changeDetails];

    try {
        const result = await db.query(query, values); // Log the change in the database
        const logId = result.rows[0].id;  // Get the log entry ID

        // Send email notification
        const emailSubject = `Shift Change Notification for ${agentName}`;
        const emailBody = `
            ${changeDetails}
            \nPlease click on the following link to view the updated schedule: https://docs.google.com/spreadsheets/d/1iOwYexBNqsdW3mTzeTHkKerC77y-h0dLHGSCqWBN82c
        `;

        await sendNotificationEmail(userEmail, emailSubject, emailBody);

        // Update log entry with email status
        await db.query('UPDATE logs SET email_status = $1, notification_sent = true WHERE id = $2', ['Sent', logId]);

        console.log('Change logged and notification sent.');
    } catch (error) {
        console.error('Error logging change or sending email:', error);
    }
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

const calculateTeamStrengthFromSheet = (sheetData, hour, date) => {
  const shiftStartColumn = 14; // Assuming shift starts at column O (14th index)
  const dateRow = sheetData[2]; // Assuming dates are in row 3 (index 2)
  const shiftDataStartRow = 4; // Assuming shifts start at row 5 (index 4)
  const channelColumnIndex = 10; // Channel is in column K (index 10)

  // Find the column that matches the provided date
  const dateColumnIndex = dateRow.findIndex((d) => d === date);
  if (dateColumnIndex === -1) {
    throw new Error('Date not found in the sheet');
  }

  let totalAgents = 0;
  const channelStrength = {}; // To store count per channel

  // Check all rows (agents) for their shift timing
  for (let rowIndex = shiftDataStartRow; rowIndex < sheetData.length; rowIndex++) {
    const row = sheetData[rowIndex];
    const shiftType = row[dateColumnIndex];
    const channel = row[channelColumnIndex]; // Fetch the channel for the agent

    // Check if the agent's shift overlaps with the provided hour
    const shiftHours = getShiftHours(shiftType);
    if (shiftHours && hour >= shiftHours.start && hour <= shiftHours.end) {
      totalAgents++;

      // Increment agent count for the corresponding channel
      if (!channelStrength[channel]) {
        channelStrength[channel] = 0;
      }
      channelStrength[channel]++;
    }
  }

  return { totalAgents, channelStrength };
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
// Route to calculate team strength per channel
router.get('/team-strength', async (req, res) => {
  const { date, hour } = req.query;
  
  if (!date || !hour) {
    return res.status(400).json({ message: 'Date and hour must be provided' });
  }

  try {
    const sheetData = await fetchDataFromSheet(); // Fetch the sheet data
    const { totalAgents, channelStrength } = calculateTeamStrengthFromSheet(sheetData, parseInt(hour, 10), date);

    res.json({ date, hour, totalAgents, channelStrength });
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
      const agentName = sheetData[row - 1][5]; // Column F for agent names
      const userEmail = sheetData[row - 1][6]; // Column G for agent email addresses
      const date = dateRow[column - 1];

      // Determine the change type based on the column
      const changeType = column >= 14 ? 'shift' : sheetData[3][column - 1]; // Row 4 has headers for other columns

      const detail = `Shift Change Made: ${agentName} is now scheduled to work ${newValue} shift on ${date}`;
      changeDetails.push({ agentName, changeType, detail, userEmail });

      // Log changes and send email notifications
      logChange({
        agentName,
        changeType,
        changeDetails: detail,
        shiftDate: new Date(),
        userEmail // Pass the email address
      });
    });

    res.status(201).json({ message: 'Changes logged and notifications sent successfully', changes: changeDetails });
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
