/**
 * ==============================================================================
 * VeriCapVdo Studio - ระบบจัดการลิขสิทธิ์และคีย์เข้าใช้งานบน Google Sheets
 * (Serverless License Management API for Google Sheets & Google Apps Script)
 * ==============================================================================
 *
 * คุณสมบัติ:
 * 1. ตรวจสอบและผูก License Key ถาวร (1 คีย์ต่อ 1 เบราว์เซอร์/เครื่อง)
 * 2. เมนูบน Google Sheets สร้างคีย์อัตโนมัติ 20 / 50 / 100 คีย์ (รูปแบบ VCV-XXXX-XXXX-XXXX-XXXX)
 * 3. แจ้งเตือนผ่าน Webhook URL (Discord / Slack / Relay Webhook) อัตโนมัติเมื่อเปิดใช้งานคีย์
 * 4. รองรับการระงับคีย์ (Revoke) ทันทีเพียงเปลี่ยนสถานะใน Sheet เป็น "ระงับการใช้งาน"
 * 5. มีระบบ LockService ป้องกันคำขอชนกัน + ป้องกัน Sheets Formula Injection + รองรับ Shared Secret
 */

const SHEET_LICENSES = "Licenses";
const KEY_PREFIX = "VCV";

/**
 * ป้องกัน Google Sheets Formula Injection สำหรับข้อมูลจากผู้ใช้
 */
function sanitizeSheetCell(value) {
  const str = String(value || "").trim();
  if (!str) return "";
  return /^[=+\-@\t\r]/.test(str) ? "'" + str : str;
}

/**
 * สร้างเมนู VeriCapVdo บนแถบเครื่องมือของ Google Sheets อัตโนมัติ
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu("🎬 VeriCapVdo Studio")
    .addItem("⚙️ ติดตั้งและตั้งค่าหัวตาราง (Setup Sheets)", "setupSheets")
    .addSeparator()
    .addItem("➕ สร้างคีย์พร้อมใช้งาน 20 คีย์", "generate20Keys")
    .addItem("➕ สร้างคีย์พร้อมใช้งาน 50 คีย์", "generate50Keys")
    .addItem("➕ สร้างคีย์พร้อมใช้งาน 100 คีย์", "generate100Keys")
    .addSeparator()
    .addItem("🔔 ตั้งค่า Webhook แจ้งเตือน (Discord/Slack/Relay)", "configureWebhook")
    .addItem("🔒 ตั้งค่า Shared Secret (ป้องกันยิงตรง)", "configureSharedSecret")
    .addItem("🧪 ทดสอบส่งแจ้งเตือน Webhook", "testWebhookNotification")
    .addToUi();
}

/**
 * ติดตั้งตาราง Licenses พร้อมจัดรูปแบบสวยงาม
 */
function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  let licSheet = ss.getSheetByName(SHEET_LICENSES);
  if (!licSheet) {
    licSheet = ss.insertSheet(SHEET_LICENSES);
  }
  const licHeaders = [
    ["License Key", "สถานะ", "ชื่อผู้ใช้ / ลูกค้า", "Device ID (รหัสเครื่อง/เบราว์เซอร์)", "วันที่เปิดใช้งาน", "ตรวจเช็กล่าสุด", "หมายเหตุ"]
  ];
  licSheet.getRange(1, 1, 1, licHeaders[0].length).setValues(licHeaders);
  licSheet.getRange(1, 1, 1, licHeaders[0].length)
    .setBackground("#0F172A")
    .setFontColor("#38BDF8")
    .setFontWeight("bold")
    .setHorizontalAlignment("center");
  licSheet.setFrozenRows(1);
  licSheet.setColumnWidth(1, 240);
  licSheet.setColumnWidth(2, 110);
  licSheet.setColumnWidth(3, 200);
  licSheet.setColumnWidth(4, 250);
  licSheet.setColumnWidth(5, 160);
  licSheet.setColumnWidth(6, 160);
  licSheet.setColumnWidth(7, 200);

  SpreadUiAlert("ตั้งค่าสำเร็จ!", "สร้างแท็บ Licenses สำหรับ VeriCapVdo Studio พร้อมใช้งานเรียบร้อยแล้วครับ");
}

function generate20Keys() { generateBatchKeys(20); }
function generate50Keys() { generateBatchKeys(50); }
function generate100Keys() { generateBatchKeys(100); }

/**
 * สร้างคีย์สุ่มแบบปลอดภัย (รูปแบบ VCV-XXXX-XXXX-XXXX-XXXX) ด้วยเอนโทรปีจาก Utilities.getUuid()
 */
function generateBatchKeys(count) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_LICENSES);
  if (!sheet) {
    setupSheets();
    sheet = ss.getSheetByName(SHEET_LICENSES);
  }

  const existingKeys = new Set();
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    const data = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (let i = 0; i < data.length; i++) {
      if (data[i][0]) existingKeys.add(String(data[i][0]).toUpperCase().trim());
    }
  }

  const newRows = [];
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  for (let i = 0; i < count; i++) {
    let key = "";
    do {
      const entropy = Utilities.computeDigest(
        Utilities.DigestAlgorithm.SHA_256,
        Utilities.getUuid() + ":" + Date.now() + ":" + Math.random()
      );
      let idx = 0;
      key = KEY_PREFIX;
      for (let segment = 0; segment < 4; segment++) {
        let part = "";
        for (let c = 0; c < 4; c++) {
          const byteVal = (entropy[idx % entropy.length] + 256) % 256;
          part += chars.charAt(byteVal % chars.length);
          idx++;
        }
        key += "-" + part;
      }
    } while (existingKeys.has(key));

    existingKeys.add(key);
    newRows.push([key, "พร้อมใช้งาน", "", "", "", "", "สร้างเมื่อ " + Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd HH:mm")]);
  }

  if (newRows.length > 0) {
    const startRow = lastRow + 1;
    sheet.getRange(startRow, 1, newRows.length, newRows[0].length).setValues(newRows);
    SpreadUiAlert("สร้างคีย์สำเร็จ!", `สร้าง License Key สำหรับ VeriCapVdo จำนวน ${count} คีย์ เรียบร้อยแล้ว`);
  }
}

function SpreadUiAlert(title, msg) {
  try {
    SpreadsheetApp.getUi().alert(title, msg, SpreadsheetApp.getUi().ButtonSet.OK);
  } catch (e) { }
}

/**
 * API Web App Endpoint (GET & POST)
 */
function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (err) {
    return jsonResponse({ success: false, message: "ระบบกำลังประมวลผลคำขออื่นอยู่ กรุณาลองใหม่อีกครั้งใน 2-3 วินาที" });
  }

  try {
    const params = e && e.parameter ? e.parameter : {};
    const action = (params.action || "").trim().toLowerCase();

    if (action === "ping") {
      return jsonResponse({ success: true, message: "VeriCapVdo Studio License API Online", timestamp: new Date().toISOString() });
    }

    const configuredSecret = (PropertiesService.getScriptProperties().getProperty("LICENSE_SHARED_SECRET") || "").trim();
    if (configuredSecret && (params.secret || "").trim() !== configuredSecret) {
      return jsonResponse({ success: false, message: "Unauthorized request" });
    }

    if (action === "activate") {
      return handleActivate(params);
    }

    if (action === "check") {
      return handleCheckStatus(params);
    }

    return jsonResponse({ success: false, message: "Action ไม่ถูกต้อง กรุณาระบุ action=activate หรือ action=check" });
  } catch (ex) {
    return jsonResponse({ success: false, message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์: " + ex.toString() });
  } finally {
    try { lock.releaseLock(); } catch (err) { }
  }
}

/**
 * ประมวลผลการเปิดใช้งาน Key ถาวร
 */
function handleActivate(params) {
  const keyInput = String(params.key || "").trim().toUpperCase().replace(/\s+/g, "");
  const deviceId = String(params.deviceId || params.machineId || "").trim().toUpperCase().slice(0, 120);
  const safeDeviceId = sanitizeSheetCell(deviceId);
  const rawUserName = String(params.userName || "").trim().slice(0, 80);
  const safeUserName = sanitizeSheetCell(rawUserName);

  if (!keyInput || keyInput.length < 6) {
    return jsonResponse({ success: false, message: "กรุณาระบุ License Key ให้ถูกต้อง" });
  }
  if (!deviceId || deviceId === "VCV-WEB-CLIENT") {
    return jsonResponse({ success: false, message: "ไม่พบรหัสอุปกรณ์ Device ID ที่ถูกต้อง" });
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_LICENSES);
  if (!sheet) {
    setupSheets();
    sheet = ss.getSheetByName(SHEET_LICENSES);
  }

  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return jsonResponse({ success: false, message: "ไม่พบ License Key นี้ในระบบ Google Sheets" });
  }

  const data = sheet.getRange(2, 1, lastRow - 1, 7).getValues();
  let targetRowIndex = -1;
  let rowData = null;

  for (let i = 0; i < data.length; i++) {
    const rowKey = String(data[i][0] || "").toUpperCase().trim().replace(/\s+/g, "");
    if (rowKey === keyInput || rowKey.replace(/-/g, "") === keyInput.replace(/-/g, "")) {
      targetRowIndex = i + 2;
      rowData = data[i];
      break;
    }
  }

  if (targetRowIndex === -1 || !rowData) {
    return jsonResponse({ success: false, message: "ไม่พบ License Key นี้ในระบบ กรุณาตรวจสอบความถูกต้องอีกครั้ง" });
  }

  const currentStatus = String(rowData[1] || "").trim();
  const boundDeviceId = String(rowData[3] || "").trim().replace(/^'/, "").toUpperCase();
  const nowStr = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd HH:mm:ss");

  if (currentStatus === "ระงับการใช้งาน" || currentStatus.toLowerCase() === "revoked") {
    return jsonResponse({ success: false, message: "License Key นี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ" });
  }

  if (boundDeviceId && boundDeviceId.length > 0) {
    if (boundDeviceId === deviceId) {
      sheet.getRange(targetRowIndex, 6).setValue(nowStr);
      return jsonResponse({
        success: true,
        message: "อุปกรณ์นี้เปิดใช้งานด้วยคีย์นี้เรียบร้อยแล้ว (สิทธิ์ถาวรตลอดชีพ)",
        licenseKey: rowData[0],
        userName: rowData[2] || rawUserName,
        licenseType: "Permanent"
      });
    } else {
      return jsonResponse({
        success: false,
        message: "คีย์นี้ถูกเปิดใช้งานบนอุปกรณ์อื่นไปแล้ว (จำกัด 1 คีย์ต่อ 1 อุปกรณ์เท่านั้น)"
      });
    }
  }

  const updatedName = safeUserName || String(rowData[2] || "");
  sheet.getRange(targetRowIndex, 2, 1, 5).setValues([[
    "ใช้งานแล้ว",
    updatedName,
    safeDeviceId,
    nowStr,
    nowStr
  ]]);

  sendWebhookNotification(
    `🎉 เปิดใช้งานคีย์ใหม่ VeriCapVdo Studio!\n🔑 คีย์: ${rowData[0]}\n👤 ผู้ใช้: ${rawUserName || "ไม่ระบุ"}\n💻 Device ID: ${deviceId}\n⏰ เวลา: ${nowStr}`
  );

  return jsonResponse({
    success: true,
    message: "เปิดใช้งานสิทธิ์เข้าใช้งานสำเร็จเรียบร้อยแล้ว!",
    licenseKey: rowData[0],
    userName: rawUserName || String(rowData[2] || ""),
    licenseType: "Permanent"
  });
}

/**
 * ตรวจสอบสถานะของคีย์
 */
function handleCheckStatus(params) {
  const keyInput = String(params.key || "").trim().toUpperCase().replace(/\s+/g, "");
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const licSheet = ss.getSheetByName(SHEET_LICENSES);

  if (licSheet && keyInput) {
    const lastRow = licSheet.getLastRow();
    if (lastRow > 1) {
      const data = licSheet.getRange(2, 1, lastRow - 1, 7).getValues();
      for (let i = 0; i < data.length; i++) {
        const rowKey = String(data[i][0] || "").toUpperCase().trim().replace(/\s+/g, "");
        if (rowKey === keyInput || rowKey.replace(/-/g, "") === keyInput.replace(/-/g, "")) {
          const status = String(data[i][1] || "").trim();
          const isValid = status !== "ระงับการใช้งาน" && status.toLowerCase() !== "revoked";
          return jsonResponse({
            success: isValid,
            key: data[i][0],
            status: status,
            userName: String(data[i][2] || ""),
            boundDeviceId: String(data[i][3] || "").replace(/^'/, ""),
            activatedAt: data[i][4]
          });
        }
      }
    }
  }

  return jsonResponse({ success: false, message: "ไม่พบข้อมูลคีย์นี้ในระบบ" });
}

/**
 * Webhook Notification Integration (แทนที่ LINE Notify ซึ่งยุติการให้บริการแล้ว)
 */
function configureWebhook() {
  const ui = SpreadsheetApp.getUi();
  const prop = PropertiesService.getScriptProperties();
  const currentUrl = prop.getProperty("NOTIFY_WEBHOOK_URL") || "";

  const response = ui.prompt(
    "ตั้งค่า Webhook แจ้งเตือน",
    "วาง Discord Webhook / Slack Webhook URL (เว้นว่างเพื่อปิดการแจ้งเตือน):\n(ปัจจุบัน: " +
      (currentUrl ? currentUrl.slice(0, 32) + "..." : "ยังไม่ได้ตั้งค่า") +
      ")",
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() === ui.Button.OK) {
    const url = response.getResponseText().trim();
    if (url) {
      prop.setProperty("NOTIFY_WEBHOOK_URL", url);
      SpreadUiAlert("บันทึกสำเร็จ", "บันทึก Webhook แจ้งเตือนเรียบร้อยแล้วครับ");
    } else {
      prop.deleteProperty("NOTIFY_WEBHOOK_URL");
      SpreadUiAlert("อัปเดตสำเร็จ", "ลบการตั้งค่า Webhook แล้วครับ");
    }
  }
}

function configureSharedSecret() {
  const ui = SpreadsheetApp.getUi();
  const prop = PropertiesService.getScriptProperties();
  const response = ui.prompt(
    "ตั้งค่า Shared Secret",
    "กรอกรหัสลับให้ตรงกับ LICENSE_SHARED_SECRET บน Vercel (เว้นว่างเพื่อปิด):",
    ui.ButtonSet.OK_CANCEL
  );
  if (response.getSelectedButton() === ui.Button.OK) {
    const val = response.getResponseText().trim();
    if (val) {
      prop.setProperty("LICENSE_SHARED_SECRET", val);
      SpreadUiAlert("บันทึกสำเร็จ", "ตั้งค่า Shared Secret เรียบร้อยแล้ว");
    } else {
      prop.deleteProperty("LICENSE_SHARED_SECRET");
      SpreadUiAlert("อัปเดตสำเร็จ", "ลบ Shared Secret แล้ว");
    }
  }
}

function testWebhookNotification() {
  const success = sendWebhookNotification("🧪 ทดสอบการเชื่อมต่อแจ้งเตือนจาก VeriCapVdo Studio สำเร็จ 100%!");
  if (success) {
    SpreadUiAlert("สำเร็จ!", "ส่งข้อความทดสอบเข้า Webhook เรียบร้อยแล้ว");
  } else {
    SpreadUiAlert("ไม่สำเร็จ", "กรุณาตรวจสอบว่าได้ตั้งค่า Webhook URL แล้วหรือยัง");
  }
}

function sendWebhookNotification(message) {
  try {
    const webhookUrl = PropertiesService.getScriptProperties().getProperty("NOTIFY_WEBHOOK_URL");
    if (!webhookUrl) return false;

    const payload = webhookUrl.includes("discord.com")
      ? { content: message }
      : { text: message, message: message };

    const res = UrlFetchApp.fetch(webhookUrl, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    return res.getResponseCode() >= 200 && res.getResponseCode() < 300;
  } catch (e) {
    return false;
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
