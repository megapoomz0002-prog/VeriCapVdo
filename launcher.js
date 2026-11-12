const { spawn, exec } = require("child_process");
const http = require("http");

console.log("======================================================================");
console.log("  VeriCapVdo AI Studio - ระบบแต่งเพลง สร้างปก และตัดต่อ MV 9:16");
console.log("======================================================================\n");

const PORT = 3000;
const URL = `http://localhost:${PORT}`;

const isWindows = process.platform === "win32";
const npmCmd = isWindows ? "npm.cmd" : "npm";

// Check if server is already running on port 3000
const initialCheck = http.get(URL, (res) => {
  console.log(`[✓] เซิร์ฟเวอร์ทำงานอยู่แล้วที่: ${URL}`);
  console.log("กำลังเปิดเบราว์เซอร์ให้ทันที...\n");
  exec(`start ${URL}`);
});

initialCheck.on("error", () => {
  // Not running, let's start it cleanly!
  console.log("[*] กำลังเริ่มต้นเซิร์ฟเวอร์ความเร็วสูง (Production Mode)...");

  const server = spawn(npmCmd, ["start"], {
    stdio: "inherit",
    shell: true,
    cwd: __dirname,
  });

  let opened = false;
  function checkAndOpenBrowser() {
    if (opened) return;
    const req = http.get(URL, (res) => {
      if (!opened) {
        opened = true;
        console.log(`\n[✓] เซิร์ฟเวอร์พร้อมใช้งานแล้ว! กำลังเปิดเบราว์เซอร์ไปที่: ${URL}`);
        console.log("======================================================================");
        console.log(`  เข้าใช้งานเว็บได้ที่: ${URL}`);
        console.log("  (กด Ctrl + C หรือปิดหน้าต่างนี้เมื่อต้องการหยุดระบบ)");
        console.log("======================================================================\n");
        exec(`start ${URL}`);
      }
    });
    req.on("error", () => {
      setTimeout(checkAndOpenBrowser, 400);
    });
    req.setTimeout(1000, () => req.destroy());
  }

  setTimeout(checkAndOpenBrowser, 400);

  server.on("error", (err) => {
    console.error("\n[ERROR] ไม่สามารถเริ่มต้นด้วยโหมด Production ได้:", err.message);
    console.log("กำลังสลับไปรันด้วยโหมด Development (npm run dev)...");
    spawn(npmCmd, ["run", "dev"], {
      stdio: "inherit",
      shell: true,
      cwd: __dirname,
    });
    setTimeout(checkAndOpenBrowser, 1000);
  });

  server.on("close", (code) => {
    if (code !== 0 && code !== null) {
      console.log(`\n[*] เซิร์ฟเวอร์หยุดทำงาน (Exit code: ${code})`);
    }
  });
});

initialCheck.setTimeout(800, () => initialCheck.destroy());
