import { useEffect, useRef, useMemo, useState } from 'react';

interface StaticBlackHoleProps {
  theme?: 'dark' | 'light';
  size?: number;
}

const StaticBlackHole = ({
  theme = 'dark',
  size = 1200,
}: StaticBlackHoleProps) => {
  const svgRef = useRef<SVGSVGElement>(null);

  // Define colors based on theme - memoized to prevent unnecessary re-renders
  const colors = useMemo(
    () =>
      theme === 'dark'
        ? {
            stroke: 'white',
            fill: 'white',
            voidColor: '#000000',
            accentColor: '#0005e9',
            particleColor: 'white',
            distortedColor: '#666666',
            silhouetteColor: '#000000',
          }
        : {
            stroke: 'black',
            fill: 'black',
            voidColor: '#000000',
            accentColor: '#0005e9',
            particleColor: 'black',
            distortedColor: '#999999',
            silhouetteColor: '#FFFFFF',
          },
    [theme]
  );

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = svgRef.current;
    svg.innerHTML = '';

    // Create styles
    const style = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'style'
    );
    style.textContent = `
      .black-hole { fill: ${colors.voidColor}; }
      .event-horizon { fill: none; stroke: ${colors.accentColor}; stroke-width: 2; opacity: 0.8; }
      .accretion-disk { fill: none; stroke: ${colors.accentColor}; stroke-width: 1; opacity: 0.6; }
      .normal-particle { fill: ${colors.particleColor}; opacity: 0.8; }
      .stretched-particle { fill: ${colors.particleColor}; opacity: 0.6; }
      .distorted-line { stroke: ${colors.distortedColor}; stroke-width: 1; fill: none; opacity: 0.5; }
      .gravity-well { fill: none; stroke: ${colors.stroke}; stroke-width: 1; opacity: 0.3; }
      .gravity-well-1 { fill: none; stroke: ${colors.stroke}; stroke-width: 2; opacity: 0.4; }
      .gravity-well-2 { fill: none; stroke: ${colors.stroke}; stroke-width: 1.5; opacity: 0.35; }
      .gravity-well-3 { fill: none; stroke: ${colors.stroke}; stroke-width: 1; opacity: 0.3; }
      .gravity-well-4 { fill: none; stroke: ${colors.stroke}; stroke-width: 0.8; opacity: 0.25; }
      .gravity-well-5 { fill: none; stroke: ${colors.stroke}; stroke-width: 0.6; opacity: 0.2; }
      .gravity-well-6 { fill: none; stroke: ${colors.stroke}; stroke-width: 0.4; opacity: 0.15; }
      .gravity-well-7 { fill: none; stroke: ${colors.stroke}; stroke-width: 0.3; opacity: 0.1; }
      .gravity-well-8 { fill: none; stroke: ${colors.stroke}; stroke-width: 0.2; opacity: 0.05; }
      .gravity-well-far { fill: none; stroke: ${colors.stroke}; stroke-width: 0.1; opacity: 0.03; }
      .debris { fill: ${colors.particleColor}; opacity: 0.7; }
      .light-ray { stroke: ${colors.accentColor}; stroke-width: 1; opacity: 0.4; fill: none; }
      .outer-edge { stroke: ${colors.stroke}; stroke-width: 1.5; stroke-linecap: round; fill: none; }
      .inner-edge { stroke: ${colors.stroke}; stroke-width: 1; stroke-linecap: round; fill: none; }
      .connection-edge { stroke: ${colors.stroke}; stroke-width: 0.5; stroke-linecap: round; fill: none; }
      .outer-face { fill: ${colors.fill}; stroke: ${colors.stroke}; stroke-width: 1.5; opacity: 0.1; }
      .inner-face { fill: ${colors.fill}; stroke: ${colors.stroke}; stroke-width: 1.5; opacity: 0.1; }
      .hypercube-silhouette { fill: ${colors.silhouetteColor}; stroke: none; opacity: 0.4; }
      .hypercube-distorted { stroke: ${colors.distortedColor}; stroke-width: 3; stroke-linecap: round; fill: none; opacity: 0.7; }
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

    function createEllipse(
      cx: number,
      cy: number,
      rx: number,
      ry: number,
      className: string,
      rotation = 0
    ) {
      const ellipse = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'ellipse'
      );
      ellipse.setAttribute('cx', cx.toString());
      ellipse.setAttribute('cy', cy.toString());
      ellipse.setAttribute('rx', rx.toString());
      ellipse.setAttribute('ry', ry.toString());
      ellipse.setAttribute('class', className);
      if (rotation !== 0) {
        ellipse.setAttribute('transform', `rotate(${rotation} ${cx} ${cy})`);
      }
      return ellipse;
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

    function createPath(d: string, className: string) {
      const path = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'path'
      );
      path.setAttribute('d', d);
      path.setAttribute('class', className);
      return path;
    }

    const centerX = 0;
    const centerY = 0;
    const blackHoleRadius = 60;

    // Vector3 and Matrix4 classes for hypercube
    class Vector3 {
      constructor(public x: number, public y: number, public z: number) {}

      clone() {
        return new Vector3(this.x, this.y, this.z);
      }

      applyMatrix4(m: Matrix4) {
        const x = this.x,
          y = this.y,
          z = this.z;
        const e = m.elements;
        this.x = e[0] * x + e[4] * y + e[8] * z + e[12];
        this.y = e[1] * x + e[5] * y + e[9] * z + e[13];
        this.z = e[2] * x + e[6] * y + e[10] * z + e[14];
        return this;
      }
    }

    class Matrix4 {
      elements: number[];

      constructor() {
        this.elements = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
      }

      makeRotationY(theta: number) {
        const c = Math.cos(theta);
        const s = Math.sin(theta);
        this.elements = [c, 0, s, 0, 0, 1, 0, 0, -s, 0, c, 0, 0, 0, 0, 1];
        return this;
      }

      makeRotationFromEuler(x: number, y: number, z: number) {
        const cx = Math.cos(x),
          sx = Math.sin(x);
        const cy = Math.cos(y),
          sy = Math.sin(y);
        const cz = Math.cos(z),
          sz = Math.sin(z);

        this.elements = [
          cy * cz,
          cx * sz + sx * sy * cz,
          sx * sz - cx * sy * cz,
          0,
          -cy * sz,
          cx * cz - sx * sy * sz,
          sx * cz + cx * sy * sz,
          0,
          sy,
          -sx * cy,
          cx * cy,
          0,
          0,
          0,
          0,
          1,
        ];
        return this;
      }
    }

    // Project 3D point to 2D
    function project3D(point: Vector3) {
      const scale = 16; // 64px hypercube
      const x = point.x * scale;
      const y = point.y * scale;
      const z = point.z * scale;
      const screenX = (x - z) * 0.866;
      const screenY = (x + z) * 0.5 - y;
      return { x: screenX, y: screenY };
    }

    // Define hypercube vertices
    const outerVertices = [
      new Vector3(-1, -1, -1),
      new Vector3(1, -1, -1),
      new Vector3(1, 1, -1),
      new Vector3(-1, 1, -1),
      new Vector3(-1, -1, 1),
      new Vector3(1, -1, 1),
      new Vector3(1, 1, 1),
      new Vector3(-1, 1, 1),
    ];

    const innerVertices = [
      new Vector3(-0.5, -0.5, -0.5),
      new Vector3(0.5, -0.5, -0.5),
      new Vector3(0.5, 0.5, -0.5),
      new Vector3(-0.5, 0.5, -0.5),
      new Vector3(-0.5, -0.5, 0.5),
      new Vector3(0.5, -0.5, 0.5),
      new Vector3(0.5, 0.5, 0.5),
      new Vector3(-0.5, 0.5, 0.5),
    ];

    // Define edges
    const outerEdges = [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 4],
      [0, 4],
      [1, 5],
      [2, 6],
      [3, 7],
    ];

    const innerEdges = [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 4],
      [0, 4],
      [1, 5],
      [2, 6],
      [3, 7],
    ];

    // Create hypercube with some rotation
    const outerMatrix = new Matrix4().makeRotationFromEuler(0.3, 0.5, 0.2);
    const innerMatrix = new Matrix4().makeRotationFromEuler(0.2, 0.4, 0.1);

    // Transform vertices
    const transformedOuter = outerVertices.map((v) =>
      project3D(v.clone().applyMatrix4(outerMatrix))
    );
    const transformedInner = innerVertices.map((v) =>
      project3D(v.clone().applyMatrix4(innerMatrix))
    );

    // Shift hypercube to center towards the bottom
    const hypercubeOffsetX = 0;
    const hypercubeOffsetY = 200;
    const transformedOuterShifted = transformedOuter.map((p) => ({
      x: p.x + hypercubeOffsetX,
      y: p.y + hypercubeOffsetY,
    }));
    const transformedInnerShifted = transformedInner.map((p) => ({
      x: p.x + hypercubeOffsetX,
      y: p.y + hypercubeOffsetY,
    }));

    // Draw gravity wells
    const gravityWells = [
      { radius: blackHoleRadius + 30, class: 'gravity-well-1' },
      { radius: blackHoleRadius + 60, class: 'gravity-well-2' },
      { radius: blackHoleRadius + 100, class: 'gravity-well-3' },
      { radius: blackHoleRadius + 150, class: 'gravity-well-4' },
      { radius: blackHoleRadius + 210, class: 'gravity-well-5' },
      { radius: blackHoleRadius + 280, class: 'gravity-well-6' },
      { radius: blackHoleRadius + 360, class: 'gravity-well-7' },
      { radius: blackHoleRadius + 450, class: 'gravity-well-8' },
      { radius: blackHoleRadius + 550, class: 'gravity-well-far' },
      { radius: blackHoleRadius + 650, class: 'gravity-well-far' },
      { radius: blackHoleRadius + 750, class: 'gravity-well-far' },
      { radius: blackHoleRadius + 850, class: 'gravity-well-far' },
      { radius: blackHoleRadius + 950, class: 'gravity-well-far' },
      { radius: blackHoleRadius + 1050, class: 'gravity-well-far' },
      { radius: blackHoleRadius + 1150, class: 'gravity-well-far' },
      { radius: blackHoleRadius + 1250, class: 'gravity-well-far' },
      { radius: blackHoleRadius + 1350, class: 'gravity-well-far' },
      { radius: blackHoleRadius + 1450, class: 'gravity-well-far' },
      { radius: blackHoleRadius + 1550, class: 'gravity-well-far' },
    ];

    gravityWells.forEach((well) => {
      svg.appendChild(createCircle(centerX, centerY, well.radius, well.class));
    });

    // Draw hypercube silhouette
    const allVertices = [
      ...transformedOuterShifted,
      ...transformedInnerShifted,
    ];

    function convexHull(
      points: { x: number; y: number }[]
    ): { x: number; y: number }[] {
      const hull: { x: number; y: number }[] = [];

      let leftmost = 0;
      for (let i = 1; i < points.length; i++) {
        if (points[i].x < points[leftmost].x) {
          leftmost = i;
        }
      }

      let p = leftmost;
      do {
        hull.push(points[p]);
        let q = (p + 1) % points.length;

        for (let i = 0; i < points.length; i++) {
          if (orientation(points[p], points[i], points[q]) === 2) {
            q = i;
          }
        }

        p = q;
      } while (p !== leftmost);

      return hull;
    }

    function orientation(
      p: { x: number; y: number },
      q: { x: number; y: number },
      r: { x: number; y: number }
    ): number {
      const val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
      if (val === 0) return 0;
      return val > 0 ? 1 : 2;
    }

    const silhouettePoints = convexHull(allVertices);

    if (silhouettePoints.length > 0) {
      const pathData =
        `M ${silhouettePoints[0].x} ${silhouettePoints[0].y} ` +
        silhouettePoints
          .slice(1)
          .map((p) => `L ${p.x} ${p.y}`)
          .join(' ') +
        ' Z';

      const silhouettePath = createPath(pathData, 'hypercube-silhouette');
      svg.appendChild(silhouettePath);
    }

    // Draw accretion disk
    for (let i = 0; i < 6; i++) {
      const angle = i * 30;
      const radiusX = blackHoleRadius + 20 + i * 8;
      const radiusY = radiusX * 0.2 + i * 2;
      svg.appendChild(
        createEllipse(
          centerX,
          centerY,
          radiusX,
          radiusY,
          'accretion-disk',
          angle
        )
      );
    }

    // Draw the black hole itself
    svg.appendChild(
      createCircle(centerX, centerY, blackHoleRadius, 'black-hole')
    );

    // Draw event horizon
    svg.appendChild(
      createCircle(centerX, centerY, blackHoleRadius + 3, 'event-horizon')
    );

    // Draw hypercube edges
    outerEdges.forEach((edge) => {
      const [start, end] = edge;
      svg.appendChild(
        createLine(
          transformedOuterShifted[start].x,
          transformedOuterShifted[start].y,
          transformedOuterShifted[end].x,
          transformedOuterShifted[end].y,
          'outer-edge'
        )
      );
    });

    innerEdges.forEach((edge) => {
      const [start, end] = edge;
      svg.appendChild(
        createLine(
          transformedInnerShifted[start].x,
          transformedInnerShifted[start].y,
          transformedInnerShifted[end].x,
          transformedInnerShifted[end].y,
          'inner-edge'
        )
      );
    });

    // Draw connection lines between inner and outer cubes
    for (let i = 0; i < 8; i++) {
      svg.appendChild(
        createLine(
          transformedInnerShifted[i].x,
          transformedInnerShifted[i].y,
          transformedOuterShifted[i].x,
          transformedOuterShifted[i].y,
          'connection-edge'
        )
      );
    }

    // Draw particles pointing toward the black hole center
    const pointingParticles = [
      { x: -400, y: -300, size: 8, length: 20 },
      { x: 450, y: -280, size: 6, length: 15 },
      { x: -380, y: 320, size: 5, length: 12 },
      { x: 420, y: 350, size: 9, length: 22 },
      { x: -300, y: -400, size: 4, length: 10 },
      { x: 480, y: 250, size: 7, length: 18 },
      { x: -500, y: 100, size: 5, length: 12 },
      { x: 350, y: -350, size: 8, length: 20 },
      { x: -250, y: 400, size: 6, length: 15 },
      { x: 500, y: -150, size: 4, length: 10 },
      { x: -450, y: -200, size: 7, length: 18 },
      { x: 300, y: 400, size: 6, length: 15 },
      { x: -550, y: 50, size: 5, length: 12 },
      { x: 550, y: 100, size: 8, length: 20 },
      { x: -200, y: -450, size: 6, length: 15 },
      { x: 200, y: 450, size: 4, length: 10 },
    ];

    pointingParticles.forEach((particle) => {
      const angle = Math.atan2(centerY - particle.y, centerX - particle.x);
      const endX = particle.x + Math.cos(angle) * particle.length;
      const endY = particle.y + Math.sin(angle) * particle.length;

      svg.appendChild(
        createLine(particle.x, particle.y, endX, endY, 'normal-particle')
      );
    });

    // Draw circular particles
    const circularParticles = [
      { x: -220, y: -120, size: 3 },
      { x: 190, y: -110, size: 2.5 },
      { x: -180, y: 150, size: 4 },
      { x: 210, y: 140, size: 3.5 },
      { x: -140, y: -160, size: 2.5 },
      { x: 160, y: 170, size: 3 },
      { x: -110, y: -100, size: 2 },
      { x: 130, y: 110, size: 3.5 },
      { x: -90, y: 120, size: 2.5 },
      { x: 110, y: -90, size: 2 },
      { x: -250, y: 200, size: 4 },
      { x: 240, y: -180, size: 3 },
      { x: -300, y: -80, size: 3.5 },
      { x: 280, y: 220, size: 2.5 },
      { x: -350, y: 150, size: 3 },
      { x: 330, y: -200, size: 2.5 },
      { x: -120, y: 250, size: 2 },
      { x: 150, y: -240, size: 3 },
      { x: -270, y: -160, size: 2.5 },
      { x: 290, y: 180, size: 3.5 },
    ];

    circularParticles.forEach((particle) => {
      svg.appendChild(
        createCircle(particle.x, particle.y, particle.size, 'normal-particle')
      );
    });

    // Draw spiraling debris trails
    const spiralData = [
      'M -300,-200 Q -250,-150 -200,-100 Q -150,-50 -120,-30 Q -100,-20 -90,-15 Q -80,-10 -75,-8',
      'M 280,-180 Q 230,-140 190,-100 Q 150,-60 120,-35 Q 100,-20 90,-15 Q 85,-10 80,-8',
      'M -250,250 Q -200,200 -160,150 Q -120,100 -100,70 Q -90,50 -85,40 Q -80,35 -78,30',
      'M 270,230 Q 220,180 180,140 Q 140,100 120,70 Q 110,50 105,40 Q 100,35 98,30',
      'M -350,100 Q -300,80 -250,65 Q -200,50 -170,40 Q -150,35 -140,32 Q -130,30 -125,28',
      'M 320,-120 Q 270,-100 220,-85 Q 170,-70 140,-60 Q 120,-55 110,-52 Q 100,-50 95,-48',
      'M -200,-300 Q -170,-250 -140,-200 Q -110,-150 -95,-120 Q -85,-100 -80,-90 Q -78,-85 -76,-80',
      'M 180,280 Q 150,230 120,180 Q 90,130 75,100 Q 65,80 60,70 Q 58,65 56,60',
    ];

    spiralData.forEach((pathData) => {
      svg.appendChild(createPath(pathData, 'distorted-line'));
    });

    // Draw light rays
    const lightRays = [
      'M -600,-300 Q -400,-200 -300,-150 Q -200,-100 -150,-80 Q -100,-60 -50,-40 Q -20,-20 0,0',
      'M 600,-250 Q 400,-150 300,-100 Q 200,-60 150,-40 Q 100,-20 50,-10 Q 20,-5 0,0',
      'M -550,350 Q -350,250 -250,200 Q -150,150 -100,120 Q -50,90 -25,60 Q -10,30 0,0',
      'M 550,320 Q 350,220 250,170 Q 150,120 100,90 Q 50,60 25,30 Q 10,15 0,0',
      'M -400,-500 Q -300,-350 -250,-250 Q -200,-150 -150,-100 Q -100,-50 -50,-25 Q -20,-10 0,0',
      'M 450,480 Q 350,330 300,230 Q 250,130 200,80 Q 150,40 100,20 Q 50,10 0,0',
      'M 500,100 Q 400,80 300,60 Q 200,40 150,30 Q 100,20 50,10 Q 25,5 0,0',
      'M -480,-100 Q -380,-80 -280,-60 Q -180,-40 -130,-30 Q -80,-20 -40,-10 Q -20,-5 0,0',
    ];

    lightRays.forEach((rayData) => {
      svg.appendChild(createPath(rayData, 'light-ray'));
    });

    lightRays.forEach((rayData) => {
      svg.appendChild(createPath(rayData, 'light-ray'));
    });
  }, [colors]);

  return (
    <div style={{ display: 'inline-block', background: 'transparent' }}>
      <svg
        ref={svgRef}
        width={size}
        height={size}
        viewBox='-600 -400 1200 800'
        style={{ display: 'block', background: 'transparent' }}
      />
    </div>
  );
};

const NotFound = () => {
  // Detect theme from localStorage or system preference
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    // Check localStorage first
    const savedTheme = localStorage.getItem('color-mode');
    if (savedTheme === 'dark' || savedTheme === 'light') {
      return savedTheme;
    }

    // Fall back to system preference
    if (
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      return 'dark';
    }

    return 'light';
  });

  // Track viewport dimensions for responsive text positioning
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const [viewportWidth, setViewportWidth] = useState(window.innerWidth);

  // Listen for theme changes
  useEffect(() => {
    const handleStorageChange = () => {
      const newTheme = localStorage.getItem('color-mode');
      if (newTheme === 'dark' || newTheme === 'light') {
        setTheme(newTheme);
      }
    };

    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      // Only update if no theme is saved in localStorage
      if (!localStorage.getItem('color-mode')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };

    const handleResize = () => {
      setViewportHeight(window.innerHeight);
      setViewportWidth(window.innerWidth);
    };

    // Listen for localStorage changes
    window.addEventListener('storage', handleStorageChange);

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', handleSystemThemeChange);

    // Listen for viewport changes
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const backgroundColor = theme === 'dark' ? '#111111' : '#FAFAFA';
  const textColor = theme === 'dark' ? 'white' : '#1B1B1D';
  const subtextColor = theme === 'dark' ? '#ccc' : '#666';

  // Calculate if viewport is too small for the SVG (1200px)
  const isViewportTooSmall = viewportWidth < 1200 || viewportHeight < 800;

  // Dynamic text positioning based on viewport size
  const textBottomPosition = isViewportTooSmall
    ? Math.max(20, viewportHeight * 0.15) // Move text up when viewport is small
    : 40; // Default bottom position

  return (
    <div
      style={{
        backgroundColor,
        padding: '0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Container with max width constraint */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          maxWidth: '100vh', // Set max width to 100vh
          margin: '0 auto', // Center the container
          overflow: 'hidden',
        }}
      >
        {/* SVG Container - can overflow boundaries */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1,
          }}
        >
          <StaticBlackHole theme={theme} size={1200} />
        </div>

        {/* Text Card - absolutely positioned at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: `${textBottomPosition}px`,
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
            zIndex: 10,
            width: '90%',
            maxWidth: '600px',
            padding: '20px 24px',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)',
            backgroundColor:
              theme === 'dark'
                ? 'rgba(26, 26, 26, 0.2)'
                : 'rgba(255, 255, 255, 0.2)',
            border: `1px solid ${
              theme === 'dark'
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(0, 0, 0, 0.1)'
            }`,
          }}
        >
          <h2
            style={{
              color: textColor,
              fontFamily:
                "'TT Norms Pro Normal', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
              margin: '0 0 10px 0',
              fontSize: isViewportTooSmall ? '20px' : '24px',
              fontWeight: 'normal',
              lineHeight: 1.2,
            }}
          >
            404 - Page Not Found
          </h2>
          <p
            style={{
              color: subtextColor,
              fontFamily:
                "'JetBrains Mono', SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
              fontSize: isViewportTooSmall ? '14px' : '16px',
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            This page does not exist or may have been moved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
