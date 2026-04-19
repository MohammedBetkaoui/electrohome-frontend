import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, RoundedBox, Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

/* ------------------------------------------------------------------ */
/*  Floating accent shapes                                             */
/* ------------------------------------------------------------------ */

function AccentSphere({ position, scale, speed }: { position: [number, number, number]; scale: number; speed: number }) {
  const ref = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * speed) * 0.15;
  });

  return (
    <mesh ref={ref} position={position} scale={scale}>
      <sphereGeometry args={[1, 48, 48]} />
      <meshStandardMaterial color="#E8400C" roughness={0.15} metalness={0.9} />
    </mesh>
  );
}

function FloatingTorus({ position, scale }: { position: [number, number, number]; scale: number }) {
  const ref = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    ref.current.rotation.x = state.clock.elapsedTime * 0.3;
    ref.current.rotation.z = state.clock.elapsedTime * 0.15;
    ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.8) * 0.12;
  });

  return (
    <mesh ref={ref} position={position} scale={scale}>
      <torusGeometry args={[1, 0.35, 32, 64]} />
      <meshStandardMaterial color="#ffffff" roughness={0.05} metalness={1} />
    </mesh>
  );
}

function FloatingBox() {
  const ref = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    ref.current.rotation.x = state.clock.elapsedTime * 0.2;
    ref.current.rotation.y = state.clock.elapsedTime * 0.35;
    ref.current.position.y = 0.6 + Math.sin(state.clock.elapsedTime * 0.6) * 0.1;
  });

  return (
    <mesh ref={ref} position={[1.6, 0.6, -0.5]} scale={0.45}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#16213E" roughness={0.15} metalness={0.85} />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/*  Main appliance — stylized modern refrigerator                      */
/* ------------------------------------------------------------------ */

function MainAppliance() {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.15;
    groupRef.current.position.y = -0.2 + Math.sin(state.clock.elapsedTime * 0.5) * 0.08;
  });

  return (
    <group ref={groupRef} position={[0, -0.2, 0]}>
      {/* Corps principal */}
      <RoundedBox args={[1.6, 2.4, 1]} radius={0.08} smoothness={6} castShadow>
        <meshStandardMaterial color="#e0e0e0" roughness={0.08} metalness={0.95} />
      </RoundedBox>

      {/* Ecran tactile */}
      <RoundedBox args={[0.7, 0.4, 0.02]} radius={0.02} smoothness={4} position={[0, 0.5, 0.52]}>
        <meshStandardMaterial color="#0a1628" roughness={0.05} metalness={0.3} emissive="#1a3a6e" emissiveIntensity={0.4} />
      </RoundedBox>

      {/* Poignée accent */}
      <RoundedBox args={[0.06, 1.2, 0.06]} radius={0.02} smoothness={4} position={[0.65, 0.05, 0.52]}>
        <meshStandardMaterial color="#E8400C" roughness={0.2} metalness={0.8} />
      </RoundedBox>

      {/* Ligne de séparation */}
      <mesh position={[0, -0.35, 0.51]}>
        <boxGeometry args={[1.5, 0.01, 0.02]} />
        <meshStandardMaterial color="#aaa" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Base accent */}
      <RoundedBox args={[1.62, 0.05, 1.02]} radius={0.02} smoothness={4} position={[0, -1.25, 0]}>
        <meshStandardMaterial color="#E8400C" roughness={0.2} metalness={0.8} />
      </RoundedBox>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Particles                                                          */
/* ------------------------------------------------------------------ */

function Particles({ count = 40 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null!);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 8;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 5;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 4;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return geo;
  }, [count]);

  useFrame((state) => {
    ref.current.rotation.y = state.clock.elapsedTime * 0.02;
    ref.current.rotation.x = state.clock.elapsedTime * 0.01;
  });

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial size={0.025} color="#E8400C" transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}

/* ------------------------------------------------------------------ */
/*  Scene                                                              */
/* ------------------------------------------------------------------ */

function Scene() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} color="#ffffff" castShadow />
      <directionalLight position={[-3, 3, -2]} intensity={0.4} color="#4a6fa5" />
      <spotLight position={[0, 6, 3]} angle={0.3} penumbra={1} intensity={0.8} color="#E8400C" />

      <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.5}>
        <MainAppliance />
      </Float>

      <AccentSphere position={[-2, 0.8, 0.5]} scale={0.35} speed={0.7} />
      <FloatingTorus position={[-1.5, -0.5, -1]} scale={0.3} />
      <FloatingBox />
      <AccentSphere position={[2.2, 1.2, -0.8]} scale={0.2} speed={1.1} />

      <Particles count={50} />

      <ContactShadows position={[0, -1.6, 0]} opacity={0.5} scale={8} blur={2.5} far={3} color="#1A1A2E" />

      {/* Sol sombre subtil */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.6, 0]}>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color="#0a0a15" roughness={0.8} metalness={0.5} transparent opacity={0.6} />
      </mesh>

      <Environment preset="city" />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Export                                                             */
/* ------------------------------------------------------------------ */

export function HeroScene3D() {
  return (
    <div className="w-full h-full min-h-[320px]" style={{ aspectRatio: "4/3" }}>
      <Canvas
        camera={{ position: [0, 0.5, 5], fov: 40 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
