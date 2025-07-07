import { useEffect, useRef, useMemo } from 'react';

interface WarningHypercubeProps {
  theme?: 'dark' | 'light';
  size?: number;
}

const WarningHypercube = ({
  theme = 'dark',
  size = 800,
}: WarningHypercubeProps) => {
  const svgRef = useRef<SVGSVGElement>(null);

  // Define colors based on theme - using your exact color tokens
  const colors = useMemo(
    () =>
      theme === 'dark'
        ? {
            stroke: '#FFFFFF', // text.primary.dark
            fill: '#FFFFFF',
            warningPrimary: '#FF6860', // status.error.dark
            warningSecondary: '#FF4D53', // status.error.light
            warningGlow: '#FF6860',
            gridColor: '#333333', // border.secondary.dark
            particleColor: '#FFFFFF',
            barrierColor: '#FF6860',
            accentColor: '#0005e9', // brand.500
            backgroundFill: '#000000', // BLACK - darker than background
            concentricGridColor: '#333333',
          }
        : {
            stroke: '#111111', // text.primary.light
            fill: '#111111',
            warningPrimary: '#FF4D53', // status.error.light
            warningSecondary: '#FF6860', // status.error.dark
            warningGlow: '#FF4D53',
            gridColor: '#E0E0E0', // border.secondary.light
            particleColor: '#111111',
            barrierColor: '#FF4D53',
            accentColor: '#0005e9', // brand.500
            backgroundFill: '#FFFFFF', // WHITE - lighter than background
            concentricGridColor: '#E0E0E0',
          },
    [theme]
  );

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = svgRef.current;
    svg.innerHTML = '';

    // Create styles with pulsing animation
    const style = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'style'
    );
    style.textContent = `
      @keyframes pulse {
        0%, 100% { opacity: 0.8; }
        50% { opacity: 1; }
      }
      @keyframes glow {
        0%, 100% { filter: drop-shadow(0 0 10px ${colors.warningGlow}); }
        50% { filter: drop-shadow(0 0 20px ${colors.warningGlow}); }
      }
      
      .hypercube-background { 
        fill: ${colors.backgroundFill}; 
        stroke: ${colors.stroke}; 
        stroke-width: 2; 
      }
      .hypercube-outer-thick { 
        stroke: ${colors.stroke}; 
        stroke-width: 4; 
        fill: none; 
        stroke-linecap: round; 
        stroke-linejoin: round; 
      }
      .hypercube-outer-thin { 
        stroke: ${colors.stroke}; 
        stroke-width: 1; 
        fill: none; 
        stroke-linecap: round; 
        stroke-linejoin: round; 
        opacity: 0.6; 
      }
      .hypercube-inner-thick { 
        stroke: ${colors.stroke}; 
        stroke-width: 2; 
        fill: none; 
        stroke-linecap: round; 
        stroke-linejoin: round; 
      }
      .hypercube-inner-thin { 
        stroke: ${colors.stroke}; 
        stroke-width: 0.5; 
        fill: none; 
        stroke-linecap: round; 
        stroke-linejoin: round; 
        opacity: 0.6; 
      }
      
      .warning-triangle { 
        fill: ${colors.warningPrimary}; 
        stroke: ${colors.warningSecondary}; 
        stroke-width: 3; 
        animation: pulse 2s ease-in-out infinite; 
      }
      .warning-exclamation { 
        fill: white; 
        font-family: 'TT Norms Pro Normal', Arial, sans-serif; 
        font-weight: bold; 
      }
      .warning-glow { 
        fill: none; 
        stroke: ${colors.warningGlow}; 
        stroke-width: 1; 
        opacity: 0.6; 
        animation: glow 2s ease-in-out infinite; 
      }
      
      .barrier-particle { 
        fill: ${colors.barrierColor}; 
        opacity: 0.8; 
      }
      .access-denied-line { 
        stroke: ${colors.barrierColor}; 
        stroke-width: 2; 
        opacity: 0.7; 
      }
      .security-grid { 
        stroke: ${colors.gridColor}; 
        stroke-width: 0.3; 
        opacity: 0.2; 
      }
      .concentric-grid-1 { stroke: ${colors.stroke}; stroke-width: 2; opacity: 0.4; fill: none; }
      .concentric-grid-2 { stroke: ${colors.stroke}; stroke-width: 1.5; opacity: 0.35; fill: none; }
      .concentric-grid-3 { stroke: ${colors.stroke}; stroke-width: 1; opacity: 0.3; fill: none; }
      .concentric-grid-4 { stroke: ${colors.stroke}; stroke-width: 0.8; opacity: 0.25; fill: none; }
      .concentric-grid-5 { stroke: ${colors.stroke}; stroke-width: 0.6; opacity: 0.2; fill: none; }
      .concentric-grid-6 { stroke: ${colors.stroke}; stroke-width: 0.4; opacity: 0.15; fill: none; }
      .concentric-grid-7 { stroke: ${colors.stroke}; stroke-width: 0.3; opacity: 0.1; fill: none; }
      .concentric-grid-8 { stroke: ${colors.stroke}; stroke-width: 0.2; opacity: 0.05; fill: none; }
      .concentric-grid-far { stroke: ${colors.stroke}; stroke-width: 0.1; opacity: 0.03; fill: none; }
    `;
    svg.appendChild(style);

    // Helper functions
    function createCircle(x: number, y: number, r: number, className: string) {
      const circle = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'circle'
      );
      circle.setAttribute('cx', x.toString());
      circle.setAttribute('cy', y.toString());
      circle.setAttribute('r', r.toString());
      circle.setAttribute('class', className);
      return circle;
    }

    function createLine(
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      className: string
    ) {
      const line = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'line'
      );
      line.setAttribute('x1', x1.toString());
      line.setAttribute('y1', y1.toString());
      line.setAttribute('x2', x2.toString());
      line.setAttribute('y2', y2.toString());
      line.setAttribute('class', className);
      return line;
    }

    function createPolygon(points: string, className: string) {
      const polygon = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'polygon'
      );
      polygon.setAttribute('points', points);
      polygon.setAttribute('class', className);
      return polygon;
    }

    function createGroup(className?: string, transform?: string) {
      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      if (className) group.setAttribute('class', className);
      if (transform) group.setAttribute('transform', transform);
      return group;
    }

    const centerX = 0;
    const centerY = 0;

    // Draw subtle background security grid
    for (let i = -400; i <= 400; i += 50) {
      svg.appendChild(createLine(i, -300, i, 300, 'security-grid'));
      svg.appendChild(createLine(-400, i, 400, i, 'security-grid'));
    }

    // Draw concentric grid circles emanating from center (same as NotFound gravity wells)
    const concentricGridRings = [
      { radius: 90, class: 'concentric-grid-1' },
      { radius: 120, class: 'concentric-grid-2' },
      { radius: 160, class: 'concentric-grid-3' },
      { radius: 210, class: 'concentric-grid-4' },
      { radius: 270, class: 'concentric-grid-5' },
      { radius: 340, class: 'concentric-grid-6' },
      { radius: 420, class: 'concentric-grid-7' },
      { radius: 510, class: 'concentric-grid-8' },
      { radius: 610, class: 'concentric-grid-far' },
      { radius: 710, class: 'concentric-grid-far' },
      { radius: 810, class: 'concentric-grid-far' },
      { radius: 910, class: 'concentric-grid-far' },
      { radius: 1010, class: 'concentric-grid-far' },
      { radius: 1110, class: 'concentric-grid-far' },
      { radius: 1210, class: 'concentric-grid-far' },
      { radius: 1310, class: 'concentric-grid-far' },
      { radius: 1410, class: 'concentric-grid-far' },
      { radius: 1510, class: 'concentric-grid-far' },
    ];

    concentricGridRings.forEach((ring) => {
      svg.appendChild(createCircle(centerX, centerY, ring.radius, ring.class));
    });

    // Scale factor for the hypercube (50% bigger than the reduced size)
    const scale = 0.9; // Changed from 0.6 to 0.9 (0.6 × 1.5 = 0.9)

    // Create the main hypercube background hexagon
    const hexPoints = `
      ${centerX},${centerY - 100 * scale}
      ${87 * scale},${centerY - 50 * scale}
      ${87 * scale},${centerY + 50 * scale}
      ${centerX},${centerY + 100 * scale}
      ${-87 * scale},${centerY + 50 * scale}
      ${-87 * scale},${centerY - 50 * scale}
    `;

    svg.appendChild(createPolygon(hexPoints, 'hypercube-background'));

    // Create main hypercube group
    const mainHypercube = createGroup('', `translate(${centerX}, ${centerY})`);

    // OUTER CUBE - Thick lines (front-facing edges)
    const outerThickGroup = createGroup('hypercube-outer-thick');

    // Outer hexagon (6 edges)
    outerThickGroup.appendChild(
      createLine(
        0,
        100 * scale,
        87 * scale,
        50 * scale,
        'hypercube-outer-thick'
      )
    );
    outerThickGroup.appendChild(
      createLine(
        87 * scale,
        50 * scale,
        87 * scale,
        -50 * scale,
        'hypercube-outer-thick'
      )
    );
    outerThickGroup.appendChild(
      createLine(
        87 * scale,
        -50 * scale,
        0,
        -100 * scale,
        'hypercube-outer-thick'
      )
    );
    outerThickGroup.appendChild(
      createLine(
        0,
        -100 * scale,
        -87 * scale,
        -50 * scale,
        'hypercube-outer-thick'
      )
    );
    outerThickGroup.appendChild(
      createLine(
        -87 * scale,
        -50 * scale,
        -87 * scale,
        50 * scale,
        'hypercube-outer-thick'
      )
    );
    outerThickGroup.appendChild(
      createLine(
        -87 * scale,
        50 * scale,
        0,
        100 * scale,
        'hypercube-outer-thick'
      )
    );

    // Three internal edges meeting at center
    outerThickGroup.appendChild(
      createLine(0, 0, 0, 100 * scale, 'hypercube-outer-thick')
    );
    outerThickGroup.appendChild(
      createLine(0, 0, 87 * scale, -50 * scale, 'hypercube-outer-thick')
    );
    outerThickGroup.appendChild(
      createLine(0, 0, -87 * scale, -50 * scale, 'hypercube-outer-thick')
    );

    mainHypercube.appendChild(outerThickGroup);

    // OUTER CUBE - Thin lines (back-facing edges)
    const outerThinGroup = createGroup('hypercube-outer-thin');

    outerThinGroup.appendChild(
      createLine(0, 0, 0, -100 * scale, 'hypercube-outer-thin')
    );
    outerThinGroup.appendChild(
      createLine(0, 0, 87 * scale, 50 * scale, 'hypercube-outer-thin')
    );
    outerThinGroup.appendChild(
      createLine(0, 0, -87 * scale, 50 * scale, 'hypercube-outer-thin')
    );

    mainHypercube.appendChild(outerThinGroup);

    // INNER CUBE - Rotated 45 degrees and scaled down
    const innerCubeGroup = createGroup('', 'rotate(45)');
    const innerScale = 0.525 * scale; // Half scale for inner cube

    // Inner cube thick lines (front-facing edges)
    const innerThickGroup = createGroup('hypercube-inner-thick');

    // Outer hexagon (6 edges) - scaled down
    innerThickGroup.appendChild(
      createLine(
        0,
        100 * innerScale,
        87 * innerScale,
        50 * innerScale,
        'hypercube-inner-thick'
      )
    );
    innerThickGroup.appendChild(
      createLine(
        87 * innerScale,
        50 * innerScale,
        87 * innerScale,
        -50 * innerScale,
        'hypercube-inner-thick'
      )
    );
    innerThickGroup.appendChild(
      createLine(
        87 * innerScale,
        -50 * innerScale,
        0,
        -100 * innerScale,
        'hypercube-inner-thick'
      )
    );
    innerThickGroup.appendChild(
      createLine(
        0,
        -100 * innerScale,
        -87 * innerScale,
        -50 * innerScale,
        'hypercube-inner-thick'
      )
    );
    innerThickGroup.appendChild(
      createLine(
        -87 * innerScale,
        -50 * innerScale,
        -87 * innerScale,
        50 * innerScale,
        'hypercube-inner-thick'
      )
    );
    innerThickGroup.appendChild(
      createLine(
        -87 * innerScale,
        50 * innerScale,
        0,
        100 * innerScale,
        'hypercube-inner-thick'
      )
    );

    // Three internal edges meeting at center
    innerThickGroup.appendChild(
      createLine(0, 0, 0, 100 * innerScale, 'hypercube-inner-thick')
    );
    innerThickGroup.appendChild(
      createLine(
        0,
        0,
        87 * innerScale,
        -50 * innerScale,
        'hypercube-inner-thick'
      )
    );
    innerThickGroup.appendChild(
      createLine(
        0,
        0,
        -87 * innerScale,
        -50 * innerScale,
        'hypercube-inner-thick'
      )
    );

    innerCubeGroup.appendChild(innerThickGroup);

    // Inner cube thin lines (back-facing edges)
    const innerThinGroup = createGroup('hypercube-inner-thin');

    innerThinGroup.appendChild(
      createLine(0, 0, 0, -100 * innerScale, 'hypercube-inner-thin')
    );
    innerThinGroup.appendChild(
      createLine(0, 0, 87 * innerScale, 50 * innerScale, 'hypercube-inner-thin')
    );
    innerThinGroup.appendChild(
      createLine(
        0,
        0,
        -87 * innerScale,
        50 * innerScale,
        'hypercube-inner-thin'
      )
    );

    innerCubeGroup.appendChild(innerThinGroup);

    mainHypercube.appendChild(innerCubeGroup);

    svg.appendChild(mainHypercube);

    // Draw static barrier particles at irregular positions (tilted 45 degrees)
    const barrierParticles = [
      { x: -212 * scale, y: -353 * scale, size: 4 }, // Rotated from (-300, -250)
      { x: 389 * scale, y: -65 * scale, size: 3 }, // Rotated from (320, -230)
      { x: -7 * scale, y: 394 * scale, size: 5 }, // Rotated from (-280, 270)
      { x: 375 * scale, y: 183 * scale, size: 4 }, // Rotated from (290, 260)
      { x: -177 * scale, y: -318 * scale, size: 3 }, // Rotated from (-350, -100)
      { x: 170 * scale, y: 339 * scale, size: 4 }, // Rotated from (360, 120)
      { x: -71 * scale, y: -354 * scale, size: 3 }, // Rotated from (-200, -300)
      { x: 361 * scale, y: 65 * scale, size: 5 }, // Rotated from (210, 310)
      { x: -198 * scale, y: -198 * scale, size: 4 }, // Rotated from (0, -280)
      { x: 205 * scale, y: 205 * scale, size: 3 }, // Rotated from (0, 290)
      { x: -268 * scale, y: -268 * scale, size: 4 }, // Rotated from (-380, 0)
      { x: 261 * scale, y: 290 * scale, size: 3 }, // Rotated from (390, -20)
    ];

    barrierParticles.forEach((particle) => {
      svg.appendChild(
        createCircle(particle.x, particle.y, particle.size, 'barrier-particle')
      );
    });

    // Draw access denied lines (X pattern around the hypercube)
    const accessDeniedLines = [
      { x1: -120 * scale, y1: -120 * scale, x2: 120 * scale, y2: 120 * scale },
      { x1: 120 * scale, y1: -120 * scale, x2: -120 * scale, y2: 120 * scale },
    ];

    accessDeniedLines.forEach((line) => {
      svg.appendChild(
        createLine(line.x1, line.y1, line.x2, line.y2, 'access-denied-line')
      );
    });

    // Create warning glow circles
    for (let i = 1; i <= 3; i++) {
      svg.appendChild(
        createCircle(centerX, centerY, 15 + i * 10, 'warning-glow')
      );
    }

    // Draw central warning triangle (BIGGER)
    const triangleSize = 50; // Increased from 30
    const triangleHeight = (triangleSize * Math.sqrt(3)) / 2;
    const trianglePoints = `
      ${centerX},${centerY - triangleHeight * 0.6}
      ${centerX - triangleSize * 0.5},${centerY + triangleHeight * 0.4}
      ${centerX + triangleSize * 0.5},${centerY + triangleHeight * 0.4}
    `;

    svg.appendChild(createPolygon(trianglePoints, 'warning-triangle'));

    // Draw exclamation mark (same size)
    // Exclamation body (rectangle)
    const exclamationBody = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'rect'
    );
    exclamationBody.setAttribute('x', (centerX - 2).toString());
    exclamationBody.setAttribute('y', (centerY - 12).toString());
    exclamationBody.setAttribute('width', '4');
    exclamationBody.setAttribute('height', '16');
    exclamationBody.setAttribute('class', 'warning-exclamation');
    svg.appendChild(exclamationBody);

    // Exclamation dot
    svg.appendChild(
      createCircle(centerX, centerY + 8, 2, 'warning-exclamation')
    );
  }, [colors]);

  return (
    <div style={{ display: 'inline-block', background: 'transparent' }}>
      <svg
        ref={svgRef}
        width={size}
        height={size}
        viewBox='-400 -300 800 600'
        style={{ display: 'block', background: 'transparent' }}
      />
    </div>
  );
};

export default WarningHypercube;
