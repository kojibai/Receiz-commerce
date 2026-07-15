"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { WILDS_REGION_SIZE } from "./multiplayer-core";
import type { WildsAtlasProjection } from "./wilds-world-atlas";
import type { WildsQualityProfile } from "./wilds-quality-profile";

export function WildsAtlasCanvas({
  projection,
  qualityProfile,
  selectedId,
  reducedMotion,
  onSelect
}: {
  projection: WildsAtlasProjection;
  qualityProfile: WildsQualityProfile;
  selectedId: string | null;
  reducedMotion: boolean;
  onSelect: (landmarkId: string) => void;
}) {
  return (
    <div aria-hidden="true" className="wilds-atlas-canvas">
      <Canvas
        camera={{ fov: 40, near: 0.1, far: 80, position: [0, 9.6, 11.5] }}
        dpr={qualityProfile.dpr}
        frameloop={reducedMotion ? "demand" : "always"}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        shadows={false}
      >
        <color attach="background" args={["#06151c"]} />
        <fog attach="fog" args={["#06151c", 11, 26]} />
        <ambientLight intensity={1.25} />
        <directionalLight color="#fff2a8" intensity={2.2} position={[4, 10, 3]} />
        <pointLight color="#71e8c3" intensity={18} position={[-5, 3, 2]} distance={14} />
        <RegionField projection={projection} />
        <LandmarkBeacons projection={projection} selectedId={selectedId} onSelect={onSelect} />
        <PresenceLights projection={projection} />
        <CurrentPositionBeam />
        <Sparkles
          color="#b9fff0"
          count={reducedMotion ? 12 : Math.round(38 * qualityProfile.particles)}
          opacity={0.45}
          scale={[16, 5, 16]}
          size={1.5}
          speed={reducedMotion ? 0 : 0.2}
        />
        <OrbitControls
          dampingFactor={0.08}
          enableDamping={!reducedMotion}
          enablePan
          maxDistance={19}
          maxPolarAngle={Math.PI / 2.25}
          minDistance={6.8}
          minPolarAngle={0.35}
          panSpeed={0.65}
          rotateSpeed={0.55}
          target={[0, 0, 0]}
          zoomSpeed={0.75}
        />
      </Canvas>
    </div>
  );
}

function RegionField({ projection }: { projection: WildsAtlasProjection }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const matrix = useMemo(() => new THREE.Matrix4(), []);
  const color = useMemo(() => new THREE.Color(), []);

  useLayoutEffect(() => {
    if (!mesh.current) return;
    projection.nodes.forEach((node, index) => {
      const x = (node.regionX - projection.centerRegion.x) * 1.35;
      const z = (node.regionZ - projection.centerRegion.z) * 1.35;
      const height = 0.12 + node.biome.luminosity * 0.24;
      matrix.compose(
        new THREE.Vector3(x, height / 2 - 0.18, z),
        new THREE.Quaternion(),
        new THREE.Vector3(1.24, height, 1.24)
      );
      mesh.current!.setMatrixAt(index, matrix);
      mesh.current!.setColorAt(index, color.set(node.biome.ground.base));
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
  }, [color, matrix, projection]);

  return (
    <instancedMesh args={[undefined, undefined, projection.nodes.length]} ref={mesh}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial metalness={0.08} roughness={0.72} vertexColors />
    </instancedMesh>
  );
}

function LandmarkBeacons({
  projection,
  selectedId,
  onSelect
}: {
  projection: WildsAtlasProjection;
  selectedId: string | null;
  onSelect: (landmarkId: string) => void;
}) {
  return projection.landmarks.map((landmark) => {
    const regionX = landmark.position.x / WILDS_REGION_SIZE;
    const regionZ = landmark.position.z / WILDS_REGION_SIZE;
    const x = (regionX - projection.centerRegion.x) * 1.35;
    const z = (regionZ - projection.centerRegion.z) * 1.35;
    const active = landmark.id === selectedId;
    return (
      <group
        key={landmark.id}
        name={`atlas-${landmark.id}`}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(landmark.id);
        }}
        position={[x, 0.38, z]}
        scale={active ? 1.18 : 1}
      >
        <mesh>
          <octahedronGeometry args={[active ? 0.34 : 0.27, 0]} />
          <meshStandardMaterial
            color={landmark.discovered ? landmark.accent : "#6d8290"}
            emissive={landmark.discovered ? landmark.accent : "#263945"}
            emissiveIntensity={active ? 2.4 : 1.2}
            metalness={0.35}
            roughness={0.25}
          />
        </mesh>
        <mesh position={[0, -0.25, 0]}>
          <cylinderGeometry args={[0.025, 0.08, 0.55, 10]} />
          <meshBasicMaterial color={landmark.accent} transparent opacity={0.7} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[active ? 0.48 : 0.4, 0.025, 8, 30]} />
          <meshBasicMaterial color={landmark.accent} transparent opacity={active ? 0.92 : 0.5} />
        </mesh>
      </group>
    );
  });
}

function PresenceLights({ projection }: { projection: WildsAtlasProjection }) {
  const clusters = useRef<THREE.InstancedMesh>(null);
  const matrix = useMemo(() => new THREE.Matrix4(), []);
  useLayoutEffect(() => {
    if (!clusters.current) return;
    projection.playerClusters.forEach((cluster, index) => {
      const x = (cluster.regionX - projection.centerRegion.x) * 1.35;
      const z = (cluster.regionZ - projection.centerRegion.z) * 1.35;
      const size = 0.08 + Math.min(0.2, cluster.count * 0.012);
      matrix.compose(new THREE.Vector3(x, 0.36, z), new THREE.Quaternion(), new THREE.Vector3(size, size, size));
      clusters.current!.setMatrixAt(index, matrix);
    });
    clusters.current.instanceMatrix.needsUpdate = true;
  }, [matrix, projection]);
  return (
    <instancedMesh args={[undefined, undefined, projection.playerClusters.length]} ref={clusters}>
      <sphereGeometry args={[1, 10, 8]} />
      <meshBasicMaterial color="#72dfff" transparent opacity={0.88} />
    </instancedMesh>
  );
}

function CurrentPositionBeam() {
  return (
    <group name="atlas-current-position">
      <mesh position={[0, 0.48, 0]}>
        <coneGeometry args={[0.16, 0.42, 12]} />
        <meshStandardMaterial color="#ffffff" emissive="#71e8c3" emissiveIntensity={2} />
      </mesh>
      <mesh position={[0, 1.25, 0]}>
        <cylinderGeometry args={[0.012, 0.05, 1.5, 8]} />
        <meshBasicMaterial color="#71e8c3" transparent opacity={0.45} />
      </mesh>
    </group>
  );
}
