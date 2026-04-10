"use client";

import { Canvas } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Float,
  OrbitControls,
  RoundedBox,
  Sparkles,
} from "@react-three/drei";
import { CuboidCollider, Physics, RigidBody } from "@react-three/rapier";
import { useControls } from "leva";

function DeviceBody() {
  const controls = useControls("Digital Twin", {
    tilt: { value: 0.24, min: -0.4, max: 0.5, step: 0.01 },
    glow: { value: "#0A84FF" },
    pulse: { value: 1.35, min: 0.8, max: 2.4, step: 0.05 },
    stability: { value: 0.82, min: 0.3, max: 1, step: 0.01 },
  });

  return (
    <group rotation={[controls.tilt, 0.2, -0.05]}>
      <Float speed={controls.pulse} rotationIntensity={0.15} floatIntensity={0.6}>
        <RigidBody type="fixed" colliders={false}>
          <RoundedBox args={[2.8, 1.5, 0.6]} radius={0.12} smoothness={6}>
            <meshStandardMaterial
              color="#f2f2f7"
              metalness={0.38}
              roughness={0.18}
              emissive={controls.glow}
              emissiveIntensity={0.16}
            />
          </RoundedBox>
          <RoundedBox position={[0, 0.15, 0.34]} args={[1.85, 0.92, 0.08]} radius={0.08}>
            <meshStandardMaterial color="#111318" metalness={0.2} roughness={0.1} />
          </RoundedBox>
          <RoundedBox position={[-0.86, -0.12, 0.37]} args={[0.24, 0.24, 0.12]} radius={0.05}>
            <meshStandardMaterial color="#30D158" emissive="#30D158" emissiveIntensity={0.65} />
          </RoundedBox>
          <RoundedBox position={[-0.44, -0.12, 0.37]} args={[0.24, 0.24, 0.12]} radius={0.05}>
            <meshStandardMaterial color="#FF9F0A" emissive="#FF9F0A" emissiveIntensity={0.45} />
          </RoundedBox>
          <RoundedBox position={[0.84, -0.42, 0.06]} args={[0.36, 0.3, 0.52]} radius={0.06}>
            <meshStandardMaterial color="#d5d9e1" metalness={0.44} roughness={0.2} />
          </RoundedBox>
          <CuboidCollider args={[1.5, 0.85, 0.35]} />
        </RigidBody>
      </Float>
      <mesh position={[0, -1.05, 0]} scale={[3.4, 0.04, 1.1]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#0a84ff" emissive="#0a84ff" emissiveIntensity={0.2} />
      </mesh>
      <Sparkles
        count={24}
        size={2.5}
        speed={controls.pulse}
        scale={[4.5, 2.8, 2.4]}
        color={controls.glow}
      />
    </group>
  );
}

export default function DeviceTwinCanvas() {
  return (
    <Canvas camera={{ position: [0, 1.4, 5.1], fov: 42 }}>
      <color attach="background" args={["#0b1018"]} />
      <ambientLight intensity={0.8} />
      <pointLight position={[4, 4, 4]} intensity={18} color="#0A84FF" />
      <pointLight position={[-3, 2, 1]} intensity={12} color="#30D158" />
      <Physics gravity={[0, 0, 0]}>
        <DeviceBody />
      </Physics>
      <Environment preset="city" />
      <ContactShadows position={[0, -1.35, 0]} opacity={0.45} scale={7} blur={2.2} />
      <OrbitControls enablePan={false} minDistance={3.6} maxDistance={6.8} />
    </Canvas>
  );
}

