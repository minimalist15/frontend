import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface Node {
  id: string;
  name: string;
  type: string;
  connections: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface Link {
  source: string | Node;
  target: string | Node;
  strength: number;
}

interface ForceGraph2DProps {
  nodes: Node[];
  links: Link[];
  onNodeClick?: (node: Node) => void;
  highlightedNode?: string | null;
  width?: number;
  height?: number;
}

const ForceGraph2D: React.FC<ForceGraph2DProps> = ({
  nodes,
  links,
  onNodeClick,
  highlightedNode,
  width = 800,
  height = 600
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<Node, Link> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const transformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity);
  const initializedRef = useRef(false);

  // Stable nodes to prevent unnecessary re-renders
  const stableNodes = useMemo(() => {
    return nodes.map(node => ({
      ...node,
      x: node.x || Math.random() * width,
      y: node.y || Math.random() * height
    }));
  }, [nodes, width, height]);

  const stableLinks = useMemo(() => {
    return links.map(link => ({
      ...link,
      source: typeof link.source === 'string' ? link.source : link.source.id,
      target: typeof link.target === 'string' ? link.target : link.target.id
    }));
  }, [links]);

  const getNodeColor = useCallback((type: string, isHighlighted: boolean) => {
    const colors = {
      'PERSON': isHighlighted ? '#1e40af' : '#3b82f6',
      'LOCATION': isHighlighted ? '#059669' : '#10b981',
      'ORGANIZATION': isHighlighted ? '#d97706' : '#f59e0b',
      'default': isHighlighted ? '#6b7280' : '#9ca3af'
    };
    return colors[type as keyof typeof colors] || colors.default;
  }, []);

  const getConnectedNodes = useCallback((nodeId: string) => {
    const connected = new Set<string>();
    stableLinks.forEach(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      
      if (sourceId === nodeId) connected.add(targetId);
      if (targetId === nodeId) connected.add(sourceId);
    });
    return connected;
  }, [stableLinks]);

  const initializeGraph = useCallback(() => {
    if (!svgRef.current || initializedRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Create main group for zoom/pan
    const g = svg.append('g').attr('class', 'main-group');

    // Create links group
    const linksGroup = g.append('g').attr('class', 'links');
    
    // Create nodes group
    const nodesGroup = g.append('g').attr('class', 'nodes');

    // Setup zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        transformRef.current = event.transform;
        g.attr('transform', event.transform);
      });

    zoomRef.current = zoom;
    svg.call(zoom);

    // Create simulation
    const simulation = d3.forceSimulation<Node>(stableNodes)
      .force('link', d3.forceLink<Node, Link>(stableLinks)
        .id(d => d.id)
        .distance(100)
        .strength(0.5))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(25));

    simulationRef.current = simulation;

    // Create links
    const linkElements = linksGroup.selectAll('line')
      .data(stableLinks)
      .enter()
      .append('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 2);

    // Create nodes
    const nodeElements = nodesGroup.selectAll('circle')
      .data(stableNodes)
      .enter()
      .append('circle')
      .attr('r', d => Math.max(8, Math.min(20, d.connections * 2)))
      .attr('fill', d => getNodeColor(d.type, false))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .call(d3.drag<SVGCircleElement, Node>()
        .on('start', (event, d) => {
          if (!event.active && simulationRef.current) {
            simulationRef.current.alphaTarget(0.3).restart();
          }
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active && simulationRef.current) {
            simulationRef.current.alphaTarget(0);
          }
          d.fx = null;
          d.fy = null;
        }))
      .on('click', (event, d) => {
        event.stopPropagation();
        if (onNodeClick) {
          onNodeClick(d);
        }
      });

    // Create labels
    const labelElements = nodesGroup.selectAll('text')
      .data(stableNodes)
      .enter()
      .append('text')
      .text(d => d.name)
      .attr('font-size', '12px')
      .attr('font-family', 'Arial, sans-serif')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', '#333')
      .style('pointer-events', 'none')
      .style('opacity', 0);

    // Update positions on tick
    simulation.on('tick', () => {
      linkElements
        .attr('x1', d => (d.source as Node).x!)
        .attr('y1', d => (d.source as Node).y!)
        .attr('x2', d => (d.target as Node).x!)
        .attr('y2', d => (d.target as Node).y!);

      nodeElements
        .attr('cx', d => d.x!)
        .attr('cy', d => d.y!);

      labelElements
        .attr('x', d => d.x!)
        .attr('y', d => d.y!);
    });

    // Stop simulation after initial animation
    simulation.on('end', () => {
      simulation.alpha(0);
    });

    initializedRef.current = true;
  }, [stableNodes, stableLinks, width, height, getNodeColor, onNodeClick]);

  // Update highlighting
  useEffect(() => {
    if (!svgRef.current || !initializedRef.current) return;

    const svg = d3.select(svgRef.current);
    const connectedNodes = highlightedNode ? getConnectedNodes(highlightedNode) : new Set();

    // Update node colors and labels
    svg.selectAll('.nodes circle')
      .attr('fill', (d: any) => {
        const isHighlighted = d.id === highlightedNode || connectedNodes.has(d.id);
        return getNodeColor(d.type, isHighlighted);
      })
      .attr('stroke-width', (d: any) => d.id === highlightedNode ? 4 : 2);

    // Update link visibility
    svg.selectAll('.links line')
      .attr('stroke', (d: any) => {
        const sourceId = typeof d.source === 'string' ? d.source : d.source.id;
        const targetId = typeof d.target === 'string' ? d.target : d.target.id;
        const isConnected = (sourceId === highlightedNode || targetId === highlightedNode);
        return isConnected ? '#ff6b6b' : '#999';
      })
      .attr('stroke-width', (d: any) => {
        const sourceId = typeof d.source === 'string' ? d.source : d.source.id;
        const targetId = typeof d.target === 'string' ? d.target : d.target.id;
        const isConnected = (sourceId === highlightedNode || targetId === highlightedNode);
        return isConnected ? 3 : 2;
      })
      .attr('stroke-opacity', (d: any) => {
        const sourceId = typeof d.source === 'string' ? d.source : d.source.id;
        const targetId = typeof d.target === 'string' ? d.target : d.target.id;
        const isConnected = (sourceId === highlightedNode || targetId === highlightedNode);
        return isConnected ? 0.8 : 0.6;
      });

    // Show labels for highlighted nodes
    svg.selectAll('.nodes text')
      .style('opacity', (d: any) => {
        const isHighlighted = d.id === highlightedNode || connectedNodes.has(d.id);
        return isHighlighted || transformRef.current.k > 1.5 ? 1 : 0;
      });

  }, [highlightedNode, getConnectedNodes, getNodeColor]);

  // Initialize graph
  useEffect(() => {
    initializeGraph();
  }, [initializeGraph]);

  // Zoom controls
  const handleZoomIn = () => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(300)
        .call(zoomRef.current.scaleBy, 1.5);
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(300)
        .call(zoomRef.current.scaleBy, 1 / 1.5);
    }
  };

  const handleResetZoom = () => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(500)
        .call(zoomRef.current.transform, d3.zoomIdentity);
    }
  };

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="border border-gray-300 rounded-lg bg-white"
      />
      
      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button
          onClick={handleZoomIn}
          className="p-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetZoom}
          className="p-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
          title="Reset View"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-sm text-sm text-gray-600">
        <div>• Mouse wheel: Zoom in/out</div>
        <div>• Drag background: Pan around</div>
        <div>• Drag nodes: Reposition</div>
        <div>• Click nodes: View details</div>
      </div>

      {/* Zoom Level Indicator */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg shadow-sm text-sm text-gray-600">
        Zoom: {Math.round(transformRef.current.k * 100)}%
      </div>
    </div>
  );
};

export default ForceGraph2D;