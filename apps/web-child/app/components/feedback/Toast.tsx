"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

const toastStyles: Record<ToastType, { bg: string; icon: string; border: string }> = {
  success: {
    bg: "bg-green-600",
    icon: "✅",
    border: "border-green-500",
  },
  error: {
    bg: "bg-red-600",
    icon: "❌",
    border: "border-red-500",
  },
  warning: {
    bg: "bg-yellow-600",
    icon: "⚠️",
    border: "border-yellow-500",
  },
  info: {
    bg: "bg-blue-600",
    icon: "ℹ️",
    border: "border-blue-500",
  },
};

export default function Toast({
  message,
  type = "info",
  duration = 3000,
  onClose,
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const style = toastStyles[type];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -50, scale: 0.9 }}
        className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-full mx-4`}
      >
        <div
          className={`${style.bg} ${style.border} border-2 rounded-xl p-4 shadow-2xl flex items-center gap-3`}
        >
          <span className="text-2xl">{style.icon}</span>
          <p className="text-white font-medium flex-1">{message}</p>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition text-xl"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
