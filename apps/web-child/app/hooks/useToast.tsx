"use client";

import { useState, useCallback } from "react";
import { createPortal } from "react-dom";
import Toast, { ToastType } from "../components/feedback/Toast";

interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
}

export function useToast() {
  const [toasts, setToasts] = useState<
    Array<ToastOptions & { id: number }>
  >([]);

  const showToast = useCallback(
    ({ message, type = "info", duration = 3000 }: ToastOptions) => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message, type, duration }]);
    },
    []
  );

  const hideToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const ToastContainer = useCallback(() => {
    if (typeof window === "undefined" || toasts.length === 0) return null;

    return createPortal(
      <>
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            style={{ top: `${index * 80 + 16}px` }}
            className="absolute"
          >
            <Toast
              message={toast.message}
              type={toast.type}
              duration={toast.duration}
              onClose={() => hideToast(toast.id)}
            />
          </div>
        ))}
      </>,
      document.body
    );
  }, [toasts, hideToast]);

  return {
    showToast,
    ToastContainer,
    success: (message: string, duration?: number) =>
      showToast({ message, type: "success", duration }),
    error: (message: string, duration?: number) =>
      showToast({ message, type: "error", duration }),
    warning: (message: string, duration?: number) =>
      showToast({ message, type: "warning", duration }),
    info: (message: string, duration?: number) =>
      showToast({ message, type: "info", duration }),
  };
}
