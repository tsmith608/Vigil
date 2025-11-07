"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars, useTexture } from "@react-three/drei";
import { useRef, useState, useEffect } from "react";

/* -------------------- EARTH COMPONENT -------------------- */
function Earth({children}) {
  const texture = useTexture("/earth.jpg");
  const earthRef = useRef();
  const isDragging = useRef(false);
  const velocity = useRef({ x: 0, y: 0 });
  const prev = useRef({ x: 0, y: 0 });
  const sensitivity = 0.0025;
  const friction = 0.95;
  const issMarkerRef = useRef();


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
      {children}
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
/* -------------------- ISS HANDLER -------------------- */
function ISSMarker() {
  const markerRef = useRef();

  useEffect(() => {
    async function fetchISS() {
      try {
        const res = await fetch("/api/iss");
        const data = await res.json();

        // scale to 2-unit Earth
        const SCALE = 1 / 3185; 
        const { x, y, z } = data.cartesian;
        

        if (markerRef.current) {
          markerRef.current.position.set(x * SCALE, y * SCALE, z * SCALE);
          console.log("ISS Cartesian scaled:", x * SCALE, y * SCALE, z * SCALE);
          console.log("ISS Lat/Lon:", data.latitude, data.longitude);
        }
      } catch (err) {
        console.error("ISS fetch error:", err);
      }
    }

    fetchISS();
  }, []);

  return (
    <mesh ref={markerRef}>
      <sphereGeometry args={[0.01, 16, 16]} />
      <meshBasicMaterial color="red" />
    </mesh>
  );
}

/* -------------------- StarLink HANDLER -------------------- */
function StarlinkMarkers() {
  const [positions, setPositions] = useState([]);
  const groupRef = useRef();
  const SCALE = 1 / 3185;

  useEffect(() => {
    async function fetchStarlink() {
      try {
        const res = await fetch("/api/starlink");
        const data = await res.json();
        // store scaled xyz for each satellite
        const scaled = data.map((s) => ({
          x: s.cartesian.x * SCALE,
          y: s.cartesian.y * SCALE,
          z: s.cartesian.z * SCALE,
        }));
        setPositions(scaled);
        console.log("Starlink sats loaded:", scaled.length);
        
      } catch (err) {
        console.error("Starlink fetch error:", err);
      }
    }
    fetchStarlink();
  }, []);

  return (
    <group ref={groupRef}>
      {positions.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, p.z]}>
          <sphereGeometry args={[0.004, 8, 8]} />
          <meshBasicMaterial color="#00ffcc" />
        </mesh>
      ))}
    </group>
  );
}

/* -------------------- Beidou HANDLER -------------------- */
function BeidouMarkers() {
  const [positions, setPositions] = useState([]);
  const groupRef = useRef();
  const SCALE = 1 / 3185;

  useEffect(() => {
    async function fetchBeidou() {
      try {
        const res = await fetch("/api/beidou");
        const data = await res.json();
        // store scaled xyz for each satellite
        const scaled = data.map((s) => ({
          x: s.cartesian.x * SCALE,
          y: s.cartesian.y * SCALE,
          z: s.cartesian.z * SCALE,
        }));
        setPositions(scaled);
        console.log("Beidou sats loaded:", scaled.length);
        
      } catch (err) {
        console.error("Beidou fetch error:", err);
      }
    }
    fetchBeidou();
  }, []);

  return (
    <group ref={groupRef}>
      {positions.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, p.z]}>
          <sphereGeometry args={[0.008, 8, 8]} />
          <meshBasicMaterial color="#fd07b3ff" />
        </mesh>
      ))}
    </group>
  );
}

/* -------------------- GlobalStar HANDLER -------------------- */
function GlobalStarMarkers() {
  const [positions, setPositions] = useState([]);
  const groupRef = useRef();
  const SCALE = 1 / 3185;

  useEffect(() => {
    async function fetchGlobalStar() {
      try {
        const res = await fetch("/api/globalstar");
        const data = await res.json();
        // store scaled xyz for each satellite
        const scaled = data.map((s) => ({
          x: s.cartesian.x * SCALE,
          y: s.cartesian.y * SCALE,
          z: s.cartesian.z * SCALE,
        }));
        setPositions(scaled);
        console.log("GlobalStar sats loaded:", scaled.length);

      } catch (err) {
        console.error("GlobalStar fetch error:", err);
      }
    }
    fetchGlobalStar();
  }, []);

  return (
    <group ref={groupRef}>
      {positions.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, p.z]}>
          <sphereGeometry args={[0.004, 8, 8]} />
          <meshBasicMaterial color="#1707ffff" />
        </mesh>
      ))}
    </group>
  );
}


/* -------------------- Glonass HANDLER -------------------- */
function GlonassMarkers() {
  const [positions, setPositions] = useState([]);
  const groupRef = useRef();
  const SCALE = 1 / 3185;

  useEffect(() => {
    async function fetchGlonass() {
      try {
        const res = await fetch("/api/glonass");
        const data = await res.json();
        // store scaled xyz for each satellite
        const scaled = data.map((s) => ({
          x: s.cartesian.x * SCALE,
          y: s.cartesian.y * SCALE,
          z: s.cartesian.z * SCALE,
        }));
        setPositions(scaled);
        console.log("Glonass sats loaded:", scaled.length);
        
      } catch (err) {
        console.error("Glonass fetch error:", err);
      }
    }
    fetchGlonass();
  }, []);

  return (
    <group ref={groupRef}>
      {positions.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, p.z]}>
          <sphereGeometry args={[0.01, 8, 8]} />
          <meshBasicMaterial color="#15ff00ff" />
        </mesh>
      ))}
    </group>
  );
}

/* -------------------- GPS HANDLER -------------------- */
function GPSMarkers() {
  const [positions, setPositions] = useState([]);
  const groupRef = useRef();
  const SCALE = 1 / 3185;

  useEffect(() => {
    async function fetchGPS() {
      try {
        const res = await fetch("/api/gps");
        const data = await res.json();
        // store scaled xyz for each satellite
        const scaled = data.map((s) => ({
          x: s.cartesian.x * SCALE,
          y: s.cartesian.y * SCALE,
          z: s.cartesian.z * SCALE,
        }));
        setPositions(scaled);
        console.log("GPS sats loaded:", scaled.length);
        
      } catch (err) {
        console.error("GPS fetch error:", err);
      }
    }
    fetchGPS();
  }, []);

  return (
    <group ref={groupRef}>
      {positions.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, p.z]}>
          <sphereGeometry args={[0.01, 8, 8]} />
          <meshBasicMaterial color="#eb0808ff" />
        </mesh>
      ))}
    </group>
  );
}

/* -------------------- Iridium HANDLER -------------------- */
function IridiumMarkers() {
  const [positions, setPositions] = useState([]);
  const groupRef = useRef();
  const SCALE = 1 / 3185;

  useEffect(() => {
    async function fetchIridium() {
      try {
        const res = await fetch("/api/iridium");
        const data = await res.json();
        // store scaled xyz for each satellite
        const scaled = data.map((s) => ({
          x: s.cartesian.x * SCALE,
          y: s.cartesian.y * SCALE,
          z: s.cartesian.z * SCALE,
        }));
        setPositions(scaled);
        console.log("Iridium sats loaded:", scaled.length);
        
      } catch (err) {
        console.error("Iridium fetch error:", err);
      }
    }
    fetchIridium();
  }, []);

  return (
    <group ref={groupRef}>
      {positions.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, p.z]}>
          <sphereGeometry args={[0.004, 8, 8]} />
          <meshBasicMaterial color="#ffd900ff" />
        </mesh>
      ))}
    </group>
  );
}

/* -------------------- OneWeb HANDLER -------------------- */
function OneWebMarkers() {
  const [positions, setPositions] = useState([]);
  const groupRef = useRef();
  const SCALE = 1 / 3185;

  useEffect(() => {
    async function fetchOneWeb() {
      try {
        const res = await fetch("/api/oneweb");
        const data = await res.json();
        // store scaled xyz for each satellite
        const scaled = data.map((s) => ({
          x: s.cartesian.x * SCALE,
          y: s.cartesian.y * SCALE,
          z: s.cartesian.z * SCALE,
        }));
        setPositions(scaled);
        console.log("OneWeb sats loaded:", scaled.length);
        
      } catch (err) {
        console.error("OneWeb fetch error:", err);
      }
    }
    fetchOneWeb();
  }, []);

  return (
    <group ref={groupRef}>
      {positions.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, p.z]}>
          <sphereGeometry args={[0.004, 8, 8]} />
          <meshBasicMaterial color="#00ffcc" />
        </mesh>
      ))}
    </group>
  );
}



/* -------------------- TLE HANDLER -------------------- */
function TLEMarkers({ selectedCountries }) {
  const [positions, setPositions] = useState([]);
  const groupRef = useRef();
  const SCALE = 1 / 3185;

  useEffect(() => {
    async function fetchActive() {
      try {
        const res = await fetch("/api/active");
        const data = await res.json();
        const scaled = data
          .filter((s) => s && s.cartesian && s.cartesian.x !== undefined)
          .map((s) => ({
            x: s.cartesian.x * SCALE,
            y: s.cartesian.y * SCALE,
            z: s.cartesian.z * SCALE,
          }));
        setPositions(scaled);
        console.log("🛰️ Satellites loaded:", scaled.length);
      } catch (err) {
        console.error("TLE fetch error:", err);
      }
    }

    fetchActive();
  }, []);


  return (
    <group ref={groupRef}>
      {positions.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, p.z]}>
          <sphereGeometry args={[0.004, 8, 8]} />
          <meshBasicMaterial color="#008080" />
        </mesh>
      ))}
    </group>
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
      newZoom = Math.min(25, Math.max(3, newZoom));
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
  const [showISS, setShowISS] = useState(true);
  const [showStarlink, setShowStarlink] = useState(true);
  const [showBeidou, setShowBeidou] = useState(true);
  const [showGlobalStar, setShowGlobalStar] = useState(true);
  const [showGlonass, setShowGlonass] = useState(true);
  const [showGPS, setShowGPS] = useState(true);
  const [showIridium, setShowIridium] = useState(true);
  const [showOneWeb, setShowOneWeb] = useState(true);
  const [showTLE, setShowTLE] = useState(true);
  const [filterOptions, setFilterOptions] = useState([]);
  const [selectedCountries, setSelectedCountries] = useState([]);

  // 🛰️ Fetch unique country codes from /api/active
  useEffect(() => {
    async function fetchCountries() {
      try {
        const res = await fetch("/api/active");
        const data = await res.json();

        // collect unique uppercase country codes
        const uniqueCountries = [
          ...new Set(data.map((s) => (s.country ? s.country.toUpperCase() : "UNK"))),
        ].sort();

        setFilterOptions(uniqueCountries);
      } catch (err) {
        console.error("Country list fetch error:", err);
      }
    }

    fetchCountries();
  }, []);

  return (
    <div className="h-screen w-full relative">
      {/* --- Control panel --- */}
      <div className="absolute top-4 left-4 z-10 bg-black/50 text-white px-3 py-2 rounded space-y-2 w-56">
        {/* Toggle switches */}
        <label className="block">
          <input
            type="checkbox"
            checked={showISS}
            onChange={(e) => setShowISS(e.target.checked)}
            className="mr-2"
          />
          Show ISS
        </label>

        <label className="block">
          <input
            type="checkbox"
            checked={showStarlink}
            onChange={(e) => setShowStarlink(e.target.checked)}
            className="mr-2"
          />
          Show Starlink
        </label>
        
        <label className="block">
          <input
            type="checkbox"
            checked={showBeidou}
            onChange={(e) => setShowBeidou(e.target.checked)}
            className="mr-2"
          />
          Show Beidou
        </label>

        <label className="block">
          <input
            type="checkbox"
            checked={showGlobalStar}
            onChange={(e) => setShowGlobalStar(e.target.checked)}
            className="mr-2"
          />
          Show GlobalStar
        </label>

        <label className="block">
          <input
            type="checkbox"
            checked={showGlonass}
            onChange={(e) => setShowGlonass(e.target.checked)}
            className="mr-2"
          />
          Show Glonass
        </label>

        <label className="block">
          <input
            type="checkbox"
            checked={showGPS}
            onChange={(e) => setShowGPS(e.target.checked)}
            className="mr-2"
          />
          Show GPS
        </label>

        <label className="block">
          <input
            type="checkbox"
            checked={showIridium}
            onChange={(e) => setShowIridium(e.target.checked)}
            className="mr-2"
          />
          Show Iridium
        </label>

        <label className="block">
          <input
            type="checkbox"
            checked={showOneWeb}
            onChange={(e) => setShowOneWeb(e.target.checked)}
            className="mr-2"
          />
          Show OneWeb
        </label>

        <label className="block">
          <input
            type="checkbox"
            checked={showTLE}
            onChange={(e) => setShowTLE(e.target.checked)}
            className="mr-2"
          />
          Show Other Active Satellites
        </label>

      </div>

      {/* --- 3D Scene --- */}
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
        <color attach="background" args={["#02050a"]} />
        <ambientLight intensity={0.15} color="#5ca9ff" />
        <directionalLight position={[3, 2, 5]} intensity={1.2} color="#7fc7ff" />

        <Earth>
          {showISS && <ISSMarker />}
          {showStarlink && <StarlinkMarkers />}
          {showBeidou && <BeidouMarkers />}
          {showGlobalStar && <GlobalStarMarkers />}
          {showGlonass && <GlonassMarkers />}
          {showGPS && <GPSMarkers />}
          {showIridium && <IridiumMarkers />}
          {showOneWeb && <OneWebMarkers />}
          {showTLE && <TLEMarkers/>}
        </Earth>

        {/* <StaticStars radius={100} count={4000} /> */}
        <ZoomHandler />
      </Canvas>
    </div>
  );
}

