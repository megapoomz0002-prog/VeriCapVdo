"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Key,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Crown,
  LogOut,
  Settings,
  Sparkles,
  User,
  Laptop,
} from "lucide-react";

export interface LicenseSession {
  licenseKey: string;
  userName?: string;
  licenseType: string;
  activatedAt?: string;
  deviceId: string;
}

interface LicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: LicenseSession | null;
  onSessionChange: (session: LicenseSession | null) => void;
}

export function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return "VCV-WEB-CLIENT";
  let id = localStorage.getItem("vericap_device_id");
  if (!id) {
    id =
      "VCV-WEB-" +
      Math.random().toString(36).substring(2, 7).toUpperCase() +
      "-" +
      Math.random().toString(36).substring(2, 7).toUpperCase();
    localStorage.setItem("vericap_device_id", id);
  }
  return id;
}

export default function LicenseModal({
  isOpen,
  onClose,
  session,
  onSessionChange,
}: LicenseModalProps) {
  const [keyInput, setKeyInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [customApiUrl, setCustomApiUrl] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [deviceId, setDeviceId] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setDeviceId(getOrCreateDeviceId());
      const savedApi = localStorage.getItem("vericap_custom_license_api") || "";
      if (savedApi) setCustomApiUrl(savedApi);
    }
  }, []);

  if (!isOpen) return null;

  const handleActivate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanKey = keyInput.trim().toUpperCase().replace(/\s+/g, "");

    if (!cleanKey) {
      setErrorMsg("กรุณากรอก License Key ก่อนกดตรวจสอบครับ");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/license/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: cleanKey,
          deviceId: deviceId || getOrCreateDeviceId(),
          userName: nameInput.trim(),
          apiUrl: customApiUrl.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const newSession: LicenseSession = {
          licenseKey: data.licenseKey || cleanKey,
          userName: data.userName || nameInput.trim() || "ผู้ใช้งาน VeriCapVdo",
          licenseType: data.licenseType || "Permanent",
          activatedAt: new Date().toISOString(),
          deviceId: deviceId || getOrCreateDeviceId(),
        };

        localStorage.setItem("vericap_license_session", JSON.stringify(newSession));
        if (customApiUrl.trim()) {
          localStorage.setItem("vericap_custom_license_api", customApiUrl.trim());
        }

        onSessionChange(newSession);
        setSuccessMsg(data.message || "เปิดใช้งานสิทธิ์เข้าใช้งานสำเร็จเรียบร้อยแล้ว!");
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setErrorMsg(data.message || "ไม่สามารถเปิดใช้งานคีย์นี้ได้ กรุณาตรวจสอบอีกครั้ง");
      }
    } catch (err: any) {
      setErrorMsg("เกิดข้อผิดพลาดในการเชื่อมต่อ: " + (err.message || "ไม่สามารถติดต่อเซิร์ฟเวอร์ได้"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    if (confirm("คุณต้องการออกจากระบบและลบสิทธิ์คีย์จากเบราว์เซอร์นี้หรือไม่?")) {
      localStorage.removeItem("vericap_license_session");
      onSessionChange(null);
      setSuccessMsg("");
      setErrorMsg("");
      setKeyInput("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 max-w-md w-full shadow-2xl relative space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
              <Crown className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">ระบบตรวจสอบสิทธิ์ Google Sheets</h3>
              <p className="text-[11px] text-slate-400">VeriCapVdo Cloud License</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center font-bold text-base transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Activated State View */}
        {session ? (
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-br from-amber-500/10 via-emerald-500/10 to-slate-900 border border-amber-500/30 rounded-xl space-y-3">
              <div className="flex items-center space-x-2 text-amber-300 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>สถานะ: อนุมัติสิทธิ์เข้าใช้งานเรียบร้อยแล้ว</span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300 font-mono bg-slate-950/80 p-3 rounded-lg border border-slate-800">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">License Key:</span>
                  <span className="font-bold text-amber-400">{session.licenseKey}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">ผู้ใช้งาน:</span>
                  <span className="text-white">{session.userName || "VIP Member"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">ประเภทสิทธิ์:</span>
                  <span className="text-emerald-400 font-semibold">{session.licenseType} (ตลอดชีพ)</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-800 text-[10px]">
                  <span className="text-slate-500">Device ID:</span>
                  <span className="text-slate-400 truncate max-w-[180px]">{session.deviceId}</span>
                </div>
              </div>

              <p className="text-[11px] text-emerald-300/90 leading-relaxed">
                ✨ คุณได้รับสิทธิ์ใช้งานระบบครบทุกขั้นตอน (สร้างเพลง, ปก AI และตัดต่อ MV วิดีโอคาราโอเกะ)
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 flex items-center space-x-1 transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>เปลี่ยนคีย์ / ล้างสิทธิ์</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition-all shadow-md"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        ) : (
          /* Form for Activating Key */
          <form onSubmit={handleActivate} className="space-y-3.5">
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-300 space-y-1.5 leading-relaxed">
              <div className="font-semibold text-white flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>กรอก License Key เพื่อเปิดสิทธิ์การใช้งาน</span>
              </div>
              <p className="text-[11px] text-slate-400">
                ระบบจะทำการตรวจสอบข้อมูลคีย์กับตาราง **Google Sheets** แบบเรียลไทม์ และผูกสิทธิ์เข้ากับอุปกรณ์ของคุณโดยอัตโนมัติ
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>License Key:</span>
              </label>
              <input
                type="text"
                placeholder="เช่น VCV-ABCD-EFGH-JKLM-NPQR หรือ VBX-..."
                value={keyInput}
                onChange={(e) => {
                  setKeyInput(e.target.value);
                  setErrorMsg("");
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono tracking-wider"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>ชื่อของคุณหรือร้านค้า (ไม่บังคับ):</span>
              </label>
              <input
                type="text"
                placeholder="ระบุชื่อเพื่อให้แสดงในตาราง Google Sheets"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-slate-500"
              />
            </div>

            {/* Advanced Settings for Custom Sheets URL */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center space-x-1 font-medium"
              >
                <Settings className="w-3 h-3 text-slate-500" />
                <span>{showAdvanced ? "ซ่อนการตั้งค่าเซิร์ฟเวอร์ Google Sheets" : "⚙️ ตั้งค่า URL Google Sheets (สำหรับแอดมิน)"}</span>
              </button>

              {showAdvanced && (
                <div className="mt-2 p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5 animate-fadeIn">
                  <label className="text-[10.5px] text-slate-400 block">
                    URL ของเว็บแอป Google Apps Script (หากปล่อยว่างจะใช้ค่ามาตรฐานของระบบ):
                  </label>
                  <input
                    type="url"
                    placeholder="https://script.google.com/macros/s/.../exec"
                    value={customApiUrl}
                    onChange={(e) => setCustomApiUrl(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-200 font-mono placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              )}
            </div>

            {/* Error & Success Messages */}
            {errorMsg && (
              <div className="p-3 bg-rose-950/70 border border-rose-500/50 rounded-xl text-xs text-rose-200 flex items-start space-x-2 animate-fadeIn">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-950/70 border border-emerald-500/50 rounded-xl text-xs text-emerald-200 flex items-start space-x-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-semibold">{successMsg}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800 font-medium"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-lg shadow-amber-500/25 flex items-center space-x-1.5 transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>กำลังตรวจเช็คกับ Google Sheets...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>ตรวจสอบสิทธิ์ & ปลดล็อค</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
