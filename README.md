# Shift Scheduler Web App

This web application provides a shift scheduling and management system for teams. It allows administrators and managers to track shifts, monitor team strength, manage leave requests, and log changes to schedules. The application is integrated with Google Sheets to synchronize shift data and enables users to log in and manage their profiles securely.

## Features

### 1. **Authentication**
- **User Registration**: New users can register with their email, password, and title (e.g., Manager, Agent).
- **Login/Logout**: Users can log in using JWT-based authentication, and token management is handled via local storage.
- **Protected Routes**: Certain routes (e.g., the dashboard) are protected and accessible only to authenticated users.

### 2. **Dashboard**
- **Tabs Navigation**: Users can navigate through different tabs to view team strength, logs, and leave requests.
- **Responsive Design**: The dashboard provides a user-friendly interface with a dark theme and modern layout.

### 3. **Team Strength Overview**
- **Team Strength Calculation**: Displays how many agents are available at each hour of the day, broken down by channel.
- **Customizable Filters**: Users can filter by date range, hour, and channel to check agent availability.
- **Dynamic Display**: Agents are displayed based on their availability, with options to adjust shifts as necessary.

### 4. **Logs**
- **Change Tracking**: Shows a log of changes made to the schedule, including the timestamp and details of the changes.
- **Email Notification Status**: Indicates whether a notification email has been sent, seen, or not seen.

### 5. **Leave Planner**
- **Leave Request Management**: Users can log leave requests (annual, sick, maternity, compassionate, bonus) for a specific date range.
- **Manager Approvals**: Managers can view pending leave requests and approve or deny them.
- **Email Notifications**: Automatic notifications are sent when leave requests are logged or approved.
- **Team Strength Exclusions**: Agents on leave are excluded from team strength calculations to prevent scheduling conflicts.
- **Conflict Notifications**: Logs display errors if a shift change conflicts with scheduled leave.

### 6. **Google Sheets Integration**
- **Shift Data Synchronization**: Shift data is imported from Google Sheets, ensuring up-to-date schedules.
- **Real-Time Updates**: Modifications made in the app reflect back in the Google Sheet, maintaining data consistency.

## Installation

1. **Clone the repository:**
    ```bash
    git clone https://github.com/your-repository/shift-scheduler.git
    ```

2. **Install dependencies:**
    ```bash
    cd shift-scheduler
    npm install
    ```

3. **Environment Setup:**
   Create a `.env` file with the following keys:
    ```
    JWT_SECRET=your_jwt_secret
    GOOGLE_API_KEY=your_google_api_key
    ```

4. **Run the application:**
    ```bash
    npm start
    ```

5. **Frontend Setup:**
   Navigate to the `frontend` directory and run:
    ```bash
    npm start
    ```

## API Endpoints

### **Authentication**
- **POST /api/users/register**: Register a new user.
    - Request body: `{ "username", "email", "password", "title" }`
- **POST /api/users/login**: Authenticate user and return a JWT token.
    - Request body: `{ "email", "password" }`
- **GET /api/users/:id**: Get details of a specific user by ID.
- **PUT /api/users/update**: Update the user's profile details (e.g., username, email, title).
    - Request body: `{ "username", "email", "title" }`

### **Shifts**
- **GET /api/shifts/team-strength?date=&hour=**: Get team strength data based on the date and hour.
    - Query params: `date`, `hour`
- **GET /api/shifts/log**: Retrieve the log of all schedule changes.
- **POST /api/shifts/update**: Update shift details for an agent.
    - Request body: `{ "agent_name", "shift", "date" }`
- **GET /api/shifts/agent/:id**: Retrieve shift details for a specific agent.
- **POST /api/shifts/import**: Import shift data from the Google Sheet into the database.

### **Leave Requests**
- **GET /api/leave-requests**: Retrieve all leave requests.
- **POST /api/leave-requests**: Create a new leave request.
    - Request body: `{ "agent_name", "leave_type", "start_date", "end_date" }`
- **PUT /api/leave-requests/:id**: Update an existing leave request.
    - Request body: `{ "leave_type", "start_date", "end_date" }`
- **DELETE /api/leave-requests/:id**: Delete a leave request by ID.
- **POST /api/leave-requests/approve/:id**: Approve a leave request.
- **POST /api/leave-requests/deny/:id**: Deny a leave request.

### **Logs**
- **GET /api/shifts/logs**: Retrieve the list of all changes made to the shift schedule.
    - Includes change details, timestamp, and email notification status.
- **GET /api/logs/user/:userId**: Get logs filtered by a specific user.

## Technologies Used

- **Backend**: Node.js, Express.js, PostgreSQL
- **Frontend**: React.js, Axios
- **Authentication**: JWT (JSON Web Tokens)
- **Google Sheets API**: Synchronization of shift data
- **Styling**: CSS with modern design elements (dark theme and responsive UI)

## Future Enhancements
- **Push Notifications**: Add real-time notifications for schedule updates.
- **Agent Availability Checker**: Allow agents to mark their availability in advance.
- **Advanced Filtering**: Add more detailed filters for managers to view team strength.
