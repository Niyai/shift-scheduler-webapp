// EditLeaveModal.js

import React, { useState } from "react";
import "./styles.css"; // Optional: Add custom styles for your modal

const EditLeaveModal = ({ isOpen, onClose, leaveRequest, onSave }) => {
  const [leaveType, setLeaveType] = useState(leaveRequest.leaveType || "");
  const [startDate, setStartDate] = useState(leaveRequest.startDate || "");
  const [endDate, setEndDate] = useState(leaveRequest.endDate || "");
  const [status, setStatus] = useState(leaveRequest.status || "Pending");

  const handleSubmit = (e) => {
    e.preventDefault();
    const updatedLeaveDetails = { leaveType, startDate, endDate, status };
    onSave(leaveRequest.id, updatedLeaveDetails);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Edit Leave Request</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Leave Type:
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
            >
              <option value="Annual Leave">Annual Leave</option>
              <option value="Sick Leave">Sick Leave</option>
              <option value="Maternity Leave">Maternity Leave</option>
              <option value="Compassionate Leave">Compassionate Leave</option>
            </select>
          </label>

          <label>
            Start Date:
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </label>

          <label>
            End Date:
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </label>

          <label>
            Status:
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Denied">Denied</option>
            </select>
          </label>

          <div className="modal-actions">
            <button type="submit">Save Changes</button>
            <button type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditLeaveModal;
