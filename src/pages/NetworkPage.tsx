import React from 'react';
import NetworkGraph from '../components/NetworkGraph';
import PerformanceMonitor from '../components/PerformanceMonitor';

const NetworkPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <PerformanceMonitor enabled={true} />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Entity Network</h1>
          <p className="text-gray-400">
            Explore connections between entities in the news data
          </p>
        </div>
        <NetworkGraph />
      </div>
    </div>
  );
};

export default NetworkPage;