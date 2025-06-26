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

    // Detect theme using the same method as the component's theme system
    const isDarkTheme =
      document.documentElement.getAttribute('data-theme') === 'dark';

    // Determine unique categories from data
    const uniqueCategories = Array.from(
      new Set(data.map((d) => d.category))
    ).sort((a, b) => a - b);

    // Create a mapping from category numbers to category names
    const categoryNamesMap = new Map<number, string>();
    data.forEach((item) => {
      if (item.categoryName && !categoryNamesMap.has(item.category)) {
        categoryNamesMap.set(item.category, item.categoryName);
      }
    });

    // Calculate minimum height based on data
    const minRowHeight = 160;
    const subjectsPerCategory = new Map<number, number>();
    data.forEach((item) => {
      subjectsPerCategory.set(
        item.category,
        (subjectsPerCategory.get(item.category) || 0) + 1
      );
    });

    // Calculate row height - either minimum or based on number of subjects
    const maxSubjectsInCategory = Math.max(
      ...Array.from(subjectsPerCategory.values())
    );
    const calculatedRowHeight = Math.max(
      minRowHeight,
      maxSubjectsInCategory * 40 + 60
    );
    const rowHeight =
      uniqueCategories.length === 1
        ? calculatedRowHeight
        : Math.max(minRowHeight, calculatedRowHeight * 0.7);

    // Chart dimensions with minimum height and centered content
    const containerWidth = 1000;
    const minChartHeight = 650;
    const contentHeight = uniqueCategories.length * rowHeight;
    const chartHeight = Math.max(minChartHeight, contentHeight);
    const containerHeight = chartHeight + 100; // Add space for labels

    // Calculate vertical offset to center content
    const contentVerticalOffset = (chartHeight - contentHeight) / 2;

    const margin = { top: 60, right: 60, bottom: 40, left: 120 };
    const chartWidth = containerWidth - margin.left - margin.right;

    // Create SVG
    const svg = d3
      .select(svgRef.current)
      .attr('width', containerWidth)
      .attr('height', containerHeight)
      .attr('viewBox', [0, 0, containerWidth, containerHeight])
      .attr('style', 'width: 100%; height: 100%; display: block;');

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Horizon boundaries - use simple proportions for now to get visible arcs
    const horizonBoundaries = [
      { name: 'Business', start: 0, end: 0.2, radius: 200 },
      { name: 'Engineering', start: 0.2, end: 0.4, radius: 300 },
      { name: 'Science', start: 0.4, end: 0.7, radius: 400 },
      { name: 'Imagination', start: 0.7, end: 1.0, radius: 0 },
    ];

    // Theme-aware colors using your design system
    const textColor = isDarkTheme ? '#FFFFFF' : '#1B1B1D';
    const mutedTextColor = isDarkTheme ? '#646E78' : '#A7ACB2';
    const borderColor = isDarkTheme ? '#333333' : '#E0E0E0';
    const primaryTextColor = textColor; // Use primary text color for lines and labels

    // Draw category rows with rounded corners (centered vertically)
    const categoryGroup = g
      .append('g')
      .attr('transform', `translate(0, ${contentVerticalOffset})`);

    uniqueCategories.forEach((category, i) => {
      const y = i * rowHeight;

      // Row background with rounded corners
      categoryGroup
        .append('rect')
        .attr('x', 0)
        .attr('y', y)
        .attr('width', chartWidth)
        .attr('height', rowHeight)
        .attr('fill', 'none')
        .attr('stroke', borderColor)
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '3,3')
        .attr('rx', 8) // Rounded corners
        .attr('ry', 8);

      // Category label on the left
      const categoryLabel =
        categoryNamesMap.get(category) || `Category ${category}`;
      categoryGroup
        .append('text')
        .attr('x', -10)
        .attr('y', y + rowHeight / 2)
        .attr('text-anchor', 'end')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', '14px')
        .attr('font-weight', 'bold')
        .attr('fill', primaryTextColor)
        .text(categoryLabel);
    });

    // Draw curved boundaries - RIGHT EDGES of circles align with boundaries
    horizonBoundaries.slice(0, -1).forEach((horizon) => {
      const boundaryX = horizon.end * chartWidth;

      const topY = -30;
      const bottomY = chartHeight + 30;
      const midY = (topY + bottomY) / 2;

      // Use smaller, more appropriate diameters for the chart size
      let diameter;
      if (horizon.name === 'Business') {
        diameter = 120; // Very small circle, very tight curve
      } else if (horizon.name === 'Engineering') {
        diameter = 250; // Medium circle
      } else if (horizon.name === 'Science') {
        diameter = 450; // Large circle, gentle curve
      } else {
        diameter = 120;
      }

      const radius = diameter / 2;

      // CRITICAL: Position circle center so the RIGHT EDGE is at boundaryX
      // This means center is at (boundaryX - radius, midY)
      const centerX = boundaryX - radius;
      const centerY = midY;

      // Calculate where the circle intersects the top and bottom boundaries
      const deltaY_top = Math.abs(centerY - topY);
      const deltaY_bottom = Math.abs(centerY - bottomY);

      // Find intersection points where circle crosses horizontal lines at topY and bottomY
      let topIntersectX, bottomIntersectX;

      if (deltaY_top <= radius) {
        // Circle extends to this Y level
        topIntersectX =
          centerX + Math.sqrt(radius * radius - deltaY_top * deltaY_top);
      } else {
        // Circle doesn't reach this high, use rightmost point
        topIntersectX = centerX + radius;
      }

      if (deltaY_bottom <= radius) {
        // Circle extends to this Y level
        bottomIntersectX =
          centerX + Math.sqrt(radius * radius - deltaY_bottom * deltaY_bottom);
      } else {
        // Circle doesn't reach this low, use rightmost point
        bottomIntersectX = centerX + radius;
      }

      // Create arc curving to the RIGHT (sweep-flag = 1)
      const pathData = `M ${topIntersectX} ${topY} A ${radius} ${radius} 0 0 1 ${bottomIntersectX} ${bottomY}`;

      console.log(
        `${horizon.name}: diameter=${diameter}, center=(${centerX}, ${centerY}), boundary at x=${boundaryX}`
      );
      console.log(
        `  Right edge of circle should be at x=${
          centerX + radius
        } (boundary is at ${boundaryX})`
      );

      g.append('path')
        .attr('d', pathData)
        .attr('stroke', primaryTextColor)
        .attr('stroke-width', 2)
        .attr('fill', 'none');
    });

    // Add large horizon labels in center of each zone
    horizonBoundaries.forEach((horizon) => {
      const sectionStart = horizon.start * chartWidth;
      const sectionEnd = horizon.end * chartWidth;
      const centerX = (sectionStart + sectionEnd) / 2;
      const centerY = chartHeight / 2;

      g.append('text')
        .attr('x', centerX)
        .attr('y', centerY)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', '24px')
        .attr('font-weight', 'normal')
        .attr('font-family', 'TT Norms Pro, sans-serif') // Use heading font family
        .attr('fill', primaryTextColor) // Use theme-aware color
        .text(horizon.name.toUpperCase());
    });

    // Add maturity axis label at the bottom
    g.append('text')
      .attr('x', chartWidth / 2)
      .attr('y', chartHeight + 30)
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .attr('font-style', 'italic')
      .attr('fill', mutedTextColor)
      .text('MATURITY →');

    // Position data points (in centered content area)
    const dataGroup = g
      .append('g')
      .attr('transform', `translate(0, ${contentVerticalOffset})`);

    const jitterRange = rowHeight * 0.3; // Vertical jitter within row

    // Use theme-aware colors and brand colors
    const shapeColor = '#0005E9'; // Brand color for subject icons

    data.forEach((item) => {
      // Find which row this item belongs to
      const categoryIndex = uniqueCategories.indexOf(item.category);
      const rowY = categoryIndex * rowHeight;

      // Position within the horizon section using proportional positions
      const horizonSection = horizonBoundaries[item.horizon - 1];
      const sectionStart = horizonSection.start * chartWidth;
      const sectionEnd = horizonSection.end * chartWidth;
      const sectionWidth = sectionEnd - sectionStart;

      // Add some randomness within the section (but not too close to edges)
      const padding = 30;
      const x =
        sectionStart + padding + Math.random() * (sectionWidth - 2 * padding);

      // Vertical position with jitter within the row
      const y = rowY + rowHeight / 2 + (Math.random() - 0.5) * jitterRange;

      // Create item group
      const itemGroup = dataGroup
        .append('g')
        .attr('class', 'horizon-item')
        .attr('transform', `translate(${x}, ${y})`);

      // Draw shape based on type (keeping hexagon for now)
      const hexagonPoints = d3.range(6).map((i) => {
        const angle = (i * Math.PI) / 3;
        return [8 * Math.cos(angle), 8 * Math.sin(angle)];
      });

      const lineGenerator = d3.line();
      const hexPath = lineGenerator(hexagonPoints as [number, number][]) + 'Z';

      itemGroup
        .append('path')
        .attr('d', hexPath)
        .attr('fill', shapeColor)
        .attr('opacity', 0.8)
        .attr('stroke', primaryTextColor)
        .attr('stroke-width', 1);

      // Add connecting line to label
      const labelDistance = 15;
      itemGroup
        .append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', labelDistance)
        .attr('y2', 0)
        .attr('stroke', mutedTextColor)
        .attr('stroke-width', 0.5)
        .attr('stroke-dasharray', '1,1');

      // Add label with monospace font
      itemGroup
        .append('text')
        .attr('x', labelDistance + 2)
        .attr('y', 0)
        .attr('class', 'item-label')
        .attr('text-anchor', 'start')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', '10px')
        .attr('font-family', 'JetBrains Mono, monospace') // Use monospace font
        .attr('fill', primaryTextColor)
        .text(item.name);
    });

    // Add legend if requested
    if (showLegend) {
      const legend = svg
        .append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${containerWidth - 150}, ${margin.top})`);

      legend
        .append('text')
        .attr('x', 0)
        .attr('y', 0)
        .attr('font-weight', 'bold')
        .attr('fill', primaryTextColor)
        .text('Legend');

      // Show horizon meanings
      const legendItems = [
        'Business: Can we do it profitably?',
        'Engineering: Can we do it at scale?',
        'Science: Can we do it at all?',
        'Imagination: What if we could?',
      ];

      legendItems.forEach((text, i) => {
        legend
          .append('text')
          .attr('x', 0)
          .attr('y', 20 + i * 15)
          .attr('font-size', '12px')
          .attr('fill', mutedTextColor)
          .text(text);
      });
    }
  }, [data, showLegend]);

  return (
    <div className='horizons-container' style={{ background: 'transparent' }}>
      <div className='horizons-chart'>
        <svg ref={svgRef}></svg>
      </div>
    </div>
  );
}

export default Horizons;
