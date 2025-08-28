import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Recommendation from './pages/Recommendation';
// import History from './pages/History'; // 추천기록 기능 일시 비활성화

const App: React.FC = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/recommendation" element={<Recommendation />} />
        {/* <Route path="/history" element={<History />} /> 추천기록 기능 일시 비활성화 */}
      </Routes>
    </Layout>
  );
};

export default App;
