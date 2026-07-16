"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { MarketContractDefinition, MarketHazardDefinition } from "./contract-director";
import type { MarketRuntimeState } from "./runtime";

declare global {
  var __WAYFARER_MARKET_DIAGNOSTICS__: undefined | {
    calls: number; triangles: number; geometries: number; textures: number; dpr: number;
  };
}

const palette = {
  canvas: "#07120f", timber: "#5f3d27", brass: "#d5aa52", cloth: "#8e342c",
  clothDark: "#2d5f52", danger: "#ff695d", reward: "#f5d77d", ink: "#17221d",
};

function Diagnostics() {
  const { gl } = useThree();
  useFrame(() => {
    globalThis.__WAYFARER_MARKET_DIAGNOSTICS__ = {
      calls: gl.info.render.calls,
      triangles: gl.info.render.triangles,
      geometries: gl.info.memory.geometries,
      textures: gl.info.memory.textures,
      dpr: gl.getPixelRatio(),
    };
  });
  return null;
}

function CameraFollow({ state }: { state: MarketRuntimeState }) {
  const { camera } = useThree();
  useFrame(() => {
    const desired = new THREE.Vector3(state.player.x * .28, 12.5, 13 + state.player.z * .28);
    camera.position.lerp(desired, .075);
    camera.lookAt(state.player.x * .28, 0, state.player.z * .28);
  });
  return null;
}

function Merchant({ position, color, scale = 1 }: { position: [number, number, number]; color: string; scale?: number }) {
  return <group position={position} scale={scale}>
    <mesh castShadow position={[0, .92, 0]}><capsuleGeometry args={[.27, .8, 5, 10]} /><meshStandardMaterial color={color} roughness={.78} /></mesh>
    <mesh castShadow position={[0, 1.62, 0]}><sphereGeometry args={[.29, 14, 10]} /><meshStandardMaterial color="#7a5540" roughness={.9} /></mesh>
    <mesh castShadow position={[0, 1.78, 0]} rotation={[0, 0, -.06]}><coneGeometry args={[.55, .32, 12]} /><meshStandardMaterial color={palette.ink} roughness={.7} /></mesh>
    <mesh castShadow position={[.38, 1.02, .02]} rotation={[0, 0, -.35]}><boxGeometry args={[.12, .72, .14]} /><meshStandardMaterial color="#7a5540" roughness={.9} /></mesh>
    <mesh position={[0, .02, .04]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[.5, 18]} /><meshBasicMaterial color="#000" transparent opacity={.28} /></mesh>
  </group>;
}

function Canopy({ color, position, rotation = 0 }: { color: string; position: [number, number, number]; rotation?: number }) {
  return <group position={position} rotation={[0, rotation, 0]}>
    <mesh castShadow position={[0, 1.75, 0]}><cylinderGeometry args={[1.55, 1.8, .5, 6]} /><meshStandardMaterial color={color} roughness={.82} /></mesh>
    <mesh castShadow position={[0, 2.08, 0]}><coneGeometry args={[1.58, .75, 6]} /><meshStandardMaterial color={palette.clothDark} roughness={.7} /></mesh>
    {[-1, 1].flatMap((x) => [-1, 1].map((z) => <mesh castShadow key={`${x}:${z}`} position={[x * 1.18, .82, z * 1.18]}><cylinderGeometry args={[.06, .08, 1.65, 8]} /><meshStandardMaterial color={palette.brass} metalness={.5} roughness={.35} /></mesh>))}
    <mesh castShadow receiveShadow position={[0, .55, 0]}><boxGeometry args={[2.5, .16, 1.35]} /><meshStandardMaterial color={palette.timber} roughness={.8} /></mesh>
    <mesh position={[0, .76, .7]}><boxGeometry args={[1.35, .08, .08]} /><meshStandardMaterial color={palette.reward} emissive={palette.brass} emissiveIntensity={.5} /></mesh>
  </group>;
}

function LanternRail() {
  const lanterns = useRef<THREE.Group>(null);
  useFrame(({ clock }) => { if (lanterns.current) lanterns.current.rotation.y = Math.sin(clock.elapsedTime * .22) * .025; });
  return <group ref={lanterns}>
    <mesh castShadow position={[0, 2.7, -3.7]}><boxGeometry args={[11, .12, .12]} /><meshStandardMaterial color={palette.brass} metalness={.65} roughness={.3} /></mesh>
    {[-4.5, -2.25, 0, 2.25, 4.5].map((x) => <group key={x} position={[x, 2.15, -3.7]}>
      <mesh><cylinderGeometry args={[.24, .18, .55, 6]} /><meshPhysicalMaterial color={palette.reward} emissive={palette.reward} emissiveIntensity={1.4} transmission={.2} roughness={.18} /></mesh>
      <pointLight color={palette.reward} distance={3.2} intensity={1.2} />
    </group>)}
  </group>;
}

function Cargo({ position }: { position: { x: number; z: number } }) {
  const root = useRef<THREE.Group>(null);
  useFrame(({ clock }) => { if (root.current) root.current.position.y = .1 + Math.sin(clock.elapsedTime * 1.5) * .04; });
  return <group ref={root} position={[position.x, .1, position.z]}>
    <mesh castShadow><boxGeometry args={[1.1, .8, .85]} /><meshStandardMaterial color="#80603b" roughness={.9} /></mesh>
    <mesh position={[0, 0, .435]}><boxGeometry args={[.15, .82, .03]} /><meshStandardMaterial color={palette.brass} metalness={.5} /></mesh>
    <mesh position={[0, .42, 0]} rotation={[0, 0, Math.PI / 2]}><torusGeometry args={[.2, .035, 8, 16]} /><meshStandardMaterial color={palette.reward} emissive={palette.brass} emissiveIntensity={.45} /></mesh>
  </group>;
}

function Hazard({ hazard, resolved }: { hazard: MarketHazardDefinition; resolved: boolean }) {
  const root = useRef<THREE.Group>(null);
  useFrame(({ clock }) => { if (root.current && !resolved) root.current.rotation.y = clock.elapsedTime * .9; });
  const color = resolved ? "#43544c" : palette.danger;
  return <group ref={root} position={[hazard.position.x, .25, hazard.position.z]}>
    {hazard.kind === "crowd-surge" ? <>
      <mesh castShadow><torusKnotGeometry args={[.48, .14, 48, 8]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={.45} roughness={.4} /></mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}><ringGeometry args={[1.1, 1.24, 28]} /><meshBasicMaterial color={color} transparent opacity={.55} side={THREE.DoubleSide} /></mesh>
    </> : hazard.kind === "gate-snap" ? <>
      <mesh castShadow position={[-.55, .45, 0]}><boxGeometry args={[.18, 1.4, .24]} /><meshStandardMaterial color={color} metalness={.4} /></mesh>
      <mesh castShadow position={[.55, .45, 0]}><boxGeometry args={[.18, 1.4, .24]} /><meshStandardMaterial color={color} metalness={.4} /></mesh>
      <mesh castShadow position={[0, .7, 0]} rotation={[0, 0, .55]}><boxGeometry args={[1.4, .12, .16]} /><meshStandardMaterial color={palette.brass} /></mesh>
    </> : <>
      <mesh castShadow rotation={[.4, .2, 0]}><octahedronGeometry args={[.72, 1]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={.35} roughness={.6} /></mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}><ringGeometry args={[.9, 1.05, 4]} /><meshBasicMaterial color={color} transparent opacity={.6} side={THREE.DoubleSide} /></mesh>
    </>}
  </group>;
}

function CardAvatar({ state }: { state: MarketRuntimeState }) {
  const root = useRef<THREE.Group>(null);
  const card = state.squad.find((value) => value.assetId === state.activeAssetId)!;
  const color = card.element === "Grove" ? "#75d39a" : card.element === "Spark" ? "#ffe065" : card.element === "Tide" ? "#78c9ef" : "#d3b58d";
  useFrame(({ clock }) => { if (root.current) root.current.rotation.y = Math.sin(clock.elapsedTime * 2.2) * .12; });
  return <group ref={root} position={[state.player.x, .42, state.player.z]}>
    <mesh castShadow><capsuleGeometry args={[.28, .62, 6, 12]} /><meshPhysicalMaterial color={color} clearcoat={.55} roughness={.35} /></mesh>
    <mesh castShadow position={[0, .62, 0]}><icosahedronGeometry args={[.34, 1]} /><meshStandardMaterial color={color} roughness={.45} /></mesh>
    <mesh position={[0, .67, .29]}><boxGeometry args={[.34, .07, .035]} /><meshStandardMaterial color="#effff9" emissive={color} emissiveIntensity={.8} /></mesh>
    <mesh position={[0, -.34, 0]} rotation={[Math.PI / 2, 0, 0]}><circleGeometry args={[.48, 24]} /><meshBasicMaterial color="#000" transparent opacity={.35} /></mesh>
    {state.phase === "execution" ? <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[.48, .035, 8, 24]} /><meshBasicMaterial color={color} transparent opacity={.8} /></mesh> : null}
  </group>;
}

function MarketWorld({ contract, state }: { contract: MarketContractDefinition; state: MarketRuntimeState }) {
  const cargo = contract.intelligence.find((node) => node.kind === "cargo")?.position ?? { x: 0, z: 0 };
  const markerMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: palette.reward, emissive: palette.brass, emissiveIntensity: .55, roughness: .35 }), []);
  return <>
    <color attach="background" args={[palette.canvas]} />
    <fog attach="fog" args={[palette.canvas, 10, 27]} />
    <ambientLight intensity={.8} color="#bed7cc" />
    <directionalLight castShadow color="#ffe2a6" intensity={2.4} position={[7, 12, 5]} shadow-mapSize={[1024, 1024]} />
    <pointLight color="#5ca995" intensity={20} distance={14} position={[-6, 3, 4]} />
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[13, 64]} /><meshStandardMaterial color="#16241e" roughness={.96} /></mesh>
    <mesh receiveShadow position={[0, .012, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[3.5, 8.5, 48]} /><meshStandardMaterial color="#26392f" roughness={.92} /></mesh>
    <Canopy color={palette.cloth} position={[-5.5, 0, -4]} rotation={.25} />
    <Canopy color="#315d54" position={[5.4, 0, -3.4]} rotation={-.2} />
    <Canopy color="#784f31" position={[-5.2, 0, 4.2]} rotation={-.35} />
    <Canopy color="#6f3143" position={[5.5, 0, 4.1]} rotation={.3} />
    <Merchant color="#af4338" position={[-5.45, 0, -3.25]} />
    <Merchant color="#426f65" position={[5.25, 0, -2.65]} scale={.92} />
    <Merchant color="#89623d" position={[-4.9, 0, 3.4]} scale={1.08} />
    <LanternRail />
    <Cargo position={cargo} />
    {contract.intelligence.map((node) => <group key={node.id} position={[node.position.x, .08, node.position.z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={markerMaterial}><ringGeometry args={[.52, .68, 20]} /></mesh>
      <mesh position={[0, .42, 0]}><octahedronGeometry args={[.15, 0]} /><meshStandardMaterial color={palette.reward} emissive={palette.brass} emissiveIntensity={.7} /></mesh>
    </group>)}
    {contract.objectives.map((objective) => <group key={objective.id} position={[objective.position.x, 0, objective.position.z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[.75, .9, 28]} /><meshBasicMaterial color={state.objectives.find((value) => value.id === objective.id)?.complete ? "#70d99b" : palette.brass} transparent opacity={.72} side={THREE.DoubleSide} /></mesh>
    </group>)}
    {contract.hazards.map((hazard) => <Hazard hazard={hazard} key={hazard.id} resolved={state.resolvedHazardIds.includes(hazard.id)} />)}
    <CardAvatar state={state} />
    <Sparkles color={palette.reward} count={55} scale={[18, 4, 18]} size={1.3} speed={.18} />
    <CameraFollow state={state} />
    <Diagnostics />
  </>;
}

export function WayfarerMarketScene({ contract, state }: { contract: MarketContractDefinition; state: MarketRuntimeState }) {
  return <Canvas camera={{ fov: 48, near: .1, far: 60, position: [0, 12.5, 13] }} dpr={[1, 1.6]} gl={{ antialias: true }} shadows>
    <MarketWorld contract={contract} state={state} />
  </Canvas>;
}
