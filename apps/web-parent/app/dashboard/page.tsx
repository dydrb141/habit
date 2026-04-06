"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PairingModal from "../components/PairingModal";
import ProgressBar from "../components/animations/ProgressBar";

interface Character {
  id: string;
  name?: string;
  level: number;
  exp: number;
  max_exp: number;
  hp: number;
  max_hp: number;
  gold: number;
  gems: number;
  stats: {
    strength: number;
    intelligence: number;
    vitality: number;
    luck: number;
  };
}

interface User {
  id: string;
  nickname: string;
  email: string;
}

interface Child {
  user: User;
  character: Character;
  paired_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPairingModal, setShowPairingModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const fetchChildren = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }

    try {
      // Fetch current user
      const userResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (userResponse.ok) {
        const userData = await userResponse.json();
        setCurrentUser(userData);
      }

      // Fetch children
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/family/children`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("자녀 목록을 불러올 수 없습니다.");
      }

      const data = await response.json();
      setChildren(data);
    } catch (err) {
      setError("데이터를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChildren();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/");
  };

  const handleChildClick = (childId: string) => {
    router.push(`/children/${childId}`);
  };

  const handlePairingClose = () => {
    setShowPairingModal(false);
    // Refresh children list
    fetchChildren();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-white text-xl">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-red-400 text-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">
              부모 관리자 대시보드
            </h1>
            {currentUser && (
              <p className="text-gray-400 mt-1">
                👤 {currentUser.nickname}님 환영합니다
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowPairingModal(true)}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-2 rounded-lg transition font-bold"
            >
              🔗 페어링 코드 생성
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
            >
              로그아웃
            </button>
          </div>
        </div>

        {/* Children List */}
        {children.length === 0 ? (
          <div className="bg-gray-800 rounded-2xl p-12 text-center border border-gray-700">
            <div className="text-gray-400 text-lg mb-4">
              아직 연결된 자녀가 없습니다
            </div>
            <p className="text-gray-500 mb-6">
              페어링 코드를 생성하여 자녀 앱에서 입력하세요
            </p>
            <button
              onClick={() => setShowPairingModal(true)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-lg transition"
            >
              🔗 페어링 코드 생성하기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {children.map((child) => (
              <div
                key={child.user.id}
                onClick={() => handleChildClick(child.user.id)}
                className="bg-gray-800 rounded-2xl p-6 border border-gray-700 cursor-pointer hover:border-purple-500 transition shadow-lg hover:shadow-2xl"
              >
                {/* Child Name */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {child.character.name || child.user.nickname}
                    </h2>
                    <p className="text-gray-400 text-sm">
                      @{child.user.nickname}
                    </p>
                  </div>
                  <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1 rounded-full font-bold text-sm">
                    Lv.{child.character.level}
                  </div>
                </div>

                {/* EXP Bar */}
                <div className="mb-4">
                  <ProgressBar
                    current={child.character.exp}
                    max={child.character.max_exp}
                    label="⭐ EXP"
                    color="bg-gradient-to-r from-blue-500 to-cyan-500"
                    animate={false}
                  />
                </div>

                {/* Currency */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-700 rounded-lg p-3">
                    <div className="text-yellow-400 text-xs mb-1">💰 골드</div>
                    <div className="text-white font-bold">
                      {child.character.gold}
                    </div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-3">
                    <div className="text-purple-400 text-xs mb-1">💎 보석</div>
                    <div className="text-white font-bold">
                      {child.character.gems}
                    </div>
                  </div>
                </div>

                {/* Stats Preview */}
                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-gray-700 rounded-lg p-2 text-center">
                    <div className="text-red-400 text-xs">⚔️</div>
                    <div className="text-white text-sm font-bold">
                      {child.character.stats.strength}
                    </div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-2 text-center">
                    <div className="text-blue-400 text-xs">🧠</div>
                    <div className="text-white text-sm font-bold">
                      {child.character.stats.intelligence}
                    </div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-2 text-center">
                    <div className="text-green-400 text-xs">❤️</div>
                    <div className="text-white text-sm font-bold">
                      {child.character.stats.vitality}
                    </div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-2 text-center">
                    <div className="text-yellow-400 text-xs">🍀</div>
                    <div className="text-white text-sm font-bold">
                      {child.character.stats.luck}
                    </div>
                  </div>
                </div>

                {/* Click to view details */}
                <div className="mt-4 text-center text-purple-400 text-sm">
                  클릭하여 자세히 보기 →
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pairing Modal */}
      <PairingModal
        isOpen={showPairingModal}
        onClose={handlePairingClose}
      />
    </div>
  );
}
