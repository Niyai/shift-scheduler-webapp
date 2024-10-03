const express = require('express');
const { google } = require('googleapis');
const { OAuth2 } = google.auth;
const dotenv = require('dotenv');

dotenv.config();

const router = express.Router();

const oauth2Client = new OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:5000/auth/callback'
);

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

// Route to start Google OAuth process
router.get('/login', (req, res) => {
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    res.redirect(authUrl);
});

// Route to handle OAuth callback
router.get('/auth/callback', async (req, res) => {
    const { code } = req.query;
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    res.send('Google Sheets API authentication successful!');
});

module.exports = router;
