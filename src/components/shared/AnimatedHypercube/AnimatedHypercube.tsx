import { useRef, useEffect } from 'react';

interface AnimatedHypercubeProps {
  theme?: 'dark' | 'light';
  onClick?: () => void;
  href?: string;
}

const AnimatedHypercube = ({
  theme = 'dark',
  onClick,
  href,
}: AnimatedHypercubeProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationProgressRef = useRef(0);
  const targetProgressRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const isInitialAnimationRef = useRef(true);

  // Define colors based on theme
  const colors =
    theme === 'dark'
      ? {
          stroke: 'white',
          fill: 'black',
        }
      : {
          stroke: 'black',
          fill: 'white',
        };

  useEffect(() => {
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

    function createPath(
      points: Array<{ x: number; y: number }>,
      className: string
    ) {
      const path = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'path'
      );
      let d = 'M ' + points[0].x + ' ' + points[0].y;
      for (let i = 1; i < points.length; i++) {
        d += ' L ' + points[i].x + ' ' + points[i].y;
      }
      d += ' Z';
      path.setAttribute('d', d);
      path.setAttribute('class', className);
      return path;
    }

    class Vector3 {
      x: number;
      y: number;
      z: number;

      constructor(x: number, y: number, z: number) {
        this.x = x || 0;
        this.y = y || 0;
        this.z = z || 0;
      }

      clone() {
        return new Vector3(this.x, this.y, this.z);
      }

      normalize() {
        const length = Math.sqrt(
          this.x * this.x + this.y * this.y + this.z * this.z
        );
        if (length > 0) {
          this.x /= length;
          this.y /= length;
          this.z /= length;
        }
        return this;
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

      makeRotationAxis(axis: Vector3, angle: number) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        const t = 1 - c;
        const x = axis.x,
          y = axis.y,
          z = axis.z;
        const tx = t * x,
          ty = t * y;

        this.elements = [
          tx * x + c,
          tx * y - s * z,
          tx * z + s * y,
          0,
          tx * y + s * z,
          ty * y + c,
          ty * z - s * x,
          0,
          tx * z - s * y,
          ty * z + s * x,
          t * z * z + c,
          0,
          0,
          0,
          0,
          1,
        ];
        return this;
      }

      makeRotationFromEuler(euler: Euler) {
        const x = euler.x,
          y = euler.y,
          z = euler.z;
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

      multiply(m: Matrix4) {
        const a = this.elements;
        const b = m.elements;
        const result = new Array(16);

        for (let i = 0; i < 4; i++) {
          for (let j = 0; j < 4; j++) {
            result[i * 4 + j] =
              a[i * 4 + 0] * b[0 * 4 + j] +
              a[i * 4 + 1] * b[1 * 4 + j] +
              a[i * 4 + 2] * b[2 * 4 + j] +
              a[i * 4 + 3] * b[3 * 4 + j];
          }
        }
        this.elements = result;
        return this;
      }

      multiplyMatrices(a: Matrix4, b: Matrix4) {
        const ae = a.elements;
        const be = b.elements;
        const te = this.elements;

        for (let i = 0; i < 4; i++) {
          for (let j = 0; j < 4; j++) {
            te[i * 4 + j] =
              ae[i * 4 + 0] * be[0 * 4 + j] +
              ae[i * 4 + 1] * be[1 * 4 + j] +
              ae[i * 4 + 2] * be[2 * 4 + j] +
              ae[i * 4 + 3] * be[3 * 4 + j];
          }
        }
        return this;
      }

      setFromRotationMatrix(m: Matrix4) {
        this.elements = m.elements.slice();
        return this;
      }
    }

    class Euler {
      x: number;
      y: number;
      z: number;

      constructor(x: number, y: number, z: number) {
        this.x = x || 0;
        this.y = y || 0;
        this.z = z || 0;
      }
    }

    function project3D(point: Vector3) {
      const scale = 100;
      const x = point.x * scale;
      const y = point.y * scale;
      const z = point.z * scale;

      const screenX = (x - z) * 0.866;
      const screenY = (x + z) * 0.5 - y;

      return { x: screenX, y: screenY };
    }

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

    const allEdgePoints = [
      [new Vector3(1, -1, 1), new Vector3(1, 1, 1)],
      [new Vector3(1, -1, -1), new Vector3(1, 1, -1)],
      [new Vector3(-1, -1, -1), new Vector3(-1, 1, -1)],
      [new Vector3(-1, -1, 1), new Vector3(-1, 1, 1)],
      [new Vector3(1, -1, 1), new Vector3(1, -1, -1)],
      [new Vector3(1, -1, -1), new Vector3(-1, -1, -1)],
      [new Vector3(-1, -1, -1), new Vector3(-1, -1, 1)],
      [new Vector3(-1, -1, 1), new Vector3(1, -1, 1)],
      [new Vector3(1, 1, 1), new Vector3(1, 1, -1)],
      [new Vector3(1, 1, -1), new Vector3(-1, 1, -1)],
      [new Vector3(-1, 1, -1), new Vector3(-1, 1, 1)],
      [new Vector3(-1, 1, 1), new Vector3(1, 1, 1)],
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

    const outerFaces = [
      [0, 1, 2, 3],
      [4, 5, 6, 7],
      [0, 4, 7, 3],
      [1, 5, 6, 2],
      [0, 1, 5, 4],
      [3, 2, 6, 7],
    ];

    let outerMatrix = new Matrix4();
    const innerMatrix = new Matrix4();
    const animationSpeed = 0.02;
    const initialAnimationSpeed = 0.005; // Much slower for initial animation

    // Start with the initial animation
    if (isInitialAnimationRef.current) {
      animationProgressRef.current = 1; // Start at hover state
      targetProgressRef.current = 0; // Animate to non-hover state
    }

    function getEdgeThickness(edgeIndex: number, rotationDegrees: number) {
      if (edgeIndex >= 8) return 'thick-edge';

      const shouldBeThin = new Array(12).fill(false);

      if (rotationDegrees < 45) {
        shouldBeThin[2] = true;
        shouldBeThin[5] = true;
        shouldBeThin[6] = true;
      } else if (rotationDegrees < 135) {
        shouldBeThin[3] = true;
        shouldBeThin[7] = true;
        shouldBeThin[6] = true;
      } else {
        shouldBeThin[0] = true;
        shouldBeThin[4] = true;
        shouldBeThin[7] = true;
      }

      return shouldBeThin[edgeIndex] ? 'thin-edge' : 'thick-edge';
    }

    function onMouseEnter() {
      isInitialAnimationRef.current = false; // End initial animation phase
      targetProgressRef.current = 1;
    }

    function onMouseLeave() {
      isInitialAnimationRef.current = false; // End initial animation phase
      targetProgressRef.current = 0;
    }

    function lerp(start: number, end: number, factor: number) {
      return start + (end - start) * factor;
    }

    function animate() {
      // Use slow speed only for initial animation, normal speed after first interaction
      const currentSpeed = isInitialAnimationRef.current
        ? initialAnimationSpeed
        : animationSpeed;

      animationProgressRef.current = lerp(
        animationProgressRef.current,
        targetProgressRef.current,
        currentSpeed
      );

      // End initial animation when we reach close to the target
      if (
        isInitialAnimationRef.current &&
        Math.abs(animationProgressRef.current - targetProgressRef.current) <
          0.05
      ) {
        isInitialAnimationRef.current = false;
      }

      const easedProgress =
        animationProgressRef.current < 0.5
          ? 2 * animationProgressRef.current * animationProgressRef.current
          : 1 - Math.pow(-2 * animationProgressRef.current + 2, 2) / 2;

      const outerRotationMultiplier = easedProgress * 0.5;
      const outerRotation = outerRotationMultiplier * Math.PI * 2;
      outerMatrix = new Matrix4().makeRotationY(outerRotation);

      let innerRotationMultiplier = easedProgress * 0.5;
      innerRotationMultiplier = Math.sin(innerRotationMultiplier * Math.PI);

      const cameraAxis = new Vector3(1, 1, 1).normalize();
      const baseRotationMatrix = new Matrix4().makeRotationAxis(
        cameraAxis,
        -Math.PI / 4
      );
      const outerAlignment = outerRotationMultiplier * Math.PI * 2;
      const outerRotationMatrix = new Matrix4().makeRotationY(outerAlignment);
      const innerAnimation = -innerRotationMultiplier * Math.PI * 0.5;
      const innerAnimationMatrix = new Matrix4().makeRotationFromEuler(
        new Euler(
          innerAnimation * 0.8,
          innerAnimation * 1.0,
          innerAnimation * 0.6
        )
      );

      const finalMatrix = new Matrix4()
        .multiplyMatrices(outerRotationMatrix, baseRotationMatrix)
        .multiply(innerAnimationMatrix);

      innerMatrix.setFromRotationMatrix(finalMatrix);

      updateVisualization(easedProgress);
      animationFrameRef.current = requestAnimationFrame(animate);
    }

    function updateVisualization(easedProgress: number) {
      const groups = [
        'silhouette-faces',
        'inner-cube-faces',
        'inner-cube-edges',
        'outer-cube-edges',
        'connection-lines',
      ];
      groups.forEach(function (id) {
        const element = document.getElementById(id);
        if (element) element.innerHTML = '';
      });

      const transformedOuter = outerVertices.map(function (v) {
        return project3D(v.clone().applyMatrix4(outerMatrix));
      });
      const transformedInner = innerVertices.map(function (v) {
        return project3D(v.clone().applyMatrix4(innerMatrix));
      });

      outerFaces.forEach(function (face) {
        const points = face.map(function (i) {
          return transformedOuter[i];
        });
        const path = createPath(points, 'silhouette-face');
        const silhouetteElement = document.getElementById('silhouette-faces');
        if (silhouetteElement) silhouetteElement.appendChild(path);
      });

      const innerFaces = [
        [0, 1, 2, 3],
        [4, 5, 6, 7],
        [0, 4, 7, 3],
        [1, 5, 6, 2],
        [0, 1, 5, 4],
        [3, 2, 6, 7],
      ];
      innerFaces.forEach(function (face) {
        const points = face.map(function (i) {
          return transformedInner[i];
        });
        const path = createPath(points, 'inner-cube-face');
        const innerFacesElement = document.getElementById('inner-cube-faces');
        if (innerFacesElement) innerFacesElement.appendChild(path);
      });

      innerEdges.forEach(function (edge) {
        const start = edge[0];
        const end = edge[1];
        const line = createLine(
          transformedInner[start].x,
          transformedInner[start].y,
          transformedInner[end].x,
          transformedInner[end].y,
          'inner-edge'
        );
        const innerEdgesElement = document.getElementById('inner-cube-edges');
        if (innerEdgesElement) innerEdgesElement.appendChild(line);
      });

      const rotationDegrees = easedProgress * 180;

      allEdgePoints.forEach(function (edgePoints, index) {
        const start = edgePoints[0].clone().applyMatrix4(outerMatrix);
        const end = edgePoints[1].clone().applyMatrix4(outerMatrix);
        const startProj = project3D(start);
        const endProj = project3D(end);

        const thickness = getEdgeThickness(index, rotationDegrees);
        const line = createLine(
          startProj.x,
          startProj.y,
          endProj.x,
          endProj.y,
          thickness
        );
        const outerEdgesElement = document.getElementById('outer-cube-edges');
        if (outerEdgesElement) outerEdgesElement.appendChild(line);
      });

      for (let i = 0; i < 8; i++) {
        const line = createLine(
          transformedInner[i].x,
          transformedInner[i].y,
          transformedOuter[i].x,
          transformedOuter[i].y,
          'connection-line'
        );
        const connectionElement = document.getElementById('connection-lines');
        if (connectionElement) connectionElement.appendChild(line);
      }
    }

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mouseenter', onMouseEnter);
      container.addEventListener('mouseleave', onMouseLeave);

      animate();

      return () => {
        container.removeEventListener('mouseenter', onMouseEnter);
        container.removeEventListener('mouseleave', onMouseLeave);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }
  }, []);

  // Handle click events
  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick();
    }
  };

  // Handle context menu for right-click behavior
  const handleContextMenu = (e: React.MouseEvent) => {
    // Allow default context menu behavior when href is provided
    if (!href) {
      e.preventDefault();
    }
  };

  // Determine if this should render as a link
  const isLink = Boolean(href || onClick);

  const containerProps = {
    ref: containerRef,
    className: 'cursor-pointer',
    style: {
      position: 'relative' as const,
      background: 'transparent',
      padding: 0,
      margin: 0,
      overflow: 'visible' as const,
    },
    ...(isLink && {
      onClick: handleClick,
      onContextMenu: handleContextMenu,
      role: 'button',
      tabIndex: 0,
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (onClick) onClick();
        }
      },
    }),
  };

  const svgContent = (
    <svg
      width='64'
      height='64'
      viewBox='-200 -200 400 400'
      style={{
        display: 'block',
        background: 'transparent',
        pointerEvents: 'none',
      }}
    >
      <style>{`
        .thick-edge {
          stroke: ${colors.stroke};
          stroke-width: 10.5;
          stroke-linecap: round;
          fill: none;
        }
        .thin-edge {
          stroke: ${colors.stroke};
          stroke-width: 3.5;
          stroke-linecap: round;
          fill: none;
        }
        .connection-line {
          stroke: ${colors.stroke};
          stroke-width: 1.75;
          stroke-linecap: round;
          fill: none;
        }
        .inner-cube-face {
          fill: ${colors.fill};
          stroke: ${colors.stroke};
          stroke-width: 2.625;
          stroke-linecap: round;
          stroke-linejoin: round;
        }
        .inner-edge {
          stroke: ${colors.stroke};
          stroke-width: 5.25;
          stroke-linecap: round;
          fill: none;
        }
        .silhouette-face {
          fill: ${colors.fill};
          stroke: none;
        }
      `}</style>
      <g id='silhouette-faces'></g>
      <g id='inner-cube-faces'></g>
      <g id='inner-cube-edges'></g>
      <g id='outer-cube-edges'></g>
      <g id='connection-lines'></g>
    </svg>
  );

  // If href is provided, render as an actual <a> tag for proper link behavior
  if (href) {
    return (
      <a
        href={href}
        {...containerProps}
        style={{
          ...containerProps.style,
          textDecoration: 'none',
          color: 'inherit',
        }}
      >
        {svgContent}
      </a>
    );
  }

  // Otherwise render as div with click handler
  return <div {...containerProps}>{svgContent}</div>;
};

export default AnimatedHypercube;
