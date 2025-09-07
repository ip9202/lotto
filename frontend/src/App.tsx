import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Recommendation from './pages/Recommendation';
import Admin from './pages/Admin';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import { UserAuthProvider } from './contexts/UserAuthContext';
import PrivacyPolicy from './pages/PrivacyPolicy';
import CookieSettings from './pages/CookieSettings';
import Terms from './pages/Terms';
// import History from './pages/History'; // 이전기록 기능 개발 중 - 일시 비활성화

const App: React.FC = () => {
  return (
    <UserAuthProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/recommendation" element={<Recommendation />} />
          <Route path="/admin" element={
            <AdminAuthProvider>
              <Admin />
            </AdminAuthProvider>
          } />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/cookie-settings" element={<CookieSettings />} />
          <Route path="/terms" element={<Terms />} />
          {/* <Route path="/history" element={<History />} /> 이전기록 기능 개발 중 - 일시 비활성화 */}
        </Routes>
      </Layout>
    </UserAuthProvider>
  );
};

export default App;
