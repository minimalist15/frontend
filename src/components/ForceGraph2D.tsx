import React, { useEffect, useRef, useMemo, useCallback, useState } from 'react';
import * as d3 from 'd3';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface GraphState {
  nodePositions: Map<string, { x: number; y: number }>;
  zoomLevel: number;
  center: { x: number; y: number };
}

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
  graphState?: GraphState;
  onGraphStateChange?: (state: GraphState) => void;
  preserveLayout?: boolean;
  width?: number;
  height?: number;
}

const ForceGraph2D: React.FC<ForceGraph2DProps> = ({
  nodes,
  links,
  onNodeClick,
  graphState,
  onGraphStateChange,
  preserveLayout = false,
  width = 800,
  height = 600
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<Node, Link> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const transformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity);
  const initializedRef = useRef(false);
  
  // Hover state
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  console.log('🎯 ForceGraph2D: Rendering with', {
    nodes: nodes.length,
    links: links.length,
    preserveLayout,
    hasGraphState: !!graphState,
    cachedPositions: graphState?.nodePositions?.size || 0
  });

  // Memoize stable nodes and links to prevent unnecessary re-renders
  const stableNodes = useMemo(() => {
    const result = nodes.map(node => {
      // If we have cached positions and preserveLayout is true, use them
      if (preserveLayout && graphState?.nodePositions?.has(node.id)) {
        const cached = graphState.nodePositions.get(node.id)!;
        return {
          ...node,
          x: cached.x,
          y: cached.y,
          fx: cached.x, // Fix position immediately
          fy: cached.y
        };
      }
      return {
        ...node,
        x: node.x || Math.random() * width,
        y: node.y || Math.random() * height,
        fx: null,
        fy: null
      };
    });
    console.log('🎯 ForceGraph2D: Stable nodes created:', result.length);
    return result;
  }, [nodes, width, height, graphState, preserveLayout]);

  const stableLinks = useMemo(() => {
    const result = links.map(link => ({
      ...link,
      source: typeof link.source === 'string' ? link.source : link.source.id,
      target: typeof link.target === 'string' ? link.target : link.target.id
    }));
    console.log('🎯 ForceGraph2D: Stable links created:', result.length);
    return result;
  }, [links]);

  const getNodeColor = useCallback((type: string, isHighlighted: boolean, isHovered: boolean) => {
    const colors = {
      'PERSON': isHighlighted || isHovered ? '#1e40af' : '#3b82f6',
      'LOCATION': isHighlighted || isHovered ? '#059669' : '#10b981',
      'ORGANIZATION': isHighlighted || isHovered ? '#d97706' : '#f59e0b',
      'default': isHighlighted || isHovered ? '#6b7280' : '#9ca3af'
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

  const saveGraphState = useCallback(() => {
    if (!onGraphStateChange || !stableNodes.length) return;
    
    const nodePositions = new Map<string, { x: number; y: number }>();
    stableNodes.forEach(node => {
      if (node.x !== undefined && node.y !== undefined) {
        nodePositions.set(node.id, { x: node.x, y: node.y });
      }
    });

    const state: GraphState = {
      nodePositions,
      zoomLevel: transformRef.current.k,
      center: { x: transformRef.current.x, y: transformRef.current.y }
    };

    onGraphStateChange(state);
  }, [stableNodes, onGraphStateChange]);

  const initializeGraph = useCallback(() => {
    if (!svgRef.current) return;

    console.log('🎯 ForceGraph2D: Initializing graph...');

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

    // Restore zoom state if available
    if (graphState && preserveLayout) {
      const transform = d3.zoomIdentity
        .translate(graphState.center.x, graphState.center.y)
        .scale(graphState.zoomLevel);
      svg.call(zoom.transform, transform);
      transformRef.current = transform;
    }

    // Create links with EXPLICIT visibility
    const linkElements = linksGroup.selectAll('line')
      .data(stableLinks)
      .enter()
      .append('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6) // EXPLICIT opacity
      .attr('stroke-width', 2); // EXPLICIT width

    console.log('🔗 ForceGraph2D: Created', linkElements.size(), 'link elements');

    // Create nodes
    const nodeElements = nodesGroup.selectAll('circle')
      .data(stableNodes)
      .enter()
      .append('circle')
      .attr('r', d => Math.max(8, Math.min(20, d.connections * 1.5 + 5)))
      .attr('fill', d => getNodeColor(d.type, false, false))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseenter', (event, d) => {
        console.log('🎯 ForceGraph2D: Mouse enter node:', d.name);
        setHoveredNode(d.id);
      })
      .on('mouseleave', () => {
        console.log('🎯 ForceGraph2D: Mouse leave node');
        setHoveredNode(null);
      })
      .on('click', (event, d) => {
        event.stopPropagation();
        console.log('🎯 ForceGraph2D: Node clicked:', d.name, 'onNodeClick exists:', !!onNodeClick);
        if (onNodeClick) {
          console.log('🎯 ForceGraph2D: Calling onNodeClick with node:', d);
          onNodeClick(d);
        } else {
          console.error('🎯 ForceGraph2D: onNodeClick is not defined!');
        }
      })
      .call(d3.drag<SVGCircleElement, Node>()
        .on('start', (event, d) => {
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
          d.x = event.x;
          d.y = event.y;
          
          // Update positions immediately during drag
          nodeElements.filter((node: any) => node.id === d.id)
            .attr('cx', d.x)
            .attr('cy', d.y);
          
          labelElements.filter((node: any) => node.id === d.id)
            .attr('x', d.x)
            .attr('y', d.y);
          
          // Update connected links
          linkElements
            .attr('x1', (link: any) => {
              const source = typeof link.source === 'string' ? stableNodes.find(n => n.id === link.source) : link.source;
              return source?.x || 0;
            })
            .attr('y1', (link: any) => {
              const source = typeof link.source === 'string' ? stableNodes.find(n => n.id === link.source) : link.source;
              return source?.y || 0;
            })
            .attr('x2', (link: any) => {
              const target = typeof link.target === 'string' ? stableNodes.find(n => n.id === link.target) : link.target;
              return target?.x || 0;
            })
            .attr('y2', (link: any) => {
              const target = typeof link.target === 'string' ? stableNodes.find(n => n.id === link.target) : link.target;
              return target?.y || 0;
            });
        })
        .on('end', (event, d) => {
          // Keep the position fixed after dragging
          d.fx = d.x;
          d.fy = d.y;
          saveGraphState();
        }));

    console.log('🎯 ForceGraph2D: Created', nodeElements.size(), 'node elements');

    // Create labels
    const labelElements = nodesGroup.selectAll('text')
      .data(stableNodes)
      .enter()
      .append('text')
      .attr('class', 'node-label')
      .text(d => d.name)
      .attr('font-size', '11px')
      .attr('font-family', 'Arial, sans-serif')
      .attr('font-weight', '500')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', '#1f2937')
      .attr('stroke', '#fff')
      .attr('stroke-width', '3')
      .attr('paint-order', 'stroke')
      .style('pointer-events', 'none')
      .style('opacity', 0);

    // If we have cached positions, use them directly - NO SIMULATION
    if (preserveLayout && graphState?.nodePositions && graphState.nodePositions.size > 0) {
      console.log('🎯 ForceGraph2D: Using cached positions, no simulation');
      
      // Set positions immediately
      nodeElements
        .attr('cx', d => d.x!)
        .attr('cy', d => d.y!);

      labelElements
        .attr('x', d => d.x!)
        .attr('y', d => d.y!);

      linkElements
        .attr('x1', d => (d.source as Node).x!)
        .attr('y1', d => (d.source as Node).y!)
        .attr('x2', d => (d.target as Node).x!)
        .attr('y2', d => (d.target as Node).y!);

    } else {
      // Run MINIMAL simulation for initial layout only
      console.log('🎯 ForceGraph2D: Running minimal simulation (3 ticks only)');
      
      const simulation = d3.forceSimulation<Node>(stableNodes)
        .force('link', d3.forceLink<Node, Link>(stableLinks)
          .id(d => d.id)
          .distance(80)
          .strength(0.3))
        .force('charge', d3.forceManyBody().strength(-200))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(d => Math.max(12, Math.min(25, d.connections * 2 + 5))));

      simulationRef.current = simulation;

      // Run for exactly 3 ticks then STOP FOREVER
      let tickCount = 0;
      const maxTicks = 3;
      
      simulation.on('tick', () => {
        tickCount++;
        console.log(`🎯 ForceGraph2D: Simulation tick ${tickCount}/${maxTicks}`);
        
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

        // Stop after exactly 3 ticks
        if (tickCount >= maxTicks) {
          simulation.stop();
          
          // Fix ALL node positions permanently
          stableNodes.forEach(node => {
            node.fx = node.x;
            node.fy = node.y;
          });
          
          console.log('🎯 ForceGraph2D: Simulation STOPPED, all positions FIXED');
          saveGraphState();
        }
      });
    }

    initializedRef.current = true;
  }, [stableNodes, stableLinks, width, height, getNodeColor, onNodeClick, graphState, preserveLayout, saveGraphState]);

  // Update highlighting and hover effects
  useEffect(() => {
    if (!svgRef.current || !initializedRef.current) return;

    const svg = d3.select(svgRef.current);
    const connectedToHovered = hoveredNode ? getConnectedNodes(hoveredNode) : new Set();

    console.log('🎯 ForceGraph2D: Updating hover effects for node:', hoveredNode);

    // Update node colors and stroke
    svg.selectAll('.nodes circle')
      .attr('fill', (d: any) => {
        const isHovered = d.id === hoveredNode;
        const isConnectedToHovered = connectedToHovered.has(d.id);
        
        if (isHovered || isConnectedToHovered) {
          return getNodeColor(d.type, true, true);
        }
        return getNodeColor(d.type, false, false);
      })
      .attr('stroke-width', (d: any) => {
        const isHovered = d.id === hoveredNode;
        return isHovered ? 3 : 2;
      })
      .attr('opacity', (d: any) => {
        if (!hoveredNode) return 1;
        
        const isHovered = d.id === hoveredNode;
        const isConnectedToHovered = connectedToHovered.has(d.id);
        
        return (isHovered || isConnectedToHovered) ? 1 : 0.3;
      });

    // Update link highlighting - ENSURE LINKS STAY VISIBLE
    svg.selectAll('.links line')
      .attr('stroke', (d: any) => {
        const sourceId = typeof d.source === 'string' ? d.source : d.source.id;
        const targetId = typeof d.target === 'string' ? d.target : d.target.id;
        
        const isConnectedToHovered = (sourceId === hoveredNode || targetId === hoveredNode);
        
        if (isConnectedToHovered) return '#3b82f6';
        return '#999';
      })
      .attr('stroke-width', (d: any) => {
        const sourceId = typeof d.source === 'string' ? d.source : d.source.id;
        const targetId = typeof d.target === 'string' ? d.target : d.target.id;
        
        const isConnectedToHovered = (sourceId === hoveredNode || targetId === hoveredNode);
        
        return isConnectedToHovered ? 3 : 2;
      })
      .attr('stroke-opacity', (d: any) => {
        const sourceId = typeof d.source === 'string' ? d.source : d.source.id;
        const targetId = typeof d.target === 'string' ? d.target : d.target.id;
        
        const isConnectedToHovered = (sourceId === hoveredNode || targetId === hoveredNode);
        
        if (isConnectedToHovered) return 0.8;
        if (hoveredNode) return 0.3; // Fade but keep visible
        return 0.6; // DEFAULT VISIBLE STATE
      });

    // Update label visibility - show on hover
    svg.selectAll('.node-label')
      .style('opacity', (d: any) => {
        const isHovered = d.id === hoveredNode;
        const isConnectedToHovered = connectedToHovered.has(d.id);
        
        return (isHovered || isConnectedToHovered) ? 1 : 0;
      });

  }, [hoveredNode, getConnectedNodes, getNodeColor]);

  // Initialize graph when component mounts or data changes
  useEffect(() => {
    if (stableNodes.length > 0) {
      console.log('🎯 ForceGraph2D: Data changed, reinitializing graph');
      initializedRef.current = false;
      initializeGraph();
    }
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
    <div className="relative w-full h-full">
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        className="bg-gray-900 rounded-lg border border-gray-700"
        style={{ minHeight: '600px' }}
      />
      
      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button
          onClick={handleZoomIn}
          className="p-2 bg-gray-800 border border-gray-600 rounded-lg shadow-sm hover:bg-gray-700 transition-colors text-white"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 bg-gray-800 border border-gray-600 rounded-lg shadow-sm hover:bg-gray-700 transition-colors text-white"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetZoom}
          className="p-2 bg-gray-800 border border-gray-600 rounded-lg shadow-sm hover:bg-gray-700 transition-colors text-white"
          title="Reset View"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 bg-gray-800/90 backdrop-blur-sm p-3 rounded-lg shadow-sm text-sm text-gray-300 border border-gray-600">
        <div>• Mouse wheel: Zoom in/out</div>
        <div>• Drag background: Pan around</div>
        <div>• Hover nodes: See names & connections</div>
        <div>• Click nodes: View details</div>
      </div>

      {/* Zoom Level Indicator */}
      <div className="absolute top-4 left-4 bg-gray-800/90 backdrop-blur-sm px-3 py-1 rounded-lg shadow-sm text-sm text-gray-300 border border-gray-600">
        Zoom: {Math.round(transformRef.current.k * 100)}%
      </div>
    </div>
  );
};

export default ForceGraph2D;