import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Recommendation from './pages/Recommendation';
import Admin from './pages/Admin';
import History from './pages/History';
import { AdminAuthProvider } from './contexts/AdminAuthContext';

const App: React.FC = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/recommendation" element={<Recommendation />} />
        <Route path="/admin" element={
          <AdminAuthProvider>
            <Admin />
          </AdminAuthProvider>
        } />
        <Route path="/history" element={<History />} />
      </Routes>
    </Layout>
  );
};

export default App;
