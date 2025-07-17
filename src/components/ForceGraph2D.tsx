import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
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
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
}

interface VisibleNetworkLink extends NetworkLink {
  visible: boolean;
  source: any;
  target: any;
}

interface ForceGraph2DProps {
  nodes: VisibleNetworkNode[];
  links: VisibleNetworkLink[];
  onNodeClick?: (node: VisibleNetworkNode) => void;
  highlightedNode?: VisibleNetworkNode | null;
  graphState?: GraphState;
  onGraphStateChange?: (state: GraphState) => void;
  preserveLayout?: boolean;
}

const ForceGraph2D: React.FC<ForceGraph2DProps> = ({ 
  nodes, 
  links, 
  onNodeClick, 
  highlightedNode,
  graphState,
  onGraphStateChange,
  preserveLayout = true 
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<VisibleNetworkNode, VisibleNetworkLink> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const containerRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [draggedNode, setDraggedNode] = useState<VisibleNetworkNode | null>(null);
  const [currentZoom, setCurrentZoom] = useState(1);

  // Dimensions
  const width = 800;
  const height = 600;

  // Memoize expensive calculations
  const graphStats = useMemo(() => {
    if (nodes.length === 0) return { maxConnections: 1, maxSize: 90, baseSize: 30 };
    
    const maxConnections = Math.max(...nodes.map(n => n.connections), 1);
    return { maxConnections, maxSize: 90, baseSize: 30 };
  }, [nodes]);

  // Color mapping
  const getNodeColor = useCallback((node: VisibleNetworkNode) => {
    const baseColors = {
      PERSON: '#3b82f6',     // blue
      LOCATION: '#10b981',   // green
      ORGANIZATION: '#f59e0b' // orange
    };
    return baseColors[node.type] || '#6b7280';
  }, []);

  // Size mapping
  const getNodeSize = useCallback((node: VisibleNetworkNode) => {
    if (graphStats.maxConnections === 0) return graphStats.baseSize;
    const scaleFactor = node.connections / graphStats.maxConnections;
    return graphStats.baseSize + (scaleFactor * (graphStats.maxSize - graphStats.baseSize));
  }, [graphStats]);

  // Check if node is connected to highlighted node
  const isNodeConnected = useCallback((node: VisibleNetworkNode) => {
    if (!highlightedNode || node.id === highlightedNode.id) return false;
    return links.some(link => 
      (link.source === highlightedNode.id && link.target === node.id) ||
      (link.target === highlightedNode.id && link.source === node.id) ||
      (typeof link.source === 'object' && link.source.id === highlightedNode.id && 
       typeof link.target === 'object' && link.target.id === node.id) ||
      (typeof link.target === 'object' && link.target.id === highlightedNode.id && 
       typeof link.source === 'object' && link.source.id === node.id)
    );
  }, [highlightedNode, links]);

  // Check if link is connected to highlighted node
  const isLinkConnected = useCallback((link: VisibleNetworkLink) => {
    if (!highlightedNode) return false;
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    return sourceId === highlightedNode.id || targetId === highlightedNode.id;
  }, [highlightedNode]);

  // Save graph state
  const saveGraphState = useCallback(() => {
    if (!onGraphStateChange || !simulationRef.current) return;

    const nodePositions = new Map<string, { x: number; y: number }>();
    nodes.forEach(node => {
      if (node.x !== undefined && node.y !== undefined) {
        nodePositions.set(node.id, { x: node.x, y: node.y });
      }
    });

    const newState: GraphState = {
      nodePositions,
      zoomLevel: currentZoom,
      center: { x: width / 2, y: height / 2 }
    };

    onGraphStateChange(newState);
  }, [nodes, onGraphStateChange, currentZoom, width, height]);

  // Stable node data reference to prevent unnecessary re-renders
  const stableNodes = useMemo(() => {
    return nodes.map(node => {
      const cachedPosition = graphState?.nodePositions?.get(node.id);
      return {
        ...node,
        x: node.x || cachedPosition?.x || Math.random() * width,
        y: node.y || cachedPosition?.y || Math.random() * height
      };
    });
  }, [nodes, graphState?.nodePositions, width, height]);

  // Initialize and update D3 force simulation
  useEffect(() => {
    if (!svgRef.current || stableNodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    
    // Only clear and recreate if not initialized or if nodes changed significantly
    if (!isInitialized || !containerRef.current) {
      svg.selectAll("*").remove();
      
      // Setup zoom behavior
      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 4])
        .on("zoom", (event) => {
          if (containerRef.current) {
            containerRef.current.attr("transform", event.transform);
            setCurrentZoom(event.transform.k);
          }
        });

      svg.call(zoom);
      zoomRef.current = zoom;

      // Create container groups
      const container = svg.append("g");
      containerRef.current = container;
      
      // Apply initial zoom if available
      if (graphState?.zoomLevel && graphState.zoomLevel !== 1) {
        const initialTransform = d3.zoomIdentity.scale(graphState.zoomLevel);
        svg.call(zoom.transform, initialTransform);
      }
    }

    const container = containerRef.current!;
    
    // Clear existing elements
    container.selectAll(".links").remove();
    container.selectAll(".nodes").remove();
    container.selectAll(".labels").remove();

    const linksGroup = container.append("g").attr("class", "links");
    const nodesGroup = container.append("g").attr("class", "nodes");
    const labelsGroup = container.append("g").attr("class", "labels");

    // Create or update force simulation
    if (!simulationRef.current) {
      const simulation = d3.forceSimulation(stableNodes)
        .force("link", d3.forceLink(links)
          .id((d: any) => d.id)
          .distance(100)
          .strength(0.1))
        .force("charge", d3.forceManyBody().strength(-300))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide().radius(d => getNodeSize(d as VisibleNetworkNode) + 5))
        .alphaDecay(0.02)
        .velocityDecay(0.4);

      simulationRef.current = simulation;
    } else {
      // Update existing simulation with new data
      simulationRef.current
        .nodes(stableNodes)
        .force("link", d3.forceLink(links)
          .id((d: any) => d.id)
          .distance(100)
          .strength(0.1));
    }

    const simulation = simulationRef.current;

    // Create links
    const link = linksGroup
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", d => isLinkConnected(d) ? "#f59e0b" : "rgba(75, 85, 99, 0.6)")
      .attr("stroke-width", d => isLinkConnected(d) ? 3 : Math.sqrt(d.strength || 1))
      .attr("stroke-opacity", 0.8);

    // Create nodes
    const node = nodesGroup
      .selectAll("circle")
      .data(stableNodes)
      .enter()
      .append("circle")
      .attr("r", d => getNodeSize(d))
      .attr("fill", d => getNodeColor(d))
      .attr("stroke", d => {
        if (highlightedNode?.id === d.id) return "#3b82f6";
        if (isNodeConnected(d)) return "#f59e0b";
        return "#222";
      })
      .attr("stroke-width", d => {
        if (highlightedNode?.id === d.id) return 4;
        if (isNodeConnected(d)) return 3;
        return 2;
      })
      .style("cursor", "pointer")
      .call(d3.drag<SVGCircleElement, VisibleNetworkNode>()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
          setDraggedNode(d);
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
          setDraggedNode(null);
          saveGraphState();
        }));

    // Add click handler
    node.on("click", (event, d) => {
      event.stopPropagation();
      if (onNodeClick) {
        onNodeClick(d);
      }
    });

    // Create labels for highlighted nodes and when zoomed in
    const shouldShowLabels = currentZoom > 1.5 || highlightedNode;
    const labelsData = shouldShowLabels 
      ? stableNodes.filter(d => 
          currentZoom > 1.5 || highlightedNode?.id === d.id || isNodeConnected(d)
        )
      : [];

    const labels = labelsGroup
      .selectAll("text")
      .data(labelsData)
      .enter()
      .append("text")
      .text(d => d.name)
      .attr("font-size", "12px")
      .attr("fill", "white")
      .attr("text-anchor", "middle")
      .attr("dy", d => getNodeSize(d) + 15)
      .style("pointer-events", "none")
      .style("font-weight", "500");

    // Update positions on simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("cx", d => d.x!)
        .attr("cy", d => d.y!);

      labels
        .attr("x", d => d.x!)
        .attr("y", d => d.y! + getNodeSize(d) + 15);
    });

    // Restart simulation if needed
    if (preserveLayout && graphState?.nodePositions) {
      simulation.alpha(0.1).restart();
      setTimeout(() => {
        simulation.alpha(0);
      }, 1000);
    } else {
      simulation.alpha(1).restart();
    }

    setIsInitialized(true);

    // Cleanup function
    return () => {
      if (simulation) {
        simulation.on("tick", null);
      }
    };
  }, [stableNodes, links, highlightedNode, currentZoom, preserveLayout, graphState?.nodePositions, getNodeColor, getNodeSize, isNodeConnected, isLinkConnected, onNodeClick, saveGraphState, width, height, isInitialized]);

  // Save state periodically
  useEffect(() => {
    if (!isInitialized || !preserveLayout) return;

    const interval = setInterval(saveGraphState, 3000);
    return () => clearInterval(interval);
  }, [isInitialized, preserveLayout, saveGraphState]);

  // Reset zoom function
  const resetZoom = useCallback(() => {
    if (zoomRef.current && svgRef.current) {
      const svg = d3.select(svgRef.current);
      svg.transition().duration(750).call(
        zoomRef.current.transform,
        d3.zoomIdentity
      );
      setCurrentZoom(1);
    }
  }, []);

  return (
    <div className="w-full h-full bg-gray-900 relative flex items-center justify-center">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="border border-gray-700 rounded-lg cursor-grab"
        style={{ background: '#111827' }}
      />
      
      {/* Zoom controls */}
      <div className="absolute top-4 right-4 flex flex-col space-y-2 z-20">
        <button
          onClick={() => {
            if (zoomRef.current && svgRef.current) {
              const svg = d3.select(svgRef.current);
              svg.transition().duration(200).call(
                zoomRef.current.scaleBy,
                1.5
              );
            }
          }}
          className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded border border-gray-600 text-sm font-mono"
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={() => {
            if (zoomRef.current && svgRef.current) {
              const svg = d3.select(svgRef.current);
              svg.transition().duration(200).call(
                zoomRef.current.scaleBy,
                1 / 1.5
              );
            }
          }}
          className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded border border-gray-600 text-sm font-mono"
          title="Zoom Out"
        >
          −
        </button>
        <button
          onClick={resetZoom}
          className="bg-gray-800 hover:bg-gray-700 text-white p-1 rounded border border-gray-600 text-xs"
          title="Reset Zoom"
        >
          Reset
        </button>
      </div>

      {/* Zoom indicator */}
      <div className="absolute bottom-4 right-4 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-xs z-20">
        Zoom: {Math.round(currentZoom * 100)}%
      </div>
      
      {/* Drag indicator */}
      {draggedNode && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-gray-800 border border-blue-500 rounded-lg p-3 text-white z-20">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Dragging: {draggedNode.name}</span>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 bg-gray-800 border border-gray-600 rounded p-2 text-white text-xs max-w-xs z-20">
        <div className="space-y-1">
          <div>• Scroll or use +/− to zoom</div>
          <div>• Drag to pan around</div>
          <div>• Drag nodes to reposition</div>
          <div>• Labels appear when zoomed in</div>
        </div>
      </div>
    </div>
  );
};

export default ForceGraph2D;