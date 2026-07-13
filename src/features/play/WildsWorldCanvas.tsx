"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import {
  creatureCards,
  habitatNodes,
  nearestCreature,
  type CreatureCard,
  type HabitatNode,
  type PlayState,
  type WildsInput
} from "@/features/play/game-state";

export function WildsWorldCanvas({
  state,
  onInput
}: {
  state: PlayState;
  onInput: (input: WildsInput) => void;
}) {
  return (
    <div className="wilds-canvas-wrap">
      <Canvas
        camera={{ fov: 42, near: 0.1, far: 80, position: [4.6, 5.8, 7.2] }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        onCreated={({ gl, size }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.08;
          gl.shadowMap.type = THREE.PCFShadowMap;
          publishWildsDiagnostics(gl, size, state);
        }}
        shadows
      >
        <Suspense fallback={null}>
          <WildsScene state={state} onInput={onInput} />
        </Suspense>
      </Canvas>
    </div>
  );
}

function WildsScene({
  state,
  onInput
}: {
  state: PlayState;
  onInput: (input: WildsInput) => void;
}) {
  const nearest = nearestCreature(state);

  return (
    <>
      <color attach="background" args={["#8fd7ff"]} />
      <fog attach="fog" args={["#91dca7", 10, 24]} />
      <ambientLight intensity={0.78} />
      <directionalLight
        castShadow
        intensity={1.45}
        position={[4, 8, 5]}
        shadow-camera-bottom={-8}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-mapSize-height={1024}
        shadow-mapSize-width={1024}
      />
      <CameraRig player={state.player} />
      <WildsDiagnostics state={state} />
      <Terrain />
      {habitatNodes.map((node) => (
        <Habitat key={node.id} node={node} />
      ))}
      {creatureCards.map((card) => (
        <Creature
          active={state.selectedCardId === card.id}
          card={card}
          discovered={state.discoveredCardIds.includes(card.id)}
          inRange={nearest.card.id === card.id && nearest.distance <= 1.25}
          key={card.id}
          onInput={onInput}
        />
      ))}
      <PlayerMarker position={[state.player.x, 0, state.player.z]} />
      <Sparkles count={54} scale={[8, 2.4, 8]} size={2.1} speed={0.22} color="#fff5b6" />
    </>
  );
}

function CameraRig({ player }: { player: PlayState["player"] }) {
  const target = useMemo(() => new THREE.Vector3(), []);
  const lookAt = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ camera }) => {
    target.set(player.x + 4.6, 5.4, player.z + 6.6);
    lookAt.set(player.x, 0.35, player.z);
    camera.position.lerp(target, 0.08);
    camera.lookAt(lookAt);
  });

  return null;
}

function Terrain() {
  const trees = useMemo(
    () => [
      [-4.2, -2.9, 0.75],
      [-3.7, 2.6, 1.1],
      [-2.2, 3.4, 0.85],
      [-0.4, -3.4, 0.9],
      [1.2, 3.5, 1],
      [2.7, -3.1, 0.8],
      [3.7, 2.8, 1.15],
      [4.3, -0.6, 0.9]
    ] as const,
    []
  );
  const mainTrail = useMemo(
    () => trailRibbonGeometry([
      new THREE.Vector3(-4.5, 0.08, -2.7),
      new THREE.Vector3(-2.4, 0.08, -1.3),
      new THREE.Vector3(-0.5, 0.08, 0.1),
      new THREE.Vector3(1.7, 0.08, 1.25),
      new THREE.Vector3(4.35, 0.08, 2.4)
    ], 0.82, 0.035),
    []
  );
  const crossingTrail = useMemo(
    () => trailRibbonGeometry([
      new THREE.Vector3(-3.7, 0.115, 2.8),
      new THREE.Vector3(-1.9, 0.115, 1.65),
      new THREE.Vector3(0.15, 0.115, 0.15),
      new THREE.Vector3(1.75, 0.115, -1.7),
      new THREE.Vector3(3.45, 0.115, -3.15)
    ], 0.58, 0.045),
    []
  );

  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[6.15, 96]} />
        <meshStandardMaterial color="#69ad5b" roughness={0.95} />
      </mesh>
      <mesh renderOrder={1}>
        <primitive attach="geometry" object={mainTrail} />
        <meshStandardMaterial color="#f1d889" roughness={0.86} polygonOffset polygonOffsetFactor={-2} />
      </mesh>
      <mesh renderOrder={2}>
        <primitive attach="geometry" object={crossingTrail} />
        <meshStandardMaterial color="#d9c16d" roughness={0.9} polygonOffset polygonOffsetFactor={-3} />
      </mesh>
      <mesh position={[0, -0.17, 0]}>
        <cylinderGeometry args={[6.2, 6.65, 0.24, 96]} />
        <meshStandardMaterial color="#456d3d" roughness={1} />
      </mesh>
      {trees.map(([x, z, scale], index) => (
        <Tree key={`${x}-${z}-${index}`} position={[x, 0, z]} scale={scale} />
      ))}
    </group>
  );
}

function trailRibbonGeometry(controlPoints: THREE.Vector3[], width: number, y: number) {
  const points = new THREE.CatmullRomCurve3(controlPoints).getPoints(64);
  const positions: number[] = [];
  const indices: number[] = [];

  points.forEach((point, index) => {
    const previous = points[Math.max(0, index - 1)];
    const next = points[Math.min(points.length - 1, index + 1)];
    const tangent = next.clone().sub(previous).normalize();
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).multiplyScalar(width / 2);
    positions.push(point.x + normal.x, y, point.z + normal.z);
    positions.push(point.x - normal.x, y, point.z - normal.z);
    if (index < points.length - 1) {
      const start = index * 2;
      indices.push(start, start + 2, start + 1, start + 2, start + 3, start + 1);
    }
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function Tree({
  position,
  scale
}: {
  position: readonly [number, number, number];
  scale: number;
}) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow position={[0, 0.32, 0]}>
        <cylinderGeometry args={[0.09, 0.13, 0.68, 8]} />
        <meshStandardMaterial color="#7a5637" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0, 0.84, 0]}>
        <coneGeometry args={[0.48, 0.94, 10]} />
        <meshStandardMaterial color="#2e7b48" roughness={0.78} />
      </mesh>
      <mesh castShadow position={[0.18, 0.64, -0.06]}>
        <sphereGeometry args={[0.28, 12, 10]} />
        <meshStandardMaterial color="#55a857" roughness={0.82} />
      </mesh>
    </group>
  );
}

function Habitat({ node }: { node: HabitatNode }) {
  const tone = habitatTone(node.tone);

  return (
    <group position={node.position}>
      <mesh receiveShadow position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.64, 32]} />
        <meshStandardMaterial color={tone.base} roughness={0.72} emissive={tone.glow} emissiveIntensity={0.08} />
      </mesh>
      <mesh position={[0, 0.09, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.58, 0.035, 10, 40]} />
        <meshStandardMaterial color={tone.ring} roughness={0.48} emissive={tone.ring} emissiveIntensity={0.24} />
      </mesh>
    </group>
  );
}

function Creature({
  active,
  card,
  discovered,
  inRange,
  onInput
}: {
  active: boolean;
  card: CreatureCard;
  discovered: boolean;
  inRange: boolean;
  onInput: (input: WildsInput) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.position.y = 0.5 + Math.sin(clock.elapsedTime * 1.8 + card.position[0]) * 0.06;
    groupRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.85 + card.position[2]) * 0.18;
  });

  return (
      <group
        ref={groupRef}
        position={[card.position[0], 0.42, card.position[2]]}
        onClick={(event) => {
          event.stopPropagation();
          onInput(discovered ? { type: "select-card", cardId: card.id } : { type: "discover" });
        }}
      >
        <mesh castShadow>
          <sphereGeometry args={[0.36, 24, 18]} />
          <meshStandardMaterial color={card.color} roughness={0.58} emissive={card.color} emissiveIntensity={0.08} />
        </mesh>
        <mesh castShadow position={[-0.22, 0.24, -0.02]}>
          <sphereGeometry args={[0.14, 16, 12]} />
          <meshStandardMaterial color={card.accent} roughness={0.58} />
        </mesh>
        <mesh castShadow position={[0.22, 0.24, -0.02]}>
          <sphereGeometry args={[0.14, 16, 12]} />
          <meshStandardMaterial color={card.accent} roughness={0.58} />
        </mesh>
        <mesh position={[-0.12, 0.08, 0.31]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color="#142115" roughness={0.35} />
        </mesh>
        <mesh position={[0.12, 0.08, 0.31]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color="#142115" roughness={0.35} />
        </mesh>
        <CreatureDetails cardId={card.id} color={card.color} accent={card.accent} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.34, 0]}>
          <torusGeometry args={[0.46, active || inRange ? 0.035 : 0.02, 8, 36]} />
          <meshStandardMaterial
            color={active ? "#fff2a8" : inRange ? "#ffffff" : "#2b6c47"}
            emissive={active || inRange ? "#f7c948" : "#000000"}
            emissiveIntensity={active || inRange ? 0.44 : 0}
            transparent
            opacity={discovered ? 0.95 : 0.68}
          />
        </mesh>
        {discovered ? (
          <Html center distanceFactor={8} position={[0, 0.82, 0]} className="wilds-world-label">
            <span>{card.name}</span>
          </Html>
        ) : null}
      </group>
  );
}

function CreatureDetails({ cardId, color, accent }: { cardId: string; color: string; accent: string }) {
  if (cardId === "mintcub") {
    return (
      <group>
        <mesh castShadow position={[-0.28, 0.36, -0.02]} rotation={[0, 0, -0.48]} scale={[0.55, 1, 0.38]}>
          <coneGeometry args={[0.18, 0.48, 5]} />
          <meshStandardMaterial color={accent} roughness={0.72} />
        </mesh>
        <mesh castShadow position={[0.28, 0.36, -0.02]} rotation={[0, 0, 0.48]} scale={[0.55, 1, 0.38]}>
          <coneGeometry args={[0.18, 0.48, 5]} />
          <meshStandardMaterial color={accent} roughness={0.72} />
        </mesh>
        <mesh castShadow position={[0, 0.43, -0.02]} rotation={[0.12, 0, 0.08]} scale={[0.45, 1, 0.22]}>
          <octahedronGeometry args={[0.22, 0]} />
          <meshStandardMaterial color="#d9ff9f" roughness={0.6} emissive={color} emissiveIntensity={0.12} />
        </mesh>
      </group>
    );
  }

  if (cardId === "voltray") {
    return (
      <group>
        {[-1, 1].map((side) => (
          <group key={side} position={[side * 0.42, 0.08, -0.05]} rotation={[0.2, 0, side * -0.42]}>
            <mesh castShadow scale={[0.35, 0.85, 0.14]}>
              <tetrahedronGeometry args={[0.42, 0]} />
              <meshStandardMaterial color={accent} roughness={0.38} metalness={0.2} emissive={accent} emissiveIntensity={0.18} />
            </mesh>
            <mesh castShadow position={[side * 0.12, -0.18, 0]} scale={[0.25, 0.56, 0.12]}>
              <tetrahedronGeometry args={[0.34, 0]} />
              <meshStandardMaterial color="#fff1a8" roughness={0.4} />
            </mesh>
          </group>
        ))}
        <mesh castShadow position={[0, 0.5, 0]} rotation={[0, 0, Math.PI]}>
          <coneGeometry args={[0.09, 0.38, 5]} />
          <meshStandardMaterial color="#fff1a8" emissive={accent} emissiveIntensity={0.22} />
        </mesh>
      </group>
    );
  }

  if (cardId === "ledgerfox") {
    return (
      <group>
        {[-1, 1].map((side) => (
          <mesh key={side} castShadow position={[side * 0.24, 0.38, -0.03]} rotation={[0, 0, side * -0.18]} scale={[0.7, 1.35, 0.48]}>
            <coneGeometry args={[0.16, 0.42, 4]} />
            <meshStandardMaterial color={accent} roughness={0.58} />
          </mesh>
        ))}
        <group position={[0.35, -0.08, -0.24]} rotation={[0.2, 0.2, -0.68]}>
          <mesh castShadow>
            <capsuleGeometry args={[0.09, 0.52, 6, 10]} />
            <meshStandardMaterial color={color} roughness={0.7} />
          </mesh>
          <mesh castShadow position={[0, 0.32, 0]}>
            <sphereGeometry args={[0.12, 10, 8]} />
            <meshStandardMaterial color="#ecfff8" roughness={0.55} />
          </mesh>
        </group>
      </group>
    );
  }

  if (cardId === "titanseal") {
    return (
      <group>
        <mesh castShadow position={[-0.25, -0.02, 0.28]} rotation={[0.35, 0, 0.18]}>
          <coneGeometry args={[0.075, 0.38, 8]} />
          <meshStandardMaterial color="#fff2d4" roughness={0.42} />
        </mesh>
        <mesh castShadow position={[0.25, -0.02, 0.28]} rotation={[0.35, 0, -0.18]}>
          <coneGeometry args={[0.075, 0.38, 8]} />
          <meshStandardMaterial color="#fff2d4" roughness={0.42} />
        </mesh>
        {[-0.22, 0, 0.22].map((x, index) => (
          <mesh key={x} castShadow position={[x, 0.43 + Math.abs(x) * 0.25, -0.02]} rotation={[0, 0, x * 0.65]}>
            <coneGeometry args={[0.09, index === 1 ? 0.42 : 0.32, 5]} />
            <meshStandardMaterial color={accent} roughness={0.48} metalness={0.18} emissive={accent} emissiveIntensity={0.12} />
          </mesh>
        ))}
      </group>
    );
  }

  return null;
}

function WildsDiagnostics({ state }: { state: PlayState }) {
  const { camera, gl, scene, size } = useThree();
  const outputRef = useRef<HTMLOutputElement>(null);

  useEffect(() => {
    const sample = () => {
    const extra = {
      camera: { position: camera.position.toArray(), fov: camera instanceof THREE.PerspectiveCamera ? camera.fov : null },
      scene: { children: scene.children.length }
    };
    publishWildsDiagnostics(gl, size, state, extra);
    if (outputRef.current) {
      outputRef.current.dataset.snapshot = JSON.stringify({
        canvas: { width: size.width, height: size.height, dpr: gl.getPixelRatio() },
        render: gl.info.render,
        memory: gl.info.memory,
        state: { player: state.player, missionProgress: state.missionProgress, energy: state.energy, combo: state.combo },
        ...extra
      });
    }
    };
    sample();
    const interval = window.setInterval(sample, 500);
    return () => window.clearInterval(interval);
  }, [camera, gl, scene, size, state]);

  return (
    <Html className="wilds-diagnostics-anchor">
      <output
        data-snapshot={JSON.stringify({
          canvas: { width: size.width, height: size.height, dpr: gl.getPixelRatio() },
          render: gl.info.render,
          memory: gl.info.memory,
          state: { player: state.player, missionProgress: state.missionProgress, energy: state.energy, combo: state.combo }
        })}
        data-three-game-diagnostics
        ref={outputRef}
      />
    </Html>
  );
}

function publishWildsDiagnostics(
  gl: THREE.WebGLRenderer,
  size: { width: number; height: number },
  state: PlayState,
  extra: Record<string, unknown> = {}
) {
  const diagnostics = {
    renderer: gl.info,
    canvas: {
      cssWidth: size.width,
      cssHeight: size.height,
      drawingBufferWidth: gl.domElement.width,
      drawingBufferHeight: gl.domElement.height,
      dpr: gl.getPixelRatio()
    },
    state: {
      player: state.player,
      selectedCardId: state.selectedCardId,
      discovered: state.discoveredCardIds.length,
      missionProgress: state.missionProgress,
      energy: state.energy,
      combo: state.combo
    },
    ...extra
  };
  (window as typeof window & { __THREE_GAME_DIAGNOSTICS__?: unknown }).__THREE_GAME_DIAGNOSTICS__ = diagnostics;
  gl.domElement.dataset.threeGameDiagnostics = JSON.stringify({
    canvas: diagnostics.canvas,
    state: diagnostics.state,
    render: {
      calls: gl.info.render.calls,
      triangles: gl.info.render.triangles,
      points: gl.info.render.points,
      lines: gl.info.render.lines
    },
    memory: gl.info.memory,
    ...extra
  });
}

function PlayerMarker({ position }: { position: readonly [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = Math.sin(clock.elapsedTime * 1.25) * 0.16;
  });

  return (
    <group ref={groupRef} position={[position[0], 0.42, position[2]]}>
      <mesh castShadow>
        <capsuleGeometry args={[0.2, 0.48, 8, 18]} />
        <meshStandardMaterial color="#ffffff" roughness={0.5} emissive="#37d688" emissiveIntensity={0.12} />
      </mesh>
      <mesh castShadow position={[0, 0.46, 0.02]}>
        <sphereGeometry args={[0.22, 18, 14]} />
        <meshStandardMaterial color="#f7c948" roughness={0.52} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.38, 0]}>
        <torusGeometry args={[0.48, 0.025, 8, 36]} />
        <meshStandardMaterial color="#ffffff" emissive="#37d688" emissiveIntensity={0.46} />
      </mesh>
    </group>
  );
}

function habitatTone(tone: HabitatNode["tone"]) {
  if (tone === "spark") return { base: "#ff9f6b", ring: "#ffd15c", glow: "#ff7466" };
  if (tone === "trade") return { base: "#62c8ff", ring: "#a7efff", glow: "#62c8ff" };
  if (tone === "reward") return { base: "#f7c948", ring: "#fff2a8", glow: "#f7c948" };
  if (tone === "gate") return { base: "#6c8142", ring: "#c7ec5a", glow: "#c7ec5a" };
  return { base: "#37d688", ring: "#b8ffd9", glow: "#37d688" };
}
