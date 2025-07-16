import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import NewsPage from './pages/NewsPage';
import NetworkPage from './pages/NetworkPage';
import TopicsPage from './pages/TopicsPage';
import ProjectInfoPage from './pages/ProjectInfoPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-900">
        <Header />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/network" element={<NetworkPage />} />
          <Route path="/topics" element={<TopicsPage />} />
          <Route path="/project-info" element={<ProjectInfoPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;