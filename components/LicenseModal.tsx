"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ShieldCheck,
  Key,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Crown,
  LogOut,
  Sparkles,
  User,
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

function safeReadStorage(key: string): string | null {
  try {
    return typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}

function safeWriteStorage(key: string, value: string): void {
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // Ignore storage quota or private-mode restrictions
  }
}

function safeRemoveStorage(key: string): void {
  try {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Ignore storage restrictions
  }
}

export function maskLicenseKey(key?: string): string {
  const clean = (key || "").trim();
  if (!clean) return "••••-••••";
  if (clean.length <= 8) {
    return `${clean.slice(0, 2)}••••${clean.slice(-2)}`;
  }
  const parts = clean.split("-");
  if (parts.length >= 3) {
    return `${parts[0]}-••••-••••-${parts[parts.length - 1]}`;
  }
  return `${clean.slice(0, 4)}••••${clean.slice(-4)}`;
}

export function formatLicenseType(licenseType?: string): string {
  const raw = (licenseType || "Permanent").trim();
  const lower = raw.toLowerCase();
  if (lower.includes("permanent") || lower.includes("lifetime") || lower.includes("vip")) {
    return `${raw} (ตลอดชีพ)`;
  }
  return raw;
}

function createCryptoSegment(hexLength: number): string {
  try {
    if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
      const bytes = new Uint8Array(Math.ceil(hexLength / 2));
      window.crypto.getRandomValues(bytes);
      return Array.from(bytes, (b) => b.toString(16).padStart(2, "0"))
        .join("")
        .slice(0, hexLength)
        .toUpperCase();
    }
    if (typeof window !== "undefined" && typeof window.crypto?.randomUUID === "function") {
      return window.crypto.randomUUID().replace(/-/g, "").slice(0, hexLength).toUpperCase();
    }
  } catch {
    // Fall through to Math.random fallback
  }
  return Math.random().toString(16).slice(2, 2 + hexLength).padEnd(hexLength, "0").toUpperCase();
}

export function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return "VCV-WEB-CLIENT";
  let id = safeReadStorage("vericap_device_id");
  if (!id || id === "VCV-WEB-CLIENT") {
    id = `VCV-WEB-${createCryptoSegment(6)}-${createCryptoSegment(6)}`;
    safeWriteStorage("vericap_device_id", id);
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
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setDeviceId(getOrCreateDeviceId());
    }
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setConfirmingLogout(false);
      setErrorMsg("");
      setSuccessMsg("");
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading && !isLoggingOut) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, isLoggingOut, onClose]);

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
      const activeDeviceId = deviceId || getOrCreateDeviceId();
      const res = await fetch("/api/license/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: cleanKey,
          deviceId: activeDeviceId,
          userName: nameInput.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const newSession: LicenseSession = {
          licenseKey: data.licenseKey || cleanKey,
          userName: data.userName || nameInput.trim() || "ผู้ใช้งาน VeriCapVdo",
          licenseType: data.licenseType || "Permanent",
          activatedAt: new Date().toISOString(),
          deviceId: activeDeviceId,
        };

        safeWriteStorage("vericap_license_session", JSON.stringify(newSession));

        onSessionChange(newSession);
        setSuccessMsg(data.message || "เปิดใช้งานสิทธิ์เข้าใช้งานสำเร็จเรียบร้อยแล้ว!");
        if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
        closeTimerRef.current = setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setErrorMsg(data.message || "ไม่สามารถเปิดใช้งานคีย์นี้ได้ กรุณาตรวจสอบอีกครั้ง");
      }
    } catch (err: any) {
      setErrorMsg("เกิดข้อผิดพลาดในการเชื่อมต่อ: " + (err?.message || "ไม่สามารถติดต่อเซิร์ฟเวอร์ได้"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/license/verify", { method: "DELETE" });
    } catch {
      // Clear local session even if server logout fails
    } finally {
      safeRemoveStorage("vericap_license_session");
      onSessionChange(null);
      setSuccessMsg("");
      setErrorMsg("");
      setKeyInput("");
      setConfirmingLogout(false);
      setIsLoggingOut(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="license-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading && !isLoggingOut) onClose();
      }}
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 max-w-md w-full shadow-2xl relative space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
              <Crown className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 id="license-modal-title" className="text-base font-bold text-white">
                ระบบตรวจสอบสิทธิ์ Google Sheets
              </h3>
              <p className="text-[11px] text-slate-400">VeriCapVdo Cloud License</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่างตรวจสอบสิทธิ์"
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
                  <span className="font-bold text-amber-400">{maskLicenseKey(session.licenseKey)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">ผู้ใช้งาน:</span>
                  <span className="text-white">{session.userName || "VIP Member"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">ประเภทสิทธิ์:</span>
                  <span className="text-emerald-400 font-semibold">{formatLicenseType(session.licenseType)}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-800 text-[10px]">
                  <span className="text-slate-400">Device ID:</span>
                  <span className="text-slate-300 truncate max-w-[180px]">{session.deviceId}</span>
                </div>
              </div>

              <p className="text-[11px] text-emerald-300/90 leading-relaxed">
                ✨ คุณได้รับสิทธิ์ใช้งานระบบครบทุกขั้นตอน (สร้างเพลง, ปก AI และตัดต่อ MV วิดีโอคาราโอเกะ)
              </p>
            </div>

            {confirmingLogout ? (
              <div className="p-3 bg-rose-950/50 border border-rose-500/40 rounded-xl space-y-2.5 animate-fadeIn">
                <p className="text-xs text-rose-200 font-medium">
                  ต้องการออกจากระบบและลบสิทธิ์คีย์ออกจากเบราว์เซอร์นี้ใช่ไหม?
                </p>
                <div className="flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    disabled={isLoggingOut}
                    onClick={() => setConfirmingLogout(false)}
                    className="px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    disabled={isLoggingOut}
                    onClick={handleConfirmLogout}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center space-x-1.5 disabled:opacity-50"
                  >
                    {isLoggingOut && <Loader2 className="w-3 h-3 animate-spin" />}
                    <span>ยืนยันล้างสิทธิ์</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmingLogout(true)}
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
            )}
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
                ระบบจะตรวจสอบข้อมูลคีย์กับตาราง Google Sheets แบบเรียลไทม์ และผูกสิทธิ์เข้ากับอุปกรณ์ของคุณโดยอัตโนมัติ
              </p>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="license-modal-key-input"
                className="text-xs font-semibold text-slate-300 flex items-center space-x-1"
              >
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>License Key:</span>
              </label>
              <input
                id="license-modal-key-input"
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
              <label
                htmlFor="license-modal-name-input"
                className="text-xs font-semibold text-slate-300 flex items-center space-x-1"
              >
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>ชื่อของคุณหรือร้านค้า (ไม่บังคับ):</span>
              </label>
              <input
                id="license-modal-name-input"
                type="text"
                placeholder="ระบุชื่อเพื่อให้แสดงในตาราง Google Sheets"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-slate-500"
              />
            </div>

            {/* Error & Success Messages */}
            {errorMsg && (
              <div
                role="alert"
                className="p-3 bg-rose-950/70 border border-rose-500/50 rounded-xl text-xs text-rose-200 flex items-start space-x-2 animate-fadeIn"
              >
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div
                role="status"
                className="p-3 bg-emerald-950/70 border border-emerald-500/50 rounded-xl text-xs text-emerald-200 flex items-start space-x-2 animate-fadeIn"
              >
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
