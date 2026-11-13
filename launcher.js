const { spawn, exec } = require("child_process");
const fs = require("fs");
const http = require("http");
const path = require("path");

console.log("======================================================================");
console.log("  VeriCapVdo AI Studio - ระบบแต่งเพลง สร้างปก และตัดต่อ MV 9:16");
console.log("======================================================================\n");

const parsedPort = Number(process.env.PORT || 3000);
const PORT = Number.isInteger(parsedPort) && parsedPort > 0 && parsedPort < 65536 ? parsedPort : 3000;
const URL = `http://localhost:${PORT}`;

const isWindows = process.platform === "win32";
const npmCmd = isWindows ? "npm.cmd" : "npm";
const hasProdBuild = fs.existsSync(path.join(__dirname, ".next", "BUILD_ID"));

function openBrowser(targetUrl) {
  const command = isWindows
    ? `start "" "${targetUrl}"`
    : process.platform === "darwin"
      ? `open "${targetUrl}"`
      : `xdg-open "${targetUrl}"`;
  exec(command, (err) => {
    if (err) {
      console.log(`[i] เปิดลิงก์ด้วยตัวเองได้ที่: ${targetUrl}`);
    }
  });
}

// Check if server is already running on PORT
const initialCheck = http.get(URL, (res) => {
  res.resume();
  console.log(`[✓] เซิร์ฟเวอร์ทำงานอยู่แล้วที่: ${URL}`);
  console.log("กำลังเปิดเบราว์เซอร์ให้ทันที...\n");
  openBrowser(URL);
});

initialCheck.setTimeout(800, () => initialCheck.destroy());

initialCheck.on("error", () => {
  const startScript = hasProdBuild ? ["run", "start", "--", "-p", String(PORT)] : ["run", "dev", "--", "-p", String(PORT)];
  console.log(
    hasProdBuild
      ? `[*] กำลังเริ่มต้นเซิร์ฟเวอร์ความเร็วสูง (Production Mode • Port ${PORT})...`
      : `[*] ยังไม่พบ .next build — กำลังเริ่มต้นในโหมด Development (Port ${PORT})...`
  );

  let activeServer = spawn(npmCmd, startScript, {
    stdio: "inherit",
    shell: isWindows,
    cwd: __dirname,
  });

  let opened = false;
  let stopped = false;
  let pollCount = 0;
  let pollTimer = null;

  function scheduleNextPoll() {
    if (opened || stopped || pollCount >= 180) return;
    pollTimer = setTimeout(checkAndOpenBrowser, 400);
  }

  function checkAndOpenBrowser() {
    if (opened || stopped) return;
    pollCount += 1;
    const req = http.get(URL, (res) => {
      res.resume();
      if (!opened && !stopped) {
        opened = true;
        console.log(`\n[✓] เซิร์ฟเวอร์พร้อมใช้งานแล้ว! กำลังเปิดเบราว์เซอร์ไปที่: ${URL}`);
        console.log("======================================================================");
        console.log(`  เข้าใช้งานเว็บได้ที่: ${URL}`);
        console.log("  (กด Ctrl + C หรือปิดหน้าต่างนี้เมื่อต้องการหยุดระบบ)");
        console.log("======================================================================\n");
        openBrowser(URL);
      }
    });
    req.on("error", scheduleNextPoll);
    req.setTimeout(1000, () => {
      req.destroy();
      scheduleNextPoll();
    });
  }

  pollTimer = setTimeout(checkAndOpenBrowser, 500);

  const forwardShutdown = (signal) => {
    stopped = true;
    if (pollTimer) clearTimeout(pollTimer);
    if (activeServer && !activeServer.killed) {
      activeServer.kill(signal);
    }
  };

  process.on("SIGINT", () => forwardShutdown("SIGINT"));
  process.on("SIGTERM", () => forwardShutdown("SIGTERM"));

  activeServer.on("error", (err) => {
    console.error("\n[ERROR] ไม่สามารถเริ่มต้นเซิร์ฟเวอร์ได้:", err.message);
    stopped = true;
    if (pollTimer) clearTimeout(pollTimer);
  });

  activeServer.on("close", (code) => {
    stopped = true;
    if (pollTimer) clearTimeout(pollTimer);
    if (code !== 0 && code !== null) {
      console.log(`\n[*] เซิร์ฟเวอร์หยุดทำงาน (Exit code: ${code})`);
      process.exitCode = code;
    }
  });
});
