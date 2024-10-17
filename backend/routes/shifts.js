const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const { OAuth2 } = google.auth;
const fs = require('fs');
const db = require('../db');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Helper to send email
const sendNotificationEmail = async (to, subject, text) => {
  const mailOptions = {
    from: process.env.EMAIL_USERNAME,
    to,
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

const fetchDataFromSheet = async () => {
  const spreadsheetId = '1iOwYexBNqsdW3mTzeTHkKerC77y-h0dLHGSCqWBN82c'; // Replace with your Spreadsheet ID
  const range = 'Hybrid Plan!A1:JF126'; 
  
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

const parseDate = (dayMonthString) => {
    // Assuming the date string is in the format '21-Oct'
    const [day, month] = dayMonthString.split('-');
    const currentYear = new Date().getFullYear();
    
    // We assume the shift schedule starts in 2024, and wrap around to 2025 after December
    let year = 2024; // Default year
    const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Find the index of the month (0-based) and adjust year based on if we have wrapped to 2025
    const monthIndex = monthOrder.indexOf(month);
    if (monthIndex === -1) {
        throw new Error('Invalid month format');
    }

    // If we are in January after having passed December (e.g., shifts start at December then go to January)
    if (monthIndex < monthOrder.indexOf('Jan')) {
        year = 2025; // Shift happens next year if we are past December
    }

    // Construct a proper date
    return new Date(`${year}-${month}-${day}`);
};

const isAgentOnLeave = async (agentName, dateString) => {
    try {
        // Convert '21-Oct' to a proper Date object formatted as 'YYYY-MM-DD'
        const date = parseDate(dateString);

        // Format it to 'YYYY-MM-DD' to match database format
        const formattedDate = date.toISOString().split('T')[0]; // Extract just the date part

        // Query the database to check if the agent is on leave for the given date
        const query = `
            SELECT * 
            FROM leave_requests 
            WHERE agent_name = $1 
              AND ($2 >= start_date AND $2 <= end_date)
        `;
        const result = await db.query(query, [agentName, formattedDate]);

        return result.rows.length > 0;  // Return true if there's any matching row
    } catch (err) {
        console.error('Error checking if agent is on leave', err);
        throw err;
    }
};

// Team Strength Calculation (Excludes agents on leave)
const calculateTeamStrengthFromSheet = async (sheetData, hour, date) => {
  const shiftStartColumn = 14; 
  const dateRow = sheetData[2];
  const shiftDataStartRow = 4; 
  const channelColumnIndex = 10; 

  const dateColumnIndex = dateRow.findIndex((d) => d === date);
  if (dateColumnIndex === -1) {
    throw new Error('Date not found in the sheet');
  }

  let totalAgents = 0;
  const channelStrength = {};

  for (let rowIndex = shiftDataStartRow; rowIndex < sheetData.length; rowIndex++) {
    const row = sheetData[rowIndex];
    const agentName = row[5];  // Assuming agent name is in column F (index 5)
    const shiftType = row[dateColumnIndex];
    const channel = row[channelColumnIndex];

    // Check if the agent is on leave for the given date
    const onLeave = await isAgentOnLeave(agentName, date);
    if (onLeave) {
      continue;  // Skip this agent if they are on leave
    }

    const shiftHours = getShiftHours(shiftType);
    if (shiftHours && hour >= shiftHours.start && hour <= shiftHours.end) {
      totalAgents++;

      if (!channelStrength[channel]) {
        channelStrength[channel] = 0;
      }
      channelStrength[channel]++;
    }
  }

  return { totalAgents, channelStrength };
};

// Get shift hours
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
      return { start: 19.5, end: 7.5 }; 
    default:
      return null;
  }
};

// Route to calculate team strength per channel
router.get('/team-strength', async (req, res) => {
  const { date, hour } = req.query;
  
  if (!date || !hour) {
    return res.status(400).json({ message: 'Date and hour must be provided' });
  }

  try {
    const sheetData = await fetchDataFromSheet();
    const { totalAgents, channelStrength } = await calculateTeamStrengthFromSheet(sheetData, parseInt(hour, 10), date);

    res.json({ date, hour, totalAgents, channelStrength });
  } catch (error) {
    console.error('Error calculating team strength:', error);
    res.status(500).json({ message: 'Error calculating team strength' });
  }
});

// Log Changes to Shift with Leave Check
const logChange = async ({ agentName, changeType, changeDetails, shiftDate, userEmail }) => {
  const onLeave = await isAgentOnLeave(agentName, shiftDate);

  let detail = changeDetails;
  if (onLeave) {
    detail = `Notification not sent; ${agentName} is already scheduled to go on leave on ${shiftDate}`;
  }

  const query = `
    INSERT INTO logs (agent_name, change_type, change_details, timestamp, email_status, notification_sent)
    VALUES ($1, $2, $3, CURRENT_TIMESTAMP, 'Not Sent', false)
    RETURNING id
  `;
  const values = [agentName, changeType, detail];

  try {
    const result = await db.query(query, values); 
    const logId = result.rows[0].id;

    if (!onLeave) {
      const emailSubject = `Shift Change Notification for ${agentName}`;
      const emailBody = `
        ${detail}
        \nPlease click on the following link to view the updated schedule: https://docs.google.com/spreadsheets/d/1iOwYexBNqsdW3mTzeTHkKerC77y-h0dLHGSCqWBN82c
      `;

      await sendNotificationEmail(userEmail, emailSubject, emailBody);
      await db.query('UPDATE logs SET email_status = $1, notification_sent = true WHERE id = $2', ['Sent', logId]);
    }

    console.log('Change logged and notification sent.');
  } catch (error) {
    console.error('Error logging change or sending email:', error);
  }
};

// Route to log shift changes
router.post('/sheets/log', async (req, res) => {
  const { changes } = req.body;
  const changeDetails = [];

  try {
    const sheetData = await fetchDataFromSheet();
    const dateRow = sheetData[2]; 

    for (const change of changes) {
      const { row, column, newValue } = change;
      const agentName = sheetData[row - 1][5]; 
      const userEmail = sheetData[row - 1][6]; 
      const date = dateRow[column - 1];

      const changeType = column >= 14 ? 'shift' : sheetData[3][column - 1]; 

      const detail = `Shift Change Made: ${agentName} is now scheduled to work ${newValue} shift on ${date}`;
      changeDetails.push({ agentName, changeType, detail, userEmail });

      await logChange({
        agentName,
        changeType,
        changeDetails: detail,
        shiftDate: date,
        userEmail
      });
    }

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
