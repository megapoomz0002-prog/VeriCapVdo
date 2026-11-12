/**
 * ==============================================================================
 * VeriCapVdo Studio - ระบบจัดการลิขสิทธิ์และคีย์เข้าใช้งานบน Google Sheets
 * (Serverless License Management API for Google Sheets & Google Apps Script)
 * ==============================================================================
 * 
 * คุณสมบัติ:
 * 1. ตรวจสอบและผูก License Key ถาวร (1 คีย์ต่อ 1 เบราว์เซอร์/เครื่อง)
 * 2. เมนูบน Google Sheets สร้างคีย์อัตโนมัติ 20 / 50 / 100 คีย์ (รูปแบบ VCV-XXXX-XXXX-XXXX-XXXX)
 * 3. แจ้งเตือนเข้า LINE Notify อัตโนมัติเมื่อมีผู้เปิดใช้งานคีย์
 * 4. รองรับการระงับคีย์ (Revoke) ทันทีเพียงเปลี่ยนสถานะใน Sheet เป็น "ระงับการใช้งาน"
 * 5. มีระบบ LockService ป้องกันคำขอชนกัน (Concurrency Safe)
 * 
 * ขั้นตอนการติดตั้ง (ใช้เวลา 1-2 นาที):
 * 1. เปิด Google Sheets เปล่าใหม่ที่ https://sheets.new
 * 2. ตั้งชื่อไฟล์ เช่น "VeriCapVdo Studio - ระบบจัดการลิขสิทธิ์"
 * 3. ไปที่เมนู "ส่วนขยาย" (Extensions) > "Apps Script"
 * 4. ลบโค้ดเดิมออกทั้งหมด แล้ววางโค้ดไฟล์นี้ลงไป
 * 5. กดปุ่ม "บันทึก" (รูปแผ่นดิสก์)
 * 6. กดปุ่ม "ทำให้ใช้งานได้" (Deploy) > "การทำให้ใช้งานได้ใหม่" (New deployment)
 *    - เลือกประเภท: "เว็บแอป" (Web app)
 *    - คำอธิบาย: VeriCapVdo License API
 *    - ดำเนินการในฐานะ: ตัวฉัน (Me)
 *    - ผู้ที่มีสิทธิ์เข้าถึง: ทุกคน (Anyone)  <-- สำคัญมาก! เพื่อให้เว็บแอปเช็คคีย์ได้
 * 7. กด "ทำให้ใช้งานได้" (Deploy) แล้วคัดลอก "URL ของเว็บแอป"
 *    (รูปแบบ https://script.google.com/macros/s/.../exec)
 *    นำไปใส่ใน Vercel Environment Variable: LICENSE_API_URL
 */

const SHEET_LICENSES = "Licenses";
const KEY_PREFIX = "VCV"; // Prefix คีย์สำหรับ VeriCapVdo Studio

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
    .addItem("🔔 ตั้งค่า LINE Notify Token", "configureLineNotify")
    .addItem("🧪 ทดสอบส่งแจ้งเตือน LINE", "testLineNotify")
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
  licSheet.setColumnWidth(1, 240); // Key
  licSheet.setColumnWidth(2, 110); // Status
  licSheet.setColumnWidth(3, 200); // Customer/User
  licSheet.setColumnWidth(4, 250); // Device ID
  licSheet.setColumnWidth(5, 160); // Activated At
  licSheet.setColumnWidth(6, 160); // Last Check
  licSheet.setColumnWidth(7, 200); // Notes

  SpreadUiAlert("ตั้งค่าสำเร็จ!", "สร้างแท็บ Licenses สำหรับ VeriCapVdo Studio พร้อมใช้งานเรียบร้อยแล้วครับ");
}

function generate20Keys() { generateBatchKeys(20); }
function generate50Keys() { generateBatchKeys(50); }
function generate100Keys() { generateBatchKeys(100); }

/**
 * สร้างคีย์สุ่มแบบปลอดภัย (รูปแบบ VCV-XXXX-XXXX-XXXX-XXXX)
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
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // ตัดตัวสับสน O, 0, I, 1 ออก

  for (let i = 0; i < count; i++) {
    let key = "";
    do {
      key = KEY_PREFIX;
      for (let segment = 0; segment < 4; segment++) {
        let part = "";
        for (let c = 0; c < 4; c++) {
          part += chars.charAt(Math.floor(Math.random() * chars.length));
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
  const keyInput = (params.key || "").trim().toUpperCase().replace(/\s+/g, "");
  const deviceId = (params.deviceId || params.machineId || "").trim().toUpperCase();
  const userName = (params.userName || "").trim();

  if (!keyInput || keyInput.length < 6) {
    return jsonResponse({ success: false, message: "กรุณาระบุ License Key ให้ถูกต้อง" });
  }
  if (!deviceId) {
    return jsonResponse({ success: false, message: "ไม่พบรหัสอุปกรณ์ Device ID" });
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
    const rowKey = String(data[i][0]).toUpperCase().trim().replace(/\s+/g, "");
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
  const boundDeviceId = String(rowData[3] || "").trim().toUpperCase();
  const nowStr = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd HH:mm:ss");

  // กรณีคีย์ถูกระงับ
  if (currentStatus === "ระงับการใช้งาน" || currentStatus.toLowerCase() === "revoked") {
    return jsonResponse({ success: false, message: "License Key นี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ" });
  }

  // กรณีคีย์เคยถูกเปิดใช้งานแล้ว
  if (boundDeviceId && boundDeviceId.length > 0) {
    if (boundDeviceId === deviceId) {
      // เครื่องเดิม/เบราว์เซอร์เดิม -> อนุญาตให้เปิดใช้งานซ้ำได้
      sheet.getRange(targetRowIndex, 6).setValue(nowStr);
      return jsonResponse({
        success: true,
        message: "อุปกรณ์นี้เปิดใช้งานด้วยคีย์นี้เรียบร้อยแล้ว (สิทธิ์ถาวรตลอดชีพ)",
        licenseKey: rowData[0],
        userName: rowData[2] || userName,
        licenseType: "Permanent"
      });
    } else {
      // เครื่องอื่นแอบเอาคีย์ไปใช้
      return jsonResponse({
        success: false,
        message: "คีย์นี้ถูกเปิดใช้งานบนอุปกรณ์อื่นไปแล้ว (จำกัด 1 คีย์ต่อ 1 อุปกรณ์เท่านั้น)"
      });
    }
  }

  // กรณีคีย์ยังว่างอยู่ -> ผูกเข้ากับ Device ID ทันที!
  sheet.getRange(targetRowIndex, 2).setValue("ใช้งานแล้ว");
  if (userName) {
    sheet.getRange(targetRowIndex, 3).setValue(userName);
  }
  sheet.getRange(targetRowIndex, 4).setValue(deviceId);
  sheet.getRange(targetRowIndex, 5).setValue(nowStr);
  sheet.getRange(targetRowIndex, 6).setValue(nowStr);

  // แจ้งเตือนเข้า LINE (ถ้ามีการตั้งค่าไว้)
  sendLineNotification(`🎉 มีผู้เปิดใช้งานคีย์ใหม่บน VeriCapVdo Studio!\n🔑 คีย์: ${rowData[0]}\n👤 ผู้ใช้: ${userName || "ไม่ระบุ"}\n💻 Device ID: ${deviceId}\n⏰ เวลา: ${nowStr}`);

  return jsonResponse({
    success: true,
    message: "เปิดใช้งานสิทธิ์เข้าใช้งานสำเร็จเรียบร้อยแล้ว!",
    licenseKey: rowData[0],
    userName: userName || rowData[2],
    licenseType: "Permanent"
  });
}

/**
 * ตรวจสอบสถานะของคีย์
 */
function handleCheckStatus(params) {
  const keyInput = (params.key || "").trim().toUpperCase().replace(/\s+/g, "");

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const licSheet = ss.getSheetByName(SHEET_LICENSES);

  if (licSheet && keyInput) {
    const lastRow = licSheet.getLastRow();
    if (lastRow > 1) {
      const data = licSheet.getRange(2, 1, lastRow - 1, 7).getValues();
      for (let i = 0; i < data.length; i++) {
        const rowKey = String(data[i][0]).toUpperCase().trim().replace(/\s+/g, "");
        if (rowKey === keyInput || rowKey.replace(/-/g, "") === keyInput.replace(/-/g, "")) {
          const status = data[i][1];
          const isValid = status !== "ระงับการใช้งาน" && status.toLowerCase() !== "revoked";
          return jsonResponse({
            success: isValid,
            key: data[i][0],
            status: status,
            userName: data[i][2],
            boundDeviceId: data[i][3],
            activatedAt: data[i][4]
          });
        }
      }
    }
  }

  return jsonResponse({ success: false, message: "ไม่พบข้อมูลคีย์นี้ในระบบ" });
}

/**
 * LINE Notify Integration
 */
function configureLineNotify() {
  const ui = SpreadsheetApp.getUi();
  const prop = PropertiesService.getScriptProperties();
  const currentToken = prop.getProperty("LINE_NOTIFY_TOKEN") || "";

  const response = ui.prompt(
    "ตั้งค่า LINE Notify Token",
    "กรอก LINE Notify Token (รับได้ฟรีจาก notify-bot.line.me):\n(ปัจจุบัน: " + (currentToken ? "••••" + currentToken.slice(-4) : "ยังไม่ได้ตั้งค่า") + ")",
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() === ui.Button.OK) {
    const token = response.getResponseText().trim();
    if (token) {
      prop.setProperty("LINE_NOTIFY_TOKEN", token);
      SpreadUiAlert("บันทึกสำเร็จ", "บันทึก LINE Notify Token เรียบร้อยแล้วครับ");
    }
  }
}

function testLineNotify() {
  const success = sendLineNotification("🧪 ทดสอบการเชื่อมต่อระบบแจ้งเตือน LINE จาก VeriCapVdo Studio สำเร็จ 100%!");
  if (success) {
    SpreadUiAlert("สำเร็จ!", "ส่งข้อความทดสอบเข้า LINE เรียบร้อยแล้ว กรุณาเปิดดูในแชท");
  } else {
    SpreadUiAlert("ไม่สำเร็จ", "กรุณาตรวจสอบว่าได้ตั้งค่า LINE Notify Token หรือยัง");
  }
}

function sendLineNotification(message) {
  try {
    const token = PropertiesService.getScriptProperties().getProperty("LINE_NOTIFY_TOKEN");
    if (!token) return false;

    UrlFetchApp.fetch("https://notify-api.line.me/api/notify", {
      method: "post",
      headers: { "Authorization": "Bearer " + token },
      payload: { "message": message },
      muteHttpExceptions: true
    });
    return true;
  } catch (e) {
    return false;
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
