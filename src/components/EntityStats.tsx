import React from 'react';
import { TrendingUp, FileText, Heart } from 'lucide-react';

export interface EntityStats {
  totalMentions: number;
  uniqueArticles: number;
  avgSentiment: number;
}

interface EntityStatsProps {
  stats: EntityStats;
}

const EntityStats: React.FC<EntityStatsProps> = ({ stats }) => {
  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0) return 'text-green-400';
    if (sentiment < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  const getSentimentLabel = (sentiment: number) => {
    if (sentiment > 2) return 'Very Positive';
    if (sentiment > 0) return 'Positive';
    if (sentiment < -2) return 'Very Negative';
    if (sentiment < 0) return 'Negative';
    return 'Neutral';
  };

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
        <div className="flex items-center space-x-2 mb-2">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          <span className="text-sm text-gray-400">Total Mentions</span>
        </div>
        <div className="text-2xl font-bold text-white">
          {stats.totalMentions.toLocaleString()}
        </div>
      </div>

      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
        <div className="flex items-center space-x-2 mb-2">
          <FileText className="w-5 h-5 text-purple-400" />
          <span className="text-sm text-gray-400">Unique Articles</span>
        </div>
        <div className="text-2xl font-bold text-white">
          {stats.uniqueArticles.toLocaleString()}
        </div>
      </div>

      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
        <div className="flex items-center space-x-2 mb-2">
          <Heart className="w-5 h-5 text-pink-400" />
          <span className="text-sm text-gray-400">Avg Sentiment</span>
        </div>
        <div className={`text-2xl font-bold ${getSentimentColor(stats.avgSentiment)}`}>
          {isNaN(stats.avgSentiment) ? '0.0' : stats.avgSentiment.toFixed(1)}
        </div>
        <div className={`text-xs ${getSentimentColor(stats.avgSentiment)}`}>
          {getSentimentLabel(stats.avgSentiment)}
        </div>
      </div>
    </div>
  );
};

export default EntityStats;