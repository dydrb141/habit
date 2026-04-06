"use client";

import { useState } from "react";

interface PairingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PairingModal({ isOpen, onClose }: PairingModalProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setCode("");
    setCopied(false);

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/pairing/generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({}),
        }
      );

      if (!response.ok) {
        throw new Error("코드 생성 실패");
      }

      const data = await response.json();
      setCode(data.code);
    } catch (err) {
      setError("페어링 코드 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 border border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">페어링 코드 생성</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ✕
          </button>
        </div>

        <p className="text-gray-400 mb-6">
          자녀 앱에서 이 코드를 입력하면 연결됩니다. 코드는 1시간 동안
          유효합니다.
        </p>

        {!code && !loading && (
          <button
            onClick={handleGenerate}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-lg transition"
          >
            코드 생성하기
          </button>
        )}

        {loading && (
          <div className="text-center py-8">
            <div className="text-white text-lg">코드 생성 중...</div>
          </div>
        )}

        {code && (
          <div className="space-y-4">
            <div className="bg-gray-700 rounded-xl p-6 text-center">
              <div className="text-4xl font-bold text-white tracking-widest mb-2">
                {code}
              </div>
              <div className="text-gray-400 text-sm">
                1시간 후 만료됩니다
              </div>
            </div>

            <button
              onClick={handleCopy}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition"
            >
              {copied ? "✓ 복사됨!" : "📋 코드 복사"}
            </button>

            <button
              onClick={onClose}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition"
            >
              닫기
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg text-sm mt-4">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
