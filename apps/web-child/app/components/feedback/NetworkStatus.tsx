"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [showOffline, setShowOffline] = useState(false);

  useEffect(() => {
    // Initial check
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowOffline(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOffline(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Hide offline banner after 3 seconds when back online
  useEffect(() => {
    if (isOnline && showOffline) {
      const timer = setTimeout(() => setShowOffline(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, showOffline]);

  return (
    <AnimatePresence>
      {showOffline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-50"
        >
          <div
            className={`${
              isOnline
                ? "bg-green-600"
                : "bg-red-600"
            } text-white px-4 py-3 text-center font-medium shadow-lg`}
          >
            {isOnline ? (
              <>
                <span className="mr-2">✅</span>
                인터넷에 다시 연결되었습니다
              </>
            ) : (
              <>
                <span className="mr-2">⚠️</span>
                오프라인 상태입니다. 인터넷 연결을 확인해주세요.
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
