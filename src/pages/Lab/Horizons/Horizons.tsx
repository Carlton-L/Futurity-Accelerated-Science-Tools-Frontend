import './Horizons.css';
import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

// Define the data structure
interface HorizonItem {
  name: string;
  horizon: number; // Changed to number to allow floats like 2.3
  category: 1 | 2 | 3 | 4 | 5;
  type: 1 | 2 | 3;
  categoryName?: string; // Optional category name for display
}

const exampleData: HorizonItem[] = [
  {
    name: 'Quantum Computing',
    horizon: 7.2,
    category: 1,
    type: 2,
    categoryName: 'Technology',
  },
  {
    name: 'Artificial Intelligence',
    horizon: 2.3,
    category: 2,
    type: 1,
    categoryName: 'AI',
  },
  {
    name: 'Blockchain',
    horizon: 8.5,
    category: 3,
    type: 1,
    categoryName: 'Finance',
  },
  {
    name: 'Renewable Energy',
    horizon: 5.7,
    category: 4,
    type: 3,
    categoryName: 'Energy',
  },
  {
    name: 'Autonomous Vehicles',
    horizon: 6.1,
    category: 2,
    type: 1,
    categoryName: 'AI',
  },
  {
    name: 'Genetic Engineering',
    horizon: 4.8,
    category: 5,
    type: 2,
    categoryName: 'Biotech',
  },
];

interface HorizonsProps {
  // Component props
  data?: HorizonItem[];
  showLegend?: boolean;
  isLoading?: boolean; // Add loading prop
  containerWidth?: number; // Add container width prop
  containerHeight?: number; // Add container height prop
}

function Horizons({
  data = exampleData,
  showLegend = false,
  isLoading = false,
  containerWidth = 1000,
  containerHeight = 650,
}: HorizonsProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  // Function to get horizon rank description based on value
  const getHorizonDescription = (rank: number): string => {
    if (rank >= 9) {
      return "Forgotten/Obsolete (Once relevant or cutting-edge, now completely abandoned or irrelevant, 'No one remembers this')";
    } else if (rank >= 8) {
      return 'Dormant / Rediscovery Potential (Known but currently dormant, might see revival in new applications or contexts)';
    } else if (rank >= 7) {
      return "Residual. Niche Legacy (Obsolete for mainstream use, but still functional in niche contexts, or retained for legacy support i.e. it's rare to adopt this into new products)";
    } else if (rank >= 6) {
      return 'Post-standardization / Ubiquitous (Fully commoditized, infrastructure-level tech, or assumed baseline capability)';
    } else if (rank >= 5) {
      return 'Mainstream Adoption / Standard (Widely adopted and integrated into industries or daily life, but not yet ubiquitous)';
    } else if (rank >= 4) {
      return 'Commercial Breakthrough (First products or services launched; gaining traction in early markets but not yet mainstream)';
    } else if (rank >= 3) {
      return 'Emergent / Pre-Venture Viable (Early working prototypes or validated concepts; attracting venture or research grant interest)';
    } else if (rank >= 2) {
      return 'Moonshot / High-Risk development (Ambitious R&D or experimental prototypes exist; technical or market feasibility highly uncertain)';
    } else if (rank >= 1) {
      return 'Speculative / Early Concept (Mostly conceptual, discussed in speculative media or think tanks, minimal or no prototypes)';
    } else {
      return "Unimagined / Future Frontier (No known research, prototypes, or even speculative concepts yet 'No one's imagined this')";
    }
  };

  // Create the D3 visualization
  useEffect(() => {
    if (!svgRef.current) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    // Show loading state if explicitly requested
    if (isLoading) {
      const svg = d3
        .select(svgRef.current)
        .attr('width', containerWidth)
        .attr('height', containerHeight)
        .attr('viewBox', [0, 0, containerWidth, containerHeight])
        .attr('style', 'width: 100%; height: 100%; display: block;');

      // Add loading indicator
      const loadingGroup = svg
        .append('g')
        .attr(
          'transform',
          `translate(${containerWidth / 2}, ${containerHeight / 2})`
        );

      loadingGroup
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', '16px')
        .attr('font-family', 'JetBrains Mono, monospace')
        .attr('fill', '#666')
        .text('Loading horizon data...');

      // Add simple loading animation
      const circle = loadingGroup
        .append('circle')
        .attr('r', 20)
        .attr('cy', -40)
        .attr('fill', 'none')
        .attr('stroke', '#0005E9')
        .attr('stroke-width', 3)
        .attr('stroke-dasharray', '31.4')
        .attr('stroke-dashoffset', '31.4');

      // Animate the circle
      circle
        .transition()
        .duration(2000)
        .ease(d3.easeLinear)
        .attr('stroke-dashoffset', 0)
        .on('end', function repeat() {
          d3.select(this)
            .attr('stroke-dashoffset', '31.4')
            .transition()
            .duration(2000)
            .ease(d3.easeLinear)
            .attr('stroke-dashoffset', 0)
            .on('end', repeat);
        });

      return;
    }

    // Show empty state if no data
    if (!data.length) {
      const svg = d3
        .select(svgRef.current)
        .attr('width', containerWidth)
        .attr('height', containerHeight)
        .attr('viewBox', [0, 0, containerWidth, containerHeight])
        .attr('style', 'width: 100%; height: 100%; display: block;');

      const emptyGroup = svg
        .append('g')
        .attr(
          'transform',
          `translate(${containerWidth / 2}, ${containerHeight / 2})`
        );

      emptyGroup
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', '16px')
        .attr('font-family', 'JetBrains Mono, monospace')
        .attr('fill', '#666')
        .text('No subjects selected');

      return;
    }

    // Filter out any subjects that don't have valid horizon ranks
    const validData = data.filter(
      (d) => d.horizon !== undefined && d.horizon !== null && !isNaN(d.horizon)
    );

    if (validData.length === 0) {
      console.log('No valid horizon data available yet');
      return;
    }

    console.log('Rendering horizon chart with valid data:', validData);

    // Detect theme using multiple methods to ensure it works with your Chakra system
    const html = document.documentElement;
    const isDarkTheme =
      html.getAttribute('data-theme') === 'dark' ||
      html.classList.contains('dark') ||
      (html.hasAttribute('data-theme') &&
        html.getAttribute('data-theme') === 'dark');

    // Determine unique categories from data - put uncategorized (1) first
    const uniqueCategories = Array.from(
      new Set(validData.map((d) => d.category))
    ).sort((a, b) => {
      // Put category 1 (uncategorized) first, then sort others
      if (a === 1) return -1;
      if (b === 1) return 1;
      return a - b;
    });

    // Create a mapping from category numbers to category names
    const categoryNamesMap = new Map<number, string>();
    validData.forEach((item) => {
      if (item.categoryName && !categoryNamesMap.has(item.category)) {
        categoryNamesMap.set(item.category, item.categoryName);
      }
    });

    // Calculate minimum height based on data
    const minRowHeight = 120; // Reduced from 160 to be more compact
    const rowSpacing = 12; // Spacing between rows
    const subjectsPerCategory = new Map<number, number>();
    validData.forEach((item) => {
      subjectsPerCategory.set(
        item.category,
        (subjectsPerCategory.get(item.category) || 0) + 1
      );
    });

    // Calculate row height based on number of subjects in each category
    const maxSubjectsInCategory = Math.max(
      ...Array.from(subjectsPerCategory.values())
    );
    const calculatedRowHeight = Math.max(
      minRowHeight,
      maxSubjectsInCategory * 30 + 60 // Reduced multiplier for more compact layout
    );
    const rowHeight = calculatedRowHeight;

    // Chart dimensions - use container dimensions
    const categoryLabelWidth = 200; // Fixed width for category labels
    const margin = { top: 80, right: 40, bottom: 40, left: categoryLabelWidth };
    const chartWidth = containerWidth - margin.left - margin.right;
    const contentHeight =
      uniqueCategories.length * rowHeight +
      (uniqueCategories.length - 1) * rowSpacing;
    const finalHeight = Math.max(
      containerHeight,
      contentHeight + margin.top + margin.bottom
    );

    // Create SVG with calculated dimensions
    const svg = d3
      .select(svgRef.current)
      .attr('width', containerWidth)
      .attr('height', finalHeight)
      .attr('viewBox', [0, 0, containerWidth, finalHeight])
      .attr('style', 'width: 100%; height: 100%; display: block;');

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Horizon boundaries - 0-10 scale mapped to sections
    const horizonBoundaries = [
      { name: 'Imagination', start: 0, end: 2.5, category: 'A' },
      { name: 'Science', start: 2.5, end: 5.0, category: 'B' },
      { name: 'Engineering', start: 5.0, end: 7.5, category: 'C' },
      { name: 'Business', start: 7.5, end: 10.0, category: 'D' },
    ];

    // Theme-aware colors using your design system hierarchy
    const foregroundColor = isDarkTheme ? '#FFFFFF' : '#1B1B1D';
    const mutedTextColor = isDarkTheme ? '#646E78' : '#A7ACB2';
    const subtleTextColor = isDarkTheme ? '#A7ACB2' : '#646E78';

    // Draw colored background sections for each maturity level
    const maturityColors = {
      Imagination: '#6A35D4',
      Science: '#46ACC8',
      Engineering: '#F2CD5D',
      Business: '#E07B91',
    };

    // Create scale for horizon values (0-10)
    const xScale = d3.scaleLinear().domain([0, 10]).range([0, chartWidth]);

    // Create tooltip div for hover effects
    const tooltip = d3
      .select('body')
      .selectAll('.horizon-tooltip')
      .data([null])
      .join('div')
      .attr('class', 'horizon-tooltip')
      .style('position', 'absolute')
      .style(
        'background',
        isDarkTheme ? 'rgba(26, 26, 26, 0.95)' : 'rgba(255, 255, 255, 0.95)'
      )
      .style('border', `1px solid ${foregroundColor}`)
      .style('border-radius', '4px')
      .style('padding', '8px 12px')
      .style('font-family', 'JetBrains Mono, monospace')
      .style('font-size', '12px')
      .style('color', foregroundColor)
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('z-index', 9999)
      .style('backdrop-filter', 'blur(10px)');

    // Draw colored background sections
    horizonBoundaries.forEach((horizon) => {
      const sectionStart = xScale(horizon.start);
      const sectionEnd = xScale(horizon.end);
      const sectionWidth = sectionEnd - sectionStart;

      // Create colored background with 10% opacity
      const baseColor =
        maturityColors[horizon.name as keyof typeof maturityColors];
      const opacity = isDarkTheme ? 0.15 : 0.1;

      g.append('rect')
        .attr('x', sectionStart)
        .attr('y', -60)
        .attr('width', sectionWidth)
        .attr('height', contentHeight + 120)
        .attr('fill', baseColor)
        .attr('opacity', opacity);

      // Add large vertical text in the center of each section
      const sectionCenterX = sectionStart + sectionWidth / 2;
      const textY = contentHeight / 2;

      g.append('text')
        .attr('x', sectionCenterX)
        .attr('y', textY)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', '24px')
        .attr('font-weight', 'bold')
        .attr('font-family', 'TT Norms Pro, sans-serif')
        .attr('fill', baseColor)
        .attr('opacity', 0.3)
        .attr('transform', `rotate(-90 ${sectionCenterX} ${textY})`)
        .text(horizon.name.toUpperCase());
    });

    // Add straight vertical boundary lines between sections
    horizonBoundaries.slice(0, -1).forEach((horizon) => {
      const boundaryX = xScale(horizon.end);

      g.append('line')
        .attr('x1', boundaryX)
        .attr('y1', -60)
        .attr('x2', boundaryX)
        .attr('y2', contentHeight + 60)
        .attr('stroke', foregroundColor)
        .attr('stroke-width', 2)
        .attr('opacity', 0.8);
    });

    // Add maturity axis label at the top
    g.append('text')
      .attr('x', chartWidth / 2)
      .attr('y', -40)
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .attr('font-style', 'italic')
      .attr('font-family', 'TT Norms Pro, sans-serif')
      .attr('fill', subtleTextColor)
      .text('MATURITY');

    // Add arrow pointing right
    const arrowStartX = chartWidth / 2 + 40;
    const arrowEndX = chartWidth / 2 + 55;
    const arrowY = -40;

    g.append('line')
      .attr('x1', arrowStartX)
      .attr('y1', arrowY)
      .attr('x2', arrowEndX)
      .attr('y2', arrowY)
      .attr('stroke', mutedTextColor)
      .attr('stroke-width', 1)
      .attr('opacity', 0.3);

    const arrowHeadSize = 6;
    g.append('path')
      .attr(
        'd',
        `M ${arrowEndX - arrowHeadSize} ${
          arrowY - arrowHeadSize / 2
        } L ${arrowEndX} ${arrowY} L ${arrowEndX - arrowHeadSize} ${
          arrowY + arrowHeadSize / 2
        }`
      )
      .attr('stroke', mutedTextColor)
      .attr('stroke-width', 1)
      .attr('fill', 'none')
      .attr('opacity', 0.3);

    // Draw category rows with fixed-width labels
    uniqueCategories.forEach((categoryNum, i) => {
      const y = i * (rowHeight + rowSpacing);

      // Row background with rounded corners
      g.append('rect')
        .attr('x', 0)
        .attr('y', y)
        .attr('width', chartWidth)
        .attr('height', rowHeight)
        .attr('fill', 'none')
        .attr('stroke', mutedTextColor)
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '4,4')
        .attr('rx', 8)
        .attr('ry', 8);

      // Category label with word wrapping
      const categoryLabel =
        categoryNamesMap.get(categoryNum) ||
        (categoryNum === 1 ? 'Uncategorized' : `Category ${categoryNum}`);

      // Create a foreign object for word wrapping
      const foreignObject = svg
        .append('foreignObject')
        .attr('x', margin.left - categoryLabelWidth + 10) // 10px padding from right edge
        .attr('y', margin.top + y + 10) // 10px padding from top
        .attr('width', categoryLabelWidth - 20) // 20px total padding
        .attr('height', rowHeight - 20); // 20px total padding

      const div = foreignObject
        .append('xhtml:div')
        .style('width', '100%')
        .style('height', '100%')
        .style('display', 'flex')
        .style('align-items', 'center')
        .style('justify-content', 'flex-end')
        .style('text-align', 'right')
        .style('font-family', 'TT Norms Pro, sans-serif')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .style('color', foregroundColor)
        .style('word-wrap', 'break-word')
        .style('overflow-wrap', 'break-word')
        .style('hyphens', 'auto')
        .style('line-height', '1.2')
        .text(categoryLabel);
    });

    // Draw short arrows in center of each category row
    uniqueCategories.forEach((categoryNum, i) => {
      const y = i * (rowHeight + rowSpacing);
      const arrowY = y + rowHeight / 2;

      // Draw arrows between sections
      horizonBoundaries.slice(0, -1).forEach((horizon, j) => {
        const fromX = xScale((horizon.start + horizon.end) / 2);
        const toX = xScale(
          (horizonBoundaries[j + 1].start + horizonBoundaries[j + 1].end) / 2
        );

        const shaftLength = 30;
        const startX = fromX + (toX - fromX) / 2 - shaftLength / 2;
        const endX = fromX + (toX - fromX) / 2 + shaftLength / 2;

        // Arrow shaft
        g.append('line')
          .attr('x1', startX)
          .attr('y1', arrowY)
          .attr('x2', endX)
          .attr('y2', arrowY)
          .attr('stroke', mutedTextColor)
          .attr('stroke-width', 2)
          .attr('opacity', 0.4);

        // Arrow head
        const arrowHeadSize = 12;
        g.append('path')
          .attr(
            'd',
            `M ${endX - arrowHeadSize} ${
              arrowY - arrowHeadSize / 2
            } L ${endX} ${arrowY} L ${endX - arrowHeadSize} ${
              arrowY + arrowHeadSize / 2
            } Z`
          )
          .attr('stroke', mutedTextColor)
          .attr('stroke-width', 1)
          .attr('fill', mutedTextColor)
          .attr('opacity', 0.4);
      });
    });

    // Position subjects based on horizon rank
    const subjectGroup = g
      .append('g')
      .attr('class', 'subjects')
      .style('z-index', 1000);

    // Group subjects by category
    const subjectsByCategory = new Map<number, typeof validData>();
    validData.forEach((subject) => {
      if (!subjectsByCategory.has(subject.category)) {
        subjectsByCategory.set(subject.category, []);
      }
      subjectsByCategory.get(subject.category)!.push(subject);
    });

    // Position subjects within each category row
    subjectsByCategory.forEach((subjects) => {
      const categoryRowIndex = uniqueCategories.indexOf(subjects[0].category);
      if (categoryRowIndex === -1) return;

      const baseY = categoryRowIndex * (rowHeight + rowSpacing) + rowHeight / 2;
      const sortedSubjects = [...subjects].sort(
        (a, b) => a.horizon - b.horizon
      );

      const labelPositions = new Map<
        string,
        { x: number; y: number; labelY: number }
      >();

      sortedSubjects.forEach((subject) => {
        const x = xScale(subject.horizon);
        const rowPadding = 30;
        const availableHeight = rowHeight - 2 * rowPadding;

        // Vertical spread based on subject name hash
        const hash = subject.name
          .split('')
          .reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const normalizedHash = (hash % 1000) / 1000;
        const verticalSpread = 1.5;
        const verticalOffset =
          (normalizedHash - 0.5) * availableHeight * verticalSpread;
        const y = baseY + verticalOffset;

        // Label positioning with collision avoidance
        let labelY = y - 15;
        const minLabelDistance = 25;
        const existingPositions = Array.from(labelPositions.values());

        for (let attempt = 0; attempt < 15; attempt++) {
          let hasOverlap = false;

          for (const existing of existingPositions) {
            const xDistance = Math.abs(x - existing.x);
            const yDistance = Math.abs(labelY - existing.labelY);

            if (xDistance < 100 && yDistance < minLabelDistance) {
              hasOverlap = true;
              break;
            }
          }

          if (!hasOverlap) break;

          labelY +=
            (attempt % 2 === 0 ? 1 : -1) *
            (minLabelDistance + Math.floor(attempt / 2) * 5);
        }

        labelPositions.set(subject.name, { x, y, labelY });

        // Draw subject as blue hexagon
        const hexagonSize = 6;
        const hexagonPath = `M${x},${y - hexagonSize} L${
          x + hexagonSize * 0.866
        },${y - hexagonSize * 0.5} L${x + hexagonSize * 0.866},${
          y + hexagonSize * 0.5
        } L${x},${y + hexagonSize} L${x - hexagonSize * 0.866},${
          y + hexagonSize * 0.5
        } L${x - hexagonSize * 0.866},${y - hexagonSize * 0.5} Z`;

        subjectGroup
          .append('path')
          .attr('d', hexagonPath)
          .attr('fill', '#0005E9')
          .attr('stroke', foregroundColor)
          .attr('stroke-width', 2)
          .style('z-index', 1001)
          .style('cursor', 'pointer')
          .on('mouseenter', function (event) {
            setTimeout(() => {
              const horizonDescription = getHorizonDescription(subject.horizon);
              tooltip
                .html(
                  `<strong>${subject.name}</strong><br/>
                   <span style="color: ${mutedTextColor}; font-size: 11px;">
                     Horizon Rank: ${subject.horizon.toFixed(1)}<br/>
                     ${horizonDescription}
                   </span>`
                )
                .style('opacity', 1)
                .style('left', event.pageX + 10 + 'px')
                .style('top', event.pageY - 10 + 'px');
            }, 500);
          })
          .on('mouseleave', function () {
            setTimeout(() => {
              tooltip.style('opacity', 0);
            }, 100);
          })
          .on('mousemove', function (event) {
            tooltip
              .style('left', event.pageX + 10 + 'px')
              .style('top', event.pageY - 10 + 'px');
          });

        // Add subject label
        subjectGroup
          .append('text')
          .attr('x', x)
          .attr('y', labelY)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'bottom')
          .attr('font-size', '11px')
          .attr('font-family', 'JetBrains Mono, monospace')
          .attr('font-weight', '500')
          .attr('fill', foregroundColor)
          .style('z-index', 1002)
          .style('pointer-events', 'none')
          .text(subject.name);
      });
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
        .attr('fill', foregroundColor)
        .text('Legend');

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
          .attr('fill', subtleTextColor)
          .text(text);
      });
    }
  }, [data, showLegend, isLoading, containerWidth, containerHeight]);

  return (
    <div className='horizons-container' style={{ background: 'transparent' }}>
      <div className='horizons-chart'>
        <svg ref={svgRef}></svg>
      </div>
    </div>
  );
}

export default Horizons;
