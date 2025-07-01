import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../context/ThemeContext';
import * as THREE from 'three';
import * as d3 from 'd3';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - d3-force-3d doesn't have types
import { forceX, forceY, forceZ, forceManyBody } from 'd3-force-3d';

import ForceGraph3D from 'react-force-graph-3d';

import './NetworkGraph.css';

// Type for our nodes
interface NodeObject {
  id: number;
  name: string;
  date: string | null;
  type: string;
  color: string;
  val: number;
  x?: number;
  y?: number;
  z?: number;
  layerPosition?: number;
  datePosition?: number;
  slug?: string;
}

// Type for our links
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

interface NetworkGraphProps {
  params: {
    subject?: string;
    subjects?: string;
  };
  backgroundColor?: string;
  hoveredNodeType?: string; // Type of nodes to highlight
}

// Define the ref interface for external control
export interface NetworkGraphRef {
  highlightNodesByType: (nodeType: string | null) => void;
  pulseNodesByType: (nodeType: string | null) => void;
}

// Updated node colors to match your theme
const nodeColors: { [key: string]: string } = {
  Organization: '#E07B91',
  Press: '#E69500',
  Website: '#F2CD5D',
  Patent: '#C3DE6D',
  Paper: '#7CCBA2',
  Book: '#46ACC8',
  Challenge: '#3366FF',
  'Sci-Fi': '#6A35D4',
  Subject: '#0005E9',
  Product: '#6E3E99',
  Taxonomy: '#FF6F61',
  People: '#6A0572',
};

// Helper functions for grid and text visualization
function makeText(
  text: string,
  position: [number, number, number],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  opts?: any
): THREE.Sprite {
  const parameters = opts || {};
  const fontFace = parameters.fontFace || 'Helvetica';
  const fontSize = parameters.fontSize || 70;
  const spriteSize = parameters.spriteSize || 30;
  const fontColor = parameters.fontcolor || 'rgba(100, 100, 100, 0.8)';

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d')!;

  context.font = `${fontSize}px ${fontFace}`;
  const metrics = context.measureText(text);
  const textWidth = metrics.width;
  canvas.width = textWidth;
  canvas.height = textWidth;

  context.font = `${fontSize}px ${fontFace}`;
  context.fillStyle = fontColor;
  context.textAlign = 'center';
  context.textBaseline = 'top';
  context.fillText(text, canvas.width / 2, canvas.height / 2);

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

const NetworkGraph = forwardRef<NetworkGraphRef, NetworkGraphProps>(
  ({ params, backgroundColor, hoveredNodeType }, ref) => {
    const navigate = useNavigate();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fgRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // PERFORMANCE FIX: Add abort controller and caches
    const abortControllerRef = useRef<AbortController | null>(null);
    const geometryCache = useRef<Map<string, THREE.SphereGeometry>>(new Map());
    const materialCache = useRef<Map<string, THREE.MeshBasicMaterial>>(
      new Map()
    );
    const throttledHover = useRef<NodeJS.Timeout | null>(null);
    const pulseAnimationRef = useRef<NodeJS.Timeout | null>(null);

    // State variables
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
    const [hoveredNode, setHoveredNode] = useState<NodeObject | null>(null);
    const [bgColor, setBgColor] = useState('#1A1A1A');
    const [containerDimensions, setContainerDimensions] = useState({
      width: 0,
      height: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [requestedModeChange, setRequestedModeChange] = useState(false);
    const [isScrollCaptured, setIsScrollCaptured] = useState(false);
    const [showTemporaryOverlay, setShowTemporaryOverlay] = useState(true);
    const [layerPositions, setLayerPositions] = useState<{
      [key: string]: number;
    }>({});
    const [highlightedNodeType, setHighlightedNodeType] = useState<
      string | null
    >(null);
    const [pulsingNodes, setPulsingNodes] = useState<Set<number>>(new Set());

    const theme = useTheme();

    // Parameters
    const minX = -500;
    const maxX = 500;

    // Expose methods via ref for external control
    useImperativeHandle(ref, () => ({
      highlightNodesByType: (nodeType: string | null) => {
        setHighlightedNodeType(nodeType);
      },
      pulseNodesByType: (nodeType: string | null) => {
        if (nodeType) {
          const nodesToPulse = filteredGraphData.nodes
            .filter((node) => node.type === nodeType)
            .map((node) => node.id);
          setPulsingNodes(new Set(nodesToPulse));

          // Clear pulse after 3 seconds
          if (pulseAnimationRef.current) {
            clearTimeout(pulseAnimationRef.current);
          }
          pulseAnimationRef.current = setTimeout(() => {
            setPulsingNodes(new Set());
          }, 3000);
        } else {
          setPulsingNodes(new Set());
          if (pulseAnimationRef.current) {
            clearTimeout(pulseAnimationRef.current);
          }
        }
      },
    }));

    // Update highlighted nodes when hoveredNodeType prop changes
    useEffect(() => {
      setHighlightedNodeType(hoveredNodeType || null);
    }, [hoveredNodeType]);

    // Update container dimensions when the container size changes
    useEffect(() => {
      const updateDimensions = () => {
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          setContainerDimensions({ width: rect.width, height: rect.height });
        }
      };

      updateDimensions();

      const resizeObserver = new ResizeObserver(updateDimensions);
      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }

      window.addEventListener('resize', updateDimensions);

      return () => {
        resizeObserver.disconnect();
        window.removeEventListener('resize', updateDimensions);
      };
    }, []);

    // Update background color based on theme or prop
    useEffect(() => {
      if (backgroundColor) {
        setBgColor(backgroundColor);
      } else {
        const isDarkMode = theme.isDark;
        setBgColor(isDarkMode ? '#111111' : '#FAFAFA');
      }
    }, [theme, backgroundColor]);

    // Handle temporary overlay to prevent initial scroll hijacking
    useEffect(() => {
      const timer = setTimeout(() => {
        setShowTemporaryOverlay(false);
      }, 2000);

      return () => clearTimeout(timer);
    }, []);

    // Simple scroll capture handling
    useEffect(() => {
      const handleClick = (e: MouseEvent) => {
        if (
          containerRef.current?.contains(e.target as Node) &&
          !isScrollCaptured
        ) {
          const target = e.target as HTMLElement;
          if (
            !target.closest('.controls-toggle-container') &&
            !target.closest('.controls-panel') &&
            !target.closest('.fullscreen-legend') &&
            !target.closest('.node-info-display') &&
            !target.closest('.scroll-overlay') &&
            !showTemporaryOverlay
          ) {
            setIsScrollCaptured(true);
          }
        }
      };

      const handleKeyPress = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && isScrollCaptured) {
          setIsScrollCaptured(false);
        }
      };

      document.addEventListener('click', handleClick);
      document.addEventListener('keydown', handleKeyPress);

      return () => {
        document.removeEventListener('click', handleClick);
        document.removeEventListener('keydown', handleKeyPress);
      };
    }, [isScrollCaptured, showTemporaryOverlay]);

    // PERFORMANCE FIX: Enhanced fetch with request cancellation and direct HTTPS URL
    useEffect(() => {
      async function fetchGraphData() {
        // Cancel previous request
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        // Create new abort controller
        abortControllerRef.current = new AbortController();

        try {
          const limit = '1000';
          const subjects = params.subjects || params.subject;

          // Use direct HTTPS URL with trailing slash to avoid redirect
          const apiUrl = `https://fast.futurity.science/graphs/graph-data?subjects=${encodeURIComponent(
            subjects || ''
          )}&limit=${limit}&debug=false`;

          console.log('Fetching graph data from:', apiUrl);

          const response = await fetch(apiUrl, {
            signal: abortControllerRef.current.signal,
          });

          console.log('Response status:', response.status);
          console.log('Response headers:', response.headers);

          if (!response.ok) {
            // Try to get error details
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            throw new Error(
              `HTTP error! status: ${response.status}, message: ${errorText}`
            );
          }

          const data = await response.json();
          console.log('Graph data received:', data);

          // Apply colors to nodes based on their type
          data.nodes.forEach((node: NodeObject) => {
            node.color = nodeColors[node.type] || '#999999';

            // Add slug for Subject nodes for navigation
            if (node.type === 'Subject') {
              node.slug = node.name
                .toLowerCase()
                .replace(/\s+/g, '_')
                .replace(/\./g, '-')
                .replace(/[^a-z0-9_-]/g, '');
            }
          });

          const nodeColorMap = new Map();
          data.nodes.forEach((node: NodeObject) => {
            nodeColorMap.set(node.id, node.color);
          });

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
          if (error instanceof Error && error.name !== 'AbortError') {
            console.error('Failed to fetch graph data:', error);

            // Enhanced error handling with CORS-specific messaging
            if (
              error.message.includes('NetworkError') ||
              error.message.includes('CORS')
            ) {
              console.error(
                'CORS Error - This is likely due to the API server not allowing cross-origin requests.'
              );
              console.error(
                'Solutions: 1) Use development proxy, 2) Contact API maintainer, 3) Use CORS browser extension for development'
              );
            }
          }
        } finally {
          setIsLoading(false);
        }
      }

      fetchGraphData();

      // Cleanup function
      return () => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      };
    }, [params.subject, params.subjects]);

    // PERFORMANCE FIX: Memoize filtered graph data calculation
    const memoizedFilteredData = useMemo(() => {
      if (
        Object.keys(selectedTypes).length === 0 ||
        graphData.nodes.length === 0
      ) {
        return { nodes: [], links: [] };
      }

      const filteredNodes = graphData.nodes.filter(
        (node) => selectedTypes[node.type]
      );
      const filteredNodeIds = new Set(filteredNodes.map((node) => node.id));

      const filteredLinks = graphData.links.filter((link) => {
        const sourceId =
          typeof link.source === 'object' ? link.source.id : link.source;
        const targetId =
          typeof link.target === 'object' ? link.target.id : link.target;
        return filteredNodeIds.has(sourceId) && filteredNodeIds.has(targetId);
      });

      return { nodes: filteredNodes, links: filteredLinks };
    }, [selectedTypes, graphData]);

    // Update filtered data when memoized calculation changes
    useEffect(() => {
      setFilteredGraphData(memoizedFilteredData);
    }, [memoizedFilteredData]);

    // Update layer positions
    useEffect(() => {
      if (graphData.nodes.length === 0) return;

      const nodeTypes = Array.from(
        new Set(graphData.nodes.map((node) => node.type))
      );
      const newLayerPositions: { [key: string]: number } = {};
      const totalLayers = nodeTypes.length;
      const newLayerGap = (maxX - minX) / Math.max(totalLayers - 1, 1);

      nodeTypes.forEach((type, index) => {
        const position = minX + index * newLayerGap;
        newLayerPositions[type] = position;
      });

      setLayerPositions(newLayerPositions);
    }, [graphData.nodes, minX, maxX]);

    // Grid and positioning functions
    const showLayerGrid = useCallback(
      (show = true) => {
        if (!fgRef.current || !fgRef.current.scene) return;

        const scene = fgRef.current.scene();
        const existingGrid = scene.getObjectByName('layer_grid');
        if (existingGrid) {
          scene.remove(existingGrid);
        }

        if (!show) return;

        const turn90deg = 0.5 * Math.PI;
        const gridObject = new THREE.Object3D();
        gridObject.name = 'layer_grid';

        const layerTypes = Object.keys(layerPositions);

        for (const layerType of layerTypes) {
          const tickPos = layerPositions[layerType];

          const dot = makeDot([tickPos, 0, 0]);
          gridObject.add(dot);

          const text = makeText(layerType, [tickPos, 0, 0]);
          gridObject.add(text);
        }

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
        scene.add(gridObject);
      },
      [layerPositions, minX, maxX]
    );

    const applyLayerPositioning = useCallback(() => {
      if (!fgRef.current) return;

      const fg = fgRef.current;

      const updateNodePositions = (nodes: NodeObject[]) => {
        nodes.forEach((node: NodeObject) => {
          const layerPosition =
            typeof layerPositions[node.type] !== 'undefined'
              ? layerPositions[node.type]
              : 0;
          node.z = layerPosition;
          node.layerPosition = layerPosition;
        });
      };

      updateNodePositions([...graphData.nodes]);
      updateNodePositions([...filteredGraphData.nodes]);

      fg.__data = {
        nodes: [...filteredGraphData.nodes],
        links: [...filteredGraphData.links],
      };

      showLayerGrid(true);
    }, [graphData, filteredGraphData, layerPositions, showLayerGrid]);

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

    const applyTimePositioning = useCallback(() => {
      if (!fgRef.current) return;

      const scaledDate = scaleDate.copy().range([minX, timeScale + minX]);
      const fg = fgRef.current;
      const nodesData = graphData.nodes;
      const todayDate = new Date();

      nodesData.forEach((node) => {
        const timePosition = node.date
          ? scaledDate(new Date(node.date))
          : scaledDate(todayDate);
        node.datePosition = timePosition;
        node.z = timePosition;
      });

      fg.__data = { ...graphData };
    }, [graphData, scaleDate, minX, timeScale]);

    const showTimeGrid = useCallback(
      (show = true) => {
        if (!fgRef.current || !fgRef.current.scene) return;

        const scene = fgRef.current.scene();
        const existingGrid = scene.getObjectByName('time_grid');
        if (existingGrid) {
          scene.remove(existingGrid);
        }

        if (!show) return;

        const turn90deg = 0.5 * Math.PI;
        const gridObject = new THREE.Object3D();
        gridObject.name = 'time_grid';

        if (!scaleDate.domain()[0] || !scaleDate.domain()[1]) {
          return;
        }

        const years =
          scaleDate.domain()[1].getFullYear() -
          scaleDate.domain()[0].getFullYear();
        let nTicks = years;
        if (years > 20) {
          nTicks = Math.floor(years / 10);
        }

        const ticks = scaleDate.ticks(nTicks);

        for (const tick of ticks) {
          const tickPos = scaleDate(tick);

          const dot = makeDot([tickPos, 0, 0]);
          gridObject.add(dot);

          const year = tick.getFullYear();
          const text = makeText(year.toString(), [tickPos, 0, 0]);
          gridObject.add(text);
        }

        gridObject.rotation.set(0, -turn90deg, 0);
        scene.add(gridObject);
      },
      [scaleDate]
    );

    // Force update functions
    const updateForces = useCallback(
      (newMode?: 'Free' | 'Layers' | 'Time') => {
        if (newMode !== 'Free' && newMode !== 'Layers' && newMode !== 'Time')
          newMode = mode;

        if (!fgRef.current) return;

        const fg = fgRef.current;

        if (newMode === 'Layers') {
          setDimensions(2);
          fg.d3Force('charge', forceManyBody().strength(chargeStrength));
          fg.d3Force('link').distance(linkDistance).strength(linkStrength);
          fg.d3Force('positionX', forceX(0).strength(centerStrength))
            .d3Force('positionY', forceY(0).strength(centerStrength))
            .d3Force('positionZ', null);
          applyLayerPositioning();
        } else if (newMode === 'Time') {
          setDimensions(2);
          fg.d3Force('charge', forceManyBody().strength(chargeStrength));
          fg.d3Force('link').distance(linkDistance).strength(linkStrength);
          fg.d3Force('positionX', forceX(0).strength(centerStrength))
            .d3Force('positionY', forceY(0).strength(centerStrength))
            .d3Force('positionZ', null);
          applyTimePositioning();
        } else {
          setDimensions(3);
          fg.d3Force('charge', forceManyBody().strength(chargeStrength));
          fg.d3Force('link').distance(linkDistance).strength(linkStrength);
          fg.d3Force('positionX', forceX(0).strength(centerStrength))
            .d3Force('positionY', forceY(0).strength(centerStrength))
            .d3Force('positionZ', forceZ(0).strength(centerStrength));
        }

        fg.refresh();
      },
      [
        mode,
        chargeStrength,
        linkStrength,
        linkDistance,
        centerStrength,
        applyLayerPositioning,
        applyTimePositioning,
      ]
    );

    // Update forces when dependencies change
    useEffect(() => {
      if (fgRef.current) {
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
      updateForces,
    ]);

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

    useEffect(() => {
      if (fgRef.current && fgRef.current.scene) {
        setTimeout(() => {
          updateSceneVisualization();
        }, 300);
      }
    }, [mode, graphData, updateSceneVisualization]);

    // Set initial camera after component mounts
    useEffect(() => {
      if (fgRef.current && filteredGraphData.nodes.length > 0) {
        setTimeout(() => {
          if (fgRef.current) {
            const cameraDist = 2 * maxX;
            fgRef.current.cameraPosition(
              { x: cameraDist, y: -cameraDist, z: -cameraDist },
              { x: 0, y: 0, z: 0 },
              0
            );

            setTimeout(() => {
              if (fgRef.current) {
                fgRef.current.zoomToFit(0, 30);
              }
            }, 200);
          }
        }, 100);
      }
    }, [maxX, filteredGraphData.nodes.length]);

    // Event handlers
    const handleModeChange = useCallback(
      (newMode: 'Free' | 'Layers' | 'Time') => {
        setMode(newMode);
        updateForces(newMode);
        setRequestedModeChange(true);

        setTimeout(() => {
          if (fgRef.current) {
            const totalDistance = Math.max(
              Math.abs(fgRef.current.cameraPosition().x),
              Math.abs(fgRef.current.cameraPosition().y),
              Math.abs(fgRef.current.cameraPosition().z)
            );
            const isometricFactor = totalDistance / Math.sqrt(3);

            fgRef.current.cameraPosition(
              { x: isometricFactor, y: -isometricFactor, z: isometricFactor },
              { x: 0, y: 0, z: 0 },
              0
            );
          }
        }, 200);
      },
      [updateForces]
    );

    // PERFORMANCE FIX: Optimized nodeThreeObject with caching and highlighting
    const nodeThreeObject = useCallback(
      (node: NodeObject) => {
        const minR = 3;
        const maxR = 6;
        const segments = 8; // Reduced for better performance

        const isSelected = selectedNode && selectedNode.id === node.id;
        const isHovered = hoveredNode && hoveredNode.id === node.id;
        const isHighlighted =
          highlightedNodeType && node.type === highlightedNodeType;
        const isPulsing = pulsingNodes.has(node.id);

        let radius = isSelected
          ? maxR * 1.5
          : node.type === 'Subject'
          ? maxR
          : minR;

        // Increase radius for highlighted or pulsing nodes
        if (isHighlighted || isPulsing) {
          radius *= 1.3;
        }

        // Use cached geometry
        const geometryKey = `${radius}-${segments}`;
        let geometry = geometryCache.current.get(geometryKey);
        if (!geometry) {
          geometry = new THREE.SphereGeometry(radius, segments, segments);
          geometryCache.current.set(geometryKey, geometry);
        }

        let opacity = 1;
        if (mode === 'Time' && !node.date) {
          opacity = 0.2;
        }

        // Dim non-highlighted nodes when highlighting is active
        if (highlightedNodeType && node.type !== highlightedNodeType) {
          opacity *= 0.3;
        }

        if (
          isSelected ||
          (isHovered && node.type === 'Subject') ||
          isHighlighted ||
          isPulsing
        ) {
          const group = new THREE.Group();

          // Use cached materials
          const innerMaterialKey = `inner-${node.color}-${opacity}`;
          let innerMaterial = materialCache.current.get(innerMaterialKey);
          if (!innerMaterial) {
            innerMaterial = new THREE.MeshBasicMaterial({
              color: node.color,
              transparent: opacity < 1,
              opacity: opacity,
            });
            materialCache.current.set(innerMaterialKey, innerMaterial);
          }

          const innerMesh = new THREE.Mesh(geometry, innerMaterial);
          group.add(innerMesh);

          // Add glow effect for highlighted/pulsing nodes
          if (isHighlighted || isPulsing) {
            const glowGeometryKey = `${radius * 1.5}-${segments}`;
            let glowGeometry = geometryCache.current.get(glowGeometryKey);
            if (!glowGeometry) {
              glowGeometry = new THREE.SphereGeometry(
                radius * 1.5,
                segments,
                segments
              );
              geometryCache.current.set(glowGeometryKey, glowGeometry);
            }

            const glowColor = isPulsing ? 0xffffff : node.color;
            const glowOpacity = isPulsing ? 0.6 : 0.4;

            const glowMaterialKey = `glow-${glowColor.toString()}-${glowOpacity}`;
            let glowMaterial = materialCache.current.get(glowMaterialKey);
            if (!glowMaterial) {
              glowMaterial = new THREE.MeshBasicMaterial({
                color: glowColor,
                transparent: true,
                opacity: glowOpacity,
                side: THREE.BackSide,
              });
              materialCache.current.set(glowMaterialKey, glowMaterial);
            }

            const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
            group.add(glowMesh);
          }

          // Regular outer shell for selected/hovered nodes
          if (isSelected || isHovered) {
            const outerGeometryKey = `${radius * 1.3}-${segments}`;
            let outerGeometry = geometryCache.current.get(outerGeometryKey);
            if (!outerGeometry) {
              outerGeometry = new THREE.SphereGeometry(
                radius * 1.3,
                segments,
                segments
              );
              geometryCache.current.set(outerGeometryKey, outerGeometry);
            }

            const outerMaterialKey = `outer-${isHovered ? 'cyan' : 'white'}`;
            let outerMaterial = materialCache.current.get(outerMaterialKey);
            if (!outerMaterial) {
              outerMaterial = new THREE.MeshBasicMaterial({
                color: isHovered ? 0x00ffff : 0xffffff,
                transparent: true,
                opacity: 0.8,
                wireframe: false,
                side: THREE.BackSide,
              });
              materialCache.current.set(outerMaterialKey, outerMaterial);
            }

            const outerMesh = new THREE.Mesh(outerGeometry, outerMaterial);
            group.add(outerMesh);
          }

          return group;
        } else {
          const materialKey = `${node.color}-${opacity}`;
          let material = materialCache.current.get(materialKey);
          if (!material) {
            material = new THREE.MeshBasicMaterial({
              color: node.color,
              transparent: opacity < 1,
              opacity: opacity,
            });
            materialCache.current.set(materialKey, material);
          }

          return new THREE.Mesh(geometry, material);
        }
      },
      [mode, selectedNode, hoveredNode, highlightedNodeType, pulsingNodes]
    );

    const handleZoomToFit = useCallback(() => {
      if (fgRef.current) {
        fgRef.current.zoomToFit(1000, 30);
      }
    }, []);

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
    ]);

    const toggleControls = () => {
      setShowControlsPanel(!showControlsPanel);
    };

    const handleLegendItemClick = useCallback((type: string) => {
      setSelectedTypes((prev) => ({
        ...prev,
        [type]: !prev[type],
      }));
    }, []);

    const handleBackgroundClick = useCallback(() => {
      setSelectedNode(null);
      setHoveredNode(null);
    }, []);

    const handleNodeClick = useCallback(
      (node: NodeObject) => {
        setSelectedNode(node);

        // Navigate to subject page if this is a Subject node
        if (node.type === 'Subject' && node.slug) {
          navigate(`/subject/${node.slug}`);
          return;
        }

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
      },
      [navigate]
    );

    // PERFORMANCE FIX: Throttled hover handler
    const handleNodeHover = useCallback(
      (node: NodeObject | null) => {
        if (throttledHover.current) {
          clearTimeout(throttledHover.current);
        }

        throttledHover.current = setTimeout(() => {
          if (hoveredNode?.id !== node?.id) {
            setHoveredNode(node);
          }
        }, 50); // 50ms throttle
      },
      [hoveredNode?.id]
    );

    // Get unique node types for legend
    const uniqueNodeTypes = Array.from(
      new Set(graphData.nodes.map((node) => node.type))
    );

    // PERFORMANCE FIX: Cleanup Three.js resources on unmount
    useEffect(() => {
      // Capture current refs to avoid stale closure issues
      const currentGeometryCache = geometryCache.current;
      const currentMaterialCache = materialCache.current;
      const currentThrottledHover = throttledHover.current;
      const currentAbortController = abortControllerRef.current;
      const currentPulseAnimation = pulseAnimationRef.current;

      return () => {
        // Clean up geometry cache
        currentGeometryCache.forEach((geometry) => {
          geometry.dispose();
        });
        currentGeometryCache.clear();

        // Clean up material cache
        currentMaterialCache.forEach((material) => {
          material.dispose();
        });
        currentMaterialCache.clear();

        // Cancel any pending hover timeouts
        if (currentThrottledHover) {
          clearTimeout(currentThrottledHover);
        }

        // Cancel any pending pulse animations
        if (currentPulseAnimation) {
          clearTimeout(currentPulseAnimation);
        }

        // Cancel any pending requests
        if (currentAbortController) {
          currentAbortController.abort();
        }
      };
    }, []);

    return (
      <div
        ref={containerRef}
        className='network-graph-container'
        style={{
          width: '100%',
          height: '100%',
          minHeight: '400px',
          position: 'relative',
        }}
      >
        {/* Scroll control overlay - prevents zoom when not captured */}
        {!showTemporaryOverlay && !isScrollCaptured && (
          <div
            className='scroll-overlay'
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 50,
              backgroundColor: 'transparent',
              pointerEvents: 'auto',
              cursor: 'pointer',
            }}
            onClick={() => setIsScrollCaptured(true)}
          />
        )}

        {/* Action Bar for Scroll Control */}
        <div
          style={{
            position: 'absolute',
            bottom: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 300,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 20px',
            borderRadius: '8px',
            backdropFilter: 'blur(6px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            minWidth: '300px',
            justifyContent: 'center',
          }}
          className={
            theme.isDark ? 'dark-controls-panel' : 'light-controls-panel'
          }
        >
          {showTemporaryOverlay ? (
            <>
              <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>
                ⏳ Loading network...
              </span>
              <div
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  backgroundColor: 'rgba(255, 165, 0, 0.2)',
                  border: '1px solid rgba(255, 165, 0, 0.4)',
                  color: theme.isDark ? '#FFA500' : '#FF8C00',
                  fontWeight: '500',
                }}
              >
                Initializing...
              </div>
            </>
          ) : !isScrollCaptured ? (
            <>
              <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>
                💡 Click network to enable zoom
              </span>
              <div
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  backgroundColor: 'rgba(100, 200, 100, 0.2)',
                  border: '1px solid rgba(100, 200, 100, 0.4)',
                  color: theme.isDark ? '#90EE90' : '#006400',
                  fontWeight: '500',
                }}
              >
                Page Scroll Active
              </div>
            </>
          ) : (
            <>
              <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>
                🔒 Network Zoom Active
              </span>
              <button
                onClick={() => setIsScrollCaptured(false)}
                style={{
                  background: 'rgba(255, 100, 100, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '6px',
                  padding: '6px 16px',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  color: 'white',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 80, 80, 1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 100, 100, 0.9)';
                }}
              >
                Release Zoom (ESC)
              </button>
            </>
          )}
        </div>

        {/* Legend */}
        <div className={`fullscreen-legend ${theme.isDark ? 'dark' : 'light'}`}>
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 'bold',
              marginBottom: '4px',
            }}
          >
            Node Types
          </div>
          {uniqueNodeTypes.map((type) => (
            <div
              key={type}
              className={`legend-item ${theme.isDark ? 'dark' : 'light'} ${
                !selectedTypes[type] ? 'legend-item-unselected' : ''
              }`}
              onClick={() => handleLegendItemClick(type)}
              style={{
                backgroundColor:
                  highlightedNodeType === type
                    ? theme.isDark
                      ? 'rgba(255, 255, 255, 0.1)'
                      : 'rgba(0, 0, 0, 0.05)'
                    : 'transparent',
              }}
            >
              <div
                className='legend-color-box'
                style={{ backgroundColor: nodeColors[type] || '#999999' }}
              />
              <span className='legend-label'>{type}</span>
            </div>
          ))}
        </div>

        {/* Node Info Display */}
        {(selectedNode || hoveredNode) && (
          <div
            className={`node-info-display ${theme.isDark ? 'dark' : 'light'}`}
          >
            <div className='node-header'>
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: (selectedNode || hoveredNode)?.color,
                }}
              />
              <span className='node-type'>
                {(selectedNode || hoveredNode)?.type}
              </span>
            </div>
            <div className='node-name'>
              {(selectedNode || hoveredNode)?.name}
            </div>
            {(selectedNode || hoveredNode)?.date && (
              <div className='node-date'>
                {new Date((selectedNode || hoveredNode)!.date!).getFullYear()}
              </div>
            )}
            {(selectedNode || hoveredNode)?.type === 'Subject' && (
              <div
                style={{
                  fontSize: '0.75rem',
                  opacity: 0.8,
                  fontStyle: 'italic',
                  color: 'inherit',
                }}
              >
                💡 Click node to visit subject page
              </div>
            )}
          </div>
        )}

        {/* Controls */}
        <div className='controls-toggle-container'>
          {/* Mode Selector */}
          <div
            className={`mode-selector-button ${
              theme.isDark ? 'dark-controls' : 'light-controls'
            }`}
          >
            <button
              className={`mode-selector-inner-button ${
                theme.isDark ? 'dark-controls-panel' : 'light-controls-panel'
              }`}
              onClick={() => setShowModeOptions(!showModeOptions)}
            >
              <span>{mode} Mode</span>
              <span className='mode-selector-chevron'>▼</span>
            </button>
            {showModeOptions && (
              <div
                className={`mode-options-dropdown ${
                  theme.isDark ? 'dark-controls-panel' : 'light-controls-panel'
                }`}
              >
                {(['Free', 'Layers', 'Time'] as const).map((modeOption) => (
                  <button
                    key={modeOption}
                    className={`mode-option ${
                      mode === modeOption ? 'selected' : ''
                    } ${theme.isDark ? 'dark-hover' : 'light-hover'}`}
                    onClick={() => {
                      handleModeChange(modeOption);
                      setShowModeOptions(false);
                    }}
                  >
                    {modeOption} Mode
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Controls Toggle */}
          <button
            className={`control-button ${
              theme.isDark ? 'dark-controls' : 'light-controls'
            }`}
            onClick={toggleControls}
            title='Toggle Controls'
          >
            ⚙️
          </button>
        </div>

        {/* Controls Panel */}
        {showControlsPanel && (
          <div
            className={`controls-panel ${
              theme.isDark ? 'dark-controls-panel' : 'light-controls-panel'
            }`}
          >
            <button
              className={`reheat-button ${
                theme.isDark ? 'dark-controls' : 'light-controls'
              }`}
              onClick={() => fgRef.current?.d3ReheatSimulation()}
            >
              Reheat Simulation
            </button>

            <button
              className={`reheat-button ${
                theme.isDark ? 'dark-controls' : 'light-controls'
              }`}
              onClick={handleZoomToFit}
            >
              Zoom to Fit
            </button>

            <label className='control-label'>
              Charge Strength: {chargeStrength}
              <input
                type='range'
                min='-200'
                max='0'
                value={chargeStrength}
                onChange={(e) => setChargeStrength(Number(e.target.value))}
                className='control-slider'
              />
            </label>

            <label className='control-label'>
              Link Strength: {linkStrength}
              <input
                type='range'
                min='0'
                max='2'
                step='0.1'
                value={linkStrength}
                onChange={(e) => setLinkStrength(Number(e.target.value))}
                className='control-slider'
              />
            </label>

            <label className='control-label'>
              Link Distance: {linkDistance}
              <input
                type='range'
                min='1'
                max='50'
                value={linkDistance}
                onChange={(e) => setLinkDistance(Number(e.target.value))}
                className='control-slider'
              />
            </label>

            <label className='control-label'>
              Center Strength: {centerStrength}
              <input
                type='range'
                min='0'
                max='1'
                step='0.01'
                value={centerStrength}
                onChange={(e) => setCenterStrength(Number(e.target.value))}
                className='control-slider'
              />
            </label>

            <label className='control-label'>
              Link Width: {linkWidth}
              <input
                type='range'
                min='0'
                max='5'
                step='0.5'
                value={linkWidth}
                onChange={(e) => setLinkWidth(Number(e.target.value))}
                className='control-slider'
              />
            </label>

            {mode === 'Time' && (
              <label className='control-label'>
                Time Scale: {timeScale}
                <input
                  type='range'
                  min='100'
                  max='2000'
                  step='50'
                  value={timeScale}
                  onChange={(e) => setTimeScale(Number(e.target.value))}
                  className='control-slider'
                />
              </label>
            )}
          </div>
        )}

        {/* ForceGraph3D Component */}
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
            key={`forcegraph-${mode}-${params.subject || params.subjects}`}
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
            onNodeClick={handleNodeClick}
            onNodeHover={handleNodeHover}
            onEngineStop={handleEngineStop}
            cooldownTicks={50}
            enableNodeDrag={false}
            enablePointerInteraction={true}
            enableNavigationControls={true}
            width={containerDimensions.width || undefined}
            height={containerDimensions.height || undefined}
            controlType='orbit'
            rendererConfig={{
              antialias: false,
              alpha: true,
              powerPreference: 'high-performance',
              precision: 'lowp',
            }}
            nodeRelSize={1}
          />
        </div>
      </div>
    );
  }
);

NetworkGraph.displayName = 'NetworkGraph';

export default React.memo(NetworkGraph);
