import React, { useState, useEffect } from 'react';
import { TopicService, TopicNetworkData } from '../services/topicService';
import { TopicNode, TopicLink } from '../types/database';
import { Hash, Tag, Users } from 'lucide-react';

// Simple force-directed graph component for topics
interface SimpleTopicGraphProps {
  nodes: TopicNode[];
  links: TopicLink[];
  onNodeClick: (node: TopicNode) => void;
}

const SimpleTopicGraph: React.FC<SimpleTopicGraphProps> = ({ nodes, links, onNodeClick }) => {
  return (
    <div className="w-full h-96 bg-gray-800 rounded-lg border border-gray-700 flex items-center justify-center">
      <div className="text-center">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-4xl">
          {nodes.filter(n => n.type === 'CLASS').map((classNode) => (
            <div key={classNode.id} className="space-y-2">
              {/* Topic Class */}
              <div
                onClick={() => onNodeClick(classNode)}
                className="bg-purple-600 hover:bg-purple-500 rounded-lg p-3 cursor-pointer transition-colors duration-300"
              >
                <div className="flex items-center space-x-2 mb-2">
                  <Hash size={16} className="text-white" />
                  <span className="text-white font-semibold text-sm">{classNode.name}</span>
                </div>
                <div className="text-xs text-purple-200">
                  {classNode.entity_names.length} entities
                </div>
              </div>
              
              {/* Individual Topics in this class */}
              <div className="space-y-1">
                {nodes
                  .filter(n => n.type === 'TOPIC' && n.parent_id === classNode.id)
                  .slice(0, 3)
                  .map((topicNode) => (
                    <div
                      key={topicNode.id}
                      onClick={() => onNodeClick(topicNode)}
                      className="bg-cyan-600 hover:bg-cyan-500 rounded p-2 cursor-pointer transition-colors duration-300"
                    >
                      <div className="flex items-center space-x-1">
                        <Tag size={12} className="text-white" />
                        <span className="text-white text-xs truncate">{topicNode.name}</span>
                      </div>
                      <div className="text-xs text-cyan-200">
                        {topicNode.entity_names.length} entities
                      </div>
                    </div>
                  ))}
                {nodes.filter(n => n.type === 'TOPIC' && n.parent_id === classNode.id).length > 3 && (
                  <div className="text-xs text-gray-400 text-center">
                    +{nodes.filter(n => n.type === 'TOPIC' && n.parent_id === classNode.id).length - 3} more
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 text-gray-400 text-sm">
          <p>Click on topic classes (purple) or individual topics (cyan) to explore details</p>
        </div>
      </div>
    </div>
  );
};

// Topic details popup
interface TopicDetailsProps {
  node: TopicNode;
  onClose: () => void;
}

const TopicDetails: React.FC<TopicDetailsProps> = ({ node, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden border border-gray-700">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${
              node.type === 'CLASS' ? 'bg-purple-600' : 'bg-cyan-600'
            }`}>
              {node.type === 'CLASS' ? <Hash size={20} /> : <Tag size={20} />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{node.name}</h2>
              <p className="text-gray-400 capitalize">{node.type === 'CLASS' ? 'Topic Class' : 'Individual Topic'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors duration-300"
          >
            ×
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  <span className="text-sm text-gray-400">Entities</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {node.entity_names.length}
                </div>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <div className="flex items-center space-x-2 mb-2">
                  <Hash className="w-5 h-5 text-purple-400" />
                  <span className="text-sm text-gray-400">Features</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {node.feature_ids.length}
                </div>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <div className="flex items-center space-x-2 mb-2">
                  <Tag className="w-5 h-5 text-green-400" />
                  <span className="text-sm text-gray-400">Connections</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {node.connections}
                </div>
              </div>
            </div>

            {/* Top Entities */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Associated Entities</h3>
              {node.entity_names.length === 0 ? (
                <div className="bg-gray-800/30 rounded-lg p-3 text-center">
                  <span className="text-gray-500 text-sm">No entities found</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {node.entity_names.slice(0, 20).map((entity, index) => (
                    <div key={index} className="bg-gray-800/50 rounded-lg p-2">
                      <span className="text-white text-sm">{entity}</span>
                    </div>
                  ))}
                  {node.entity_names.length > 20 && (
                    <div className="col-span-2 text-center text-gray-400 text-sm">
                      +{node.entity_names.length - 20} more entities
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TopicGraph: React.FC = () => {
  const [networkData, setNetworkData] = useState<TopicNetworkData>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<TopicNode | null>(null);

  useEffect(() => {
    const fetchTopicData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await TopicService.getTopicNetworkData();
        setNetworkData(data);
      } catch (err) {
        console.error('Error fetching topic data:', err);
        setError('Failed to load topic data');
      } finally {
        setLoading(false);
      }
    };

    fetchTopicData();
  }, []);

  const handleNodeClick = (node: TopicNode) => {
    setSelectedNode(node);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-400 text-center">
          <p className="text-lg font-semibold mb-2">Error Loading Topics</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const topicClasses = networkData.nodes.filter(n => n.type === 'CLASS');
  const individualTopics = networkData.nodes.filter(n => n.type === 'TOPIC');
  const hierarchyLinks = networkData.links.filter(l => l.type === 'HIERARCHY');
  const coOccurrenceLinks = networkData.links.filter(l => l.type === 'CO_OCCURRENCE');

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Hash className="w-5 h-5 text-purple-400" />
            <span className="text-sm text-gray-400">Topic Classes</span>
          </div>
          <div className="text-2xl font-bold text-white">{topicClasses.length}</div>
        </div>

        <div className="bg-gray-800/50 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Tag className="w-5 h-5 text-cyan-400" />
            <span className="text-sm text-gray-400">Individual Topics</span>
          </div>
          <div className="text-2xl font-bold text-white">{individualTopics.length}</div>
        </div>

        <div className="bg-gray-800/50 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Users className="w-5 h-5 text-green-400" />
            <span className="text-sm text-gray-400">Hierarchy Links</span>
          </div>
          <div className="text-2xl font-bold text-white">{hierarchyLinks.length}</div>
        </div>

        <div className="bg-gray-800/50 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Users className="w-5 h-5 text-yellow-400" />
            <span className="text-sm text-gray-400">Co-occurrence Links</span>
          </div>
          <div className="text-2xl font-bold text-white">{coOccurrenceLinks.length}</div>
        </div>
      </div>

      {/* Graph */}
      <SimpleTopicGraph
        nodes={networkData.nodes}
        links={networkData.links}
        onNodeClick={handleNodeClick}
      />

      {/* Topic Details Popup */}
      {selectedNode && (
        <TopicDetails
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  );
};

export default TopicGraph;