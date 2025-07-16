# Network Graph Performance Optimizations

## Overview
This document outlines the performance optimizations implemented to improve the speed and reduce glitchiness of the network graph visualization.

## Key Optimizations Made

### 1. ForceGraph2D Component Optimizations

#### Memoization
- **Color Cache**: Pre-calculated node colors using `useMemo` to avoid recalculating on every render
- **Size Cache**: Pre-calculated node sizes using `useMemo` to avoid expensive calculations
- **Graph Stats**: Memoized maximum connections and other statistics

#### Canvas Rendering Optimizations
- **Reduced Label Rendering**: Only draw labels when zoomed in enough (>2.5x) or on hover
- **Font Caching**: Cache font settings to avoid repeated font assignments
- **Conditional Operations**: Only perform expensive operations (text measurement, background drawing) when necessary

#### Force Simulation Tuning
- **Reduced cooldownTicks**: From 100 to 50 for faster convergence
- **Optimized decay rates**: 
  - `d3AlphaDecay`: 0.02 → 0.03 (faster convergence)
  - `d3VelocityDecay`: 0.3 → 0.4 (more stability)
- **Added convergence parameters**:
  - `d3AlphaMin`: 0.001 (minimum alpha for convergence)

### 2. Graph State Caching System

#### Layout Preservation
- **Node Position Caching**: Saves node positions (x, y coordinates) in memory
- **Zoom Level Caching**: Preserves zoom level and center position
- **State Restoration**: Automatically restores layout when switching between filters
- **Periodic State Saving**: Saves graph state every 2 seconds during interaction

#### Benefits
- **Consistent Layout**: Nodes maintain their positions when applying/removing filters
- **Better UX**: Users don't lose their exploration context when filtering
- **Reduced Re-computation**: Force simulation doesn't need to restart from scratch
- **Smooth Transitions**: Filter changes feel instant and natural

### 3. NetworkGraph Component Optimizations

#### Efficient Filtering
- **Memoized Filtering**: Used `useMemo` for filtered data to avoid recalculations
- **Early Returns**: Optimized filter logic with early returns for better performance
- **Set-based Lookups**: Used `Set` for O(1) node ID lookups instead of array searches
- **Pre-compiled Search**: Convert search term to lowercase once instead of per node

#### Event Handler Optimization
- **useCallback**: Memoized event handlers to prevent unnecessary re-renders
- **Memoized Stats**: Pre-calculated statistics to avoid repeated calculations

### 4. Vite Configuration Optimizations

#### Dependency Optimization
- **Pre-bundled Dependencies**: Added force graph and D3 libraries to `optimizeDeps.include`
- **Manual Chunking**: Separated heavy libraries into their own chunks for better caching
- **HMR Optimization**: Disabled overlay for faster hot module replacement

## Performance Monitoring

A `PerformanceMonitor` component has been added to track:
- **FPS (Frames Per Second)**: Real-time frame rate monitoring
- **Frame Time**: Average time per frame in milliseconds
- **Color-coded Performance**: Green (≥55 FPS), Yellow (45-54 FPS), Red (<45 FPS)

## Expected Performance Improvements

1. **Smoother Animation**: Reduced force simulation iterations and optimized decay rates
2. **Faster Rendering**: Memoized calculations and optimized canvas operations
3. **Responsive Interactions**: Better event handling and reduced re-renders
4. **Efficient Filtering**: O(1) lookups and memoized filtering operations
5. **Layout Consistency**: Preserved node positions between filter changes
6. **Instant Filtering**: No layout recalculation when switching filters

## Usage Tips

1. **Monitor Performance**: The performance monitor shows real-time FPS in the top-left corner
2. **Filter Strategically**: Use filters to reduce the number of nodes for better performance
3. **Zoom Levels**: Labels only appear at higher zoom levels to maintain performance
4. **Layout Preservation**: Node positions are automatically preserved when switching filters
5. **Reset Layout**: Use the "Reset Layout" button if you want to start with a fresh layout
6. **Browser Optimization**: Ensure hardware acceleration is enabled in your browser

## Troubleshooting

If performance is still poor:
1. Check the performance monitor for FPS readings
2. Reduce the number of visible nodes using filters
3. Close other browser tabs to free up memory
4. Ensure your browser supports WebGL for canvas acceleration
5. Use the "Reset Layout" button to clear cached positions if the layout becomes unstable

## Graph State Caching Details

### How It Works
1. **State Collection**: The system periodically saves node positions, zoom level, and center coordinates
2. **State Storage**: Graph state is stored in React state (in-memory cache)
3. **State Application**: When filters change, cached positions are applied to visible nodes
4. **Position Fixing**: Nodes with cached positions are temporarily "fixed" to prevent movement

### State Structure
```typescript
interface GraphState {
  nodePositions: Map<string, { x: number; y: number }>;
  zoomLevel: number;
  center: { x: number; y: number };
}
```

### Benefits
- **Consistent Experience**: Users can explore the graph and apply filters without losing context
- **Performance**: No need to recalculate force simulation for filtered views
- **Smooth Transitions**: Filter changes are instant and maintain visual continuity
- **Memory Efficient**: Only stores essential position data, not full graph state 