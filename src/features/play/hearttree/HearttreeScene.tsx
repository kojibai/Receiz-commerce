"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { WildsCreatureActor } from "../WildsCreatureActor";
import type { PortableCardAsset } from "../portable-card";
import type { HearttreeExpeditionDefinition } from "./expedition-director";
import type { HearttreeRuntimeState } from "./runtime";

export function HearttreeScene({ cards, definition, reducedMotion, runtime }: { cards: readonly PortableCardAsset[]; definition: HearttreeExpeditionDefinition; reducedMotion: boolean; runtime: HearttreeRuntimeState }) {
  return <div className="hearttree-canvas" aria-label="Playable Hearttree expedition chamber">
    <Canvas
      camera={{ fov: 44, near: 0.1, far: 70, position: [0, 5.7, 8.2] }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onCreated={({ gl, scene }) => {
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.12;
        const root = globalThis as typeof globalThis & { __HEARTTREE_DIAGNOSTICS__?: unknown };
        root.__HEARTTREE_DIAGNOSTICS__ = { calls: gl.info.render.calls, triangles: gl.info.render.triangles, geometries: gl.info.memory.geometries, textures: gl.info.memory.textures, objects: scene.children.length, dpr: gl.getPixelRatio() };
      }}
      shadows="soft"
    >
      <HearttreeWorld cards={cards} definition={definition} reducedMotion={reducedMotion} runtime={runtime} />
    </Canvas>
  </div>;
}

function HearttreeWorld({ cards, definition, reducedMotion, runtime }: { cards: readonly PortableCardAsset[]; definition: HearttreeExpeditionDefinition; reducedMotion: boolean; runtime: HearttreeRuntimeState }) {
  const activeCard = cards.find((card) => card.id === runtime.activeAssetId) ?? cards[0]!;
  const actor = runtime.cards[runtime.activeAssetId]!;
  return <>
    <color attach="background" args={["#061712"]} />
    <fog attach="fog" args={["#061712", 10, 28]} />
    <ambientLight intensity={0.54} color="#8bffd0" />
    <directionalLight castShadow intensity={2.1} color="#fff1b0" position={[5, 9, 5]} shadow-mapSize={[1024, 1024]} />
    <pointLight intensity={18} distance={15} color="#63efb4" position={[runtime.objective.position.x, 2, runtime.objective.position.z]} />
    <CameraFollow position={actor.position} reducedMotion={reducedMotion} />
    <WorldFloor />
    <RootArchitecture phase={runtime.phase} />
    <Hazards runtime={runtime} />
    <Objective runtime={runtime} />
    {runtime.phase === "master" ? <RootMaster health={runtime.boss.health / runtime.boss.maxHealth} reducedMotion={reducedMotion} /> : null}
    <group position={[actor.position.x, 0, actor.position.z]} rotation={[0, Math.PI, 0]}>
      <WildsCreatureActor
        accent={activeCard.manifest.variant.traits.palette.accent}
        familyId={activeCard.manifest.familyId}
        formId={activeCard.manifest.formId}
        pose={actor.health <= actor.maxHealth * 0.3 ? "weakened" : runtime.threatActive ? "attack" : "curious"}
        primary={activeCard.manifest.variant.traits.palette.primary}
      />
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.48, 0.62, 36]} /><meshBasicMaterial color="#f6df75" transparent opacity={0.7} /></mesh>
    </group>
    {!reducedMotion ? <Sparkles count={55} scale={[14, 5, 10]} size={1.7} speed={0.18} color="#9effce" opacity={0.5} /> : null}
    <group name={`expedition-${definition.seedDigest.slice(7, 15)}`} />
  </>;
}

function CameraFollow({ position, reducedMotion }: { position: { x: number; z: number }; reducedMotion: boolean }) {
  const { camera } = useThree();
  useFrame(() => {
    const target = new THREE.Vector3(position.x, 5.6, position.z + 7.8);
    camera.position.lerp(target, reducedMotion ? 1 : 0.075);
    camera.lookAt(position.x + 0.7, 0.4, position.z - 0.6);
  });
  return null;
}

function WorldFloor() {
  const markers = useMemo(() => Array.from({ length: 28 }, (_, index) => ({ x: (index % 7) * 2 - 6, z: Math.floor(index / 7) * 2 - 3 })), []);
  return <group name="hearttree-world-layer-play">
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[22, 16, 28, 20]} /><meshStandardMaterial color="#102c20" roughness={0.92} metalness={0.05} /></mesh>
    {markers.map((marker, index) => <mesh key={index} position={[marker.x, 0.012, marker.z]} rotation={[-Math.PI / 2, 0, index * 0.31]}><ringGeometry args={[0.18, 0.22, 6]} /><meshBasicMaterial color={index % 3 ? "#25523b" : "#5c9d6a"} transparent opacity={0.48} /></mesh>)}
  </group>;
}

function RootArchitecture({ phase }: { phase: HearttreeRuntimeState["phase"] }) {
  return <group name="hearttree-world-layer-mid">
    {[-1, 1].map((side) => <group key={side} position={[side * 5.2, 0, -1]} rotation={[0, 0, side * -0.18]}>
      <mesh castShadow position={[0, 2.2, 0]} scale={[1.2, 4.8, 1.2]}><cylinderGeometry args={[0.42, 0.82, 1, 9]} /><meshStandardMaterial color="#28472c" roughness={0.88} /></mesh>
      {[0, 1, 2].map((index) => <mesh castShadow key={index} position={[side * -0.42, 1.1 + index * 1.25, 0]} rotation={[0, 0, side * (0.55 + index * 0.11)]}><cylinderGeometry args={[0.1, 0.22, 2.8, 7]} /><meshStandardMaterial color={index === 1 ? "#4d7142" : "#365b34"} roughness={0.82} /></mesh>)}
    </group>)}
    <mesh castShadow position={[0, 5.4, -4]} rotation={[0, 0, Math.PI / 2]}><torusGeometry args={[4.8, 0.42, 10, 48, Math.PI]} /><meshStandardMaterial color="#3f693d" emissive="#183d25" emissiveIntensity={phase === "master" ? 0.35 : 0.12} roughness={0.78} /></mesh>
    {[-4, -2, 0, 2, 4].map((x) => <mesh castShadow key={x} position={[x, 0.6, -6.5]} scale={[1, 1.2 + Math.abs(x) * 0.1, 1]}><dodecahedronGeometry args={[0.7, 1]} /><meshStandardMaterial color="#183323" roughness={0.96} /></mesh>)}
  </group>;
}

function Hazards({ runtime }: { runtime: HearttreeRuntimeState }) {
  return <group name="hearttree-hazards">{runtime.hazards.map((hazard) => <group key={hazard.id} position={[hazard.position.x, 0, hazard.position.z]}>
    {[0, 1, 2, 3, 4].map((index) => <mesh castShadow key={index} position={[Math.cos(index * 1.256) * 0.28, 0.25, Math.sin(index * 1.256) * 0.28]} rotation={[0.15, index * 1.256, 0]}><coneGeometry args={[0.11, 0.62, 5]} /><meshStandardMaterial color="#a73f32" emissive="#ff4a30" emissiveIntensity={0.55} roughness={0.48} /></mesh>)}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}><ringGeometry args={[hazard.radius, hazard.radius + 0.09, 30]} /><meshBasicMaterial color="#ff795c" transparent opacity={0.75} /></mesh>
  </group>)}</group>;
}

function Objective({ runtime }: { runtime: HearttreeRuntimeState }) {
  const root = useRef<THREE.Group>(null);
  useFrame(({ clock }) => { if (root.current) root.current.rotation.y = clock.elapsedTime * 0.7; });
  return <group ref={root} position={[runtime.objective.position.x, 0.9, runtime.objective.position.z]} name="hearttree-objective">
    <mesh castShadow><octahedronGeometry args={[0.42, 1]} /><meshPhysicalMaterial color="#e8ffaf" emissive="#70e7a5" emissiveIntensity={1.4} roughness={0.22} clearcoat={0.8} /></mesh>
    <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.75, 0.035, 8, 48]} /><meshBasicMaterial color="#e9db70" /></mesh>
  </group>;
}

function RootMaster({ health, reducedMotion }: { health: number; reducedMotion: boolean }) {
  const root = useRef<THREE.Group>(null);
  useFrame(({ clock }) => { if (root.current && !reducedMotion) root.current.rotation.y = Math.sin(clock.elapsedTime * 0.55) * 0.16; });
  return <group ref={root} position={[4.2, 1.1, -1.8]} name="hearttree-root-master">
    <mesh castShadow scale={[1.4, 2.2, 1.1]}><dodecahedronGeometry args={[0.9, 1]} /><meshStandardMaterial color="#533b2c" emissive={health < 0.35 ? "#cb3d2f" : "#2d6c3f"} emissiveIntensity={0.45} roughness={0.78} /></mesh>
    {[-1, 1].map((side) => <mesh castShadow key={side} position={[side * 0.9, 0.7, 0]} rotation={[0, 0, side * -0.55]}><coneGeometry args={[0.28, 1.8, 7]} /><meshStandardMaterial color="#82673b" roughness={0.62} /></mesh>)}
    <mesh position={[0, 0.5, 0.86]}><sphereGeometry args={[0.2, 16, 12]} /><meshStandardMaterial color="#f7df77" emissive="#f7c948" emissiveIntensity={1.6} /></mesh>
  </group>;
}
