import './Horizons.css';
import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

// Define the data structure
interface HorizonItem {
  name: string;
  horizon: 1 | 2 | 3 | 4;
  category: 1 | 2 | 3 | 4 | 5;
  type: 1 | 2 | 3;
  categoryName?: string; // Optional category name for display
}

const exampleData: HorizonItem[] = [
  {
    name: 'Quantum Computing',
    horizon: 3,
    category: 1,
    type: 2,
    categoryName: 'Technology',
  },
  {
    name: 'Artificial Intelligence',
    horizon: 2,
    category: 2,
    type: 1,
    categoryName: 'AI',
  },
  {
    name: 'Blockchain',
    horizon: 1,
    category: 3,
    type: 1,
    categoryName: 'Finance',
  },
  {
    name: 'Renewable Energy',
    horizon: 2,
    category: 4,
    type: 3,
    categoryName: 'Energy',
  },
  {
    name: 'Autonomous Vehicles',
    horizon: 2,
    category: 2,
    type: 1,
    categoryName: 'AI',
  },
  {
    name: 'Genetic Engineering',
    horizon: 3,
    category: 5,
    type: 2,
    categoryName: 'Biotech',
  },
];

interface HorizonsProps {
  // Component props
  data?: HorizonItem[];
  showLegend?: boolean;
}

function Horizons({ data = exampleData, showLegend = false }: HorizonsProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  // Create the D3 visualization
  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    // Responsive: use parent size for width/height (square aspect ratio)
    // Find the closest parent with a non-zero width/height
    let container = svgRef.current.parentElement;
    let containerWidth = 950;
    let containerHeight = 650;
    while (container && (containerWidth === 0 || containerHeight === 0)) {
      container = container.parentElement;
      if (container) {
        const rect = container.getBoundingClientRect();
        containerWidth = rect.width;
        containerHeight = rect.height;
      }
    }
    // Use square aspect ratio for polar chart, fit to min dimension
    const size = Math.min(containerWidth, containerHeight);
    const width = size;
    const height = size;
    // Add more bottom margin to ensure horizon axis labels are visible
    const margin = { top: 30, right: 30, bottom: 60, left: 30 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // The radius of our polar chart will be based on the smallest dimension
    const maxRadius = Math.min(chartWidth, chartHeight);

    // Create SVG
    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height])
      .attr('style', 'width: 100%; height: 100%; display: block;');

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Define gradients for each horizon
    const defs = svg.append('defs');

    const isDarkTheme =
      document.documentElement.getAttribute('data-bs-theme') === 'dark';

    // Create radial gradients for each horizon band

    // Business gradient (horizon 1)
    const businessGradient = defs
      .append('radialGradient')
      .attr('id', 'business-gradient')
      .attr('cx', '0')
      .attr('cy', '1')
      .attr('r', '1')
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('gradientTransform', `scale(${maxRadius} ${maxRadius})`);

    businessGradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', isDarkTheme ? '#333333' : '#e6e6e6')
      .attr('stop-opacity', isDarkTheme ? 0.3 : 0.35);

    businessGradient
      .append('stop')
      .attr('offset', '25%')
      .attr('stop-color', isDarkTheme ? '#333333' : '#e6e6e6')
      .attr('stop-opacity', isDarkTheme ? 0.05 : 0.08);

    // Engineering gradient (horizon 2)
    const engineeringGradient = defs
      .append('radialGradient')
      .attr('id', 'engineering-gradient')
      .attr('cx', '0')
      .attr('cy', '1')
      .attr('r', '1')
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('gradientTransform', `scale(${maxRadius} ${maxRadius})`);

    engineeringGradient
      .append('stop')
      .attr('offset', '25%')
      .attr('stop-color', isDarkTheme ? '#404040' : '#d9d9d9')
      .attr('stop-opacity', isDarkTheme ? 0.3 : 0.35);

    engineeringGradient
      .append('stop')
      .attr('offset', '50%')
      .attr('stop-color', isDarkTheme ? '#404040' : '#d9d9d9')
      .attr('stop-opacity', isDarkTheme ? 0.05 : 0.08);

    // Science gradient (horizon 3)
    const scienceGradient = defs
      .append('radialGradient')
      .attr('id', 'science-gradient')
      .attr('cx', '0')
      .attr('cy', '1')
      .attr('r', '1')
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('gradientTransform', `scale(${maxRadius} ${maxRadius})`);

    scienceGradient
      .append('stop')
      .attr('offset', '50%')
      .attr('stop-color', isDarkTheme ? '#4d4d4d' : '#cccccc')
      .attr('stop-opacity', isDarkTheme ? 0.3 : 0.35);

    scienceGradient
      .append('stop')
      .attr('offset', '75%')
      .attr('stop-color', isDarkTheme ? '#4d4d4d' : '#cccccc')
      .attr('stop-opacity', isDarkTheme ? 0.05 : 0.08);

    // Idea gradient (horizon 4)
    const ideaGradient = defs
      .append('radialGradient')
      .attr('id', 'idea-gradient')
      .attr('cx', '0')
      .attr('cy', '1')
      .attr('r', '1')
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('gradientTransform', `scale(${maxRadius} ${maxRadius})`);

    ideaGradient
      .append('stop')
      .attr('offset', '75%')
      .attr('stop-color', isDarkTheme ? '#595959' : '#bfbfbf')
      .attr('stop-opacity', isDarkTheme ? 0.3 : 0.35);

    ideaGradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', isDarkTheme ? '#595959' : '#bfbfbf')
      .attr('stop-opacity', isDarkTheme ? 0.05 : 0.08);

    // Create scales for polar coordinates with empty space in the center
    const centerPadding = maxRadius * 0.15;
    const radiusScale = d3
      .scaleLinear()
      .domain([0.5, 4.5])
      .range([centerPadding, maxRadius])
      .nice();

    const horizonToRadius = (horizon: number) => {
      const invertedHorizon = 5 - horizon;
      return radiusScale(invertedHorizon);
    };

    // Determine unique categories from data
    const uniqueCategories = Array.from(
      new Set(data.map((d) => d.category))
    ).sort((a, b) => a - b);
    const minCategory = Math.min(...uniqueCategories);
    const maxCategory = Math.max(...uniqueCategories);

    const angleScale = d3
      .scaleLinear()
      .domain([minCategory - 0.5, maxCategory + 0.5])
      .range([0, Math.PI / 2])
      .nice();

    // Create a mapping from category numbers to category names
    const categoryNamesMap = new Map<number, string>();
    data.forEach((item) => {
      if (item.categoryName && !categoryNamesMap.has(item.category)) {
        categoryNamesMap.set(item.category, item.categoryName);
      }
    });

    // Define horizon info
    const backgroundGroup = g
      .append('g')
      .attr('class', 'horizon-backgrounds')
      .attr('transform', `translate(0, ${chartHeight})`);

    // create different arcs for each sector
    const createSector = (innerR: number, outerR: number, fill: string) => {
      const arc = d3
        .arc<any, any>()
        .innerRadius(innerR)
        .outerRadius(outerR)
        .startAngle(0)
        .endAngle(Math.PI / 2);

      backgroundGroup
        .append('path')
        .attr('d', arc({} as any))
        .attr('fill', fill);
    };

    // Background sectors
    createSector(0, horizonToRadius(4), 'url(#idea-gradient)'); // Horizon 4 (innermost)
    createSector(
      horizonToRadius(4),
      horizonToRadius(3),
      'url(#science-gradient)'
    ); // Horizon 3
    createSector(
      horizonToRadius(3),
      horizonToRadius(2),
      'url(#engineering-gradient)'
    ); // Horizon 2
    createSector(
      horizonToRadius(2),
      horizonToRadius(1),
      'url(#business-gradient)'
    ); // Horizon 1 (outermost)

    // Create grid lines for the polar coordinates
    const gridGroup = g
      .append('g')
      .attr('class', 'grid-lines')
      .attr('transform', `translate(0, ${chartHeight})`);

    // Radial grid lines (horizons) - between bands instead of at their centers
    const horizonLabels = ['Idea', 'Science', 'Engineering', 'Business'];

    // Draw boundary lines between horizon bands
    // Place horizon labels from innermost (Idea) to outermost (Business)
    for (let i = 0; i < 4; i++) {
      const bandInner = horizonToRadius(4 - i + 0.5);
      const bandOuter = horizonToRadius(4 - i - 0.5);
      const midRadius = (bandInner + bandOuter) / 2;
      // Draw boundary lines
      if (i !== 0) {
        const boundaryRadius = bandInner;
        const arcGenerator = d3
          .arc<any, any>()
          .innerRadius(boundaryRadius - 0.5)
          .outerRadius(boundaryRadius + 0.5)
          .startAngle(0)
          .endAngle(Math.PI / 2);
        gridGroup
          .append('path')
          .attr('d', arcGenerator({} as any))
          .attr('fill', 'none')
          .attr('stroke', isDarkTheme ? '#555' : '#ccc')
          .attr('stroke-width', 1);
      }
      // Place label at the bottom, centered to the band
      gridGroup
        .append('text')
        .attr('x', midRadius)
        .attr('y', 44)
        .attr('class', 'horizon-label')
        .text(horizonLabels[i]);
    }

    // Category grid lines (boundaries between bands)
    // Draw grid lines at category boundaries (min-0.5 to max+0.5)
    for (let i = 0; i <= uniqueCategories.length; i++) {
      const catBoundary = minCategory - 0.5 + i;
      const angle = angleScale(catBoundary);
      const lineLength = horizonToRadius(1) * 1.02;
      gridGroup
        .append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', lineLength * Math.cos(angle))
        .attr('y2', -lineLength * Math.sin(angle))
        .attr('stroke', isDarkTheme ? '#555' : '#ccc')
        .attr('stroke-width', 0.5)
        .attr('stroke-dasharray', '3,3');
    }

    // Place category labels centered in each band, at a slightly larger radius
    // Use category names instead of numbers
    for (let i = 0; i < uniqueCategories.length; i++) {
      const cat = uniqueCategories[i];
      const angleStart = angleScale(cat - 0.5);
      const angleEnd = angleScale(cat + 0.5);
      const midAngle = (angleStart + angleEnd) / 2;
      const labelRadius = horizonToRadius(1) * 1.13;

      // Get the category name from our mapping, fall back to number if not found
      const categoryLabel = categoryNamesMap.get(cat) || String(cat);

      gridGroup
        .append('text')
        .attr('x', labelRadius * Math.cos(midAngle))
        .attr('y', -labelRadius * Math.sin(midAngle))
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .text(categoryLabel);
    }

    const dataPointsGroup = g
      .append('g')
      .attr('class', 'data-points')
      .attr('transform', `translate(0, ${chartHeight})`);

    const jitterRadius = 15;
    const jitterAngle = Math.PI / 36;

    const shapeBlue = '#8AC926';
    const shapeOpacity = 0.9;

    // Keep track of all items for collision detection
    type ItemPosition = {
      x: number;
      y: number;
      width: number;
      height: number;
      itemGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
      isColliding: boolean;
      radius: number;
      angle: number;
    };

    const itemPositions: ItemPosition[] = [];

    // Helper: overlap function
    function overlap(r1: any, r2: any, labelPad = 2) {
      return !(
        r1.right + labelPad < r2.left - labelPad ||
        r1.left - labelPad > r2.right + labelPad ||
        r1.bottom + labelPad < r2.top - labelPad ||
        r1.top - labelPad > r2.bottom + labelPad
      );
    }

    // Check collision between two data items (hex and label)
    function checkItemCollision(a: ItemPosition, b: ItemPosition): boolean {
      const hexRadius = 12;
      // a hexagon center
      const aHex = {
        left: a.x - 24,
        right: a.x - 24 + hexRadius * 2,
        top: a.y - hexRadius,
        bottom: a.y + hexRadius,
      };
      // a label
      const aLabel = {
        left: a.x,
        right: a.x + a.width,
        top: a.y - a.height / 2,
        bottom: a.y + a.height / 2,
      };
      // b hexagon center
      const bHex = {
        left: b.x - 24,
        right: b.x - 24 + hexRadius * 2,
        top: b.y - hexRadius,
        bottom: b.y + hexRadius,
      };
      // b label
      const bLabel = {
        left: b.x,
        right: b.x + b.width,
        top: b.y - b.height / 2,
        bottom: b.y + b.height / 2,
      };
      return (
        overlap(aHex, bHex) ||
        overlap(aHex, bLabel) ||
        overlap(aLabel, bHex) ||
        overlap(aLabel, bLabel)
      );
    }

    // Check collision between a data item (hex and label) and an axis label box
    function checkLabelCollision(
      item: ItemPosition,
      axisBox: {
        left: number;
        right: number;
        top: number;
        bottom: number;
        name: string;
      }
    ): boolean {
      const hexRadius = 12;
      const labelDistance = 24;
      const itemHex = {
        left: item.x - labelDistance,
        right: item.x - labelDistance + hexRadius * 2,
        top: item.y - hexRadius,
        bottom: item.y + hexRadius,
      };
      const itemLabel = {
        left: item.x,
        right: item.x + item.width,
        top: item.y - item.height / 2,
        bottom: item.y + item.height / 2,
      };
      return overlap(itemLabel, axisBox) || overlap(itemHex, axisBox);
    }

    // Axis label bounding boxes for collision avoidance
    let axisLabelBoxes: {
      left: number;
      right: number;
      top: number;
      bottom: number;
      name: string;
    }[] = [];

    // Function to detect collisions and return true if any exist
    const detectCollisions = () => {
      itemPositions.forEach((item) => {
        item.isColliding = false;
      });

      let collisionsExist = false;

      // Check each pair of items for collisions (data-data)
      for (let i = 0; i < itemPositions.length; i++) {
        for (let j = i + 1; j < itemPositions.length; j++) {
          if (checkItemCollision(itemPositions[i], itemPositions[j])) {
            itemPositions[i].isColliding = true;
            itemPositions[j].isColliding = true;
            collisionsExist = true;
          }
        }
      }

      // Check for overlap with axis labels (data-axis)
      for (let i = 0; i < itemPositions.length; i++) {
        for (let k = 0; k < axisLabelBoxes.length; k++) {
          const item = itemPositions[i];
          const axisBox = axisLabelBoxes[k];
          if (checkLabelCollision(item, axisBox)) {
            console.log(
              `Collision detected between item ${i} and axis label ${axisBox.name}`
            );
            item.isColliding = true;
            collisionsExist = true;
          }
        }
      }

      // No visual changes for collisions, just track them for resolution
      itemPositions.forEach((item) => {
        // All items have the same appearance regardless of collision status
        item.itemGroup
          .select('circle, rect, path')
          .attr('fill', shapeBlue)
          .attr('opacity', shapeOpacity);

        item.itemGroup.select('text').classed('colliding-label', false);
      });

      return collisionsExist;
    };

    // Function to create shapes based on type
    const renderShape = (d: HorizonItem) => {
      // Place data in the center of the horizon and category bands
      const horizonBandStart = horizonToRadius(d.horizon + 0.5);
      const horizonBandEnd = horizonToRadius(d.horizon - 0.5);
      const radius =
        (horizonBandStart + horizonBandEnd) / 2 +
        (Math.random() - 0.5) * jitterRadius;
      const catBandStart = angleScale(d.category - 0.5);
      const catBandEnd = angleScale(d.category + 0.5);
      const angle =
        (catBandStart + catBandEnd) / 2 + (Math.random() - 0.5) * jitterAngle;

      // Convert polar to cartesian coordinates
      const x = radius * Math.cos(angle);
      const y = -radius * Math.sin(angle);

      const itemGroup = dataPointsGroup
        .append('g')
        .attr('class', 'horizon-item')
        .attr('transform', `translate(${x}, ${y})`);

      const hexagonPoints = d3.range(6).map((i) => {
        const angle = (i * Math.PI) / 3;
        return [12 * Math.cos(angle), 12 * Math.sin(angle)];
      });
      const lineGenerator = d3.line();
      const hexPath = lineGenerator(hexagonPoints as [number, number][]) + 'Z';
      itemGroup
        .append('path')
        .attr('d', hexPath)
        .attr('fill', shapeBlue)
        .attr('opacity', shapeOpacity)
        .attr('stroke', '#fff')
        .attr('stroke-width', '0.5');

      // All text labels will be horizontal and always to the right of data points
      // Create a line from the point to the label position
      const labelDistance = 24;
      const labelX = labelDistance;
      const labelY = 0;

      // Add connecting line from point to label
      itemGroup
        .append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', labelDistance - 3)
        .attr('y2', 0)
        .attr('stroke', isDarkTheme ? '#777' : '#999')
        .attr('stroke-width', 0.5)
        .attr('stroke-dasharray', '1,1');

      itemGroup
        .append('text')
        .attr('x', labelX)
        .attr('y', labelY)
        .attr('class', 'item-label')
        .attr('text-anchor', 'start')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', '11px')
        .text(d.name);

      const labelWidth = d.name.length * 6;

      const globalLabelX = x + labelDistance;
      const globalLabelY = y;

      itemPositions.push({
        x: globalLabelX,
        y: globalLabelY,
        width: labelWidth,
        height: 20,
        itemGroup: itemGroup,
        isColliding: false,
        radius: radius,
        angle: angle,
      });
    };

    axisLabelBoxes = [];
    // Horizon axis labels (bottom, centered to each band)
    for (let i = 0; i < 4; i++) {
      const bandInner = horizonToRadius(4 - i + 0.5);
      const bandOuter = horizonToRadius(4 - i - 0.5);
      const midRadius = (bandInner + bandOuter) / 2;
      const x = midRadius;
      const y = 32;
      const text = ['Idea', 'Science', 'Engineering', 'Business'][i];
      const width = text.length * 8;
      const height = 18;
      axisLabelBoxes.push({
        left: x - width / 2,
        right: x + width / 2,
        top: y,
        bottom: y + height,
        name: text,
      });
    }
    // Category axis labels (centered in each band, outside data region)
    for (let i = 0; i < uniqueCategories.length; i++) {
      const cat = uniqueCategories[i];
      const angleStart = angleScale(cat - 0.5);
      const angleEnd = angleScale(cat + 0.5);
      const midAngle = (angleStart + angleEnd) / 2;
      const labelRadius = horizonToRadius(1) * 1.13;
      const x = labelRadius * Math.cos(midAngle);
      const y = -labelRadius * Math.sin(midAngle);
      const categoryLabel = categoryNamesMap.get(cat) || String(cat);
      const width = categoryLabel.length * 8;
      const height = 18;
      axisLabelBoxes.push({
        left: x - width / 2,
        right: x + width / 2,
        top: y - height / 2,
        bottom: y + height / 2,
        name: categoryLabel,
      });
    }

    data.forEach(renderShape);

    const resolveCollisions = () => {
      const maxIterations = 60;
      const moveStep = 8;
      let iterations = 0;

      // Function to perform a single iteration of collision resolution
      const resolveStep = () => {
        if (iterations >= maxIterations) {
          console.log(
            `Reached max iterations (${maxIterations}). Some collisions may remain.`
          );
          return;
        }

        iterations++;

        // Detect collisions
        const hasCollisions = detectCollisions();

        // If no collisions, we're done
        if (!hasCollisions) {
          console.log(
            `All collisions resolved after ${iterations} iterations.`
          );
          return;
        }

        // Map to track which items are colliding with each other (data-data and data-label)
        const collisionMap = new Map<ItemPosition, ItemPosition[]>();

        // Data-data collisions
        for (let i = 0; i < itemPositions.length; i++) {
          for (let j = i + 1; j < itemPositions.length; j++) {
            if (checkItemCollision(itemPositions[i], itemPositions[j])) {
              if (!collisionMap.has(itemPositions[i])) {
                collisionMap.set(itemPositions[i], []);
              }
              if (!collisionMap.has(itemPositions[j])) {
                collisionMap.set(itemPositions[j], []);
              }
              collisionMap.get(itemPositions[i])!.push(itemPositions[j]);
              collisionMap.get(itemPositions[j])!.push(itemPositions[i]);
            }
          }
        }

        // Data-axis label collisions: treat axis label collisions as a repulsive force from a virtual item at the axis label's center
        for (let i = 0; i < itemPositions.length; i++) {
          for (let k = 0; k < axisLabelBoxes.length; k++) {
            const item = itemPositions[i];
            const axisBox = axisLabelBoxes[k];
            if (checkLabelCollision(item, axisBox)) {
              // Create a virtual item at the center of the axis label box
              const centerX = (axisBox.left + axisBox.right) / 2;
              const centerY = (axisBox.top + axisBox.bottom) / 2;
              // We'll use the same width/height as the item label for repulsion
              const virtualItem: ItemPosition = {
                x: centerX,
                y: centerY,
                width: axisBox.right - axisBox.left,
                height: axisBox.bottom - axisBox.top,
                itemGroup: item.itemGroup, // not used
                isColliding: false,
                radius: Math.sqrt(centerX * centerX + centerY * centerY),
                angle: Math.atan2(-centerY, centerX), // SVG y is down
              };
              if (!collisionMap.has(item)) {
                collisionMap.set(item, []);
              }
              collisionMap.get(item)!.push(virtualItem);
            }
          }
        }

        // Function to calculate the movement vector away from colliding items
        const calculateMovementVector = (
          item: ItemPosition,
          collidingWith: ItemPosition[]
        ): { radius: number; angle: number } => {
          // If not colliding with anything, return no movement
          if (collidingWith.length === 0) {
            return { radius: 0, angle: 0 };
          }

          // In polar coordinates, we'll modify radius and angle instead of x and y
          let radiusChange = 0;
          let angleChange = 0;

          collidingWith.forEach((other) => {
            // Determine if we should push more radially or angularly
            const radialDiff = item.radius - other.radius;
            const angularDiff = item.angle - other.angle;

            // Prioritize the direction with greater difference
            if (Math.abs(radialDiff) > Math.abs(angularDiff * item.radius)) {
              // Move more in radial direction
              radiusChange += Math.sign(radialDiff) * 2;
              angleChange += (Math.sign(angularDiff) * 0.5) / item.radius;
            } else {
              // Move more in angular direction
              radiusChange += Math.sign(radialDiff) * 0.5;
              angleChange += (Math.sign(angularDiff) * 2) / item.radius;
            }
          });

          // Normalize the changes
          const magnitude =
            Math.sqrt(
              radiusChange * radiusChange + angleChange * angleChange
            ) || 1;
          radiusChange = (radiusChange / magnitude) * moveStep;
          angleChange = (angleChange / magnitude) * moveStep * 0.02;

          return { radius: radiusChange, angle: angleChange };
        };

        // For each colliding item, move it away from its collisions
        let movedPoints = false;

        collisionMap.forEach((collidingWith, item) => {
          movedPoints = true;

          // Calculate movement vector in polar coordinates
          const movement = calculateMovementVector(item, collidingWith);

          // Update polar coordinates
          const newRadius = item.radius + movement.radius;
          const newAngle = item.angle + movement.angle;

          // Ensure we stay within bounds (use min horizon radius for inner bound)
          const minRadius = Math.max(10, horizonToRadius(4));
          const maxRadius = horizonToRadius(1) * 1.05;
          const boundedRadius = Math.max(
            minRadius,
            Math.min(newRadius, maxRadius)
          );
          const boundedAngle = Math.max(
            0.01,
            Math.min(newAngle, Math.PI / 2 - 0.01)
          );

          item.radius = boundedRadius;
          item.angle = boundedAngle;

          // Convert to cartesian for the data point
          const pointX = boundedRadius * Math.cos(boundedAngle);
          const pointY = -boundedRadius * Math.sin(boundedAngle);

          // Update the position of the item in our tracking data
          item.x = pointX + 24;
          item.y = pointY;
          item.radius = boundedRadius;
          item.angle = boundedAngle;

          // Move the entire group (which includes both the point and its label)
          item.itemGroup
            .transition()
            .duration(200)
            .ease(d3.easeCubicInOut)
            .attr('transform', `translate(${pointX}, ${pointY})`);
        });

        // Schedule next iteration if we moved any points
        if (movedPoints) {
          setTimeout(resolveStep, 80);
        }
      };

      resolveStep();
    };

    // Run initial collision detection
    detectCollisions();

    // Automatically start collision resolution with a small delay to let the initial rendering complete
    setTimeout(() => {
      resolveCollisions();
    }, 300);

    if (showLegend) {
      const legend = svg
        .append('g')
        .attr('class', 'legend')
        .attr(
          'transform',
          `translate(${width - margin.right - 150}, ${margin.top})`
        );

      legend
        .append('text')
        .attr('x', 0)
        .attr('y', 0)
        .attr('font-weight', 'bold')
        .text('Legend (Types)');

      const legendBlue = '#4285F4';
      const legendOpacity = 0.8;

      // Type 1 - Circle
      legend
        .append('circle')
        .attr('cx', 10)
        .attr('cy', 20)
        .attr('r', 8)
        .attr('fill', legendBlue)
        .attr('opacity', legendOpacity);

      legend.append('text').attr('x', 25).attr('y', 25).text('Type 1');

      // Type 2 - Square
      legend
        .append('rect')
        .attr('x', 2)
        .attr('y', 40)
        .attr('width', 16)
        .attr('height', 16)
        .attr('fill', legendBlue)
        .attr('opacity', legendOpacity);

      legend.append('text').attr('x', 25).attr('y', 50).text('Type 2');

      // Type 3 - Hexagon
      const legendHexPoints = d3.range(6).map((i) => {
        const angle = (i * Math.PI) / 3;
        return [8 * Math.cos(angle) + 10, 8 * Math.sin(angle) + 75];
      });

      legend
        .append('path')
        .attr('d', d3.line()(legendHexPoints as [number, number][]) + 'Z')
        .attr('fill', legendBlue)
        .attr('opacity', legendOpacity);

      legend.append('text').attr('x', 25).attr('y', 75).text('Type 3');
    }
  }, [data, showLegend]);

  return (
    <div className='horizons-container'>
      <div className='horizons-chart'>
        <svg ref={svgRef}></svg>
      </div>
    </div>
  );
}

export default Horizons;
