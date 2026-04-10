"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Html,
  Line,
  OrbitControls,
  RoundedBox,
  Stars,
} from "@react-three/drei";
import * as THREE from "three";

import type { SimulationSnapshot } from "@/components/app/simulation-types";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function pulseAmount(currentTime: number, eventTime: number | null, windowMs = 280) {
  if (eventTime == null) {
    return 0;
  }

  const age = currentTime - eventTime;
  if (age < 0 || age > windowMs) {
    return 0;
  }

  return Math.sin((1 - age / windowMs) * Math.PI);
}

function FloatingLabel({
  anchor,
  labelPosition,
  tone,
  title,
  detail,
}: {
  anchor: [number, number, number];
  labelPosition: [number, number, number];
  tone: string;
  title: string;
  detail: string;
}) {
  return (
    <>
      <Line points={[anchor, labelPosition]} color={tone} transparent opacity={0.5} lineWidth={1.15} />
      <Html position={labelPosition} distanceFactor={8} sprite>
        <div className="w-40 rounded-2xl border border-white/12 bg-slate-950/88 px-3 py-2 text-[11px] text-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{title}</div>
          <div className="mt-1 leading-5 text-slate-200">{detail}</div>
        </div>
      </Html>
    </>
  );
}

function ChamberMesh({
  position,
  scale,
  baseColor,
  highlightColor,
  currentTime,
  eventTime,
  capture,
}: {
  position: [number, number, number];
  scale: [number, number, number];
  baseColor: string;
  highlightColor: string;
  currentTime: number;
  eventTime: number | null;
  capture: boolean;
}) {
  const groupRef = useRef<THREE.Group | null>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current || !materialRef.current) {
      return;
    }

    const pulse = pulseAmount(currentTime, eventTime, 260);
    const shrink = 1 - pulse * 0.06;
    const target = new THREE.Vector3(scale[0] * shrink, scale[1] * (1 - pulse * 0.08), scale[2] * shrink);

    groupRef.current.scale.lerp(target, clamp(delta * 10, 0, 1));

    const nextColor = new THREE.Color(capture || pulse === 0 ? highlightColor : "#f59e0b");
    materialRef.current.color.lerp(nextColor, clamp(delta * 6, 0, 1));
    materialRef.current.emissive.setStyle(capture || pulse === 0 ? highlightColor : "#f59e0b");
    materialRef.current.emissiveIntensity = THREE.MathUtils.lerp(
      materialRef.current.emissiveIntensity,
      0.12 + pulse * 0.9,
      clamp(delta * 8, 0, 1),
    );
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[1, 48, 48]} />
        <meshStandardMaterial
          ref={materialRef}
          color={baseColor}
          metalness={0.05}
          roughness={0.32}
          transparent
          opacity={0.92}
        />
      </mesh>
    </group>
  );
}

function LeadTube({
  points,
  color,
  glow,
}: {
  points: [number, number, number][];
  color: string;
  glow: number;
}) {
  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(
      points.map((point) => new THREE.Vector3(point[0], point[1], point[2])),
    );
    return new THREE.TubeGeometry(curve, 64, 0.055, 12, false);
  }, [points]);

  useEffect(() => {
    return () => geometry.dispose();
  }, [geometry]);

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial color={color} metalness={0.28} roughness={0.34} emissive={color} emissiveIntensity={glow} />
    </mesh>
  );
}

function BloodParticles({ currentTime }: { currentTime: number }) {
  const particlesRef = useRef<Array<THREE.Mesh | null>>([]);

  useFrame(() => {
    particlesRef.current.forEach((mesh, index) => {
      if (!mesh) {
        return;
      }

      const phase = currentTime / 3_500 + index / 12;
      const angle = phase * Math.PI * 2;
      mesh.position.set(
        Math.cos(angle) * 1.1 + Math.sin(angle * 0.7) * 0.35,
        Math.sin(angle * 1.8) * 1.25,
        Math.sin(angle) * 0.55,
      );
      mesh.scale.setScalar(0.9 + Math.sin(angle * 2.1) * 0.18);
    });
  });

  return (
    <group>
      {Array.from({ length: 12 }).map((_, index) => (
        <mesh
          // eslint-disable-next-line react/no-array-index-key
          key={index}
          ref={(mesh) => {
            particlesRef.current[index] = mesh;
          }}
        >
          <sphereGeometry args={[0.07, 12, 12]} />
          <meshStandardMaterial color="#fda4af" emissive="#fb7185" emissiveIntensity={0.35} transparent opacity={0.74} />
        </mesh>
      ))}
    </group>
  );
}

function HeartSceneContents({
  snapshot,
  exploded,
  annotations,
}: {
  snapshot: SimulationSnapshot;
  exploded: boolean;
  annotations: boolean;
}) {
  const atrialPulse = pulseAmount(snapshot.currentTime, snapshot.lastAtrialContractionTime);
  const ventricularPulse = pulseAmount(snapshot.currentTime, snapshot.lastVentricularContractionTime);

  const atrialFlash = snapshot.lastAtrialMarker === "A-Pace" ? "#60a5fa" : "#67e8f9";
  const ventricularFlash = snapshot.lastVentricularMarker === "V-Pace" ? "#fb923c" : "#fb7185";
  const deviceOffset = exploded ? -2.6 : -1.2;
  const heartOffset = exploded ? 1.55 : 0;

  const devicePosition: [number, number, number] = [deviceOffset, 1.65, 1.05];
  const raAnchor: [number, number, number] = [0.82 + heartOffset, 0.95, 0.25];
  const rvAnchor: [number, number, number] = [0.82 + heartOffset, -0.75, 0.45];
  const leadGlowA = 0.12 + atrialPulse * 1.2;
  const leadGlowV = 0.12 + ventricularPulse * 1.2;

  return (
    <>
      <color attach="background" args={["#050815"]} />
      <fog attach="fog" args={["#06111d", 8, 18]} />
      <ambientLight intensity={1.1} />
      <directionalLight position={[6, 6, 5]} intensity={2.2} color="#cbd5f5" castShadow />
      <spotLight position={[-4, 8, 6]} intensity={55} angle={0.36} penumbra={0.5} color="#60a5fa" />
      <pointLight position={[4, -2, 4]} intensity={18} color="#fb7185" />
      <Stars radius={24} depth={14} count={800} factor={2} saturation={0} fade speed={0.25} />

      <group position={[heartOffset, 0, 0]}>
        <mesh scale={[2.65, 3.15, 2.45]} position={[0, 0.05, -0.18]}>
          <sphereGeometry args={[1, 64, 64]} />
          <meshStandardMaterial color="#891b32" transparent opacity={0.12} roughness={0.28} metalness={0.08} />
        </mesh>
        <mesh scale={[2.1, 2.7, 2.05]} position={[0.15, -0.22, -0.52]}>
          <sphereGeometry args={[1, 64, 64]} />
          <meshStandardMaterial color="#111827" transparent opacity={0.18} roughness={0.46} metalness={0.04} />
        </mesh>

        <ChamberMesh
          position={[0.82, 0.92, 0.18]}
          scale={[0.72, 0.88, 0.66]}
          baseColor="#38bdf8"
          highlightColor={atrialFlash}
          currentTime={snapshot.currentTime}
          eventTime={snapshot.lastAtrialContractionTime}
          capture={snapshot.lastAtrialCapture}
        />
        <ChamberMesh
          position={[-0.72, 0.98, 0.12]}
          scale={[0.82, 0.92, 0.72]}
          baseColor="#67e8f9"
          highlightColor={atrialFlash}
          currentTime={snapshot.currentTime}
          eventTime={snapshot.lastAtrialContractionTime}
          capture={snapshot.lastAtrialCapture}
        />
        <ChamberMesh
          position={[0.88, -0.82, 0.36]}
          scale={[0.96, 1.2, 0.84]}
          baseColor="#fb7185"
          highlightColor={ventricularFlash}
          currentTime={snapshot.currentTime}
          eventTime={snapshot.lastVentricularContractionTime}
          capture={snapshot.lastVentricularCapture}
        />
        <ChamberMesh
          position={[-0.62, -0.68, 0.28]}
          scale={[1.06, 1.32, 0.92]}
          baseColor="#f43f5e"
          highlightColor={ventricularFlash}
          currentTime={snapshot.currentTime}
          eventTime={snapshot.lastVentricularContractionTime}
          capture={snapshot.lastVentricularCapture}
        />

        <BloodParticles currentTime={snapshot.currentTime} />
      </group>

      <group position={devicePosition}>
        <RoundedBox args={[1.1, 0.7, 0.3]} radius={0.08} smoothness={6} castShadow receiveShadow>
          <meshStandardMaterial color="#a8b2c3" metalness={0.86} roughness={0.28} />
        </RoundedBox>
        <RoundedBox position={[0.62, 0.14, 0.02]} args={[0.34, 0.22, 0.28]} radius={0.05} smoothness={6}>
          <meshStandardMaterial color="#6b7280" metalness={0.7} roughness={0.36} />
        </RoundedBox>
        <mesh position={[0.76, 0.14, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.14, 18]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.18} />
        </mesh>
        <mesh position={[0.76, 0.14, -0.06]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.14, 18]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.18} />
        </mesh>
      </group>

      <LeadTube
        points={[
          [devicePosition[0] + 0.75, devicePosition[1] + 0.16, 0.11],
          [devicePosition[0] + 1.45, 1.65, 0.35],
          [0.55 + heartOffset, 1.45, 0.55],
          raAnchor,
        ]}
        color="#60a5fa"
        glow={leadGlowA}
      />
      <LeadTube
        points={[
          [devicePosition[0] + 0.75, devicePosition[1] + 0.16, -0.06],
          [devicePosition[0] + 1.5, 1.25, 0.1],
          [0.42 + heartOffset, 0.1, 0.32],
          rvAnchor,
        ]}
        color="#fb923c"
        glow={leadGlowV}
      />

      {annotations ? (
        <>
          <FloatingLabel
            anchor={[0.82 + heartOffset, 0.92, 0.18]}
            labelPosition={[2.2 + heartOffset, 1.7, 0.75]}
            tone="#60a5fa"
            title="RA / LA"
            detail={snapshot.lastAtrialCapture ? `${snapshot.lastAtrialMarker ?? "Awaiting"} electrical event` : "No capture - verify atrial threshold"}
          />
          <FloatingLabel
            anchor={[0.88 + heartOffset, -0.82, 0.36]}
            labelPosition={[2.35 + heartOffset, -0.05, 0.85]}
            tone="#fb923c"
            title="RV / LV"
            detail={snapshot.lastVentricularCapture ? `${snapshot.lastVentricularMarker ?? "Awaiting"} contraction` : "No capture - ventricular output reserve low"}
          />
          <FloatingLabel
            anchor={[devicePosition[0], devicePosition[1], devicePosition[2]]}
            labelPosition={[devicePosition[0] - 1.6, 2.4, 0.95]}
            tone="#cbd5f5"
            title="Device"
            detail={`${snapshot.mode} mode • ${snapshot.metrics.batteryVoltage.toFixed(2)}V battery`}
          />
          <FloatingLabel
            anchor={raAnchor}
            labelPosition={[0.15 + heartOffset, 2.15, 0.35]}
            tone="#67e8f9"
            title="RA Lead"
            detail={`${Math.round(snapshot.metrics.impedance)}Ω • atrial sensing path`}
          />
          <FloatingLabel
            anchor={rvAnchor}
            labelPosition={[0.2 + heartOffset, -1.95, 0.55]}
            tone="#fb923c"
            title="RV Lead"
            detail={`${snapshot.metrics.ventricularOutputThreshold.toFixed(1)}V threshold`}
          />
        </>
      ) : null}

      <ContactShadows position={[0.3, -3.35, 0]} opacity={0.42} scale={11} blur={2.8} far={5} />
      <Environment preset="studio" />
      <OrbitControls enableDamping dampingFactor={0.08} minDistance={5.4} maxDistance={12} />
    </>
  );
}

export function SimulationHeartScene({
  snapshot,
  exploded,
  annotations,
}: {
  snapshot: SimulationSnapshot;
  exploded: boolean;
  annotations: boolean;
}) {
  return (
    <Canvas camera={{ position: [0, 1.2, 8.2], fov: 36 }} shadows>
      <HeartSceneContents snapshot={snapshot} exploded={exploded} annotations={annotations} />
    </Canvas>
  );
}
