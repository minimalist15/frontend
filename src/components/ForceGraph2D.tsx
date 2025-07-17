import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import ForceGraphComponent from 'react-force-graph/dist/react-force-graph-2d.mjs';
import { NetworkNode, NetworkLink } from '../types/database';

interface GraphState {
  nodePositions: Map<string, { x: number; y: number }>;
  zoomLevel: number;
  center: { x: number; y: number };
}

// Extended interfaces to support visibility flags
interface VisibleNetworkNode extends NetworkNode {
  visible: boolean;
  isDragged?: boolean;
}

interface VisibleNetworkLink extends NetworkLink {
  visible: boolean;
}

interface ForceGraph2DProps {
  nodes: VisibleNetworkNode[];
  links: VisibleNetworkLink[];
  onNodeClick?: (node: VisibleNetworkNode) => void;
  highlightedNode?: VisibleNetworkNode | null; // Add this prop
  graphState?: GraphState;
  onGraphStateChange?: (state: GraphState) => void;
  preserveLayout?: boolean;
}

const ForceGraph2D: React.FC<ForceGraph2DProps> = ({ 
  nodes, 
  links, 
  onNodeClick, 
  highlightedNode, // Add this prop
  graphState,
  onGraphStateChange,
  preserveLayout = true 
}) => {
  const fgRef = useRef<any>();
  // Remove hoveredNode state - we'll use highlightedNode instead
  const isInitialized = useRef(false);
  const [isRestoringLayout, setIsRestoringLayout] = useState(false);
  const [draggedNode, setDraggedNode] = useState<VisibleNetworkNode | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Memoize expensive calculations
  const graphStats = useMemo(() => {
    if (nodes.length === 0) return { maxConnections: 1, maxSize: 90, baseSize: 30 };
    
    const maxConnections = Math.max(...nodes.map(n => n.connections), 1);
    return { maxConnections, maxSize: 90, baseSize: 30 };
  }, [nodes]);

  // Memoize color cache
  const colorCache = useMemo(() => {
    const cache = new Map<string, string>();
    const baseColors = {
      PERSON: '#3b82f6',     // blue
      LOCATION: '#10b981',   // green
      ORGANIZATION: '#f59e0b' // orange
    };

    nodes.forEach(node => {
    const baseColor = baseColors[node.type] || '#6b7280';
      const intensity = Math.max(0.4, node.connections / graphStats.maxConnections);
    
    // Convert hex to rgba for opacity control
    const hex = baseColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
      cache.set(node.id, `rgba(${r}, ${g}, ${b}, ${intensity})`);
    });

    return cache;
  }, [nodes, graphStats.maxConnections]);

  // Memoize size cache
  const sizeCache = useMemo(() => {
    const cache = new Map<string, number>();
    
    nodes.forEach(node => {
      if (graphStats.maxConnections === 0) {
        cache.set(node.id, graphStats.baseSize);
      } else {
        const scaleFactor = node.connections / graphStats.maxConnections;
        const size = graphStats.baseSize + (scaleFactor * (graphStats.maxSize - graphStats.baseSize));
        cache.set(node.id, size);
      }
    });

    return cache;
  }, [nodes, graphStats]);

  // Apply cached positions to nodes if available
  const nodesWithPositions = useMemo(() => {
    if (!preserveLayout || !graphState?.nodePositions) {
      return nodes;
    }

    console.log('ForceGraph2D: Applying cached positions to', nodes.length, 'nodes');

    return nodes.map(node => {
      const cachedPosition = graphState.nodePositions.get(node.id);
      if (cachedPosition) {
        return {
          ...node,
          x: cachedPosition.x,
          y: cachedPosition.y,
          // Don't fix positions - let force simulation work naturally
        };
      }
      return node;
    });
  }, [nodes, graphState?.nodePositions, preserveLayout]);

  // Save graph state periodically
  const saveGraphState = useCallback(() => {
    if (!fgRef.current || !onGraphStateChange) return;

    const graph = fgRef.current;
    
    // Check if graph is properly initialized and has the required methods
    if (!graph || typeof graph.graphData !== 'function') {
      console.warn('ForceGraph2D: Graph not properly initialized, skipping state save');
      return;
    }

    const nodePositions = new Map<string, { x: number; y: number }>();
    
    try {
      // Save positions of all visible nodes from the actual graph data
      const graphData = graph.graphData();
      if (graphData && graphData.nodes) {
        graphData.nodes.forEach((node: any) => {
          if (node.x !== undefined && node.y !== undefined) {
            nodePositions.set(node.id, { x: node.x, y: node.y });
          }
        });
      }

      // Get current zoom and center
      const zoomLevel = graph.zoom ? graph.zoom() : 1;
      const center = graph.center ? graph.center() : { x: 0, y: 0 };

      const newState: GraphState = {
        nodePositions,
        zoomLevel,
        center
      };

      console.log('ForceGraph2D: Saving graph state with', nodePositions.size, 'node positions');
      onGraphStateChange(newState);
    } catch (error) {
      console.warn('Error saving graph state:', error);
    }
  }, [onGraphStateChange]);

  // Unified drag handler for react-force-graph
  const handleNodeDrag = useCallback((node: any) => {
    if (!isDragging) {
      // Drag start
      setIsDragging(true);
      setDraggedNode(node as VisibleNetworkNode);
      document.body.style.cursor = 'grabbing';
      node.fx = undefined;
      node.fy = undefined;
      node.isDragged = true; // Mark as dragged
      if (fgRef.current && fgRef.current.d3ReheatSimulation) {
        // Re-enable forces for dragging
        fgRef.current.d3Force('charge', undefined);
        fgRef.current.d3Force('link', undefined);
        fgRef.current.d3Force('center', undefined);
        fgRef.current.d3ReheatSimulation();
      }
    } else {
      // Dragging (no-op, just update position)
      setDraggedNode(node as VisibleNetworkNode);
    }
  }, [isDragging]);

  // Listen for drag end globally
  useEffect(() => {
    const handleMouseUp = () => {
      if (isDragging && draggedNode) {
        // Drag end
        setIsDragging(false);
        document.body.style.cursor = 'default';
        draggedNode.fx = draggedNode.x;
        draggedNode.fy = draggedNode.y;
        draggedNode.isDragged = false; // Clear dragged flag
        setDraggedNode(null);
        if (fgRef.current && fgRef.current.d3Force) {
          fgRef.current.d3Force().stop();
          fgRef.current.d3Force('charge', null);
          fgRef.current.d3Force('link', null);
          fgRef.current.d3Force('center', null);
        }
      }
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [isDragging, draggedNode]);

  // --- Remove pinning and force stop after initial layout ---
  useEffect(() => {
    if (fgRef.current && nodes.length > 0) {
      if (!isInitialized.current) {
        setTimeout(() => {
          fgRef.current.zoomToFit(400, 50);
          // Do NOT pin all nodes or stop the simulation here!
          isInitialized.current = true;
        }, 100);
      } else if (graphState && preserveLayout) {
        const cachedNodeCount = graphState.nodePositions?.size || 0;
        const currentNodeCount = nodes.length;
        if (cachedNodeCount > 0 && cachedNodeCount >= currentNodeCount * 0.5) {
          setIsRestoringLayout(true);
          setTimeout(() => {
            const graph = fgRef.current;
            if (!graph || typeof graph.graphData !== 'function') {
              setIsRestoringLayout(false);
              return;
            }
            try {
              const graphData = graph.graphData();
              if (graphState.nodePositions && graphData && graphData.nodes) {
                graphState.nodePositions.forEach((cachedPosition, nodeId) => {
                  const currentNode = graphData.nodes.find((n: any) => n.id === nodeId);
                  if (currentNode) {
                    currentNode.x = cachedPosition.x;
                    currentNode.y = cachedPosition.y;
                  }
                });
                // Do NOT pin all nodes here!
                graph.graphData(graphData);
              }
              if (graphState.zoomLevel && graph.zoom) {
                graph.zoom(graphState.zoomLevel);
              }
              if (graphState.center && graph.centerAt) {
                graph.centerAt(graphState.center.x, graphState.center.y);
              }
              if (graph && graph.d3Force) {
                graph.d3Force().stop();
                graph.d3Force('charge', null);
                graph.d3Force('link', null);
                graph.d3Force('center', null);
              }
            } catch (error) {}
            setTimeout(() => setIsRestoringLayout(false), 500);
          }, 100);
        }
      }
    }
  }, [nodes, links, graphState, preserveLayout]);

  // --- Force simulation tuning for more spacing and collision ---
  useEffect(() => {
    if (fgRef.current && nodes.length > 0) {
      if (fgRef.current.d3Force) {
        const linkForce = fgRef.current.d3Force('link');
        if (linkForce) linkForce.distance(nodes.length < 50 ? 300 : 180); // More spread for small graphs
        fgRef.current.d3Force('charge').strength(nodes.length < 50 ? -400 : -800); // Less repulsion for small graphs
        // Add collision force to prevent overlap
        if (typeof fgRef.current.d3Force('collide')?.radius === 'function') {
          fgRef.current.d3Force('collide').radius(30); // Adjust as needed
        } else if (typeof fgRef.current.d3Force === 'function') {
          // If collide force is not present, add it
          try {
            fgRef.current.d3Force('collide', window.d3.forceCollide(30));
          } catch {}
        }
      }
    }
  }, [nodes]);

  const handleNodeClick = useCallback((node: any) => {
    if (onNodeClick) {
      onNodeClick(node as VisibleNetworkNode);
    }
  }, [onNodeClick]);

  // Memo: IDs of nodes connected to highlighted node
  const connectedNodeIds = useMemo(() => {
    if (!highlightedNode) return new Set();
    const ids = new Set();
    links.forEach(link => {
      if (link.source === highlightedNode.id) ids.add(link.target);
      if (link.target === highlightedNode.id) ids.add(link.source);
    });
    return ids;
  }, [highlightedNode, links]);

  // Memo: IDs of links connected to highlighted node
  const connectedLinkIds = useMemo(() => {
    if (!highlightedNode) return new Set();
    const ids = new Set();
    links.forEach(link => {
      if (link.source === highlightedNode.id || link.target === highlightedNode.id) {
        ids.add(`${link.source}|${link.target}`);
      }
    });
    return ids;
  }, [highlightedNode, links]);

  // --- Robust highlight logic for links and nodes ---
  const isLinkConnected = useCallback((link: VisibleNetworkLink) => {
    let sourceId: string | number | undefined;
    let targetId: string | number | undefined;
    if (typeof link.source === 'object' && link.source && 'id' in link.source) {
      sourceId = (link.source as { id: string | number }).id;
    } else {
      sourceId = link.source as string | number;
    }
    if (typeof link.target === 'object' && link.target && 'id' in link.target) {
      targetId = (link.target as { id: string | number }).id;
    } else {
      targetId = link.target as string | number;
    }
    return highlightedNode && (sourceId === highlightedNode.id || targetId === highlightedNode.id);
  }, [highlightedNode]);

  const isNodeConnected = useCallback((node: VisibleNetworkNode) => {
    if (!highlightedNode || !node || typeof node !== 'object' || !('id' in node)) return false;
    const nodeId = (node as { id?: string | number }).id;
    if (!nodeId) return false;
    if (nodeId === highlightedNode.id) return true;
    return links.some(link => {
      if (!link || typeof link !== 'object') return false;
      let sourceId: string | number | undefined;
      let targetId: string | number | undefined;
      const lnk: any = link;
      if (typeof lnk.source === 'object' && lnk.source && 'id' in lnk.source) {
        sourceId = lnk.source.id;
      } else {
        sourceId = lnk.source;
      }
      if (typeof lnk.target === 'object' && lnk.target && 'id' in lnk.target) {
        targetId = lnk.target.id;
      } else {
        targetId = lnk.target;
      }
      return (sourceId === highlightedNode.id && targetId === nodeId) ||
             (targetId === highlightedNode.id && sourceId === nodeId);
    });
  }, [highlightedNode, links]);

  const getLinkColor = useCallback((link: any) => {
    return isLinkConnected(link) ? '#f59e0b' : 'rgba(75, 85, 99, 0.6)';
  }, [highlightedNode, links]);

  const getLinkWidth = useCallback((link: any) => {
    return isLinkConnected(link) ? 7 : Math.sqrt(link.strength || 1) * 3.5;
  }, [highlightedNode, links]);

  const renderNodeLabel = useCallback((node: any) => {
    const networkNode = node as VisibleNetworkNode;
    if (highlightedNode?.id === networkNode.id) {
      return `${networkNode.name} (${networkNode.connections} connections)`;
    }
    return '';
  }, [highlightedNode]);

  // Optimized canvas rendering with reduced operations
  const renderNodeCanvas = useCallback((node: VisibleNetworkNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const networkNode = node as VisibleNetworkNode;
    if (typeof node.x !== 'number' || typeof node.y !== 'number') return;
    // Reduce node size for small graphs
    const size = nodes.length < 20 ? 18 : sizeCache.get(networkNode.id) || graphStats.baseSize;
    const color = colorCache.get(networkNode.id) || '#6b7280';
    const isBeingDragged = draggedNode?.id === networkNode.id;
    const isConnected = isNodeConnected(networkNode);
    const isSelected = highlightedNode?.id === networkNode.id;

    // Draw glow
    ctx.save();
    ctx.beginPath();
    ctx.arc(node.x, node.y, size + 6, 0, 2 * Math.PI, false);
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();

    // Draw main node
    ctx.save();
    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
    ctx.fillStyle = color;
    ctx.shadowColor = isBeingDragged ? '#fff' : color;
    ctx.shadowBlur = isBeingDragged ? 16 : 4;
    ctx.globalAlpha = 1;
    ctx.fill();
    ctx.restore();

    // Glossy highlight
    ctx.save();
    const grad = ctx.createRadialGradient(
      node.x - size/3,
      node.y - size/3,
      size/8,
      node.x,
      node.y,
      size
    );
    grad.addColorStop(0, 'rgba(255,255,255,0.95)');
    grad.addColorStop(0.4, 'rgba(255,255,255,0.18)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();

    // Draw border (highlight if connected or selected)
    ctx.save();
    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
    let borderColor = '#222';
    let borderWidth = 2;
    
    if (isSelected) {
      borderColor = '#3b82f6'; // Blue for selected
      borderWidth = 5;
    } else if (isConnected) {
      borderColor = '#f59e0b'; // Orange for connected
      borderWidth = 4;
    } else if (isBeingDragged) {
      borderColor = '#fff';
      borderWidth = 3;
    }
    
    ctx.lineWidth = borderWidth;
    ctx.strokeStyle = borderColor;
    ctx.stroke();
    ctx.restore();
    
    // Only draw labels when necessary (reduced frequency)
    const shouldDrawLabel = globalScale > 2.5 || 
                       (highlightedNode && highlightedNode.id === networkNode.id) || 
                       (highlightedNode && isNodeConnected(networkNode)) || 
                       isBeingDragged;
    if (shouldDrawLabel) {
      const label = networkNode.name;
      const fontSize = Math.max(14, size / 1.5);
      const fontKey = `${fontSize}px Arial`;
      if (ctx.font !== fontKey) {
        ctx.font = fontKey;
      }
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const textWidth = ctx.measureText(label).width;
      ctx.save();
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = '#111';
      ctx.fillRect(
        node.x - textWidth / 2 - 6,
        node.y + size + 6,
        textWidth + 12,
        fontSize + 8
      );
      ctx.restore();
      ctx.fillStyle = '#fff';
      ctx.fillText(label, node.x, node.y + size + fontSize / 2 + 10);
    }
  }, [sizeCache, colorCache, graphStats.baseSize, highlightedNode, draggedNode, links, nodes.length]);

  // Save state when simulation cools down and when data changes
  useEffect(() => {
    if (!onGraphStateChange || !preserveLayout || !isInitialized.current) return;

    const interval = setInterval(saveGraphState, 2000); // Reduced frequency to 2 seconds
    return () => clearInterval(interval);
  }, [saveGraphState, onGraphStateChange, preserveLayout]);

  // Save state immediately when nodes/links change
  useEffect(() => {
    if (onGraphStateChange && preserveLayout && isInitialized.current) {
      // Small delay to let the graph update
      const timeout = setTimeout(saveGraphState, 500);
      return () => clearTimeout(timeout);
    }
  }, [nodes, links, saveGraphState, onGraphStateChange, preserveLayout]);

  // Handle force simulation restart if connections are lost
  const handleForceRestart = useCallback(() => {
    if (!fgRef.current) return;
    
    const graph = fgRef.current;
    
    // Check if graph is properly initialized
    if (!graph || typeof graph.d3ReheatSimulation !== 'function') {
      console.warn('Graph not properly initialized, cannot restart simulation');
      return;
    }
    
    try {
      // Gently restart the force simulation
      graph.d3ReheatSimulation();
      // Stop simulation after a short time to prevent constant movement
      setTimeout(() => {
        if (graph && graph.d3Force) {
          console.log('ForceGraph2D: Stopping simulation after restart');
          graph.d3Force().stop();
        }
      }, 1500); // Stop after 1.5 seconds
    } catch (e) {
      console.warn('Could not restart force simulation:', e);
    }
  }, []);

  // Add a method to handle connection restoration
  useEffect(() => {
    if (fgRef.current && isInitialized.current) {
      const graph = fgRef.current;
      
      // Check if graph is properly initialized and has the required methods
      if (!graph || typeof graph.graphData !== 'function') {
        console.warn('ForceGraph2D: Graph not properly initialized, skipping connection restoration');
        return;
      }
      
      try {
        const graphData = graph.graphData();
        
        console.log('ForceGraph2D: Checking connections:', {
          nodes: graphData.nodes?.length || 0,
          links: graphData.links?.length || 0,
          hasCachedState: !!graphState,
          cachedNodes: graphState?.nodePositions?.size || 0
        });
        
        // If we have nodes but no visible links, and we have cached positions, try to restore
        if (graphData.nodes && graphData.nodes.length > 0 && 
            (!graphData.links || graphData.links.length === 0) && 
            graphState?.nodePositions) {
          console.log('ForceGraph2D: No links visible, attempting to restore from cache');
          
          // Apply cached positions to visible nodes
          graphData.nodes.forEach((node: any) => {
            const cachedPosition = graphState.nodePositions.get(node.id);
            if (cachedPosition) {
              node.x = cachedPosition.x;
              node.y = cachedPosition.y;
            }
          });
          
          // Force a re-render
          graph.graphData(graphData);
          
          // Stop simulation after restoration
          if (graph && graph.d3Force) {
            graph.d3Force().stop();
          }
        }
        
        // Check if links are visible and properly connected
        if (graphData.links && graphData.links.length > 0) {
          const visibleLinks = graphData.links.filter((link: any) => 
            link.source && link.target && 
            typeof link.source === 'object' && typeof link.target === 'object'
          );
          
          console.log('ForceGraph2D: Link visibility:', {
            totalLinks: graphData.links.length,
            visibleLinks: visibleLinks.length,
            visibilityRatio: visibleLinks.length / graphData.links.length
          });
          
          if (visibleLinks.length < graphData.links.length * 0.8) {
            // Most links are not visible, restart simulation briefly
            console.log('ForceGraph2D: Most links not visible, restarting simulation briefly');
            setTimeout(handleForceRestart, 1000);
          }
        }
      } catch (error) {
        console.warn('Error checking connection visibility:', error);
      }
    }
  }, [links, handleForceRestart, graphState]);

  // Monitor data changes and ensure proper handling
  useEffect(() => {
    console.log('ForceGraph2D: Data changed:', {
      nodes: nodes.length,
      links: links.length,
      hasCachedState: !!graphState,
      cachedNodes: graphState?.nodePositions?.size || 0
    });

    if (fgRef.current && isInitialized.current) {
      const graph = fgRef.current;
      
      // Check if graph is properly initialized and has the required methods
      if (!graph || typeof graph.graphData !== 'function') {
        console.warn('ForceGraph2D: Graph not properly initialized, skipping data change handling');
        return;
      }
      
      try {
        // If we have nodes but no links, and we have cached state, try to restore
        if (nodes.length > 0 && links.length === 0 && graphState?.nodePositions) {
          console.log('ForceGraph2D: No links in filtered data, but have cached state');
          
          // Apply cached positions to current nodes
          const graphData = graph.graphData();
          if (graphData && graphData.nodes) {
            graphData.nodes.forEach((node: any) => {
              const cachedPosition = graphState.nodePositions.get(node.id);
              if (cachedPosition) {
                node.x = cachedPosition.x;
                node.y = cachedPosition.y;
              }
            });
            
            // Force a re-render
            graph.graphData(graphData);
            
            // Stop simulation after applying cached positions
            if (graph && graph.d3Force) {
              graph.d3Force().stop();
            }
          }
        }
        
        // If we have both nodes and links, ensure they're properly connected
        if (nodes.length > 0 && links.length > 0) {
          console.log('ForceGraph2D: Have both nodes and links, ensuring connections');
          
          // Check if links are properly connected to node objects
          const graphData = graph.graphData();
          if (graphData && graphData.links) {
            const connectedLinks = graphData.links.filter((link: any) => 
              link.source && link.target && 
              typeof link.source === 'object' && typeof link.target === 'object'
            );
            
            console.log('ForceGraph2D: Link connection status:', {
              totalLinks: graphData.links.length,
              connectedLinks: connectedLinks.length,
              connectionRatio: connectedLinks.length / graphData.links.length
            });
            
            if (connectedLinks.length < graphData.links.length * 0.8) {
              console.log('ForceGraph2D: Most links not connected, restarting simulation briefly');
              setTimeout(handleForceRestart, 500);
            } else {
              // Links are connected, stop simulation to keep nodes stable
              if (graph && graph.d3Force) {
                graph.d3Force().stop();
              }
            }
          }
        }
      } catch (error) {
        console.warn('ForceGraph2D: Error handling data changes:', error);
      }
    }
  }, [nodes, links, graphState, handleForceRestart]);

  return (
    <div className="w-full h-full bg-gray-900 relative">
      <ForceGraphComponent
        ref={fgRef}
        graphData={{ nodes: nodesWithPositions, links }}
        nodeId="id"
        nodeLabel={renderNodeLabel}
        nodeRelSize={1}
        nodeColor={(node: any) => {
          const networkNode = node as VisibleNetworkNode;
          const baseColors = {
            PERSON: '#3b82f6',
            LOCATION: '#10b981', 
            ORGANIZATION: '#f59e0b'
          };
          return baseColors[networkNode.type] || '#6b7280';
        }}
        nodeVal={(node: any) => {
          const networkNode = node as VisibleNetworkNode;
          const size = sizeCache.get(networkNode.id) || graphStats.baseSize;
          return size;
        }}
        linkSource="source"
        linkTarget="target"
        linkWidth={getLinkWidth}
        linkColor={getLinkColor}
        backgroundColor="#111827"
        onNodeClick={handleNodeClick}
        // Remove onNodeHover prop
        onNodeDrag={handleNodeDrag}
        cooldownTicks={150}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.4}
        d3AlphaMin={0.001}
        enableZoomInteraction={true}
        enablePanInteraction={true}
        enableNodeDrag={true}
        width={window.innerWidth * 0.75}
        height={window.innerHeight - 200}
        nodeCanvasObject={renderNodeCanvas}
      />
      
      {/* Remove hover tooltip section */}
      
      {/* Layout restoration indicator */}
      {isRestoringLayout && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-800 border border-gray-600 rounded-lg p-3 text-white z-20">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
            <span className="text-sm">Restoring layout...</span>
          </div>
        </div>
      )}
      
      {/* Drag indicator */}
      {draggedNode && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-gray-800 border border-blue-500 rounded-lg p-3 text-white z-20">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Dragging: {draggedNode.name}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForceGraph2D;