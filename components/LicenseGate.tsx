"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ShieldCheck,
  Key,
  Crown,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  User,
  Clipboard,
  Lock,
} from "lucide-react";
import { readTextFromClipboard } from "@/lib/clipboard";
import { LicenseSession, getOrCreateDeviceId } from "./LicenseModal";

interface LicenseGateProps {
  onSuccess: (session: LicenseSession) => void;
}

export default function LicenseGate({ onSuccess }: LicenseGateProps) {
  const [keyInput, setKeyInput] = useState("");
  const [userName, setUserName] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [pasteHint, setPasteHint] = useState("");
  const unlockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setDeviceId(getOrCreateDeviceId());
    }
    return () => {
      if (unlockTimerRef.current) {
        clearTimeout(unlockTimerRef.current);
        unlockTimerRef.current = null;
      }
    };
  }, []);

  const handlePaste = async () => {
    setPasteHint("");
    const result = await readTextFromClipboard();
    if (result.ok && result.text.trim()) {
      setKeyInput(result.text.trim().toUpperCase().replace(/\s+/g, ""));
      setErrorMsg("");
    } else if (!result.ok) {
      setPasteHint("เบราว์เซอร์จำกัดสิทธิ์อ่านคลิปบอร์ดอัตโนมัติ — กรุณากด Ctrl+V / Cmd+V วางในช่องคีย์ได้ทันที");
    } else {
      setPasteHint("ไม่พบข้อความในคลิปบอร์ด — กรุณาคัดลอกคีย์แล้วลองอีกครั้ง");
    }
  };

  const handleVerifyAndUnlock = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanKey = keyInput.trim().toUpperCase().replace(/\s+/g, "");

    if (!cleanKey) {
      setErrorMsg("กรุณากรอก License Key ก่อนกดตรวจสอบครับ");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    setPasteHint("");

    try {
      const activeDeviceId = deviceId || getOrCreateDeviceId();
      const res = await fetch("/api/license/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: cleanKey,
          deviceId: activeDeviceId,
          userName: userName.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const session: LicenseSession = {
          licenseKey: data.licenseKey || cleanKey,
          userName: data.userName || userName.trim() || "ผู้ใช้งาน VIP",
          licenseType: data.licenseType || "Permanent",
          activatedAt: new Date().toISOString(),
          deviceId: activeDeviceId,
        };

        try {
          localStorage.setItem("vericap_license_session", JSON.stringify(session));
        } catch {
          // Non-fatal if storage is blocked
        }
        setSuccessMsg(data.message || "เปิดใช้งานสิทธิ์เข้าใช้งานสำเร็จเรียบร้อยแล้ว!");
        if (unlockTimerRef.current) clearTimeout(unlockTimerRef.current);
        unlockTimerRef.current = setTimeout(() => {
          onSuccess(session);
        }, 1200);
      } else {
        setErrorMsg(
          data.message ||
            "ไม่พบ License Key นี้ในระบบ Google Sheets หรือคีย์ถูกใช้งานบนเครื่องอื่นแล้ว"
        );
      }
    } catch (err: any) {
      setErrorMsg("เกิดข้อผิดพลาดในการเชื่อมต่อ: " + (err?.message || "ไม่สามารถติดต่อเซิร์ฟเวอร์ได้"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full relative">
        {/* Glow backdrop effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 via-fuchsia-500/20 to-cyan-500/20 rounded-3xl blur-xl opacity-75"></div>

        <div className="relative bg-slate-900/95 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
          {/* Header & Lock Icon */}
          <div className="text-center space-y-3">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Lock className="w-8 h-8 text-slate-950 stroke-[2.5]" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-center space-x-2">
                <h1 className="text-xl font-extrabold tracking-tight text-white">
                  VeriCapVdo Studio
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  ต้องมีสิทธิ์เข้าใช้
                </span>
              </div>
              <p className="text-xs text-slate-400">
                ระบบตรวจเช็คสิทธิ์การใช้งานผ่านตาราง Google Sheets
              </p>
            </div>
          </div>

          {/* Info Card */}
          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl text-xs text-slate-300 space-y-1.5 leading-relaxed">
            <div className="font-bold text-amber-300 flex items-center space-x-1.5">
              <Crown className="w-4 h-4 text-amber-400" />
              <span>กรุณากรอก License Key เพื่อเปิดใช้งาน</span>
            </div>
            <p className="text-[11px] text-slate-400">
              ระบบนี้จำกัดการเข้าใช้งานเฉพาะผู้ที่มีรหัสผ่านที่ได้รับอนุมัติใน Google Sheets เมื่อกรอกสำเร็จ ระบบจะปลดล็อคเครื่องมือแต่งเพลง สร้างปก และตัดต่อ MV ทั้งหมดทันที
            </p>
          </div>

          {/* Verification Form */}
          <form onSubmit={handleVerifyAndUnlock} className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="license-gate-key-input"
                  className="text-xs font-bold text-slate-200 flex items-center space-x-1.5"
                >
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>License Key (รหัสเข้าใช้งาน)</span>
                </label>
                <button
                  type="button"
                  onClick={handlePaste}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 font-semibold transition-colors"
                >
                  <Clipboard className="w-3 h-3" />
                  <span>วางจากคลิปบอร์ด</span>
                </button>
              </div>

              <input
                id="license-gate-key-input"
                type="text"
                autoFocus
                placeholder="เช่น VCV-ABCD-EFGH-JKLM-NPQR"
                value={keyInput}
                onChange={(e) => {
                  setKeyInput(e.target.value.toUpperCase());
                  setErrorMsg("");
                  setPasteHint("");
                }}
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 font-mono tracking-wider focus:outline-none transition-all shadow-inner"
              />
              {pasteHint && (
                <p className="text-[11px] text-amber-300/90 leading-relaxed">{pasteHint}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="license-gate-name-input"
                className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5"
              >
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>ชื่อของคุณหรือชื่อร้านค้า (ไม่บังคับ)</span>
              </label>
              <input
                id="license-gate-name-input"
                type="text"
                placeholder="ระบุชื่อเพื่อให้บันทึกลงใน Google Sheets"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-slate-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all shadow-inner"
              />
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div
                role="alert"
                className="p-3 bg-rose-950/70 border border-rose-500/50 rounded-xl text-xs text-rose-200 flex items-start space-x-2 animate-fadeIn"
              >
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-semibold">{errorMsg}</span>
              </div>
            )}

            {/* Success Message */}
            {successMsg && (
              <div
                role="status"
                className="p-3 bg-emerald-950/70 border border-emerald-500/50 rounded-xl text-xs text-emerald-200 flex items-start space-x-2 animate-fadeIn"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-semibold">{successMsg}</span>
              </div>
            )}

            {/* Unlock Button */}
            <button
              type="submit"
              disabled={isLoading || !keyInput.trim()}
              className="w-full py-3.5 rounded-2xl text-xs sm:text-sm font-bold bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-lg shadow-amber-500/25 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>กำลังตรวจสอบสิทธิ์กับ Google Sheets...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>🚀 ตรวจสอบสิทธิ์ & ปลดล็อคเข้าใช้งาน</span>
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <div className="pt-2 border-t border-slate-800 text-center space-y-1">
            <p className="text-[11px] text-slate-400">
              ยังไม่มี License Key? กรุณาติดต่อผู้ดูแลระบบเพื่อขอรับสิทธิ์เข้าใช้งาน
            </p>
            {deviceId && (
              <p className="text-[10px] text-slate-400 font-mono">
                Device ID: {deviceId}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
