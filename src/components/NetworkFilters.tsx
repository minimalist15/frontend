import React from 'react';
import { Filter, Users, MapPin, Building } from 'lucide-react';

interface NetworkFiltersProps {
  selectedEntityTypes: Set<string>;
  onEntityTypeChange: (types: Set<string>) => void;
  minConnections: number;
  onMinConnectionsChange: (min: number) => void;
}

const NetworkFilters: React.FC<NetworkFiltersProps> = ({
  selectedEntityTypes,
  onEntityTypeChange,
  minConnections,
  onMinConnectionsChange,
}) => {
  const entityTypes = [
    { value: 'PERSON', label: 'People', icon: Users, color: 'text-blue-400' },
    { value: 'LOCATION', label: 'Locations', icon: MapPin, color: 'text-green-400' },
    { value: 'ORGANIZATION', label: 'Organizations', icon: Building, color: 'text-purple-400' },
  ];

  const handleEntityTypeToggle = (type: string) => {
    const newTypes = new Set(selectedEntityTypes);
    if (newTypes.has(type)) {
      newTypes.delete(type);
    } else {
      newTypes.add(type);
    }
    onEntityTypeChange(newTypes);
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 space-y-4">
      <div className="flex items-center space-x-2 text-white">
        <Filter size={20} />
        <h3 className="font-semibold">Filters</h3>
      </div>

      {/* Entity Types */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">Entity Types</label>
        <div className="space-y-2">
          {entityTypes.map((type) => {
            const Icon = type.icon;
            return (
              <label key={type.value} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedEntityTypes.has(type.value)}
                  onChange={() => handleEntityTypeToggle(type.value)}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                />
                <Icon className={`${type.color}`} size={16} />
                <span className="text-gray-300 text-sm">{type.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Minimum Connections */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">
          Minimum Connections: {minConnections}
        </label>
        <input
          type="range"
          min="1"
          max="20"
          value={minConnections}
          onChange={(e) => onMinConnectionsChange(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
        />
      </div>
    </div>
  );
};

export default NetworkFilters;