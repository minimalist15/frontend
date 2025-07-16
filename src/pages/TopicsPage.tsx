import React, { useState, useEffect } from 'react';
import TopicHierarchyChart from '../components/TopicHierarchyChart';
import { Layers, Database, Tag, TrendingUp } from 'lucide-react';
import { TopicHierarchyService, TopicHierarchyStats } from '../services/topicHierarchyService';

const TopicsPage: React.FC = () => {
  const [hierarchyStats, setHierarchyStats] = useState<TopicHierarchyStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    fetchHierarchyStats();
  }, []);

  const fetchHierarchyStats = async () => {
    try {
      setLoadingStats(true);
      const stats = await TopicHierarchyService.getHierarchyStats();
      setHierarchyStats(stats);
    } catch (error) {
      console.error('Error fetching hierarchy stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Topic Hierarchy</h1>
          <p className="text-gray-400">
            Explore topic categories and their hierarchical relationships
          </p>
        </div>

        {/* Statistics */}
        {!loadingStats && hierarchyStats && (
          <div className="mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                <div className="flex items-center space-x-2 mb-2">
                  <Layers className="w-5 h-5 text-blue-400" />
                  <span className="text-sm text-gray-400">Macro Topics</span>
                </div>
                <div className="text-2xl font-bold text-white">{hierarchyStats.totalMetaGroups}</div>
              </div>

              <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                <div className="flex items-center space-x-2 mb-2">
                  <Database className="w-5 h-5 text-cyan-400" />
                  <span className="text-sm text-gray-400">Sub Topics</span>
                </div>
                <div className="text-2xl font-bold text-white">{hierarchyStats.totalSubGroups}</div>
              </div>

              <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                <div className="flex items-center space-x-2 mb-2">
                  <Tag className="w-5 h-5 text-green-400" />
                  <span className="text-sm text-gray-400">Topics</span>
                </div>
                <div className="text-2xl font-bold text-white">{hierarchyStats.totalTopics}</div>
              </div>
            </div>
          </div>
        )}

        {/* Hierarchy Chart Only */}
        <div className="space-y-6">
          <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center space-x-3 mb-4">
              <Layers className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-semibold text-white">Topic Hierarchy</h2>
            </div>
            <p className="text-gray-400 mb-6">
              Interactive hierarchical visualization of meta topic groups and their sub-groups. 
              Click on circles to drill down into specific topic categories.
            </p>
            <TopicHierarchyChart />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopicsPage;