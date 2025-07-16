import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import EntityStats from './EntityStats';
import EntityConnectionsDisplay from './EntityConnectionsDisplay';
import EntityPieChart from './EntityPieChart';
import EntitySentimentChart from './EntitySentimentChart';
import EntityNewsSection from './EntityNewsSection';
import { EntityConnectionService, ConnectionsByType } from '../services/entityConnectionService';
import { EntityStatsService, EntityStats as EntityStatsType } from '../services/entityStatsService';

interface EntityPopupProps {
  entityName: string;
  entityType: string;
  onClose: () => void;
}

const EntityPopup: React.FC<EntityPopupProps> = ({ entityName, entityType, onClose }) => {
  console.log('EntityPopup: Rendering with entityName:', entityName, 'entityType:', entityType); // Add debugging
  
  const [activeTab, setActiveTab] = useState('overview');
  const [connections, setConnections] = useState<ConnectionsByType>({
    people: [],
    locations: [],
    organizations: []
  });
  const [stats, setStats] = useState<EntityStatsType>({
    totalMentions: 0,
    uniqueArticles: 0,
    avgSentiment: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedEntity, setSelectedEntity] = useState<{ name: string; type: string } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [connectionsData, statsData] = await Promise.all([
          EntityConnectionService.getTopConnections(entityName),
          EntityStatsService.getEntityStats(entityName)
        ]);
        
        setConnections(connectionsData);
        setStats(statsData);
      } catch (error) {
        console.error('Error fetching entity data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [entityName]);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'sentiment', label: 'Sentiment' },
    { id: 'publishers', label: 'Publishers' },
    { id: 'news', label: 'News' }, // News tab moved to the end
  ];

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-700">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${
                entityType === 'PERSON' ? 'bg-blue-600' :
                entityType === 'LOCATION' ? 'bg-green-600' :
                'bg-purple-600'
              }`}>
                {entityName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{entityName}</h2>
                <p className="text-gray-400 capitalize">{entityType.toLowerCase()}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors duration-300"
            >
              <X size={20} />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-700">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 font-medium transition-colors duration-300 ${
                  activeTab === tab.id
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
              </div>
            ) : (
              <>
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {stats && <EntityStats stats={stats} />}
                    <EntityConnectionsDisplay
                      connections={connections}
                      onEntityClick={(name, type) => setSelectedEntity({ name, type })}
                    />
                  </div>
                )}

                {activeTab === 'sentiment' && (
                  <EntitySentimentChart entityName={entityName} entityType={entityType} />
                )}

                {activeTab === 'news' && (
                  <EntityNewsSection entityName={entityName} />
                )}

                {activeTab === 'publishers' && (
                  <React.Suspense fallback={<div className='text-gray-400'>Loading chart...</div>}>
                    <EntityPieChart entityName={entityName} hideTitle />
                  </React.Suspense>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      {selectedEntity && (
        <EntityPopup
          entityName={selectedEntity.name}
          entityType={selectedEntity.type}
          onClose={() => setSelectedEntity(null)}
        />
      )}
    </>
  );
};

export default EntityPopup;