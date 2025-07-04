import { useRef, useEffect } from 'react';

interface AnimatedHypercubeLoadingSpinnerProps {
  theme?: 'dark' | 'light';
  instanceId?: string;
}

const AnimatedHypercubeLoadingSpinner = ({
  theme = 'dark',
  instanceId = 'default',
}: AnimatedHypercubeLoadingSpinnerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  // Define colors based on theme
  const colors =
    theme === 'dark'
      ? {
          stroke: 'white',
          fill: 'black',
          fillColor: '#0005e9',
        }
      : {
          stroke: 'black',
          fill: 'white',
          fillColor: '#0005e9',
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

    const allEdgePoints: Vector3[][] = [
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

    const innerEdges: number[][] = [
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

    const outerFaces: number[][] = [
      [0, 1, 2, 3],
      [4, 5, 6, 7],
      [0, 4, 7, 3],
      [1, 5, 6, 2],
      [0, 1, 5, 4],
      [3, 2, 6, 7],
    ];

    let outerMatrix = new Matrix4();
    const innerMatrix = new Matrix4();
    const loopDuration = 4000; // 4 seconds for full loop

    function getEdgeThickness(
      edgeIndex: number,
      rotationDegrees: number
    ): string {
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

    function animate(timestamp: number) {
      animationTimeRef.current = timestamp;

      // Calculate progress (0 to 1) for the current loop cycle
      const progress = (timestamp % loopDuration) / loopDuration;

      // Create a smooth loop using sine wave for seamless transitions
      const smoothProgress =
        (Math.sin(progress * Math.PI * 2 - Math.PI / 2) + 1) / 2;

      // Apply easing for smoother animation
      const easedProgress: number =
        smoothProgress < 0.5
          ? 2 * smoothProgress * smoothProgress
          : 1 - Math.pow(-2 * smoothProgress + 2, 2) / 2;

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
        `silhouette-faces-${instanceId}`,
        `inner-cube-faces-${instanceId}`,
        `inner-cube-edges-${instanceId}`,
        `outer-cube-edges-${instanceId}`,
        `connection-lines-${instanceId}`,
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

      // Draw outer cube silhouette faces
      outerFaces.forEach(function (face) {
        const points = face.map(function (i) {
          return transformedOuter[i];
        });
        const path = createPath(points, 'silhouette-face');
        const silhouetteElement = document.getElementById(
          `silhouette-faces-${instanceId}`
        );
        if (silhouetteElement) silhouetteElement.appendChild(path);
      });

      // Draw inner cube faces with gradual blue transition
      const innerFaces = [
        [0, 1, 2, 3], // front
        [4, 5, 6, 7], // back
        [0, 4, 7, 3], // left
        [1, 5, 6, 2], // right
        [0, 1, 5, 4], // bottom
        [3, 2, 6, 7], // top
      ];

      // Calculate progress for gradual color transition
      const colorProgress = easedProgress;

      innerFaces.forEach(function (face, faceIndex) {
        const points = face.map(function (i) {
          return transformedInner[i];
        });

        // Calculate individual face transition timing
        let faceProgress = 0;
        const baseDelay = 0.1; // Start transitions after 10% of animation
        const stageDuration = 0.3; // Each face takes 30% of remaining time to transition

        if (colorProgress > baseDelay) {
          switch (faceIndex) {
            case 4: // bottom - starts first
              faceProgress = Math.min(
                1,
                (colorProgress - baseDelay) / stageDuration
              );
              break;
            case 0: // front
            case 2: // left
            case 3: // right - side faces start together
              faceProgress = Math.min(
                1,
                Math.max(0, (colorProgress - baseDelay - 0.15) / stageDuration)
              );
              break;
            case 1: // back
              faceProgress = Math.min(
                1,
                Math.max(0, (colorProgress - baseDelay - 0.3) / stageDuration)
              );
              break;
            case 5: // top - starts last
              faceProgress = Math.min(
                1,
                Math.max(0, (colorProgress - baseDelay - 0.45) / stageDuration)
              );
              break;
          }
        }

        // Create path with dynamic color based on progress
        const path = createPath(points, 'inner-cube-face');

        // Interpolate between base color and blue
        const blueAmount = Math.pow(faceProgress, 1.5); // Slight easing for smoother transition
        if (blueAmount > 0) {
          // Calculate interpolated color
          const baseColor = colors.fill;
          if (baseColor === 'black') {
            // For dark theme, interpolate from black to blue
            const r = Math.round(0 * (1 - blueAmount) + 0 * blueAmount);
            const g = Math.round(0 * (1 - blueAmount) + 5 * blueAmount);
            const b = Math.round(0 * (1 - blueAmount) + 233 * blueAmount);
            path.style.fill = `rgb(${r}, ${g}, ${b})`;
          } else {
            // For light theme, interpolate from white to blue
            const r = Math.round(255 * (1 - blueAmount) + 0 * blueAmount);
            const g = Math.round(255 * (1 - blueAmount) + 5 * blueAmount);
            const b = Math.round(255 * (1 - blueAmount) + 233 * blueAmount);
            path.style.fill = `rgb(${r}, ${g}, ${b})`;
          }
        }

        const innerFacesElement = document.getElementById(
          `inner-cube-faces-${instanceId}`
        );
        if (innerFacesElement) innerFacesElement.appendChild(path);
      });

      // Draw inner cube edges
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
        const innerEdgesElement = document.getElementById(
          `inner-cube-edges-${instanceId}`
        );
        if (innerEdgesElement) innerEdgesElement.appendChild(line);
      });

      // Draw outer cube edges
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
        const outerEdgesElement = document.getElementById(
          `outer-cube-edges-${instanceId}`
        );
        if (outerEdgesElement) outerEdgesElement.appendChild(line);
      });

      // Draw connection lines
      for (let i = 0; i < 8; i++) {
        const line = createLine(
          transformedInner[i].x,
          transformedInner[i].y,
          transformedOuter[i].x,
          transformedOuter[i].y,
          'connection-line'
        );
        const connectionElement = document.getElementById(
          `connection-lines-${instanceId}`
        );
        if (connectionElement) connectionElement.appendChild(line);
      }
    }

    const container = containerRef.current;
    if (container) {
      // Start the animation loop
      animationFrameRef.current = requestAnimationFrame(animate);

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }
  }, [instanceId, theme, colors.fill]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        background: 'transparent',
        padding: 0,
        margin: 0,
        overflow: 'visible',
      }}
    >
      <svg
        width='128'
        height='128'
        viewBox='-200 -200 400 400'
        style={{ display: 'block', background: 'transparent' }}
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
        <g id={`silhouette-faces-${instanceId}`}></g>
        <g id={`inner-cube-faces-${instanceId}`}></g>
        <g id={`inner-cube-edges-${instanceId}`}></g>
        <g id={`outer-cube-edges-${instanceId}`}></g>
        <g id={`connection-lines-${instanceId}`}></g>
      </svg>
    </div>
  );
};

export default AnimatedHypercubeLoadingSpinner;
