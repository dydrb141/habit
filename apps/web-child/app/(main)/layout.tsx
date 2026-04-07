"use client";

import ProtectedRoute from "@/app/components/layout/ProtectedRoute";
import BottomNav from "@/app/components/layout/BottomNav";
import Header from "@/app/components/layout/Header";
import NetworkStatus from "@/app/components/feedback/NetworkStatus";
import { useEffect, useState } from "react";
import { apiClient } from "@/app/lib/api-client";
import type { AvailableBossResponse } from "@/app/types/boss";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [hasBossAvailable, setHasBossAvailable] = useState(false);

  useEffect(() => {
    const checkBoss = async () => {
      try {
        const data = await apiClient.get<AvailableBossResponse>(
          "/api/v1/boss/available"
        );
        setHasBossAvailable(data.available);
      } catch (error) {
        console.error("Failed to check boss availability:", error);
      }
    };

    checkBoss();

    // Check every 30 seconds
    const interval = setInterval(checkBoss, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <ProtectedRoute>
      <NetworkStatus />
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <Header />
        <main className="pb-20">{children}</main>
        <BottomNav hasBossAvailable={hasBossAvailable} />
      </div>
    </ProtectedRoute>
  );
}
