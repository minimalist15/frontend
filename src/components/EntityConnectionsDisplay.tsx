import React from 'react';
import { Users, MapPin, Building } from 'lucide-react';
import { ConnectionsByType } from '../services/entityConnectionService';

interface EntityConnectionsDisplayProps {
  connections: ConnectionsByType;
  onEntityClick?: (entityName: string, entityType: string) => void;
}

const EntityConnectionsDisplay: React.FC<EntityConnectionsDisplayProps> = ({ connections, onEntityClick }) => {
  const sections = [
    {
      title: 'People',
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
      data: connections.people || []
    },
    {
      title: 'Locations', 
      icon: MapPin,
      color: 'text-green-400',
      bgColor: 'bg-green-400/10',
      data: connections.locations || []
    },
    {
      title: 'Organizations',
      icon: Building,
      color: 'text-purple-400', 
      bgColor: 'bg-purple-400/10',
      data: connections.organizations || []
    }
  ];

  const ConnectionSection: React.FC<{
    title: string;
    icon: React.ComponentType<any>;
    color: string;
    bgColor: string;
    connections: Array<{ entityName: string; coOccurrenceCount: number; entityType: string }>;
    entityType: string;
  }> = ({ title, icon: Icon, color, bgColor, connections, entityType }) => {
    // Sort connections by coOccurrenceCount descending
    const sortedConnections = [...connections].sort((a, b) => b.coOccurrenceCount - a.coOccurrenceCount);
    return (
      <div className="space-y-3">
        <div className="flex items-center space-x-2 mb-2">
          <Icon size={16} className={color} />
          <span className={`font-semibold ${color}`}>{title} <span className="text-gray-400">({sortedConnections.length})</span></span>
        </div>
        <div className="max-h-56 overflow-y-auto pr-1 custom-scrollbar">
          {sortedConnections.map((conn, idx) => (
            <div
              key={conn.entityName}
              className={`flex items-center justify-between rounded-lg px-4 py-2 mb-1 cursor-pointer ${bgColor} hover:bg-opacity-80 transition`}
              onClick={() => onEntityClick && onEntityClick(conn.entityName, entityType)}
              tabIndex={0}
              role="button"
              aria-label={`View details for ${conn.entityName}`}
            >
              <span className="text-white font-mono text-sm">{conn.entityName}</span>
              <span className={`font-bold text-sm ${color}`}>{conn.coOccurrenceCount}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <ConnectionSection
        title="People"
        icon={Users}
        color="text-blue-400"
        bgColor="bg-blue-900/40"
        connections={connections.people}
        entityType="PERSON"
      />
      <ConnectionSection
        title="Locations"
        icon={MapPin}
        color="text-green-400"
        bgColor="bg-green-900/40"
        connections={connections.locations}
        entityType="LOCATION"
      />
      <ConnectionSection
        title="Organizations"
        icon={Building}
        color="text-purple-400"
        bgColor="bg-purple-900/40"
        connections={connections.organizations}
        entityType="ORGANIZATION"
      />
    </div>
  );
};

export default EntityConnectionsDisplay;