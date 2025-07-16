import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { EntityService } from '../services/entityService';
import { NetworkNode, NetworkLink } from '../types/database';
import ForceGraph2D from './ForceGraph2D';
import NetworkFilters from './NetworkFilters';
import EntityPopup from './EntityPopup';

interface NetworkData {
  nodes: NetworkNode[];
  links: NetworkLink[];
}

interface GraphState {
  nodePositions: Map<string, { x: number; y: number }>;
  zoomLevel: number;
  center: { x: number; y: number };
}

interface OriginalGraphCache {
  data: NetworkData;
  state: GraphState | null;
}

// Extended node and link interfaces with visibility flags
interface VisibleNetworkNode extends NetworkNode {
  visible: boolean;
}

interface VisibleNetworkLink extends NetworkLink {
  visible: boolean;
}

interface VisibleNetworkData {
  nodes: VisibleNetworkNode[];
  links: VisibleNetworkLink[];
}

const NetworkGraph: React.FC = () => {
  // Original data state with visibility flags (never changes after initial load)
  const [originalNetworkData, setOriginalNetworkData] = useState<VisibleNetworkData>({ nodes: [], links: [] });
  
  // Cache for the original graph state (with all connections)
  const [originalGraphCache, setOriginalGraphCache] = useState<OriginalGraphCache | null>(null);
  
  // Graph state cache to preserve layout between filters
  const [graphState, setGraphState] = useState<GraphState | undefined>(undefined);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<VisibleNetworkNode | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntityTypes, setSelectedEntityTypes] = useState<Set<string>>(
    new Set(['PERSON', 'LOCATION', 'ORGANIZATION'])
  );
  const [minConnections, setMinConnections] = useState(1);
  const [selectedEntities, setSelectedEntities] = useState<{ value: string; label: string; type: string }[]>([]);

  // Add this new state for highlighted node
  const [highlightedNode, setHighlightedNode] = useState<VisibleNetworkNode | null>(null);

  // Fetch initial network data
  useEffect(() => {
    const fetchNetworkData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await EntityService.getNetworkData();
        
        // Add visibility flags to all nodes and links
        const visibleData: VisibleNetworkData = {
          nodes: data.nodes.map(node => ({
            ...node,
            visible: true
          })),
          links: data.links.map(link => ({
            ...link,
            visible: true
          }))
        };
        
        // Store original data with visibility flags (never changes)
        setOriginalNetworkData(visibleData);
        
        // Cache the original state for restoration
        setOriginalGraphCache({
          data: data, // Store original data without visibility flags for restoration
          state: null // Will be populated when graph initializes
        });
      } catch (err) {
        console.error('Error fetching network data:', err);
        setError('Failed to load network data');
      } finally {
        setLoading(false);
      }
    };

    fetchNetworkData();
  }, []);

  // Memoize filtered data using visibility flags instead of creating new arrays
  const networkData = useMemo(() => {
    if (originalNetworkData.nodes.length === 0) {
      return { nodes: [], links: [] };
    }

    // If entities are selected, filter to only those and their direct connections
    if (selectedEntities.length > 0) {
      const selectedNames = new Set(selectedEntities.map(e => e.value));
      const filteredNodes = originalNetworkData.nodes.filter(
        node => selectedNames.has(node.name)
      );
      // Optionally, include directly connected nodes:
      const connectedNodeIds = new Set(filteredNodes.map(n => n.id));
      const filteredLinks = originalNetworkData.links.filter(
        link => connectedNodeIds.has(link.source) || connectedNodeIds.has(link.target)
      );
      // Optionally, add connected nodes to filteredNodes
      filteredLinks.forEach(link => {
        connectedNodeIds.add(link.source);
        connectedNodeIds.add(link.target);
      });
      const allNodes = originalNetworkData.nodes.filter(node => connectedNodeIds.has(node.id));
      return { nodes: allNodes, links: filteredLinks };
    }

    // Pre-compile search term for case-insensitive matching
    const searchLower = searchTerm.toLowerCase();
    const hasSearchTerm = searchTerm.length > 0;

    // Update visibility flags on nodes based on filters
    const updatedNodes = originalNetworkData.nodes.map(node => {
      let visible = true;
      
      // Search filter
      if (hasSearchTerm && !node.name.toLowerCase().includes(searchLower)) {
        visible = false;
      }
      
      // Entity type filter
      if (!selectedEntityTypes.has(node.type)) {
        visible = false;
      }
      
      // Minimum connections filter
      if (node.connections < minConnections) {
        visible = false;
      }
      
      return {
        ...node,
        visible
      };
    });

    // Create a Set of visible node IDs for O(1) lookup
    const visibleNodeIds = new Set(
      updatedNodes.filter(node => node.visible).map(node => node.id)
    );

    // Update visibility flags on links based on visible nodes
    const updatedLinks = originalNetworkData.links.map(link => ({
      ...link,
      visible: visibleNodeIds.has(link.source) && visibleNodeIds.has(link.target)
    }));

    // Return only visible nodes and links (but keep original object references)
    const visibleNodes = updatedNodes.filter(node => node.visible);
    const visibleLinks = updatedLinks.filter(link => link.visible);

    console.log('NetworkGraph: Visibility-based filtering:', {
      totalNodes: originalNetworkData.nodes.length,
      totalLinks: originalNetworkData.links.length,
      visibleNodes: visibleNodes.length,
      visibleLinks: visibleLinks.length,
      hasCachedState: !!graphState,
      cachedNodes: graphState?.nodePositions?.size || 0,
      // Verify we're preserving object references
      nodesAreSame: visibleNodes.length > 0 && originalNetworkData.nodes.includes(visibleNodes[0]),
      linksAreSame: visibleLinks.length > 0 && originalNetworkData.links.includes(visibleLinks[0])
    });

    return {
      nodes: visibleNodes,
      links: visibleLinks
    };
  }, [originalNetworkData, searchTerm, selectedEntityTypes, minConnections, selectedEntities, graphState]);

  // Update visibility flags in original data when filters change
  useEffect(() => {
    if (originalNetworkData.nodes.length === 0) return;

    // Pre-compile search term for case-insensitive matching
    const searchLower = searchTerm.toLowerCase();
    const hasSearchTerm = searchTerm.length > 0;

    // Update visibility flags on nodes based on filters
    const updatedNodes = originalNetworkData.nodes.map(node => {
      let visible = true;
      
      // Search filter
      if (hasSearchTerm && !node.name.toLowerCase().includes(searchLower)) {
        visible = false;
      }
      
      // Entity type filter
      if (!selectedEntityTypes.has(node.type)) {
        visible = false;
      }
      
      // Minimum connections filter
      if (node.connections < minConnections) {
        visible = false;
      }
      
      return {
        ...node,
        visible
      };
    });

    // Create a Set of visible node IDs for O(1) lookup
    const visibleNodeIds = new Set(
      updatedNodes.filter(node => node.visible).map(node => node.id)
    );

    // Update visibility flags on links based on visible nodes
    const updatedLinks = originalNetworkData.links.map(link => ({
      ...link,
      visible: visibleNodeIds.has(link.source) && visibleNodeIds.has(link.target)
    }));

    // Update the original data with new visibility flags
    setOriginalNetworkData({
      nodes: updatedNodes,
      links: updatedLinks
    });
  }, [searchTerm, selectedEntityTypes, minConnections]);

  // Enhanced graph state restoration
  const handleGraphStateChange = useCallback((newState: GraphState) => {
    console.log('NetworkGraph: Graph state changed, nodes:', newState.nodePositions.size);
    
    // Always update the current graph state
    setGraphState(newState);
    
    // If this is the first time we're getting a state, cache it as the original
    if (originalGraphCache && !originalGraphCache.state) {
      console.log('NetworkGraph: Caching original graph state');
      setOriginalGraphCache(prev => prev ? {
        ...prev,
        state: newState
      } : null);
    }
  }, [originalGraphCache]);

  // Reset graph layout
  const handleResetLayout = useCallback(() => {
    setGraphState(undefined);
    // Force a complete reset by triggering a re-render
    setTimeout(() => {
      // This will cause the graph to reinitialize
    }, 100);
  }, []);

  // Restore original state (with all connections)
  const handleRestoreOriginal = useCallback(() => {
    if (originalGraphCache?.state) {
      console.log('Restoring original state with all connections...');
      
      // Step 1: Temporarily show all original data to restore connections
      const tempData = originalGraphCache.data;
      
      // Step 2: Apply the original cached state to preserve layout
      setGraphState(originalGraphCache.state);
      
      // Step 3: Force a re-render with the original data
      // We'll use a temporary override mechanism
      const originalNetworkDataBackup = originalNetworkData;
      setOriginalNetworkData({
        nodes: tempData.nodes.map(node => ({ ...node, visible: true })),
        links: tempData.links.map(link => ({ ...link, visible: true }))
      });
      
      // Step 4: After connections are restored, gradually reapply filters
      setTimeout(() => {
        setOriginalNetworkData(originalNetworkDataBackup);
        console.log('Original connections restored, re-applying filters...');
      }, 1000);
    }
  }, [originalGraphCache, originalNetworkData]);

  // Update the click handler
  const handleNodeClick = useCallback((node: VisibleNetworkNode) => {
    console.log('NetworkGraph: Node clicked!', node);
    
    // If clicking the same node that's already highlighted, open popup
    if (highlightedNode?.id === node.id) {
      setSelectedNode(node);
      setHighlightedNode(null); // Clear highlight when opening popup
    } else {
      // First click: highlight the node and its connections
      setHighlightedNode(node);
      setSelectedNode(null); // Close any open popup
    }
  }, [highlightedNode]);

  // Add a clear highlight function
  const handleClearHighlight = useCallback(() => {
    setHighlightedNode(null);
  }, []);

  const handleClosePopup = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // Debug: Monitor selectedNode changes
  useEffect(() => {
    console.log('NetworkGraph: selectedNode changed:', selectedNode);
  }, [selectedNode]);

  // Monitor network data changes and ensure connections are preserved
  useEffect(() => {
    console.log('NetworkGraph: Network data changed:', {
      nodes: networkData.nodes.length,
      links: networkData.links.length,
      hasCachedState: !!graphState,
      cachedNodes: graphState?.nodePositions?.size || 0
    });
    
    // If we have nodes but no links, and we have cached state, try to restore connections
    if (networkData.nodes.length > 0 && networkData.links.length === 0 && graphState) {
      console.log('NetworkGraph: No links found but have cached state, attempting to restore connections');
      // This will trigger the ForceGraph2D to restore the layout with connections
    }
  }, [networkData, graphState]);

  // Memoize stats to avoid recalculating on every render
  const stats = useMemo(() => ({
    filteredNodes: networkData.nodes.length,
    filteredLinks: networkData.links.length,
    totalNodes: originalNetworkData.nodes.length,
    totalLinks: originalNetworkData.links.length,
    hasCachedState: !!graphState,
    cachedNodes: graphState?.nodePositions?.size || 0,
    hasOriginalCache: !!originalGraphCache?.state,
    originalCacheNodes: originalGraphCache?.state?.nodePositions?.size || 0
  }), [networkData, originalNetworkData, graphState, originalGraphCache]);

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
          <p className="text-lg font-semibold mb-2">Error Loading Network</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-white">{stats.filteredNodes}</div>
          <div className="text-sm text-gray-400">Entities</div>
        </div>
        <div className="bg-gray-800/50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-white">{stats.filteredLinks}</div>
          <div className="text-sm text-gray-400">Connections</div>
        </div>
        <div className="bg-gray-800/50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-white">{stats.totalNodes}</div>
          <div className="text-sm text-gray-400">Total Entities</div>
        </div>
        <div className="bg-gray-800/50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-white">{stats.totalLinks}</div>
          <div className="text-sm text-gray-400">Total Connections</div>
        </div>
      </div>

      {/* Filters and Graph */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters */}
        <div className="lg:col-span-1">
          <NetworkFilters
            selectedEntityTypes={selectedEntityTypes}
            onEntityTypeChange={setSelectedEntityTypes}
            minConnections={minConnections}
            onMinConnectionsChange={setMinConnections}
          />
          
          {/* Legend */}
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 text-white z-10 mt-4">
            <h4 className="font-semibold mb-2">Entity Types</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>People</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Locations</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span>Organizations</span>
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-400">
              <div>• Node size = connection count</div>
              <div>• Node opacity = connection strength</div>
              <div>• Zoom in to see labels</div>
              <div>• First click: highlight connections</div>
              <div>• Second click: open details</div>
              <div>• Drag nodes to reposition</div>
              <div>• Layout preserved between filters</div>
            </div>
          </div>
          
          {/* Reset Layout Button */}
          <div className="mt-4">
            <button
              onClick={handleResetLayout}
              className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200 text-sm"
              title="Reset graph layout to default position"
            >
              Reset Layout
            </button>
          </div>
          
          {/* Clear Selection Button */}
          {highlightedNode && (
            <div className="mt-2">
              <button
                onClick={handleClearHighlight}
                className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors duration-200 text-sm"
                title="Clear node selection"
              >
                Clear Selection
              </button>
            </div>
          )}
          
          {/* Restore Connections Button */}
          <div className="mt-2">
            <button
              onClick={handleRestoreOriginal}
              className="w-full px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 text-sm"
              title="Restore original state with all connections"
              disabled={!originalGraphCache?.state}
            >
              {originalGraphCache?.state ? 'Restore All Connections' : 'No Original Cache'}
            </button>
          </div>
          
          {/* Debug: Manual Restart Button */}
          <div className="mt-2">
            <button
              onClick={() => {
                console.log('NetworkGraph: Manual restart requested');
                // This will trigger a re-render of the ForceGraph2D
                setGraphState(prev => prev ? { ...prev } : undefined);
              }}
              className="w-full px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-lg transition-colors duration-200 text-sm"
              title="Manually restart graph simulation"
            >
              Restart Simulation
            </button>
          </div>
        </div>

        {/* Graph */}
        <div className="lg:col-span-3">
          <div className="bg-gray-800/50 rounded-lg border border-gray-700 h-[600px]">
            {networkData.nodes.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-400 text-center">
                  <p className="text-lg font-semibold mb-2">No entities match your filters</p>
                  <p className="text-sm">Try adjusting your search or filter criteria</p>
                </div>
              </div>
            ) : (
              <ForceGraph2D
                nodes={networkData.nodes}
                links={networkData.links}
                onNodeClick={handleNodeClick}
                highlightedNode={highlightedNode} // Add this prop
                graphState={graphState}
                onGraphStateChange={handleGraphStateChange}
                preserveLayout={true}
              />
            )}
          </div>
        </div>
      </div>

      {/* Entity Popup */}
      {selectedNode && (
        <EntityPopup
          entityName={selectedNode.name}
          entityType={selectedNode.type}
          onClose={handleClosePopup}
        />
      )}
    </div>
  );
};

export default NetworkGraph;