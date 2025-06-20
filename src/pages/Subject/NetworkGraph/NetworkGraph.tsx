import { useRef, useState, useCallback, useEffect } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import * as THREE from 'three';
import * as d3 from 'd3';
import { forceX, forceY, forceZ, forceManyBody } from 'd3-force-3d';

import ForceGraph3D from 'react-force-graph-3d'; //reference: https://github.com/vasturiano/react-force-graph?tab=readme-ov-file

import './NetworkGraph.css';

// Type for our nodes - you may need to adjust this based on your data structure
interface NodeObject {
  id: number;
  name: string;
  date: string | null;
  type: string;
  color: string;
  val: number;
  // These will be added by the component:
  x?: number;
  y?: number;
  z?: number;
  layerPosition?: number;
  datePosition?: number;
}

// Type for our links - you may need to adjust this based on your data structure
interface LinkObject {
  source: number | NodeObject;
  target: number | NodeObject;
  type: string;
  color: string;
  sourceType: string;
}

// Type for our graph data
interface GraphData {
  nodes: NodeObject[];
  links: LinkObject[];
}

// Define node colors
const nodeColors: { [key: string]: string } = {
  Book: '#FF595E',
  Press: '#FF924C',
  Paper: '#FFCA3A',
  Subject: '#8AC926',
  Patent: '#4C95C7',
  Product: '#6E3E99',
  Organization: '#33F995',
  Taxonomy: '#FF6F61',
  People: '#6A0572',
  // Default color for undefined types will be #999999
};

// Helper functions for grid and text visualization
function makeText(
  text: string,
  position: [number, number, number],
  opts?: any
): THREE.Sprite {
  const parameters = opts || {};
  const fontFace = parameters.fontFace || 'Helvetica';
  const fontSize = parameters.fontSize || 70;
  const spriteSize = parameters.spriteSize || 30;
  const fontColor = parameters.fontcolor || 'rgba(100, 100, 100, 0.8)';

  // Create canvas
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d')!;

  // Set font and measure text
  context.font = `${fontSize}px ${fontFace}`;
  const metrics = context.measureText(text);
  const textWidth = metrics.width;
  canvas.width = textWidth;
  canvas.height = textWidth;

  // Draw text
  context.font = `${fontSize}px ${fontFace}`;
  context.fillStyle = fontColor;
  context.textAlign = 'center';
  context.textBaseline = 'top';
  context.fillText(text, canvas.width / 2, canvas.height / 2);

  // Create texture and sprite
  const texture = new THREE.Texture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.needsUpdate = true;

  const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(spriteSize, spriteSize, 1.0);
  sprite.position.set(position[0], position[1], position[2]);

  return sprite;
}

function makeDot(position: [number, number, number]): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(1, 6, 6);
  const material = new THREE.MeshBasicMaterial({
    color: 'rgba(0, 0, 0)',
    transparent: true,
    opacity: 0.5,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(position[0], position[1], position[2]);
  return mesh;
}

function NetworkGraph(props: any) {
  const params = props.params;

  // Using any type for the ref to avoid TS errors with the ForceGraph methods
  const fgRef = useRef<any>(null);
  const [mode, setMode] = useState<'Free' | 'Layers' | 'Time'>('Free');
  const [timeScale, setTimeScale] = useState(1000);
  const [linkWidth, setLinkWidth] = useState(0);
  const [chargeStrength, setChargeStrength] = useState(-50);
  const [linkStrength, setLinkStrength] = useState(0.3);
  const [linkDistance, setLinkDistance] = useState(2);
  const [centerStrength, setCenterStrength] = useState(0.08);
  const [dimensions, setDimensions] = useState<1 | 2 | 3>(3);
  const [showModeOptions, setShowModeOptions] = useState(false);
  const [showControlsPanel, setShowControlsPanel] = useState(false);
  const [graphData, setGraphData] = useState<GraphData>({
    nodes: [],
    links: [],
  });
  const [filteredGraphData, setFilteredGraphData] = useState<GraphData>({
    nodes: [],
    links: [],
  });
  const [selectedTypes, setSelectedTypes] = useState<{
    [key: string]: boolean;
  }>({});
  const [selectedNode, setSelectedNode] = useState<NodeObject | null>(null);
  const theme = useTheme();
  const [bgColor, setBgColor] = useState('#1A1A1A');
  const [containerDimensions, setContainerDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [requestedModeChange, setRequestedModeChange] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Update container dimensions when the container size changes
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerDimensions({
          width: rect.width,
          height: rect.height,
        });
      }
    };

    // Initial measurement
    updateDimensions();

    // Set up ResizeObserver to watch for container size changes
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Also listen for window resize as backup
    window.addEventListener('resize', updateDimensions);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  // Update background color based on theme
  useEffect(() => {
    const isDarkMode = theme.isDark;
    setBgColor(isDarkMode ? '#1A1A1A' : '#FFFFFF');
  }, [theme]);

  useEffect(() => {
    async function fetchGraphData() {
      try {
        const limit = '1000';
        const subjects = params.subjects || params.subject || 'metaverse';

        const response = await fetch(
          `https://api.futurity.science/search/graph-data?subjects=${subjects}&limit=${limit}&target=&debug=false`
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // Apply colors to nodes based on their type
        data.nodes.forEach((node: NodeObject) => {
          node.color = nodeColors[node.type] || '#999999';
        });

        // Create a mapping of node IDs to their colors for quick lookup
        const nodeColorMap = new Map();
        data.nodes.forEach((node: NodeObject) => {
          nodeColorMap.set(node.id, node.color);
        });

        // Apply colors to links based on their source node type
        data.links.forEach((link: LinkObject) => {
          const sourceId =
            typeof link.source === 'object'
              ? (link.source as NodeObject).id
              : link.source;
          link.color = nodeColorMap.get(sourceId) || '#AAAAAA';

          if (typeof link.source === 'object') {
            link.sourceType = (link.source as NodeObject).type;
          } else {
            const sourceNode = data.nodes.find(
              (node: NodeObject) => node.id === sourceId
            );
            if (sourceNode) {
              link.sourceType = sourceNode.type;
            }
          }
        });

        setGraphData(data);

        // Initialize selectedTypes with all node types set to true
        const initialSelectedTypes: { [key: string]: boolean } = {};
        const nodeTypes = Array.from(
          new Set(data.nodes.map((node: NodeObject) => node.type))
        );
        nodeTypes.forEach((type) => {
          initialSelectedTypes[type as string] = true;
        });
        setSelectedTypes(initialSelectedTypes);

        setFilteredGraphData(data);
      } catch (error) {
        console.error('Failed to fetch graph data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchGraphData();
  }, []);

  // Add this useEffect to filter graph data based on selected types
  useEffect(() => {
    if (Object.keys(selectedTypes).length === 0 || graphData.nodes.length === 0)
      return;

    // Filter nodes based on selected types
    const filteredNodes = graphData.nodes.filter(
      (node) => selectedTypes[node.type]
    );

    // Get IDs of all filtered nodes for link filtering
    const filteredNodeIds = new Set(filteredNodes.map((node) => node.id));

    // Filter links - only keep links where both source and target nodes are in the filtered set
    const filteredLinks = graphData.links.filter((link) => {
      const sourceId =
        typeof link.source === 'object' ? link.source.id : link.source;
      const targetId =
        typeof link.target === 'object' ? link.target.id : link.target;
      return filteredNodeIds.has(sourceId) && filteredNodeIds.has(targetId);
    });

    // Update filtered graph data
    setFilteredGraphData({
      nodes: filteredNodes,
      links: filteredLinks,
    });
  }, [selectedTypes, graphData]);

  // Parameters
  const minX = -500;
  const maxX = 500;

  // Layer scale - Dynamic assignment based on available data
  const [layerPositions, setLayerPositions] = useState<{
    [key: string]: number;
  }>({});

  // Set up layer positions dynamically based on available node types
  useEffect(() => {
    if (graphData.nodes.length === 0) return;

    // Extract unique node types from the data
    const nodeTypes = Array.from(
      new Set(graphData.nodes.map((node) => node.type))
    );

    // Calculate positions for each type, centered around 0
    const newLayerPositions: { [key: string]: number } = {};
    const totalLayers = nodeTypes.length;

    // Calculate spacing between layers
    const newLayerGap = (maxX - minX) / Math.max(totalLayers - 1, 1);

    // Position layers evenly, centered around 0
    nodeTypes.forEach((type, index) => {
      const position = minX + index * newLayerGap;
      newLayerPositions[type] = position;
    });

    setLayerPositions(newLayerPositions);
  }, [graphData.nodes, minX, maxX]);

  // Show Layer grid with type labels and axis - moved up before it's used in other functions
  const showLayerGrid = useCallback(
    (show = true) => {
      if (!fgRef.current || !fgRef.current.scene) return;

      const scene = fgRef.current.scene();

      // Remove existing grid if any
      const existingGrid = scene.getObjectByName('layer_grid');
      if (existingGrid) {
        scene.remove(existingGrid);
      }

      if (!show) return;

      const turn90deg = 0.5 * Math.PI;

      // Create container for grid and labels
      const gridObject = new THREE.Object3D();
      gridObject.name = 'layer_grid';

      // Get layer types and positions
      const layerTypes = Object.keys(layerPositions);
      const ticksPos: number[] = [];

      // Add tick marks and labels for each layer
      for (const layerType of layerTypes) {
        const tickPos = layerPositions[layerType];
        ticksPos.push(tickPos);

        // Add tick dot
        const dot = makeDot([tickPos, 0, 0]);
        gridObject.add(dot);

        // Add layer type label
        const text = makeText(layerType, [tickPos, 0, 0]);
        gridObject.add(text);
      }

      // Create axis line only (no grid)
      const axisPoints = [];
      axisPoints.push(new THREE.Vector3(minX, 0, 0));
      axisPoints.push(new THREE.Vector3(maxX, 0, 0));

      const axisMaterial = new THREE.LineBasicMaterial({
        color: 0xaaaaaa,
        opacity: 0.5,
      });
      const axisGeo = new THREE.BufferGeometry().setFromPoints(axisPoints);
      const axisLine = new THREE.LineSegments(axisGeo, axisMaterial);

      gridObject.add(axisLine);
      gridObject.rotation.set(0, -turn90deg, 0);

      // Add grid to scene
      scene.add(gridObject);
    },
    [layerPositions, minX, maxX]
  );

  // Apply layer-based positioning to nodes
  const applyLayerPositioning = useCallback(() => {
    if (!fgRef.current) return;

    const fg = fgRef.current;

    // Apply positions to both the original data and filtered data
    const updateNodePositions = (nodes: NodeObject[]) => {
      nodes.forEach((node: NodeObject) => {
        const layerPosition =
          typeof layerPositions[node.type] !== 'undefined'
            ? layerPositions[node.type]
            : 0;
        // Directly assign position in z-axis to match the axis visualization
        node.z = layerPosition;
        // Store the position for reference
        node.layerPosition = layerPosition;
      });
    };

    // Update positions in both the original and filtered datasets
    updateNodePositions([...graphData.nodes]);
    updateNodePositions([...filteredGraphData.nodes]);

    // Update the graph with our modified data
    fg.__data = {
      nodes: [...filteredGraphData.nodes],
      links: [...filteredGraphData.links],
    };

    // Ensure visualization is aligned
    showLayerGrid(true);
  }, [mode, graphData, filteredGraphData, layerPositions, showLayerGrid]);

  // Date scale setup
  const nodeWithDates = graphData.nodes.filter((node) => node.date);
  const dateExtent = d3.extent(
    nodeWithDates
      .map((node) => (node.date ? new Date(node.date) : null))
      .filter(Boolean) as Date[]
  );
  const today = new Date();
  const startDate = dateExtent[0]
    ? new Date(Math.floor(dateExtent[0].getFullYear() / 10) * 10, 0, 1)
    : new Date(today.getFullYear() - 10, 0, 1);
  const endDate = dateExtent[1] || today;
  const scaleDate = d3
    .scaleTime()
    .domain([startDate, endDate])
    .range([minX, maxX]);

  // Set initial camera after component mounts
  useEffect(() => {
    const stepDuration = 3000;
    if (fgRef.current) {
      const cameraDist = 2 * maxX;
      fgRef.current.cameraPosition(
        { x: cameraDist, y: -cameraDist, z: -cameraDist },
        { x: 0, y: 0, z: 0 },
        stepDuration
      );

      //after the 3000s zoom to fit
      setTimeout(() => {
        fgRef.current.zoomToFit(stepDuration, 30);
      }, stepDuration + 100);
    }
  }, []);

  // Update forces when dependencies change
  useEffect(() => {
    if (fgRef.current) {
      // Make sure to wait for the force graph to be fully initialized
      setTimeout(() => {
        updateForces();
      }, 100);
    }
  }, [
    mode,
    chargeStrength,
    linkStrength,
    linkDistance,
    centerStrength,
    timeScale,
  ]);

  // Function to update all forces
  const updateForces = useCallback(
    (newMode?: 'Free' | 'Layers' | 'Time') => {
      if (newMode !== 'Free' && newMode !== 'Layers' && newMode !== 'Time')
        newMode = mode;

      console.log('Updating forces...', newMode);
      if (!fgRef.current) return;

      const fg = fgRef.current;

      // Position forces based on mode
      if (newMode === 'Layers') {
        // For Layers mode, we use 2D forces for X and Y, but fixed Z positions
        setDimensions(2);

        fg.d3Force('charge', forceManyBody().strength(chargeStrength));
        fg.d3Force('link').distance(linkDistance).strength(linkStrength);
        fg.d3Force('positionX', forceX(0).strength(centerStrength))
          .d3Force('positionY', forceY(0).strength(centerStrength))
          .d3Force('positionZ', null);

        applyLayerPositioning();
      } else if (newMode === 'Time') {
        // For Time mode, we use 2D forces for X and Y, but fixed Z positions
        setDimensions(2);

        fg.d3Force('charge', forceManyBody().strength(chargeStrength));
        fg.d3Force('link').distance(linkDistance).strength(linkStrength);
        fg.d3Force('positionX', forceX(0).strength(centerStrength))
          .d3Force('positionY', forceY(0).strength(centerStrength))
          .d3Force('positionZ', null);

        applyTimePositioning();
      } else {
        // Free mode - use all 3D forces
        setDimensions(3);

        fg.d3Force('charge', forceManyBody().strength(chargeStrength));
        fg.d3Force('link').distance(linkDistance).strength(linkStrength);
        fg.d3Force('positionX', forceX(0).strength(centerStrength))
          .d3Force('positionY', forceY(0).strength(centerStrength))
          .d3Force('positionZ', forceZ(0).strength(centerStrength));
      }

      fg.refresh(); // Refresh the graph to apply the new forces
    },
    [
      mode,
      chargeStrength,
      linkStrength,
      linkDistance,
      centerStrength,
      timeScale,
      graphData.nodes,
      dimensions,
    ]
  );

  // Apply time-based positioning to nodes
  const applyTimePositioning = useCallback(() => {
    if (!fgRef.current) return;

    // Adjust scale range based on timeScale slider
    const scaledDate = scaleDate.copy().range([minX, timeScale + minX]);

    const fg = fgRef.current;
    const nodesData = graphData.nodes;
    const todayDate = new Date();

    // Apply time positions directly to the nodes in the simulation
    nodesData.forEach((node) => {
      const timePosition = node.date
        ? scaledDate(new Date(node.date))
        : scaledDate(todayDate);
      // Store the position in the node object
      node.datePosition = timePosition;
      // Directly set z coordinate
      node.z = timePosition;
    });

    // Update the graph with our modified data
    fg.__data = { ...graphData };
  }, [graphData, scaleDate, minX, timeScale]);

  // Show Time grid with years and axis
  const showTimeGrid = useCallback(
    (show = true) => {
      if (!fgRef.current || !fgRef.current.scene) return;

      const scene = fgRef.current.scene();

      // Remove existing grid if any
      const existingGrid = scene.getObjectByName('time_grid');
      if (existingGrid) {
        scene.remove(existingGrid);
      }

      if (!show) return;

      const turn90deg = 0.5 * Math.PI;

      // Create container for grid and labels
      const gridObject = new THREE.Object3D();
      gridObject.name = 'time_grid';

      // Check that we have valid date domain
      if (!scaleDate.domain()[0] || !scaleDate.domain()[1]) {
        return;
      }

      // Calculate ticks based on year span
      const years =
        scaleDate.domain()[1].getFullYear() -
        scaleDate.domain()[0].getFullYear();
      let nTicks = years;
      if (years > 20) {
        nTicks = Math.floor(years / 10);
      }

      const ticks = scaleDate.ticks(nTicks);
      const ticksPos: number[] = [];

      // Add tick marks and labels
      for (const tick of ticks) {
        const tickPos = scaleDate(tick);
        ticksPos.push(tickPos);

        // Add tick dot
        const dot = makeDot([tickPos, 0, 0]);
        gridObject.add(dot);

        // Add year label
        const year = tick.getFullYear();
        const text = makeText(year.toString(), [tickPos, 0, 0]);
        gridObject.add(text);
      }

      gridObject.rotation.set(0, -turn90deg, 0);
      // Add grid to scene
      scene.add(gridObject);
    },
    [scaleDate, minX, maxX]
  );

  // Update scene visualization based on current mode
  const updateSceneVisualization = useCallback(() => {
    if (mode === 'Time') {
      showTimeGrid(true);
      showLayerGrid(false);
    } else if (mode === 'Layers') {
      showTimeGrid(false);
      showLayerGrid(true);
    } else {
      showTimeGrid(false);
      showLayerGrid(false);
    }
  }, [mode, showTimeGrid, showLayerGrid]);

  // Update scene visualization when mode or graph data changes
  useEffect(() => {
    if (fgRef.current && fgRef.current.scene) {
      // Wait a bit for the graph to update its internal state
      setTimeout(() => {
        updateSceneVisualization();
      }, 300);
    }
  }, [mode, graphData, updateSceneVisualization]);

  // Handle mode change
  const handleModeChange = useCallback(
    (newMode: 'Free' | 'Layers' | 'Time') => {
      setMode(newMode);
      updateForces(newMode);
      setRequestedModeChange(true);

      const stepDuration = 3000;
      setTimeout(() => {
        // First zoom to fit
        if (fgRef.current) {
          // Then position the camera isometrically
          const totalDistance = Math.max(
            Math.abs(fgRef.current.cameraPosition().x),
            Math.abs(fgRef.current.cameraPosition().y),
            Math.abs(fgRef.current.cameraPosition().z)
          );
          const isometricFactor = totalDistance / Math.sqrt(3);

          fgRef.current.cameraPosition(
            { x: isometricFactor, y: -isometricFactor, z: isometricFactor },
            { x: 0, y: 0, z: 0 },
            stepDuration
          );
        }
      }, 200);
    },
    []
  );

  // 3D Node object customization
  const nodeThreeObject = useCallback(
    (node: NodeObject) => {
      const minR = 3;
      const maxR = 6;
      const segments = 10;

      // Check if this is the selected node
      const isSelected = selectedNode && selectedNode.id === node.id;

      // Create geometry based on node type and selection state
      // Increase radius for selected node
      const radius = isSelected
        ? maxR * 1.5
        : node.type === 'Subject'
        ? maxR
        : minR;
      const geometry = new THREE.SphereGeometry(radius, segments, segments);

      // Create material with appropriate color and opacity
      let opacity = 1;
      if (mode === 'Time' && !node.date) {
        opacity = 0.2;
      }

      // For selected node, we'll add an outline effect
      if (isSelected) {
        // Create a group to hold multiple meshes
        const group = new THREE.Group();

        // Inner sphere (the actual node)
        const innerMaterial = new THREE.MeshBasicMaterial({
          color: node.color,
          transparent: false,
        });
        const innerMesh = new THREE.Mesh(geometry, innerMaterial);
        group.add(innerMesh);

        // Outer sphere (the highlight) - render only the back side of the material
        const outerGeometry = new THREE.SphereGeometry(
          radius * 1.3,
          segments,
          segments
        );
        const outerMaterial = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.8,
          wireframe: false,
          side: THREE.BackSide,
        });
        const outerMesh = new THREE.Mesh(outerGeometry, outerMaterial);
        group.add(outerMesh);

        return group;
      } else {
        // Regular node
        const material = new THREE.MeshBasicMaterial({
          color: node.color,
          transparent: true,
          opacity: opacity,
        });

        return new THREE.Mesh(geometry, material);
      }
    },
    [mode, selectedNode]
  );

  // Zoom to fit function
  const handleZoomToFit = useCallback(() => {
    if (fgRef.current) {
      fgRef.current.zoomToFit(1000, 30);
    }
  }, []);

  // Handle engine stop event
  const handleEngineStop = useCallback(() => {
    if (requestedModeChange) {
      if (mode === 'Layers') {
        applyLayerPositioning();
      }
      if (mode === 'Time') {
        applyTimePositioning();
      }
      setRequestedModeChange(false);
    }
  }, [
    mode,
    applyLayerPositioning,
    applyTimePositioning,
    requestedModeChange,
    setRequestedModeChange,
  ]);

  // Toggle controls visibility
  const toggleControls = () => {
    setShowControlsPanel(!showControlsPanel);
  };

  // Add this function to handle legend item clicks
  const handleLegendItemClick = useCallback((type: string) => {
    setSelectedTypes((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  }, []);

  // Handle background click to reset selected node
  const handleBackgroundClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // Node click handler - updates selected node for info display
  const handleNodeClick = useCallback((node: NodeObject) => {
    // Set the selected node for the info panel
    setSelectedNode(node);

    // Aim at node from outside it
    if (!fgRef.current) return;

    const distance = 500;
    const distRatio =
      1 + distance / Math.hypot(node.x || 0, node.y || 0, node.z || 0);

    fgRef.current.cameraPosition(
      {
        x: (node.x || 0) * distRatio,
        y: (node.y || 0) * distRatio,
        z: (node.z || 0) * distRatio,
      },
      node,
      3000
    );
  }, []);

  return (
    <div
      ref={containerRef}
      className='network-graph-container'
      style={{
        width: '100%',
        height: '100%',
        minHeight: '400px',
      }}
    >
      <div
        style={{
          height: '100%',
          width: '100%',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {isLoading && (
          <div
            className='loading-overlay'
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              top: '0',
              left: '0',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: bgColor,
              zIndex: 100,
            }}
          >
            <div
              className='loading-spinner'
              style={{
                width: '50px',
                height: '50px',
                border: `3px solid ${
                  theme.isDark
                    ? 'rgba(255, 255, 255, 0.2)'
                    : 'rgba(0, 0, 0, 0.1)'
                }`,
                borderTop: `3px solid ${theme.isDark ? 'white' : '#333'}`,
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            ></div>
          </div>
        )}
        <ForceGraph3D
          ref={fgRef}
          key={`forcegraph-${mode}`}
          graphData={filteredGraphData}
          numDimensions={dimensions}
          nodeLabel={(node) =>
            `${node.type}${
              node.date ? ` - ${new Date(node.date).getFullYear()}` : ''
            }: ${node.name}`
          }
          nodeColor={(node) => node.color}
          nodeVal={(node) => (node.type === 'Subject' ? 20 : 1)}
          nodeThreeObject={nodeThreeObject}
          linkColor={(link) => (link as LinkObject).color}
          linkWidth={linkWidth}
          linkOpacity={0.3}
          linkDirectionalParticles={0}
          linkDirectionalParticleWidth={0}
          backgroundColor={bgColor}
          onBackgroundClick={handleBackgroundClick}
          onEngineStop={handleEngineStop}
          cooldownTicks={100}
          enableNodeDrag={false}
          enablePointerInteraction={true}
          width={containerDimensions.width || undefined}
          height={containerDimensions.height || undefined}
          controlType='orbit'
        />
      </div>
    </div>
  );
}

export default NetworkGraph;
