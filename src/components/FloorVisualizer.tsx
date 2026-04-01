import React, { useRef, useMemo, useEffect, Suspense, Component, ErrorInfo, ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Grid, Environment, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { TileConfig } from '../types';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("3D Visualizer Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

interface FloorProps {
  config: TileConfig;
}

const Floor: React.FC<FloorProps> = ({ config }) => {
  const { room, tile, pattern, color, textureUrl } = config;
  const tileW = (tile.width || 1) / 100;
  const tileL = (tile.length || 1) / 100;
  const gap = (config.gap || 0) / 1000;

  const texture = useTexture(textureUrl || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=');
  
  useEffect(() => {
    if (texture) {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    }
  }, [texture]);

  const tileData = useMemo(() => {
    const items = [];
    const cols = Math.floor(room.width / (tileW + gap));
    const rows = Math.floor(room.length / (tileL + gap));
    
    const startX = -((cols - 1) * (tileW + gap)) / 2;
    const startZ = -((rows - 1) * (tileL + gap)) / 2;

    if (pattern === 'diagonal') {
      const diag = Math.sqrt(room.width ** 2 + room.length ** 2);
      const dCols = Math.ceil(diag / (tileW + gap)) + 2;
      const dRows = Math.ceil(diag / (tileL + gap)) + 2;
      for (let i = 0; i < dRows; i++) {
        for (let j = 0; j < dCols; j++) {
          const u = (j - (dCols - 1) / 2) * (tileW + gap);
          const v = (i - (dRows - 1) / 2) * (tileL + gap);
          const angle = Math.PI / 4;
          const x = u * Math.cos(angle) - v * Math.sin(angle);
          const z = u * Math.sin(angle) + v * Math.cos(angle);
          items.push({ x, z, color: color, rotation: angle, w: tileW, l: tileL });
        }
      }
    } else if (pattern === 'mosaic' || pattern === 'random-mix') {
      const subDivs = pattern === 'mosaic' ? 4 : 1;
      const subW = tileW / subDivs;
      const subL = tileL / subDivs;
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          for (let si = 0; si < subDivs; si++) {
            for (let sj = 0; sj < subDivs; sj++) {
              let x = startX + j * (tileW + gap) - (tileW/2) + subW / 2 + sj * subW;
              let z = startZ + i * (tileL + gap) - (tileL/2) + subL / 2 + si * subL;
              
              const baseColor = new THREE.Color(color);
              const variation = (Math.random() - 0.5) * 0.25;
              baseColor.r = Math.max(0, Math.min(1, baseColor.r + variation));
              baseColor.g = Math.max(0, Math.min(1, baseColor.g + variation));
              baseColor.b = Math.max(0, Math.min(1, baseColor.b + variation));
              
              items.push({ x, z, color: '#' + baseColor.getHexString(), rotation: 0, w: subW - gap/2, l: subL - gap/2 });
            }
          }
        }
      }
    } else if (pattern === 'herringbone' || pattern === 'chevron') {
      const angle = pattern === 'chevron' ? Math.PI / 4 : 0;
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          let x1 = startX + j * (tileW + gap);
          let z1 = startZ + i * (tileL + gap);
          if ((i + j) % 2 === 0) {
            items.push({ x: x1, z: z1, color: color, rotation: angle, w: tileW, l: tileL });
          } else {
            items.push({ x: x1 + tileW/2, z: z1 + tileL/2, color: color, rotation: Math.PI / 2 - angle, w: tileW, l: tileL });
          }
        }
      }
    } else if (pattern === 'windmill') {
      const size = tileW;
      for (let i = 0; i < rows / 2; i++) {
        for (let j = 0; j < cols / 2; j++) {
          const baseX = startX + j * (size * 3 + gap) - size;
          const baseZ = startZ + i * (size * 3 + gap) - size;
          
          // Center square
          items.push({ x: baseX + size * 1.5, z: baseZ + size * 1.5, color: color, rotation: 0, w: size, l: size });
          
          // Surrounding rectangles
          items.push({ x: baseX + size, z: baseZ + size/2, color: color, rotation: 0, w: size * 2, l: size });
          items.push({ x: baseX + size * 2.5, z: baseZ + size, color: color, rotation: Math.PI / 2, w: size * 2, l: size });
          items.push({ x: baseX + size * 2, z: baseZ + size * 2.5, color: color, rotation: 0, w: size * 2, l: size });
          items.push({ x: baseX + size/2, z: baseZ + size * 2, color: color, rotation: Math.PI / 2, w: size * 2, l: size });
        }
      }
    } else if (pattern === 'hopscotch') {
      const largeSize = tileW;
      const smallSize = tileW / 2;
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          const baseX = startX + j * (largeSize + smallSize + gap) - largeSize/2;
          const baseZ = startZ + i * (largeSize + smallSize + gap) - largeSize/2;
          
          items.push({ x: baseX + largeSize/2, z: baseZ + largeSize/2, color: color, rotation: 0, w: largeSize, l: largeSize });
          items.push({ x: baseX + largeSize + smallSize/2, z: baseZ + smallSize/2, color: color, rotation: 0, w: smallSize, l: smallSize });
          items.push({ x: baseX + smallSize/2, z: baseZ + largeSize + smallSize/2, color: color, rotation: 0, w: smallSize, l: smallSize });
        }
      }
    } else if (pattern === 'pinwheel') {
      const largeSize = tileW;
      const smallSize = tileW / 2;
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          const baseX = startX + j * (largeSize + smallSize + gap) - largeSize/2;
          const baseZ = startZ + i * (largeSize + smallSize + gap) - largeSize/2;
          
          items.push({ x: baseX + largeSize/2, z: baseZ + largeSize/2, color: color, rotation: 0, w: largeSize, l: largeSize });
          items.push({ x: baseX + largeSize + smallSize/2, z: baseZ + largeSize + smallSize/2, color: color, rotation: 0, w: smallSize, l: smallSize });
        }
      }
    } else if (pattern === 'modular-3') {
      const s = tileW / 2;
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          const baseX = startX + j * (s * 3 + gap) - s*1.5;
          const baseZ = startZ + i * (s * 3 + gap) - s*1.5;
          
          items.push({ x: baseX + s, z: baseZ + s, color: color, rotation: 0, w: s * 2, l: s * 2 });
          items.push({ x: baseX + s, z: baseZ + s * 2.5, color: color, rotation: 0, w: s * 2, l: s });
          items.push({ x: baseX + s * 2.5, z: baseZ + s * 0.5, color: color, rotation: 0, w: s, l: s });
          items.push({ x: baseX + s * 2.5, z: baseZ + s * 1.5, color: color, rotation: 0, w: s, l: s });
          items.push({ x: baseX + s * 2.5, z: baseZ + s * 2.5, color: color, rotation: 0, w: s, l: s });
        }
      }
    } else if (pattern === 'versailles') {
      const s = tileW / 4;
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          const baseX = startX + j * (s * 8 + gap) - s*4;
          const baseZ = startZ + i * (s * 8 + gap) - s*4;
          
          items.push({ x: baseX + s * 2, z: baseZ + s * 2, color: color, rotation: 0, w: s * 4, l: s * 4 });
          items.push({ x: baseX + s * 6, z: baseZ + s * 2, color: color, rotation: 0, w: s * 4, l: s * 4 });
          items.push({ x: baseX + s * 2, z: baseZ + s * 6, color: color, rotation: 0, w: s * 4, l: s * 4 });
          items.push({ x: baseX + s * 6, z: baseZ + s * 6, color: color, rotation: 0, w: s * 4, l: s * 4 });
          items.push({ x: baseX + s * 4, z: baseZ + s * 4, color: '#333333', rotation: 0, w: s * 2, l: s * 2 });
        }
      }
    } else if (pattern === '3d-cube') {
      const s = tileW;
      const h = s * Math.sqrt(3) / 2;
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          const baseX = startX + j * (s * 1.5 + gap) - s*0.75;
          const baseZ = startZ + i * (h * 2 + gap) - h + (j % 2) * h;
          
          const topColor = color;
          const leftColor = new THREE.Color(color).multiplyScalar(0.7).getStyle();
          const rightColor = new THREE.Color(color).multiplyScalar(0.4).getStyle();
          
          items.push({ x: baseX + s/2, z: baseZ, color: topColor, rotation: 0, w: s, l: s });
          items.push({ x: baseX, z: baseZ + h/2, color: leftColor, rotation: Math.PI / 6, w: s, l: s });
          items.push({ x: baseX + s, z: baseZ + h/2, color: rightColor, rotation: -Math.PI / 6, w: s, l: s });
        }
      }
    } else if (pattern === 'medallion') {
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          let x = startX + j * (tileW + gap);
          let z = startZ + i * (tileL + gap);
          items.push({ x, z, color: color, rotation: 0, w: tileW, l: tileL });
        }
      }
      items.push({ 
        x: 0, z: 0, 
        color: '#f6ad55',
        rotation: Math.PI / 4, 
        w: Math.min(room.width, room.length) * 0.4, 
        l: Math.min(room.width, room.length) * 0.4 
      });
    } else if (pattern === 'circle' || pattern === 'triangle' || pattern === 'diamond' || pattern === 'cross') {
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          let x = startX + j * (tileW + gap);
          let z = startZ + i * (tileL + gap);
          let rotation = 0;
          if (pattern === 'diamond') rotation = Math.PI / 4;
          if (pattern === 'cross') {
            if (i % 3 === 0 || j % 3 === 0) {
              items.push({ x, z, color: color, rotation: 0, w: tileW, l: tileL });
            }
          } else {
            items.push({ x, z, color: color, rotation, w: tileW, l: tileL });
          }
        }
      }
    } else {
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          let x = startX + j * (tileW + gap);
          let z = startZ + i * (tileL + gap);
          let rotation = 0;
          if (pattern === 'offset' && i % 2 !== 0) x += tileW / 2;
          let tileColor = color;
          if (pattern === 'checker') tileColor = (i + j) % 2 === 0 ? color : '#333333';
          items.push({ x, z, color: tileColor, rotation, w: tileW, l: tileL });
        }
      }
    }
    return items;
  }, [room, tile, pattern, gap, color, tileW, tileL]);

  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
  const shaderRef = useRef<any>(null);

  const geometry = useMemo(() => {
    if (pattern === 'circle') return new THREE.CircleGeometry(0.5, 32);
    if (pattern === 'triangle') return new THREE.CircleGeometry(0.5, 3);
    return new THREE.PlaneGeometry(1, 1);
  }, [pattern]);

  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      map: textureUrl ? texture : null,
      roughness: 0.2,
      metalness: 0.05,
      transparent: true,
    });
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.roomDim = { value: new THREE.Vector3(room.width / 2, room.height, room.length / 2) };
      shader.vertexShader = `
        varying vec3 vWorldPos;
        ${shader.vertexShader}
      `.replace(
        `#include <worldpos_vertex>`,
        `#include <worldpos_vertex>
         vWorldPos = worldPosition.xyz;`
      );
      shader.fragmentShader = `
        varying vec3 vWorldPos;
        uniform vec3 roomDim;
        ${shader.fragmentShader}
      `.replace(
        `#include <clipping_planes_fragment>`,
        `#include <clipping_planes_fragment>
         if (abs(vWorldPos.x) > roomDim.x + 0.01 || abs(vWorldPos.z) > roomDim.z + 0.01) discard;`
      );
      shaderRef.current = shader;
    };
    return mat;
  }, [texture, textureUrl]);

  useEffect(() => {
    if (shaderRef.current) {
      shaderRef.current.uniforms.roomDim.value.set(room.width / 2, room.height, room.length / 2);
    }
  }, [room]);

  useEffect(() => {
    if (instancedMeshRef.current) {
      const dummy = new THREE.Object3D();
      const colorArr = new THREE.Color();
      tileData.forEach((t, i) => {
        dummy.position.set(t.x, 0, t.z);
        dummy.rotation.set(-Math.PI / 2, 0, t.rotation);
        dummy.scale.set(t.w, t.l, 1);
        dummy.updateMatrix();
        instancedMeshRef.current!.setMatrixAt(i, dummy.matrix);
        colorArr.set(textureUrl ? '#ffffff' : t.color);
        instancedMeshRef.current!.setColorAt(i, colorArr);
      });
      instancedMeshRef.current.instanceMatrix.needsUpdate = true;
      if (instancedMeshRef.current.instanceColor) instancedMeshRef.current.instanceColor.needsUpdate = true;
    }
  }, [tileData, textureUrl]);

  return (
    <group>
      <instancedMesh 
        key={`floor-${tileData.length}-${pattern}`}
        ref={instancedMeshRef} 
        args={[geometry as any, null as any, tileData.length]}
        material={material}
      />
      <mesh position={[0, -0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[room.width, room.length]} />
        <meshStandardMaterial color={config.groutColor} />
      </mesh>
    </group>
  );
};

const WallTiles: React.FC<FloorProps> = ({ config }) => {
  const { room, wallTile, includeWallTiles, wallColor, wallTextureUrl, wallPattern: pattern } = config;
  if (!includeWallTiles || !wallTile) return null;

  const tileW = (wallTile.width || 1) / 100;
  const tileL = (wallTile.length || 1) / 100;
  const gap = (config.gap || 0) / 1000;

  const texture = useTexture(wallTextureUrl || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=');

  useEffect(() => {
    if (texture) {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    }
  }, [texture]);

  const wallTileData = useMemo(() => {
    const walls = [];
    const h = room.height;
    const w = room.width;
    const l = room.length;

    const addWallSection = (countX: number, countY: number, startPos: [number, number, number], stepX: [number, number, number], stepY: [number, number, number], rot: [number, number, number], wallW: number, wallH: number) => {
      if (pattern === 'diagonal') {
        const diag = Math.sqrt(wallW ** 2 + wallH ** 2);
        const dCols = Math.ceil(diag / (tileW + gap)) + 2;
        const dRows = Math.ceil(diag / (tileL + gap)) + 2;
        
        for (let i = 0; i < dRows; i++) {
          for (let j = 0; j < dCols; j++) {
            const u = (j - (dCols - 1) / 2) * (tileW + gap);
            const v = (i - (dRows - 1) / 2) * (tileL + gap);
            const angle = Math.PI / 4;
            
            // Local rotation within the wall plane
            const lu = u * Math.cos(angle) - v * Math.sin(angle);
            const lv = u * Math.sin(angle) + v * Math.cos(angle);
            
            // Center of the wall section
            const centerX = startPos[0] + ((countX - 1) * stepX[0]) / 2;
            const centerY = startPos[1] + ((countY - 1) * stepY[1]) / 2;
            const centerZ = startPos[2] + ((countX - 1) * stepX[2]) / 2;

            // Calculate world position based on wall orientation (rot)
            // This is simplified: we use the step vectors to orient the local lu, lv
            const posX = centerX + lu * (stepX[0] !== 0 ? 1 : 0) + lv * (stepY[0] !== 0 ? 1 : 0);
            const posY = centerY + lu * (stepX[1] !== 0 ? 1 : 0) + lv * (stepY[1] !== 0 ? 1 : 0);
            const posZ = centerZ + lu * (stepX[2] !== 0 ? 1 : 0) + lv * (stepY[2] !== 0 ? 1 : 0);

            walls.push({
              pos: [posX, posY, posZ],
              rot: [rot[0], rot[1], rot[2] + angle],
              size: [tileW, tileL],
              color: wallColor
            });
          }
        }
        return;
      }

      for (let i = 0; i < countY; i++) {
        for (let j = 0; j < countX; j++) {
          const posX = startPos[0] + j * stepX[0] + i * stepY[0];
          const posY = startPos[1] + j * stepX[1] + i * stepY[1];
          const posZ = startPos[2] + j * stepX[2] + i * stepY[2];

          if (pattern === 'mosaic') {
            const subDivs = 4;
            const subW = tileW / subDivs;
            const subL = tileL / subDivs;
            for (let si = 0; si < subDivs; si++) {
              for (let sj = 0; sj < subDivs; sj++) {
                const baseColor = new THREE.Color(wallColor);
                const variation = (Math.random() - 0.5) * 0.15;
                baseColor.r = Math.max(0, Math.min(1, baseColor.r + variation));
                baseColor.g = Math.max(0, Math.min(1, baseColor.g + variation));
                baseColor.b = Math.max(0, Math.min(1, baseColor.b + variation));

                walls.push({
                  pos: [
                    posX + sj * (subW * (stepX[0] !== 0 ? 1 : 0)) + si * (subL * (stepY[0] !== 0 ? 1 : 0)) - (tileW/2) + subW/2,
                    posY + sj * (subW * (stepX[1] !== 0 ? 1 : 0)) + si * (subL * (stepY[1] !== 0 ? 1 : 0)) - (tileL/2) + subL/2,
                    posZ + sj * (subW * (stepX[2] !== 0 ? 1 : 0)) + si * (subL * (stepY[2] !== 0 ? 1 : 0))
                  ],
                  rot,
                  size: [subW - gap/2, subL - gap/2],
                  color: '#' + baseColor.getHexString()
                });
              }
            }
          } else {
            walls.push({
              pos: [posX, posY, posZ],
              rot,
              size: [tileW, tileL],
              color: wallColor
            });
          }
        }
      }
    };

    const rows = Math.ceil(h / (tileL + gap)) + 1;
    const colsW = Math.ceil(w / (tileW + gap)) + 1;
    const colsL = Math.ceil(l / (tileW + gap)) + 1;

    // Back Wall
    addWallSection(colsW, rows, [-(colsW-1)*(tileW+gap)/2, (tileL+gap)/2, -l/2 + 0.01], [tileW + gap, 0, 0], [0, tileL + gap, 0], [0, 0, 0], w, h);
    // Left Wall
    addWallSection(colsL, rows, [-w / 2 + 0.01, (tileL+gap)/2, -(colsL-1)*(tileW+gap)/2], [0, 0, tileW + gap], [0, tileL + gap, 0], [0, Math.PI / 2, 0], l, h);
    // Right Wall
    addWallSection(colsL, rows, [w / 2 - 0.01, (tileL+gap)/2, -(colsL-1)*(tileW+gap)/2], [0, 0, tileW + gap], [0, tileL + gap, 0], [0, -Math.PI / 2, 0], l, h);

    return walls;
  }, [room, wallTile, gap, wallColor, pattern, tileW, tileL]);

  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
  const shaderRef = useRef<any>(null);

  const geometry = useMemo(() => {
    if (pattern === 'circle') return new THREE.CircleGeometry(0.5, 32);
    if (pattern === 'triangle') return new THREE.CircleGeometry(0.5, 3);
    return new THREE.PlaneGeometry(1, 1);
  }, [pattern]);

  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      map: wallTextureUrl ? texture : null,
      roughness: 0.3,
      metalness: 0.05,
      color: wallColor,
      transparent: true,
    });
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.roomDim = { value: new THREE.Vector3(room.width / 2, room.height, room.length / 2) };
      shader.vertexShader = `
        varying vec3 vWorldPos;
        ${shader.vertexShader}
      `.replace(
        `#include <worldpos_vertex>`,
        `#include <worldpos_vertex>
         vWorldPos = worldPosition.xyz;`
      );
      shader.fragmentShader = `
        varying vec3 vWorldPos;
        uniform vec3 roomDim;
        ${shader.fragmentShader}
      `.replace(
        `#include <clipping_planes_fragment>`,
        `#include <clipping_planes_fragment>
         if (abs(vWorldPos.x) > roomDim.x + 0.01 || vWorldPos.y < -0.01 || vWorldPos.y > roomDim.y + 0.01 || abs(vWorldPos.z) > roomDim.z + 0.01) discard;`
      );
      shaderRef.current = shader;
    };
    return mat;
  }, [texture, wallTextureUrl, wallColor]);

  useEffect(() => {
    if (shaderRef.current) {
      shaderRef.current.uniforms.roomDim.value.set(room.width / 2, room.height, room.length / 2);
    }
  }, [room]);

  useEffect(() => {
    if (instancedMeshRef.current) {
      const dummy = new THREE.Object3D();
      const colorArr = new THREE.Color();
      wallTileData.forEach((t, i) => {
        dummy.position.set(t.pos[0], t.pos[1], t.pos[2]);
        dummy.rotation.set(t.rot[0], t.rot[1], t.rot[2]);
        dummy.scale.set(t.size[0], t.size[1], 1);
        dummy.updateMatrix();
        instancedMeshRef.current!.setMatrixAt(i, dummy.matrix);
        colorArr.set(wallTextureUrl ? '#ffffff' : t.color);
        instancedMeshRef.current!.setColorAt(i, colorArr);
      });
      instancedMeshRef.current.instanceMatrix.needsUpdate = true;
      if (instancedMeshRef.current.instanceColor) instancedMeshRef.current.instanceColor.needsUpdate = true;
    }
  }, [wallTileData, wallTextureUrl, wallColor]);

  return (
    <instancedMesh 
      key={`walls-${wallTileData.length}-${pattern}`}
      ref={instancedMeshRef} 
      args={[geometry as any, null as any, wallTileData.length]}
      material={material}
    />
  );
};

const Walls: React.FC<FloorProps> = ({ config }) => {
  const { room, wallColor } = config;
  const h = room.height;
  const w = room.width;
  const l = room.length;

  return (
    <group>
      {/* Back Wall */}
      <mesh position={[0, h / 2, -l / 2]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial color={wallColor} side={THREE.DoubleSide} />
      </mesh>
      {/* Left Wall */}
      <mesh position={[-w / 2, h / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[l, h]} />
        <meshStandardMaterial color={wallColor} side={THREE.DoubleSide} />
      </mesh>
      {/* Right Wall (Optional for visibility) */}
      <mesh position={[w / 2, h / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[l, h]} />
        <meshStandardMaterial color={wallColor} transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

export const FloorVisualizer: React.FC<FloorProps> = ({ config }) => {
  const roomW = config.room.width || 4;
  const roomL = config.room.length || 4;
  const roomH = config.room.height || 2.5;
  
  const maxDim = Math.max(roomW, roomL, roomH);
  const cameraPos: [number, number, number] = [maxDim * 1.5, maxDim * 1.5, maxDim * 1.5];

  return (
    <div className="w-full h-[600px] bg-slate-900 rounded-2xl overflow-hidden relative border border-slate-800 shadow-2xl">
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <div className="bg-black/50 backdrop-blur-md p-2 rounded text-[10px] text-white border border-white/10 uppercase tracking-widest font-bold">
          3D Room View: {roomW}m x {roomL}m x {roomH}m
        </div>
        <div className="bg-indigo-600/80 backdrop-blur-md p-2 rounded text-[10px] text-white border border-white/10 uppercase tracking-widest font-bold">
          Pattern: {config.pattern}
        </div>
      </div>
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={cameraPos} fov={45} />
        <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2.1} target={[0, roomH / 4, 0]} />
        
        <ambientLight intensity={0.7} />
        <pointLight position={[5, 8, 5]} intensity={1.5} castShadow />
        <spotLight position={[-5, 10, 5]} angle={0.3} penumbra={1} intensity={2} castShadow />
        
        <ErrorBoundary fallback={<mesh><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="red" /></mesh>}>
          <Suspense fallback={
            <mesh>
              <boxGeometry args={[roomW, 0.1, roomL]} />
              <meshStandardMaterial color="#333" wireframe />
            </mesh>
          }>
            <Floor config={config} />
            <WallTiles config={config} />
            <Walls config={config} />
          </Suspense>
        </ErrorBoundary>
        
        {/* Room Outline */}
        <mesh position={[0, roomH / 2, 0]}>
          <boxGeometry args={[roomW, roomH, roomL]} />
          <meshStandardMaterial color="#ffffff" wireframe transparent opacity={0.1} />
        </mesh>
        
        <Grid 
          infiniteGrid 
          fadeDistance={30} 
          fadeStrength={3} 
          cellSize={1} 
          sectionSize={5} 
          sectionColor="#333" 
          cellColor="#111" 
        />
        
        <Environment preset="apartment" />
      </Canvas>
    </div>
  );
};
