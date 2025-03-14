function onEdit(e) {
  const spreadsheet = SpreadsheetApp.openById("10kQsqKf-zsNTaKuuXjpm7Unp4rI8zWFCszsftUluRf0");
  const sheet = e.source.getActiveSheet();

  // ✅ Ensure we only run on "All CX Hybrid 2025"
  if (sheet.getName() !== "All CX Hybrid 2025") return;

  const range = e.range;
  
  if (range.getA1Notation() === "C2") {
    captureSheetState();
    return;
  }

  if (sheet.getRange("C2").getValue().toUpperCase() === "ON") {
    Logger.log("Notifications paused. Skipping.");
    return;
  }

  if (range.getColumn() < 14 || range.getRow() <= 4) {
    // Ignore non-shift area edits
    return;
  }

  detectChangesAndNotify();
}

function captureSheetState() {
  
  const spreadsheet = SpreadsheetApp.openById("10kQsqKf-zsNTaKuuXjpm7Unp4rI8zWFCszsftUluRf0");

  const sheet = spreadsheet.getSheetByName("All CX Hybrid 2025"); // ✅ Ensure we check the correct sheet
  if (!sheet) {
    Logger.log("Sheet 'All CX Hybrid 2025' not found. Skipping.");
    return;
  }
  
  let snapshotSheet = spreadsheet.getSheetByName("Sheet Snapshot");
  if (!snapshotSheet) {
    snapshotSheet = spreadsheet.insertSheet("Sheet Snapshot");
  } else {
    snapshotSheet.clear();
  }

  const data = sheet.getDataRange().getValues();
  snapshotSheet.getRange(1, 1, data.length, data[0].length).setValues(data);
}

function detectChangesAndNotify() {
  const spreadsheet = SpreadsheetApp.openById("10kQsqKf-zsNTaKuuXjpm7Unp4rI8zWFCszsftUluRf0");
  const sheet = spreadsheet.getSheetByName("All CX Hybrid 2025"); // ✅ Ensure we check the correct sheet
  if (!sheet) {
    Logger.log("Sheet 'All CX Hybrid 2025' not found. Skipping.");
    return;
  }
  const snapshotSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet Snapshot");

  if (!snapshotSheet) {
    Logger.log("No snapshot found. Skipping.");
    return;
  }

  const currentData = sheet.getDataRange().getValues();
  const snapshotData = snapshotSheet.getDataRange().getValues();

  const shiftOptions = ["OFF", "MH", "M", "A", "AH", "N"];
  const changesByAgent = {};

  // Build snapshot lookup by agent name (column F = agent name)
  const snapshotMap = {};
  for (let row = 4; row < snapshotData.length; row++) {
    const agentName = snapshotData[row][5];
    if (agentName) {
      snapshotMap[agentName] = snapshotData[row];
    }
  }

  // Compare each agent's current row to their old snapshot row (based on name)
  for (let row = 4; row < currentData.length; row++) {
    const agentName = currentData[row][5];
    const userEmail = currentData[row][6];

    if (!agentName || !userEmail) continue;

    const snapshotRow = snapshotMap[agentName];
    if (!snapshotRow) {
      // New agent added, no past data to compare - could log if needed
      continue;
    }

    for (let col = 14; col < currentData[row].length; col++) {
      const oldValue = (snapshotRow[col] || "").toString().trim().toUpperCase();
      const newValue = (currentData[row][col] || "").toString().trim().toUpperCase();

      if (oldValue === newValue) continue; // No change

      // Skip empty values (don't notify for these)
      if (!oldValue || !newValue) continue;

      // Skip if not a valid shift value
      if ((oldValue && !shiftOptions.includes(oldValue)) || (newValue && !shiftOptions.includes(newValue))) {
        continue;
      }

      const date = currentData[2][col];

      if (!changesByAgent[agentName]) {
        changesByAgent[agentName] = {
          email: userEmail,
          changes: []
        };
      }

      changesByAgent[agentName].changes.push(
        `• Shift on ${date} changed from ${oldValue} to: ${newValue}`
      );
    }
  }

  sendBatchNotifications(changesByAgent);
  logBatchChanges(changesByAgent);

  // Refresh snapshot after processing changes
  snapshotSheet.clear();
  snapshotSheet.getRange(1, 1, currentData.length, currentData[0].length).setValues(currentData);
}


function sendBatchNotifications(changesByAgent) {
  for (const agent in changesByAgent) {
    const { email, changes } = changesByAgent[agent];
    if (changes.length === 0) continue;

    const subject = `Shift Changes Notification for ${agent}`;
    const message = `
Hello ${agent},

The following shift changes have been made to your schedule:

${changes.join('\n')}

Best regards,
Shift Management System`;

    GmailApp.sendEmail(email, subject, message);
  }
}

function logBatchChanges(changesByAgent) {
  const logSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Logs");
  if (!logSheet) {
    Logger.log("Log sheet not found.");
    return;
  }

  const timestamp = new Date();

  for (const agent in changesByAgent) {
    const { email, changes } = changesByAgent[agent];
    if (changes.length === 0) continue;

    changes.forEach(change => {
      logSheet.appendRow([timestamp, agent, "shift", change, "", email]);
    });
  }
}

