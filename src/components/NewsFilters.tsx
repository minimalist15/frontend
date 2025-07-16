import React, { useState, useEffect, useRef } from 'react';
import { Filter, X, Calendar } from 'lucide-react';
import { FilterOptions, ActiveFilters, EntityOption, TopicOption } from '../types/filters';
import type { NewsFilters } from '../types/filters';
import { fetchFilterOptions, fetchEntityTypes, fetchFilteredNews, fetchAvailableFilterOptions } from '../lib/newsApi';
import MultiSelectDropdown, { Option } from './MultiSelectDropdown';

interface NewsFiltersProps {
  onFiltersChange: (filters: NewsFilters) => void;
  activeFilters: ActiveFilters;
}

const NewsFilters: React.FC<NewsFiltersProps> = ({ onFiltersChange, activeFilters }) => {
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    countries: [],
    entities: [],
    topics: [],
    dateRange: { start: null, end: null }
  });
  const [entityTypes, setEntityTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({
    countries: true,
    entities: true,
    topics: true,
    dateRange: true
  });

  // New: Interconnected filter state
  const [dynamicOptions, setDynamicOptions] = useState<FilterOptions>(filterOptions);
  const [isDynamicLoading, setIsDynamicLoading] = useState(false);
  const resettingRef = useRef(false);

  useEffect(() => {
    loadFilterOptions();
  }, []);

  const loadFilterOptions = async () => {
    try {
      setLoading(true);
      const [options, types] = await Promise.all([
        fetchFilterOptions(),
        fetchEntityTypes()
      ]);
      setFilterOptions(options);
      setEntityTypes(types);
    } catch (error) {
      console.error('Error loading filter options:', error);
      // Set default empty options on error
      setFilterOptions({
        countries: [],
        entities: [],
        topics: [],
        dateRange: { start: null, end: null }
      });
      setEntityTypes([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper: get news IDs matching current filters
  const getFilteredNewsIds = async (filters: NewsFilters) => {
    const news = await fetchFilteredNews(filters, 1000); // Large enough limit
    return news.map(n => n.id);
  };

  // Update dynamic filter options after any filter change
  const updateDynamicOptions = async (filters: NewsFilters) => {
    setIsDynamicLoading(true);
    const newsIds = await getFilteredNewsIds(filters);
    const options = await fetchAvailableFilterOptions(newsIds);
    setDynamicOptions(options);
    setIsDynamicLoading(false);
    // Deselect any options that are no longer available
    // Countries
    if (activeFilters.countries.some(c => !options.countries.includes(c))) {
      updateFilters({ countries: activeFilters.countries.filter(c => options.countries.includes(c)) });
    }
    // Entities
    if (activeFilters.entities.some(e => !options.entities.some(opt => opt.name === e.name && opt.type === e.type))) {
      updateFilters({ entities: activeFilters.entities.filter(e => options.entities.some(opt => opt.name === e.name && opt.type === e.type)) });
    }
    // Topics
    if (activeFilters.topics.some(t => !options.topics.some(opt => opt.metaGroup === t.metaGroup && opt.subGroup === t.subGroup && opt.topic === t.topic))) {
      updateFilters({ topics: activeFilters.topics.filter(t => options.topics.some(opt => opt.metaGroup === t.metaGroup && opt.subGroup === t.subGroup && opt.topic === t.topic)) });
    }
  };

  // On any filter change, update dynamic options
  useEffect(() => {
    if (resettingRef.current) return;
    const filters: NewsFilters = {
      countries: activeFilters.countries.length > 0 ? activeFilters.countries : undefined,
      entityNames: activeFilters.entities.map(e => e.name),
      entityTypes: [...new Set(activeFilters.entities.map(e => e.type))],
      topics: activeFilters.topics.map(t => t.topic),
      startDate: activeFilters.dateRange.start?.toISOString(),
      endDate: activeFilters.dateRange.end?.toISOString()
    };
    updateDynamicOptions(filters);
    // eslint-disable-next-line
  }, [activeFilters]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const updateFilters = (newFilters: Partial<ActiveFilters>) => {
    const updatedFilters = { ...activeFilters, ...newFilters };
    
    console.log('NewsFilters: Updating filters:', { 
      old: activeFilters, 
      new: updatedFilters,
      changes: newFilters 
    });
    
    // Convert to NewsFilters format
    const newsFilters: NewsFilters = {
      countries: updatedFilters.countries.length > 0 ? updatedFilters.countries : undefined,
      entityNames: updatedFilters.entities.map(e => e.name),
      entityTypes: [...new Set(updatedFilters.entities.map(e => e.type))],
      topics: updatedFilters.topics.map(t => t.topic),
      startDate: updatedFilters.dateRange.start?.toISOString(),
      endDate: updatedFilters.dateRange.end?.toISOString()
    };

    // Remove undefined values
    Object.keys(newsFilters).forEach(key => {
      if (newsFilters[key as keyof NewsFilters] === undefined) {
        delete newsFilters[key as keyof NewsFilters];
      }
    });

    console.log('NewsFilters: Calling onFiltersChange with:', newsFilters);
    onFiltersChange(newsFilters);
  };

  const addCountry = (country: string) => {
    if (!activeFilters.countries.includes(country)) {
      updateFilters({
        countries: [...activeFilters.countries, country]
      });
    }
  };

  const removeCountry = (country: string) => {
    updateFilters({
      countries: activeFilters.countries.filter(c => c !== country)
    });
  };

  const addEntity = (entity: EntityOption) => {
    if (!activeFilters.entities.some(e => e.name === entity.name && e.type === entity.type)) {
      updateFilters({
        entities: [...activeFilters.entities, entity]
      });
    }
  };

  const removeEntity = (entity: EntityOption) => {
    updateFilters({
      entities: activeFilters.entities.filter(e => 
        !(e.name === entity.name && e.type === entity.type)
      )
    });
  };

  const addTopic = (topic: TopicOption) => {
    if (!activeFilters.topics.some(t => 
      t.metaGroup === topic.metaGroup && 
      t.subGroup === topic.subGroup && 
      t.topic === topic.topic
    )) {
      updateFilters({
        topics: [...activeFilters.topics, topic]
      });
    }
  };

  const removeTopic = (topic: TopicOption) => {
    updateFilters({
      topics: activeFilters.topics.filter(t => 
        !(t.metaGroup === topic.metaGroup && 
          t.subGroup === topic.subGroup && 
          t.topic === topic.topic)
      )
    });
  };

  const updateDateRange = (field: 'start' | 'end', value: Date | null) => {
    updateFilters({
      dateRange: {
        ...activeFilters.dateRange,
        [field]: value
      }
    });
  };

  const clearAllFilters = async () => {
    resettingRef.current = true;
    updateFilters({
      countries: [],
      entities: [],
      topics: [],
      dateRange: { start: null, end: null }
    });
    setIsDynamicLoading(true);
    const allOptions = await fetchFilterOptions();
    setDynamicOptions(allOptions);
    setIsDynamicLoading(false);
    setTimeout(() => { resettingRef.current = false; }, 100); // allow state to settle
  };

  const hasActiveFilters = activeFilters.countries.length > 0 || 
    activeFilters.entities.length > 0 || 
    activeFilters.topics.length > 0 || 
    activeFilters.dateRange.start || 
    activeFilters.dateRange.end;

  if (loading) {
    return (
      <div className="bg-gray-800/50 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
          <span className="ml-2 text-gray-300">Loading filters...</span>
        </div>
      </div>
    );
  }

  // Use dynamicOptions for dropdowns
  const countryOptions: Option[] = dynamicOptions.countries.map(c => ({ label: c, value: c }));
  const entityOptions: Option[] = dynamicOptions.entities.map(e => ({ label: e.name, value: `${e.name}|${e.type}`, description: e.type, count: e.count }));
  const topicOptions: Option[] = dynamicOptions.topics.map(t => ({ label: t.topic, value: `${t.metaGroup}|${t.subGroup}|${t.topic}`, description: `${t.metaGroup} • ${t.subGroup}` }));

  // Helper: map selected to dropdown options
  const selectedCountryOptions = countryOptions.filter(opt => activeFilters.countries.includes(opt.value));
  const selectedEntityOptions = entityOptions.filter(opt => activeFilters.entities.some(e => `${e.name}|${e.type}` === opt.value));
  const selectedTopicOptions = topicOptions.filter(opt => activeFilters.topics.some(t => `${t.metaGroup}|${t.subGroup}|${t.topic}` === opt.value));

  // Handlers for dropdown changes
  const handleCountryChange = (selected: Option[]) => {
    updateFilters({ countries: selected.map(opt => opt.value) });
  };
  const handleEntityChange = (selected: Option[]) => {
    const selectedEntities: EntityOption[] = selected.map(opt => {
      const [name, type] = opt.value.split('|');
      const found = dynamicOptions.entities.find(e => e.name === name && e.type === type);
      return found || { name, type, count: 0 };
    });
    updateFilters({ entities: selectedEntities });
  };
  const handleTopicChange = (selected: Option[]) => {
    const selectedTopics: TopicOption[] = selected.map(opt => {
      const [metaGroup, subGroup, topic] = opt.value.split('|');
      const found = dynamicOptions.topics.find(t => t.metaGroup === metaGroup && t.subGroup === subGroup && t.topic === topic);
      return found || { metaGroup, subGroup, topic, count: 0 };
    });
    updateFilters({ topics: selectedTopics });
  };

  return (
    <div className="bg-gray-800/50 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="text-blue-400" size={20} />
          <h3 className="text-lg font-semibold text-white">Filters</h3>
        </div>
        <button
          onClick={clearAllFilters}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Clear All
        </button>
      </div>

      {/* Active Filters Display (unchanged) */}
      {hasActiveFilters && (
        <div className="mb-4 p-3 bg-gray-700/30 rounded-lg">
          <div className="flex flex-wrap gap-2">
            {activeFilters.countries.map(country => (
              <span key={country} className="flex items-center space-x-1 bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-sm">
                <span>{country}</span>
                <button onClick={() => removeCountry(country)} className="hover:text-white">
                  <X size={12} />
                </button>
              </span>
            ))}
            {activeFilters.entities.map(entity => (
              <span key={`${entity.name}-${entity.type}`} className="flex items-center space-x-1 bg-green-500/20 text-green-300 px-2 py-1 rounded text-sm">
                <span>{entity.name} ({entity.type})</span>
                <button onClick={() => removeEntity(entity)} className="hover:text-white">
                  <X size={12} />
                </button>
              </span>
            ))}
            {activeFilters.topics.map(topic => (
              <span key={`${topic.metaGroup}-${topic.subGroup}-${topic.topic}`} className="flex items-center space-x-1 bg-purple-500/20 text-purple-300 px-2 py-1 rounded text-sm">
                <span>{topic.topic}</span>
                <button onClick={() => removeTopic(topic)} className="hover:text-white">
                  <X size={12} />
                </button>
              </span>
            ))}
            {(activeFilters.dateRange.start || activeFilters.dateRange.end) && (
              <span className="flex items-center space-x-1 bg-orange-500/20 text-orange-300 px-2 py-1 rounded text-sm">
                <span>
                  {activeFilters.dateRange.start?.toLocaleDateString()} - {activeFilters.dateRange.end?.toLocaleDateString() || 'Now'}
                </span>
                <button onClick={() => updateDateRange('start', null)} className="hover:text-white">
                  <X size={12} />
                </button>
              </span>
            )}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Countries Dropdown */}
        <MultiSelectDropdown
          options={countryOptions}
          selected={selectedCountryOptions}
          onChange={handleCountryChange}
          label="Countries"
          placeholder="Select countries..."
        />
        {/* Entities Dropdown */}
        <MultiSelectDropdown
          options={entityOptions}
          selected={selectedEntityOptions}
          onChange={handleEntityChange}
          label="Entities"
          placeholder="Select entities..."
        />
        {/* Topics Dropdown */}
        <MultiSelectDropdown
          options={topicOptions}
          selected={selectedTopicOptions}
          onChange={handleTopicChange}
          label="Topics"
          placeholder="Select topics..."
        />
        {/* Date Range Filter (unchanged) */}
        <div>
          <button
            onClick={() => toggleSection('dateRange')}
            className="flex items-center justify-between w-full text-left"
          >
            <div className="flex items-center space-x-2">
              <Calendar className="text-orange-400" size={16} />
              <span className="font-medium text-white">Date Range</span>
              {(activeFilters.dateRange.start || activeFilters.dateRange.end) && (
                <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                  Set
                </span>
              )}
            </div>
            {expandedSections.dateRange ? <span>▲</span> : <span>▼</span>}
          </button>
          {expandedSections.dateRange && (
            <div className="mt-3 space-y-3">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Start Date</label>
                <input
                  type="date"
                  value={activeFilters.dateRange.start?.toISOString().split('T')[0] || ''}
                  onChange={(e) => updateDateRange('start', e.target.value ? new Date(e.target.value) : null)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">End Date</label>
                <input
                  type="date"
                  value={activeFilters.dateRange.end?.toISOString().split('T')[0] || ''}
                  onChange={(e) => updateDateRange('end', e.target.value ? new Date(e.target.value) : null)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-400"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewsFilters; 