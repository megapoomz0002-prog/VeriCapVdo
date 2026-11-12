"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Key,
  Video,
  Music,
  Palette,
  Check,
  ShieldCheck,
  Loader2,
  Activity,
  ShieldAlert,
  Eye,
  EyeOff,
  Trash2,
  ExternalLink,
  Crown,
} from "lucide-react";
import LicenseModal, { LicenseSession } from "./LicenseModal";

interface HeaderProps {
  activeTab: "song" | "cover" | "mv";
  setActiveTab: (tab: "song" | "cover" | "mv") => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  licenseSession?: LicenseSession | null;
  setLicenseSession?: (session: LicenseSession | null) => void;
}

export default function Header({
  activeTab,
  setActiveTab,
  apiKey,
  setApiKey,
  licenseSession = null,
  setLicenseSession = () => {},
}: HeaderProps) {
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [tempGeminiKey, setTempGeminiKey] = useState(apiKey);
  const [showPassword, setShowPassword] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [hasServerKey, setHasServerKey] = useState(false);

  useEffect(() => {
    setTempGeminiKey(apiKey);
  }, [apiKey]);

  // Check if server environment variable has GEMINI_API_KEY
  useEffect(() => {
    fetch("/api/gemini/test-connection")
      .then((res) => res.json())
      .then((data) => {
        if (data?.hasServerKey) {
          setHasServerKey(true);
        }
      })
      .catch(() => {});
  }, []);

  const saveKeys = () => {
    const trimmed = tempGeminiKey.trim();
    setApiKey(trimmed);
    if (trimmed) {
      localStorage.setItem("gemini_api_key", trimmed);
    } else {
      localStorage.removeItem("gemini_api_key");
    }
    setShowKeyModal(false);
  };

  const clearKey = () => {
    setTempGeminiKey("");
    setApiKey("");
    localStorage.removeItem("gemini_api_key");
    setTestResult(null);
  };

  const handleTestKey = async () => {
    if (!tempGeminiKey.trim()) {
      setTestResult({ success: false, message: "กรุณากรอก API Key ก่อนกดทดสอบครับ" });
      return;
    }
    setIsTestingKey(true);
    setTestResult(null);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);

    try {
      const res = await fetch("/api/gemini/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: tempGeminiKey.trim() }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({ success: true, message: data.message });
      } else {
        setTestResult({ success: false, message: data.error || "เชื่อมต่อไม่สำเร็จ" });
      }
    } catch (e: any) {
      clearTimeout(timer);
      if (e.name === "AbortError") {
        setTestResult({ success: false, message: "การเชื่อมต่อหมดเวลา (เกิน 6 วินาที) กรุณาลองใหม่อีกครั้ง" });
      } else {
        setTestResult({ success: false, message: "เกิดข้อผิดพลาดในการเชื่อมต่อ: " + e.message });
      }
    } finally {
      setIsTestingKey(false);
    }
  };

  const isConfigured = Boolean(apiKey || hasServerKey);

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-fuchsia-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-fuchsia-500/25">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  VeriCapVdo Studio
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                  ฟรี 100% ไม่เสียเงิน
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                ระบบแต่งเพลง สร้างปก AI และตัดต่อ MV วิดีโอคาราโอเกะ (ฟรีทุกเครื่องมือ ไม่ต้องผูกบัตร)
              </p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="flex space-x-1 sm:space-x-2 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab("song")}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === "song"
                  ? "bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow-md shadow-fuchsia-600/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Music className="w-4 h-4" />
              <span>1. แต่งเพลง (Suno)</span>
            </button>

            <button
              onClick={() => setActiveTab("cover")}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === "cover"
                  ? "bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md shadow-cyan-600/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>2. สร้างปก AI (ฟรี)</span>
            </button>

            <button
              onClick={() => setActiveTab("mv")}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === "mv"
                  ? "bg-gradient-to-r from-cyan-600 to-emerald-600 text-white shadow-md shadow-emerald-600/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Video className="w-4 h-4" />
              <span>3. สร้าง MV วิดีโอ (ซิงก์ซับ AI)</span>
            </button>
          </nav>

          {/* License & API Key Actions */}
          <div className="flex items-center space-x-2">
            {/* Google Sheets License Key Button */}
            <button
              onClick={() => setShowLicenseModal(true)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                licenseSession
                  ? "bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25 shadow-sm shadow-amber-500/20"
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white"
              }`}
              title="ตรวจสอบสิทธิ์การใช้งานผ่านระบบ Google Sheets"
            >
              <Crown className={`w-3.5 h-3.5 ${licenseSession ? "text-amber-400" : "text-slate-400"}`} />
              <span className="hidden sm:inline">
                {licenseSession ? `👑 VIP: ${licenseSession.userName || "อนุมัติแล้ว"}` : "👑 ปลดล็อคระบบ (Sheets)"}
              </span>
              <span className="sm:hidden">
                {licenseSession ? "👑 VIP" : "👑 ปลดล็อค"}
              </span>
            </button>

            {/* Gemini API Key Button */}
            <button
              onClick={() => setShowKeyModal(true)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                apiKey
                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/25 shadow-sm shadow-emerald-500/20"
                  : hasServerKey
                  ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/25"
                  : "bg-amber-500/10 text-amber-300 border-amber-500/40 hover:bg-amber-500/20"
              }`}
              title="ตั้งค่า Google Gemini API Key สำหรับซิงก์ซับขั้นตอนที่ 3"
            >
              <Key className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">
                {apiKey
                  ? "🔑 Gemini API: พร้อมใช้งาน"
                  : hasServerKey
                  ? "🔑 เซิร์ฟเวอร์มี Key พร้อม"
                  : "🔑 กรอก Key ฟรี"}
              </span>
              <span className="sm:hidden">
                {isConfigured ? "🔑 มี Key" : "🔑 Key"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal for 100% Free Info & Google Gemini Key Entry */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 max-w-lg w-full shadow-2xl relative space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                  <Key className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">ตั้งค่า Google Gemini API Key</h3>
                  <p className="text-[11px] text-slate-400">ฟรี 100% ไม่ต้องผูกบัตรเครดิต</p>
                </div>
              </div>
              <button
                onClick={() => setShowKeyModal(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center font-bold text-base transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Server key badge if present */}
            {hasServerKey && (
              <div className="p-3 bg-cyan-950/40 border border-cyan-500/30 rounded-xl text-xs text-cyan-200 flex items-start space-x-2">
                <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  <strong>เซิร์ฟเวอร์เปิดใช้งาน Key ส่วนกลางแล้ว:</strong> ระบบพร้อมซิงก์เสียงได้ทันที แต่คุณยังสามารถกรอกคีย์ส่วนตัวของคุณเองด้านล่างได้หากต้องการใช้โควต้าแยก
                </span>
              </div>
            )}

            {/* How Key is Used */}
            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-300 space-y-2">
              <div className="font-bold text-emerald-300 flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>ขั้นตอนที่ใช้งาน API Key:</span>
              </div>
              <ul className="space-y-1.5 text-[11px] text-slate-300 list-disc list-inside leading-relaxed">
                <li><strong>ขั้นตอนที่ 1 & 2 (แต่งเพลง / สร้างปก):</strong> ฟรี 100% ไม่ต้องใช้ API Key ใดๆ (สร้างพรอพสำเร็จรูปให้คัดลอกได้ทันที)</li>
                <li><strong>ขั้นตอนที่ 3 (สร้าง MV & ซิงก์ซับคาราโอเกะ):</strong> <strong>ใช้ Google Gemini API Key เฉพาะขั้นตอนนี้</strong> เพื่อให้ AI ฟังเพลงจริงและจับเวลาคำต่อคำแม่นยำ 100%</li>
              </ul>
            </div>

            {/* Gemini Key Input Field */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200 flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Google AI Studio Key</span>
                </label>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline font-semibold flex items-center space-x-1"
                >
                  <span>กดรับคีย์ฟรี (ใช้ได้ทันที)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="AIzaSy... (วางคีย์ที่ได้จาก Google AI Studio ที่นี่)"
                  value={tempGeminiKey}
                  onChange={(e) => {
                    setTempGeminiKey(e.target.value);
                    setTestResult(null);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-3.5 pr-20 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                  {tempGeminiKey && (
                    <button
                      type="button"
                      onClick={clearKey}
                      className="p-1 rounded text-slate-400 hover:text-rose-400"
                      title="ล้างคีย์"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 rounded text-slate-400 hover:text-slate-200"
                    title={showPassword ? "ซ่อนคีย์" : "ดูคีย์"}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  disabled={isTestingKey || !tempGeminiKey.trim()}
                  onClick={handleTestKey}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 transition-all flex items-center space-x-1.5 disabled:opacity-40"
                >
                  {isTestingKey ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-300" />
                      <span>กำลังทดสอบการเชื่อมต่อ...</span>
                    </>
                  ) : (
                    <>
                      <Activity className="w-3.5 h-3.5 text-cyan-300" />
                      <span>⚡ ทดสอบการเชื่อมต่อ API</span>
                    </>
                  )}
                </button>
                <span className="text-[10px] text-slate-400 font-mono">โมเดล: Gemini 2.5 Flash</span>
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center space-x-2 animate-fadeIn ${
                    testResult.success
                      ? "bg-emerald-950/70 border-emerald-500/50 text-emerald-200"
                      : "bg-rose-950/70 border-rose-500/50 text-rose-200"
                  }`}
                >
                  {testResult.success ? (
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span className="font-semibold">{testResult.message}</span>
                </div>
              )}

              <p className="text-[10.5px] text-slate-400 leading-relaxed">
                * คีย์จะถูกบันทึกไว้อย่างปลอดภัยในเบราว์เซอร์ของคุณ (Local Storage) โดยไม่ส่งต่อไปยังบุคคลที่สามใดๆ
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowKeyModal(false)}
                className="px-3.5 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800 font-medium"
              >
                ปิดหน้าต่าง
              </button>
              <button
                onClick={saveKeys}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/30"
              >
                บันทึกคีย์ & เริ่มใช้งาน
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal for Google Sheets License Activation */}
      <LicenseModal
        isOpen={showLicenseModal}
        onClose={() => setShowLicenseModal(false)}
        session={licenseSession}
        onSessionChange={setLicenseSession}
      />
    </header>
  );
}
