"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars, useTexture } from "@react-three/drei";
import { useRef, useState, useEffect } from "react";

/* -------------------- EARTH COMPONENT -------------------- */
function Earth() {
  const texture = useTexture("/earth.jpg");
  const earthRef = useRef();
  const isDragging = useRef(false);
  const velocity = useRef({ x: 0, y: 0 });
  const prev = useRef({ x: 0, y: 0 });
  const sensitivity = 0.0025;
  const friction = 0.95;

  useFrame(() => {
    earthRef.current.rotation.y += velocity.current.x;
    earthRef.current.rotation.x += velocity.current.y;
    velocity.current.x *= friction;
    velocity.current.y *= friction;
    earthRef.current.rotation.x = Math.max(
      -Math.PI / 2,
      Math.min(Math.PI / 2, earthRef.current.rotation.x)
    );
  });

  const handlePointerDown = (e) => {
    isDragging.current = true;
    prev.current.x = e.clientX;
    prev.current.y = e.clientY;
  };
  const handlePointerUp = () => (isDragging.current = false);
  const handlePointerMove = (e) => {
    if (!isDragging.current) return;
    const dx = e.clientX - prev.current.x;
    const dy = e.clientY - prev.current.y;
    prev.current.x = e.clientX;
    prev.current.y = e.clientY;
    velocity.current.x = dx * sensitivity;
    velocity.current.y = dy * sensitivity;
  };

  return (
    <mesh
      ref={earthRef}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerOut={handlePointerUp}
      onPointerMove={handlePointerMove}
    >
      <sphereGeometry args={[2, 64, 64]} />
      <meshStandardMaterial map={texture} metalness={0.3} roughness={0.7} />
    </mesh>
  );
}
function StaticStars({ count = 4000, radius = 100 }) {
  const positions = useRef(new Float32Array(count * 3));
  for (let i = 0; i < count * 3; i++) {
    positions.current[i] = (Math.random() - 0.5) * radius * 2;
  }
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions.current}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#ffffff"
        size={0.02}
        sizeAttenuation={true}
      />
    </points>
  );
}


/* -------------------- ZOOM HANDLER -------------------- */
function ZoomHandler() {
  const { camera } = useThree();
  const [zoom, setZoom] = useState(6);

  useFrame(() => camera.lookAt(0, 0, 0));

  useEffect(() => {
    const onWheel = (e) => {
      e.preventDefault();
      let newZoom = camera.position.z + e.deltaY * 0.01;
      newZoom = Math.min(10, Math.max(3, newZoom));
      camera.position.z = newZoom;
      setZoom(newZoom);
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [camera]);

  return null;
}

/* -------------------- MAIN PAGE -------------------- */
export default function GlobePage() {
  return (
    <div className="h-screen w-full relative">
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
        <color attach="background" args={["#02050a"]} />
        <ambientLight intensity={0.15} color="#5ca9ff" />
        <directionalLight position={[3, 2, 5]} intensity={1.2} color="#7fc7ff" />
        <Earth />
        <StaticStars radius={100} count={4000} />
        <ZoomHandler />
      </Canvas>
    </div>
  );
}
