import React from 'react';
import { useNavigate } from 'react-router-dom';

const KakaoLoginGuide: React.FC = () => {
  const navigate = useNavigate();

  const handleRegister = () => {
    navigate('/register');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            카카오 연동 안내
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            카카오 연동을 하시려면 로그인 후 가능합니다.
          </p>
        </div>
        
        <div className="mt-8 space-y-6">
          {/* 안내 메시지 */}
          <div className="text-center space-y-4">
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-center mb-3">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🔐</span>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">카카오 연동 안내</h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                카카오 연동을 하시려면 <span className="font-semibold text-orange-600">로그인 후 가능</span>합니다.
                <br />
                이 과정은 <span className="font-semibold text-orange-600">한번만 진행</span>되며, 
                연동 후에는 카카오 로그인을 사용하실 수 있습니다.
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-center mb-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🎯</span>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">로또리아 AI 회원가입</h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                <span className="font-semibold text-blue-600">로또리아 AI에 회원가입</span>을 하신 후 
                카카오 연동을 이용하시기 바랍니다.
              </p>
            </div>
          </div>

          {/* 버튼들 */}
          <div className="space-y-3">
            <button
              onClick={handleRegister}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <span className="mr-2">📝</span>
              회원가입하기
            </button>
            
            <button
              onClick={handleLogin}
              className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <span className="mr-2">🔑</span>
              로그인하기
            </button>
          </div>

          {/* 뒤로가기 */}
          <div className="text-center">
            <button
              onClick={() => navigate(-1)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ← 뒤로가기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KakaoLoginGuide;
