const express = require('express');
const router = express.Router();
const db = require('../db'); // Assuming you have a database connection setup
const nodemailer = require('nodemailer');
const fs = require('fs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Add Leave Request
router.post('/', async (req, res) => {
  const { agentName, leaveType, startDate, endDate } = req.body;

  if (!agentName || !leaveType || !startDate || !endDate) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const query = `
      INSERT INTO leave_requests (agent_name, leave_type, start_date, end_date, status)
      VALUES ($1, $2, $3, $4, 'pending') RETURNING *
    `;
    const values = [agentName, leaveType, startDate, endDate];

    const result = await db.query(query, values);
    const leaveRequest = result.rows[0];

    // Optionally: Notify manager via email about the new leave request
    res.status(201).json({ message: 'Leave request submitted successfully', leaveRequest });
  } catch (error) {
    console.error('Error submitting leave request:', error);
    res.status(500).json({ message: 'Error submitting leave request' });
  }
});

// Get Leave Requests
router.get('/', async (req, res) => {
  const { agentName, status } = req.query;

  // Start with a base query to fetch all leave requests
  let query = 'SELECT * FROM leave_requests WHERE 1=1';
  const values = [];

  // If agentName is provided, filter by agentName
  if (agentName) {
    query += ' AND agent_name = $1';
    values.push(agentName);
  }

  // Only filter by status if it's not 'all'
  if (status && status !== 'all') {
    query += values.length ? ' AND status = $2' : ' AND status = $1';
    values.push(status);
  }

  try {
    const result = await db.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error('Error retrieving leave requests:', error);
    res.status(500).json({ message: 'Error retrieving leave requests' });
  }
});

// Update Leave Request
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { leaveType, startDate, endDate, status } = req.body;

  if (!leaveType || !startDate || !endDate) {
    return res.status(400).json({ message: 'Leave type, start date, and end date are required' });
  }

  try {
    const query = `
      UPDATE leave_requests
      SET leave_type = $1, start_date = $2, end_date = $3, status = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5 RETURNING *
    `;
    const values = [leaveType, startDate, endDate, status || 'pending', id];

    const result = await db.query(query, values);
    const updatedRequest = result.rows[0];

    if (!updatedRequest) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    res.json({ message: 'Leave request updated successfully', updatedRequest });
  } catch (error) {
    console.error('Error updating leave request:', error);
    res.status(500).json({ message: 'Error updating leave request' });
  }
});

// Delete Leave Request
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const query = 'DELETE FROM leave_requests WHERE id = $1 RETURNING *';
    const values = [id];

    const result = await db.query(query, values);
    const deletedRequest = result.rows[0];

    if (!deletedRequest) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    res.json({ message: 'Leave request deleted successfully', deletedRequest });
  } catch (error) {
    console.error('Error deleting leave request:', error);
    res.status(500).json({ message: 'Error deleting leave request' });
  }
});

// Approve Leave Request
router.put('/:id/approve', async (req, res) => {
  const { id } = req.params;

  try {
    const query = `
      UPDATE leave_requests
      SET status = 'approved', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 RETURNING *
    `;
    const values = [id];

    const result = await db.query(query, values);
    const approvedRequest = result.rows[0];

    if (!approvedRequest) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    // Optionally: Notify agent about approval via email
    res.json({ message: 'Leave request approved successfully', approvedRequest });
  } catch (error) {
    console.error('Error approving leave request:', error);
    res.status(500).json({ message: 'Error approving leave request' });
  }
});

// Deny Leave Request
router.put('/:id/deny', async (req, res) => {
  const { id } = req.params;

  try {
    const query = `
      UPDATE leave_requests
      SET status = 'denied', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 RETURNING *
    `;
    const values = [id];

    const result = await db.query(query, values);
    const deniedRequest = result.rows[0];

    if (!deniedRequest) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    // Optionally: Notify agent about denial via email
    res.json({ message: 'Leave request denied successfully', deniedRequest });
  } catch (error) {
    console.error('Error denying leave request:', error);
    res.status(500).json({ message: 'Error denying leave request' });
  }
});

module.exports = router;
