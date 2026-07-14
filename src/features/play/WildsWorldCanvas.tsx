"use client";

import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import {
  creatureCards,
  type CreatureCard,
  type PlayState
} from "@/features/play/game-state";
import { creatureForm } from "@/features/play/creature-catalog";
import type { HotspotCover } from "@/features/play/hidden-hotspots";
import type { WildsPresence } from "@/features/play/multiplayer-core";

export function WildsWorldCanvas({
  state,
  avatarStyle,
  remotePlayers,
  searchEnabled,
  onSelectPlayer,
  onSearchPoint
}: {
  state: PlayState;
  avatarStyle: "female" | "male";
  remotePlayers: WildsPresence[];
  searchEnabled: boolean;
  onSelectPlayer: (player: WildsPresence | null) => void;
  onSearchPoint: (point: { x: number; z: number }) => void;
}) {
  return (
    <div className={`wilds-canvas-wrap${searchEnabled ? " search-armed" : ""}`}>
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
          <WildsScene state={state} avatarStyle={avatarStyle} remotePlayers={remotePlayers} searchEnabled={searchEnabled} onSelectPlayer={onSelectPlayer} onSearchPoint={onSearchPoint} />
        </Suspense>
      </Canvas>
    </div>
  );
}

function WildsScene({
  state,
  avatarStyle,
  remotePlayers,
  searchEnabled,
  onSelectPlayer,
  onSearchPoint
}: {
  state: PlayState;
  avatarStyle: "female" | "male";
  remotePlayers: WildsPresence[];
  searchEnabled: boolean;
  onSelectPlayer: (player: WildsPresence | null) => void;
  onSearchPoint: (point: { x: number; z: number }) => void;
}) {
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
      <CameraRig encounter={state.encounter} />
      <WildsDiagnostics state={state} />
      <SearchableTerrain player={state.player} enabled={searchEnabled} onSearchPoint={onSearchPoint} />
      <EncounterSequence state={state} />
      {remotePlayers.map((player) => <RemoteExplorer key={player.playerId} player={player} localPlayer={state.player} onSelect={onSelectPlayer} />)}
      <ExplorerAvatar style={avatarStyle} worldPosition={state.player} />
      <Sparkles count={54} scale={[8, 2.4, 8]} size={2.1} speed={0.22} color="#fff5b6" />
    </>
  );
}

function RemoteExplorer({
  player,
  localPlayer,
  onSelect
}: {
  player: WildsPresence;
  localPlayer: PlayState["player"];
  onSelect: (player: WildsPresence) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const target = useRef(new THREE.Vector3(player.x - localPlayer.x, 0, player.z - localPlayer.z));
  useEffect(() => {
    target.current.set(player.x - localPlayer.x, 0, player.z - localPlayer.z);
  }, [localPlayer.x, localPlayer.z, player.x, player.z]);
  useFrame(() => {
    group.current?.position.lerp(target.current, 0.18);
  });
  return (
    <group
      onClick={(event) => {
        event.stopPropagation();
        onSelect(player);
      }}
      position={[player.x - localPlayer.x, 0, player.z - localPlayer.z]}
      ref={group}
    >
      <ExplorerAvatar style={player.style} worldPosition={{ x: player.x, z: player.z }} />
      <mesh position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.48, 0.04, 8, 32]} />
        <meshStandardMaterial color={player.practice ? "#f7c948" : "#6ef0c9"} emissive={player.practice ? "#f7c948" : "#37d688"} emissiveIntensity={0.62} />
      </mesh>
      <Html center className="wilds-remote-nameplate" distanceFactor={8} position={[0, 1.42, 0]} zIndexRange={[12, 0]}>
        <span>{player.handle}</span><small>{player.activeCard.name}</small>
      </Html>
    </group>
  );
}

function CameraRig({ encounter }: { encounter: PlayState["encounter"] }) {
  const target = useMemo(() => new THREE.Vector3(), []);
  const lookAt = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ camera, clock }) => {
    const hot = encounter.phase === "hint" && encounter.proximity === "hot";
    const tremor = hot ? Math.sin(clock.elapsedTime * 13) * 0.025 : 0;
    target.set(4.6 + tremor, 5.4 + Math.abs(tremor) * 0.45, 6.6);
    lookAt.set(0, 0.35, 0);
    camera.position.lerp(target, 0.08);
    camera.lookAt(lookAt);
  });

  return null;
}

const WORLD_TILE_SIZE = 12;
const STREAM_RADIUS = 2;

function SearchableTerrain({
  player,
  enabled,
  onSearchPoint
}: {
  player: PlayState["player"];
  enabled: boolean;
  onSearchPoint: (point: { x: number; z: number }) => void;
}) {
  return (
    <group
      onClick={(event) => {
        if (!enabled) return;
        event.stopPropagation();
        onSearchPoint({ x: player.x + event.point.x, z: player.z + event.point.z });
      }}
    >
      <StreamedTerrain player={player} />
    </group>
  );
}

function StreamedTerrain({ player }: { player: PlayState["player"] }) {
  const centerX = Math.floor(player.x / WORLD_TILE_SIZE);
  const centerZ = Math.floor(player.z / WORLD_TILE_SIZE);
  const tiles = useMemo(() => {
    const result: Array<{ key: string; tileX: number; tileZ: number; tone: string }> = [];
    for (let dz = -STREAM_RADIUS; dz <= STREAM_RADIUS; dz += 1) {
      for (let dx = -STREAM_RADIUS; dx <= STREAM_RADIUS; dx += 1) {
        const tileX = centerX + dx;
        const tileZ = centerZ + dz;
        result.push({
          key: `${tileX}:${tileZ}`,
          tileX,
          tileZ,
          tone: seededUnit(tileX, tileZ, 5) > 0.5 ? "#69ad5b" : "#63a957"
        });
      }
    }
    return result;
  }, [centerX, centerZ]);

  return (
    <group>
      {tiles.map((tile) => (
        <mesh
          key={tile.key}
          receiveShadow
          position={[
            tile.tileX * WORLD_TILE_SIZE + WORLD_TILE_SIZE / 2 - player.x,
            -0.03,
            tile.tileZ * WORLD_TILE_SIZE + WORLD_TILE_SIZE / 2 - player.z
          ]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[WORLD_TILE_SIZE + 0.05, WORLD_TILE_SIZE + 0.05]} />
          <meshStandardMaterial color={tile.tone} roughness={0.96} />
        </mesh>
      ))}
      <WorldTrails player={player} />
      <InstancedForest player={player} tiles={tiles} />
      <InstancedGroundCover player={player} tiles={tiles} />
    </group>
  );
}

function WorldTrails({ player }: { player: PlayState["player"] }) {
  const offsetX = -(((player.x % WORLD_TILE_SIZE) + WORLD_TILE_SIZE) % WORLD_TILE_SIZE);
  const offsetZ = -(((player.z % WORLD_TILE_SIZE) + WORLD_TILE_SIZE) % WORLD_TILE_SIZE);
  return (
    <group position={[offsetX, 0.035, offsetZ]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[WORLD_TILE_SIZE * 5, 0.72]} />
        <meshStandardMaterial color="#ead285" roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
        <planeGeometry args={[WORLD_TILE_SIZE * 5, 0.56]} />
        <meshStandardMaterial color="#d9c16d" roughness={0.92} />
      </mesh>
    </group>
  );
}

function InstancedForest({
  player,
  tiles
}: {
  player: PlayState["player"];
  tiles: Array<{ key: string; tileX: number; tileZ: number }>;
}) {
  const trunks = useRef<THREE.InstancedMesh>(null);
  const crowns = useRef<THREE.InstancedMesh>(null);
  const treeData = useMemo(() => tiles.flatMap((tile) => [0, 1].map((slot) => ({
    x: tile.tileX * WORLD_TILE_SIZE + 1.7 + seededUnit(tile.tileX, tile.tileZ, slot) * 8.6,
    z: tile.tileZ * WORLD_TILE_SIZE + 1.4 + seededUnit(tile.tileZ, tile.tileX, slot + 11) * 9,
    scale: 0.85 + seededUnit(tile.tileX, tile.tileZ, slot + 23) * 0.68
  }))), [tiles]);

  useLayoutEffect(() => {
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    treeData.forEach((tree, index) => {
      scale.set(tree.scale, tree.scale, tree.scale);
      matrix.compose(new THREE.Vector3(tree.x - player.x, 0.34, tree.z - player.z), quaternion, scale);
      trunks.current?.setMatrixAt(index, matrix);
      matrix.compose(new THREE.Vector3(tree.x - player.x, 1.02 * tree.scale, tree.z - player.z), quaternion, scale);
      crowns.current?.setMatrixAt(index, matrix);
    });
    if (trunks.current) trunks.current.instanceMatrix.needsUpdate = true;
    if (crowns.current) crowns.current.instanceMatrix.needsUpdate = true;
  }, [player.x, player.z, treeData]);

  return (
    <group>
      <instancedMesh castShadow args={[undefined, undefined, treeData.length]} ref={trunks}>
        <cylinderGeometry args={[0.09, 0.14, 0.68, 7]} />
        <meshStandardMaterial color="#765135" roughness={0.92} />
      </instancedMesh>
      <instancedMesh castShadow args={[undefined, undefined, treeData.length]} ref={crowns}>
        <coneGeometry args={[0.48, 1.05, 9]} />
        <meshStandardMaterial color="#2e7b48" roughness={0.8} />
      </instancedMesh>
    </group>
  );
}

function InstancedGroundCover({
  player,
  tiles
}: {
  player: PlayState["player"];
  tiles: Array<{ key: string; tileX: number; tileZ: number }>;
}) {
  const bushes = useRef<THREE.InstancedMesh>(null);
  const rocks = useRef<THREE.InstancedMesh>(null);
  const flowers = useRef<THREE.InstancedMesh>(null);
  const bushData = useMemo(() => tiles.flatMap((tile) => [0, 1, 2, 3].map((slot) => ({
    x: tile.tileX * WORLD_TILE_SIZE + 0.8 + seededUnit(tile.tileX, tile.tileZ, slot + 41) * 10.4,
    z: tile.tileZ * WORLD_TILE_SIZE + 0.8 + seededUnit(tile.tileZ, tile.tileX, slot + 53) * 10.4,
    scale: 0.42 + seededUnit(tile.tileX, tile.tileZ, slot + 67) * 0.38
  }))), [tiles]);
  const rockData = useMemo(() => tiles.flatMap((tile) => [0, 1].map((slot) => ({
    x: tile.tileX * WORLD_TILE_SIZE + 1 + seededUnit(tile.tileX, tile.tileZ, slot + 79) * 10,
    z: tile.tileZ * WORLD_TILE_SIZE + 1 + seededUnit(tile.tileZ, tile.tileX, slot + 91) * 10,
    scale: 0.18 + seededUnit(tile.tileX, tile.tileZ, slot + 103) * 0.24
  }))), [tiles]);
  const flowerData = useMemo(() => tiles.flatMap((tile) => [0, 1, 2].map((slot) => ({
    x: tile.tileX * WORLD_TILE_SIZE + 0.6 + seededUnit(tile.tileX, tile.tileZ, slot + 113) * 10.8,
    z: tile.tileZ * WORLD_TILE_SIZE + 0.6 + seededUnit(tile.tileZ, tile.tileX, slot + 127) * 10.8,
    scale: 0.12 + seededUnit(tile.tileX, tile.tileZ, slot + 139) * 0.11
  }))), [tiles]);

  useLayoutEffect(() => {
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    const place = (
      mesh: THREE.InstancedMesh | null,
      items: Array<{ x: number; z: number; scale: number }>,
      y: number,
      yScale = 1
    ) => {
      items.forEach((item, index) => {
        scale.set(item.scale, item.scale * yScale, item.scale);
        matrix.compose(new THREE.Vector3(item.x - player.x, y, item.z - player.z), quaternion, scale);
        mesh?.setMatrixAt(index, matrix);
      });
      if (mesh) mesh.instanceMatrix.needsUpdate = true;
    };
    place(bushes.current, bushData, 0.22, 0.78);
    place(rocks.current, rockData, 0.09, 0.62);
    place(flowers.current, flowerData, 0.11, 1.7);
  }, [bushData, flowerData, player.x, player.z, rockData]);

  return (
    <group>
      <instancedMesh castShadow args={[undefined, undefined, bushData.length]} ref={bushes}>
        <dodecahedronGeometry args={[0.58, 1]} />
        <meshStandardMaterial color="#3f9551" roughness={0.9} />
      </instancedMesh>
      <instancedMesh castShadow receiveShadow args={[undefined, undefined, rockData.length]} ref={rocks}>
        <dodecahedronGeometry args={[0.68, 0]} />
        <meshStandardMaterial color="#879083" roughness={0.97} />
      </instancedMesh>
      <instancedMesh args={[undefined, undefined, flowerData.length]} ref={flowers}>
        <coneGeometry args={[0.32, 0.72, 5]} />
        <meshStandardMaterial color="#ffd15c" emissive="#ff8dad" emissiveIntensity={0.18} roughness={0.72} />
      </instancedMesh>
    </group>
  );
}

function seededUnit(x: number, z: number, salt: number) {
  const value = Math.sin(x * 127.1 + z * 311.7 + salt * 74.7) * 43758.5453123;
  return value - Math.floor(value);
}

function Creature({ card }: { card: CreatureCard }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.position.y = 0.5 + Math.sin(clock.elapsedTime * 1.8 + card.position[0]) * 0.06;
    groupRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.85 + card.position[2]) * 0.18;
  });

  return (
      <group ref={groupRef} position={[card.position[0], 0.42, card.position[2]]}>
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
          <torusGeometry args={[0.46, 0.035, 8, 36]} />
          <meshStandardMaterial
            color="#fff2a8"
            emissive="#f7c948"
            emissiveIntensity={0.44}
            transparent
            opacity={0.95}
          />
        </mesh>
        <Html center distanceFactor={8} position={[0, 0.82, 0]} className="wilds-world-label">
          <span>{card.name}</span>
        </Html>
      </group>
  );
}

function EncounterSequence({ state }: { state: PlayState }) {
  const encounter = state.encounter;
  if (encounter.phase === "idle") return null;
  const position: [number, number, number] = [
    encounter.searchPoint.x - state.player.x,
    0.04,
    encounter.searchPoint.z - state.player.z
  ];
  if (encounter.phase === "searching") {
    return <SearchPulse hint={false} position={position} />;
  }
  if (encounter.phase === "hint") {
    return (
      <>
        <SearchPulse hint position={position} />
        <RustlingClue encounter={encounter} player={state.player} />
      </>
    );
  }
  const card = creatureCards.find((candidate) => candidate.id === encounter.familyId);
  if (!card || !encounter.cover) return null;
  const localCard: CreatureCard = { ...card, position: [0, 0, 0] };
  return (
    <group position={position}>
      <SearchPulse hint position={[0, 0, 0]} />
      <HabitatCover cover={encounter.cover} open={encounter.phase !== "emerging"} />
      <group scale={encounter.phase === "capsule" ? 0.68 : encounter.phase === "sealed" || encounter.phase === "revealed" ? 0.01 : 1}>
        <Creature card={localCard} />
      </group>
      {encounter.phase === "capsule" || encounter.phase === "sealed" || encounter.phase === "revealed" ? (
        <CaptureCapsule sealed={encounter.phase !== "capsule"} />
      ) : null}
    </group>
  );
}

function RustlingClue({
  encounter,
  player
}: {
  encounter: Exclude<PlayState["encounter"], { phase: "idle" }>;
  player: PlayState["player"];
}) {
  const ref = useRef<THREE.Group>(null);
  const hot = encounter.proximity === "hot";
  const distance = encounter.distance ?? 0;
  const direction = encounter.direction ?? { x: 0, z: 0 };
  const position: [number, number, number] = [
    encounter.searchPoint.x + direction.x * distance - player.x,
    0.03,
    encounter.searchPoint.z + direction.z * distance - player.z
  ];

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const energy = hot ? 1 : 0.55;
    ref.current.rotation.y = Math.sin(clock.elapsedTime * (hot ? 15 : 9)) * 0.12 * energy;
    ref.current.position.y = 0.03 + Math.abs(Math.sin(clock.elapsedTime * 7)) * 0.045 * energy;
    const pulse = 1 + Math.sin(clock.elapsedTime * 6) * 0.035 * energy;
    ref.current.scale.setScalar(pulse);
  });

  if (!encounter.cover) return null;
  return (
    <group ref={ref} position={position}>
      <HabitatCover cover={encounter.cover} open={false} />
      <Sparkles
        count={hot ? 18 : 9}
        scale={hot ? [1.45, 1.05, 1.45] : [1.05, 0.7, 1.05]}
        size={hot ? 4 : 2.4}
        speed={hot ? 1.1 : 0.55}
        color={hot ? "#fff0a6" : "#d8fff2"}
      />
    </group>
  );
}

function SearchPulse({ hint, position }: { hint: boolean; position: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const wave = 0.8 + (clock.elapsedTime % 1) * 0.65;
    ref.current.scale.setScalar(wave);
    ref.current.rotation.y = clock.elapsedTime * 0.7;
  });
  return (
    <group ref={ref} position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.56, hint ? 0.045 : 0.028, 8, 48]} />
        <meshStandardMaterial color={hint ? "#fff2a8" : "#d8fff2"} emissive={hint ? "#f7c948" : "#37d688"} emissiveIntensity={0.75} transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

function HabitatCover({ cover, open }: { cover: HotspotCover; open: boolean }) {
  const colors: Record<string, string> = {
    grass: "#2f8d51", flowers: "#ff8dad", tree: "#236b43", rock: "#7f827d",
    cave: "#3b3446", water: "#45aee7", ruin: "#b49b75", energy: "#f7c948"
  };
  return (
    <group rotation={[0, open ? 0.62 : 0, open ? -0.24 : 0]}>
      {[-1, -0.5, 0, 0.5, 1].map((offset, index) => (
        <mesh key={offset} castShadow position={[offset * 0.25, 0.2 + Math.abs(offset) * 0.08, index % 2 ? -0.1 : 0.08]} rotation={[0.12, offset * 0.4, offset * -0.32]}>
          {cover === "rock" || cover === "cave" || cover === "ruin" ? <dodecahedronGeometry args={[0.24, 0]} /> : <coneGeometry args={[0.15, 0.52, cover === "water" ? 8 : 5]} />}
          <meshStandardMaterial color={colors[String(cover)] ?? colors.grass} roughness={0.78} metalness={cover === "energy" ? 0.24 : 0} emissive={cover === "energy" ? "#f7c948" : "#000000"} emissiveIntensity={0.28} />
        </mesh>
      ))}
    </group>
  );
}

function CaptureCapsule({ sealed }: { sealed: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.elapsedTime * (sealed ? 0.7 : 2.4);
    ref.current.position.y = 0.7 + Math.sin(clock.elapsedTime * 3) * (sealed ? 0.04 : 0.1);
  });
  return (
    <group ref={ref} scale={sealed ? 0.9 : 1.08}>
      <mesh castShadow>
        <sphereGeometry args={[0.62, 28, 20]} />
        <meshPhysicalMaterial color="#f7fff9" roughness={0.18} metalness={0.18} transmission={sealed ? 0.05 : 0.42} transparent opacity={sealed ? 0.94 : 0.7} clearcoat={1} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.61, 0.075, 12, 48]} />
        <meshStandardMaterial color="#171311" metalness={0.55} roughness={0.28} />
      </mesh>
      <mesh position={[0, 0, 0.62]}>
        <cylinderGeometry args={[0.12, 0.12, 0.08, 24]} />
        <meshStandardMaterial color={sealed ? "#37d688" : "#f7c948"} emissive={sealed ? "#37d688" : "#f7c948"} emissiveIntensity={0.72} />
      </mesh>
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
  const form = creatureForm(`${cardId}-1`);
  if (!form) return null;
  const detail = form.anatomy.detail;
  return (
    <group>
      {(detail === "ears" || detail === "horns" || detail === "wings") ? [-1, 1].map((side) => (
        <mesh key={side} castShadow position={[side * 0.29, detail === "wings" ? 0.08 : 0.34, detail === "wings" ? -0.14 : -0.02]} rotation={[0, 0, side * (detail === "wings" ? -0.7 : -0.24)]} scale={detail === "wings" ? [0.45, 1.3, 0.18] : [0.65, 1.1, 0.5]}>
          <coneGeometry args={[detail === "wings" ? 0.24 : 0.14, detail === "wings" ? 0.7 : 0.4, detail === "horns" ? 7 : 4]} />
          <meshStandardMaterial color={accent} emissive={detail === "wings" ? accent : "#000000"} emissiveIntensity={0.12} roughness={0.55} />
        </mesh>
      )) : null}
      {detail === "crest" ? <mesh castShadow position={[0, 0.46, -0.03]}><octahedronGeometry args={[0.2, 0]} /><meshStandardMaterial color={accent} emissive={color} emissiveIntensity={0.14} /></mesh> : null}
      {detail === "shell" ? <mesh castShadow position={[0, 0, -0.24]} scale={[1.1, 0.85, 0.4]}><sphereGeometry args={[0.38, 14, 10]} /><meshStandardMaterial color={accent} roughness={0.75} /></mesh> : null}
      {detail === "tail" ? <mesh castShadow position={[0.37, -0.08, -0.25]} rotation={[0.1, 0.1, -0.7]}><capsuleGeometry args={[0.075, 0.48, 5, 8]} /><meshStandardMaterial color={color} roughness={0.65} /></mesh> : null}
    </group>
  );
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

function ExplorerAvatar({
  style,
  worldPosition
}: {
  style: "female" | "male";
  worldPosition: PlayState["player"];
}) {
  const groupRef = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Group>(null);
  const rightLeg = useRef<THREE.Group>(null);
  const previousPosition = useRef(worldPosition);
  const movingUntil = useRef(0);
  const facing = useRef(0);

  useEffect(() => {
    const dx = worldPosition.x - previousPosition.current.x;
    const dz = worldPosition.z - previousPosition.current.z;
    if (Math.hypot(dx, dz) > 0.001) {
      movingUntil.current = Date.now() + 260;
      facing.current = Math.atan2(-dx, -dz);
    }
    previousPosition.current = worldPosition;
  }, [worldPosition]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const moving = Date.now() < movingUntil.current;
    const stride = moving ? Math.sin(clock.elapsedTime * 12) * 0.62 : 0;
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, facing.current, 0.18);
    groupRef.current.position.y = moving ? Math.abs(Math.sin(clock.elapsedTime * 12)) * 0.035 : 0;
    if (leftArm.current) leftArm.current.rotation.x = stride * 0.72;
    if (rightArm.current) rightArm.current.rotation.x = -stride * 0.72;
    if (leftLeg.current) leftLeg.current.rotation.x = -stride;
    if (rightLeg.current) rightLeg.current.rotation.x = stride;
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]} scale={0.68}>
      <mesh castShadow position={[0, 0.94, 0]}>
        <capsuleGeometry args={[style === "female" ? 0.2 : 0.23, 0.42, 8, 16]} />
        <meshStandardMaterial color={style === "female" ? "#f05f8f" : "#2f6f9f"} roughness={0.62} />
      </mesh>
      <mesh castShadow position={[0, 1.43, -0.01]}>
        <sphereGeometry args={[0.22, 20, 16]} />
        <meshStandardMaterial color="#b87552" roughness={0.7} />
      </mesh>
      <mesh castShadow position={[0, 1.56, -0.02]} scale={style === "female" ? [1.06, 0.78, 1.06] : [1.08, 0.52, 1.08]}>
        <sphereGeometry args={[0.22, 18, 14]} />
        <meshStandardMaterial color="#2b201b" roughness={0.88} />
      </mesh>
      {style === "female" ? (
        <mesh castShadow position={[0, 1.37, -0.2]} rotation={[0.28, 0, 0]}>
          <capsuleGeometry args={[0.075, 0.28, 6, 10]} />
          <meshStandardMaterial color="#2b201b" roughness={0.9} />
        </mesh>
      ) : null}
      <mesh castShadow position={[0, 1.02, 0.19]}>
        <boxGeometry args={[0.35, 0.48, 0.16]} />
        <meshStandardMaterial color="#e9b949" roughness={0.72} />
      </mesh>
      <group ref={leftArm} position={[-0.27, 1.12, 0]}>
        <mesh castShadow position={[0, -0.24, 0]}><capsuleGeometry args={[0.065, 0.36, 6, 10]} /><meshStandardMaterial color="#b87552" roughness={0.72} /></mesh>
      </group>
      <group ref={rightArm} position={[0.27, 1.12, 0]}>
        <mesh castShadow position={[0, -0.24, 0]}><capsuleGeometry args={[0.065, 0.36, 6, 10]} /><meshStandardMaterial color="#b87552" roughness={0.72} /></mesh>
      </group>
      <group ref={leftLeg} position={[-0.11, 0.7, 0]}>
        <mesh castShadow position={[0, -0.34, 0]}><capsuleGeometry args={[0.075, 0.5, 6, 10]} /><meshStandardMaterial color="#263747" roughness={0.78} /></mesh>
        <mesh castShadow position={[0, -0.65, -0.055]}><boxGeometry args={[0.16, 0.12, 0.3]} /><meshStandardMaterial color="#6d4b36" roughness={0.9} /></mesh>
      </group>
      <group ref={rightLeg} position={[0.11, 0.7, 0]}>
        <mesh castShadow position={[0, -0.34, 0]}><capsuleGeometry args={[0.075, 0.5, 6, 10]} /><meshStandardMaterial color="#263747" roughness={0.78} /></mesh>
        <mesh castShadow position={[0, -0.65, -0.055]}><boxGeometry args={[0.16, 0.12, 0.3]} /><meshStandardMaterial color="#6d4b36" roughness={0.9} /></mesh>
      </group>
    </group>
  );
}
