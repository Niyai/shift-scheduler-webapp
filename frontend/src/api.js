import axios from 'axios';

// Create an instance of axios with default settings
const api = axios.create({
    baseURL: 'http://localhost:5000',
});



const API_BASE_URL = 'http://localhost:5000/api';

// Fetch agents
export const getAgents = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/agents`);
    return response.data;
  } catch (error) {
    console.error('Error fetching agents:', error);
    throw error;
  }
};

// Fetch leave requests
export const getLeaveRequests = async (status) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/leave`, { params: { status } });
    return response.data;
  } catch (error) {
    console.error('Error fetching leave requests:', error);
    throw error;
  }
};

// Create leave request
export const createLeaveRequest = async (leaveData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/leave`, leaveData);
    return response.data;
  } catch (error) {
    console.error('Error creating leave request:', error);
    throw error;
  }
};

// Approve leave request (if you are handling approval from the frontend)
export const approveLeaveRequest = async (id) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/leave/${id}/approve`);
    return response.data;
  } catch (error) {
    console.error('Error approving leave request:', error);
    throw error;
  }
};

// Approve leave request (if you are handling approval from the frontend)
export const denyLeaveRequest = async (id) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/leave/${id}/deny`);
    return response.data;
  } catch (error) {
    console.error('Error denying leave request:', error);
    throw error;
  }
};
