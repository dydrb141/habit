"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import Link from "next/link";

export default function PairingPage() {
  const router = useRouter();
  const { pairWithParent } = useAuth();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits, max 6 characters
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setCode(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (code.length !== 6) {
      setError("6자리 코드를 입력해주세요.");
      return;
    }

    setLoading(true);

    try {
      await pairWithParent(code);
      setSuccess(true);

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err: any) {
      setError(
        err.detail || err.message || "페어링에 실패했습니다. 코드를 확인해주세요."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    router.push("/dashboard");
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
        <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-green-500 rounded-full mx-auto flex items-center justify-center mb-4">
              <span className="text-5xl">✓</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              페어링 완료!
            </h2>
            <p className="text-gray-400">
              부모님과 연결되었습니다.
              <br />
              대시보드로 이동합니다...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700">
        <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
          부모님과 연결하기
        </h1>
        <p className="text-center text-gray-400 mb-8">
          부모님으로부터 받은 6자리 코드를 입력하세요
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Code Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              페어링 코드
            </label>
            <input
              type="text"
              value={code}
              onChange={handleChange}
              className="w-full px-4 py-4 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white text-center text-3xl font-mono tracking-widest"
              placeholder="000000"
              maxLength={6}
              required
            />
            <p className="text-xs text-gray-400 mt-2 text-center">
              {code.length}/6 자리
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
            <p className="text-blue-200 text-sm">
              💡 부모님 앱에서 "자녀 연결" 메뉴에서 코드를 생성할 수 있습니다.
              코드는 1시간 동안 유효합니다.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "연결 중..." : "연결하기"}
          </button>

          {/* Skip Button */}
          <button
            type="button"
            onClick={handleSkip}
            className="w-full bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium py-3 px-4 rounded-lg transition duration-200"
          >
            나중에 하기
          </button>
        </form>

        {/* Back Link */}
        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-gray-400 hover:text-gray-300 text-sm"
          >
            ← 로그인으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
