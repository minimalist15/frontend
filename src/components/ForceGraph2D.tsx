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
  const [isInitialized, setIsInitialized] = useState(false);
  const [draggedNode, setDraggedNode] = useState<VisibleNetworkNode | null>(null);

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
      zoomLevel: 1, // D3 zoom level would go here
      center: { x: width / 2, y: height / 2 }
    };

    onGraphStateChange(newState);
  }, [nodes, onGraphStateChange, width, height]);

  // Initialize and update D3 force simulation
  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    // Create container groups
    const container = svg.append("g");
    const linksGroup = container.append("g").attr("class", "links");
    const nodesGroup = container.append("g").attr("class", "nodes");

    // Apply cached positions if available
    const nodesWithPositions = nodes.map(node => {
      const cachedPosition = graphState?.nodePositions?.get(node.id);
      return {
        ...node,
        x: cachedPosition?.x || Math.random() * width,
        y: cachedPosition?.y || Math.random() * height
      };
    });

    // Create force simulation
    const simulation = d3.forceSimulation(nodesWithPositions)
      .force("link", d3.forceLink(links)
        .id((d: any) => d.id)
        .distance(100)
        .strength(0.1))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(d => getNodeSize(d as VisibleNetworkNode) + 5));

    simulationRef.current = simulation;

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
      .data(nodesWithPositions)
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
      if (onNodeClick) {
        onNodeClick(d);
      }
    });

    // Create labels for highlighted nodes
    const labels = nodesGroup
      .selectAll("text")
      .data(nodesWithPositions.filter(d => 
        highlightedNode?.id === d.id || isNodeConnected(d)
      ))
      .enter()
      .append("text")
      .text(d => d.name)
      .attr("font-size", "12px")
      .attr("fill", "white")
      .attr("text-anchor", "middle")
      .attr("dy", d => getNodeSize(d) + 15)
      .style("pointer-events", "none");

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

    // Stop simulation after initial layout
    if (preserveLayout && graphState?.nodePositions) {
      setTimeout(() => {
        simulation.stop();
      }, 1000);
    }

    setIsInitialized(true);

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [nodes, links, highlightedNode, graphState, preserveLayout, getNodeColor, getNodeSize, isNodeConnected, isLinkConnected, onNodeClick, saveGraphState, width, height]);

  // Save state periodically
  useEffect(() => {
    if (!isInitialized || !preserveLayout) return;

    const interval = setInterval(saveGraphState, 2000);
    return () => clearInterval(interval);
  }, [isInitialized, preserveLayout, saveGraphState]);

  return (
    <div className="w-full h-full bg-gray-900 relative flex items-center justify-center">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="border border-gray-700 rounded-lg"
        style={{ background: '#111827' }}
      />
      
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