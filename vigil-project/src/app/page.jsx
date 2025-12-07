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

  useFrame(() => {
    if (earthRef.current) {
      earthRef.current.rotation.y += velocity.current.x;
      earthRef.current.rotation.x += velocity.current.y;
      velocity.current.x *= friction;
      velocity.current.y *= friction;

      earthRef.current.rotation.x = Math.max(
        -Math.PI / 2,
        Math.min(Math.PI / 2, earthRef.current.rotation.x)
      );
    }
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

/* -------------------- ISS HANDLER -------------------- */
function ISSMarker({ setSelectedSatellite }) {   // NEW ARG
  const markerRef = useRef();

  useEffect(() => {
    async function fetchISS() {
      try {
        const res = await fetch("/api/iss");
        const data = await res.json();

        const SCALE = 1 / 3185;
        const { x, y, z } = data.cartesian;

        if (markerRef.current) {
          markerRef.current.position.set(x * SCALE, y * SCALE, z * SCALE);
        }
      } catch (err) {
        console.error("ISS fetch error:", err);
      }
    }

    fetchISS();
  }, []);

  return (
    <mesh
      ref={markerRef}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedSatellite({ name: "ISS", ...markerRef.current.position });
      }}
    >
      <sphereGeometry args={[0.01, 16, 16]} />
      <meshBasicMaterial color="red" />
    </mesh>
  );
}

/* -------------------- StarLink HANDLER -------------------- */
function StarlinkMarkers({ setSelectedSatellite }) {   // NEW ARG
  const [positions, setPositions] = useState([]);
  const [raw, setRaw] = useState([]); // NEW: store original sat objects
  const SCALE = 1 / 3185;

  useEffect(() => {
    async function fetchStarlink() {
      try {
        const res = await fetch("/api/starlink");
        const data = await res.json();

        setRaw(data); // NEW

        const scaled = data.map((s) => ({
          x: s.cartesian.x * SCALE,
          y: s.cartesian.y * SCALE,
          z: s.cartesian.z * SCALE,
        }));
        setPositions(scaled);
      } catch (err) {
        console.error("Starlink fetch error:", err);
      }
    }
    fetchStarlink();
  }, []);

  return (
    <group>
      {positions.map((p, i) => (
        <mesh
          key={i}
          position={[p.x, p.y, p.z]}
          onClick={async (e) => {
          e.stopPropagation();

          const sat = raw[i];  // includes propagated latitude/longitude/altitude
          const info = await fetch(`/api/satinfo?satnum=${sat.satnum}`).then(r => r.json());

          setSelectedSatellite({
            ...info,          // DB metadata
            latitude: sat.latitude,
            longitude: sat.longitude,
            altitude: sat.altitude
          });
        }}
        >
          <sphereGeometry args={[0.004, 8, 8]} />
          <meshBasicMaterial color="#00ffcc" />
        </mesh>
      ))}
    </group>
  );
}
/* -------------------- Beidou HANDLER -------------------- */
function BeidouMarkers({ setSelectedSatellite }) {   // NEW ARG
  const [positions, setPositions] = useState([]);
  const [raw, setRaw] = useState([]); // NEW
  const SCALE = 1 / 3185;

  useEffect(() => {
    async function fetchBeidou() {
      try {
        const res = await fetch("/api/beidou");
        const data = await res.json();

        setRaw(data); // NEW

        const scaled = data.map((s) => ({
          x: s.cartesian.x * SCALE,
          y: s.cartesian.y * SCALE,
          z: s.cartesian.z * SCALE,
        }));
        setPositions(scaled);
      } catch (err) {
        console.error("Beidou fetch error:", err);
      }
    }
    fetchBeidou();
  }, []);

  return (
    <group>
      {positions.map((p, i) => (
        <mesh
          key={i}
          position={[p.x, p.y, p.z]}
          onClick={async (e) => {
          e.stopPropagation();

          const sat = raw[i];  // includes propagated latitude/longitude/altitude
          const info = await fetch(`/api/satinfo?satnum=${sat.satnum}`).then(r => r.json());

          setSelectedSatellite({
            ...info,          // DB metadata
            latitude: sat.latitude,
            longitude: sat.longitude,
            altitude: sat.altitude
          });
        }}


        >
          <sphereGeometry args={[0.008, 8, 8]} />
          <meshBasicMaterial color="#fd07b3ff" />
        </mesh>
      ))}
    </group>
  );
}

/* -------------------- GlobalStar HANDLER -------------------- */
function GlobalStarMarkers({ setSelectedSatellite }) {  // NEW ARG
  const [positions, setPositions] = useState([]);
  const [raw, setRaw] = useState([]); // NEW
  const SCALE = 1 / 3185;

  useEffect(() => {
    async function fetchGlobalStar() {
      try {
        const res = await fetch("/api/globalstar");
        const data = await res.json();

        setRaw(data); // NEW

        const scaled = data.map((s) => ({
          x: s.cartesian.x * SCALE,
          y: s.cartesian.y * SCALE,
          z: s.cartesian.z * SCALE,
        }));
        setPositions(scaled);
      } catch (err) {
        console.error("GlobalStar fetch error:", err);
      }
    }
    fetchGlobalStar();
  }, []);

  return (
    <group>
      {positions.map((p, i) => (
        <mesh
          key={i}
          position={[p.x, p.y, p.z]}
          onClick={async (e) => {
          e.stopPropagation();

          const sat = raw[i];  // includes propagated latitude/longitude/altitude
          const info = await fetch(`/api/satinfo?satnum=${sat.satnum}`).then(r => r.json());

          setSelectedSatellite({
            ...info,          // DB metadata
            latitude: sat.latitude,
            longitude: sat.longitude,
            altitude: sat.altitude
          });
        }}
        >
          <sphereGeometry args={[0.004, 8, 8]} />
          <meshBasicMaterial color="#1707ffff" />
        </mesh>
      ))}
    </group>
  );
}

/* -------------------- Glonass HANDLER -------------------- */
function GlonassMarkers({ setSelectedSatellite }) {   // NEW ARG
  const [positions, setPositions] = useState([]);
  const [raw, setRaw] = useState([]); // NEW
  const SCALE = 1 / 3185;

  useEffect(() => {
    async function fetchGlonass() {
      try {
        const res = await fetch("/api/glonass");
        const data = await res.json();

        setRaw(data); // NEW

        const scaled = data.map((s) => ({
          x: s.cartesian.x * SCALE,
          y: s.cartesian.y * SCALE,
          z: s.cartesian.z * SCALE,
        }));
        setPositions(scaled);
      } catch (err) {
        console.error("Glonass fetch error:", err);
      }
    }
    fetchGlonass();
  }, []);

  return (
    <group>
      {positions.map((p, i) => (
        <mesh
          key={i}
          position={[p.x, p.y, p.z]}
          onClick={async (e) => {
          e.stopPropagation();

          const sat = raw[i];  // includes propagated latitude/longitude/altitude
          const info = await fetch(`/api/satinfo?satnum=${sat.satnum}`).then(r => r.json());

          setSelectedSatellite({
            ...info,          // DB metadata
            latitude: sat.latitude,
            longitude: sat.longitude,
            altitude: sat.altitude
          });
        }}


        >
          <sphereGeometry args={[0.01, 8, 8]} />
          <meshBasicMaterial color="#15ff00ff" />
        </mesh>
      ))}
    </group>
  );
}

/* -------------------- GPS HANDLER -------------------- */
function GPSMarkers({ setSelectedSatellite }) {   // NEW ARG
  const [positions, setPositions] = useState([]);
  const [raw, setRaw] = useState([]); // NEW
  const SCALE = 1 / 3185;

  useEffect(() => {
    async function fetchGPS() {
      try {
        const res = await fetch("/api/gps");
        const data = await res.json();

        setRaw(data); // NEW

        const scaled = data.map((s) => ({
          x: s.cartesian.x * SCALE,
          y: s.cartesian.y * SCALE,
          z: s.cartesian.z * SCALE,
        }));
        setPositions(scaled);
      } catch (err) {
        console.error("GPS fetch error:", err);
      }
    }
    fetchGPS();
  }, []);

  return (
    <group>
      {positions.map((p, i) => (
        <mesh
          key={i}
          position={[p.x, p.y, p.z]}
          onClick={async (e) => {
          e.stopPropagation();

          const sat = raw[i];  // includes propagated latitude/longitude/altitude
          const info = await fetch(`/api/satinfo?satnum=${sat.satnum}`).then(r => r.json());

          setSelectedSatellite({
            ...info,          // DB metadata
            latitude: sat.latitude,
            longitude: sat.longitude,
            altitude: sat.altitude
          });
        }}


        >
          <sphereGeometry args={[0.01, 8, 8]} />
          <meshBasicMaterial color="#eb0808ff" />
        </mesh>
      ))}
    </group>
  );
}

/* -------------------- Iridium HANDLER -------------------- */
function IridiumMarkers({ setSelectedSatellite }) {   // NEW ARG
  const [positions, setPositions] = useState([]);
  const [raw, setRaw] = useState([]); // NEW
  const SCALE = 1 / 3185;

  useEffect(() => {
    async function fetchIridium() {
      try {
        const res = await fetch("/api/iridium");
        const data = await res.json();

        setRaw(data); // NEW

        const scaled = data.map((s) => ({
          x: s.cartesian.x * SCALE,
          y: s.cartesian.y * SCALE,
          z: s.cartesian.z * SCALE,
        }));
        setPositions(scaled);
      } catch (err) {
        console.error("Iridium fetch error:", err);
      }
    }
    fetchIridium();
  }, []);

  return (
    <group>
      {positions.map((p, i) => (
        <mesh
          key={i}
          position={[p.x, p.y, p.z]}
          onClick={async (e) => {
          e.stopPropagation();

          const sat = raw[i];  // includes propagated latitude/longitude/altitude
          const info = await fetch(`/api/satinfo?satnum=${sat.satnum}`).then(r => r.json());

          setSelectedSatellite({
            ...info,          // DB metadata
            latitude: sat.latitude,
            longitude: sat.longitude,
            altitude: sat.altitude
          });

  setSelectedSatellite({
    ...info,          // DB metadata
    latitude: sat.latitude,
    longitude: sat.longitude,
    altitude: sat.altitude
  });
}}


        >
          <sphereGeometry args={[0.004, 8, 8]} />
          <meshBasicMaterial color="#ffd900ff" />
        </mesh>
      ))}
    </group>
  );
}

/* -------------------- OneWeb HANDLER -------------------- */
function OneWebMarkers({ setSelectedSatellite }) {   // NEW ARG
  const [positions, setPositions] = useState([]);
  const [raw, setRaw] = useState([]); // NEW
  const SCALE = 1 / 3185;

  useEffect(() => {
    async function fetchOneWeb() {
      try {
        const res = await fetch("/api/oneweb");
        const data = await res.json();

        setRaw(data); // NEW

        const scaled = data.map((s) => ({
          x: s.cartesian.x * SCALE,
          y: s.cartesian.y * SCALE,
          z: s.cartesian.z * SCALE,
        }));
        setPositions(scaled);
      } catch (err) {
        console.error("OneWeb fetch error:", err);
      }
    }
    fetchOneWeb();
  }, []);

  return (
    <group>
      {positions.map((p, i) => (
        <mesh
          key={i}
          position={[p.x, p.y, p.z]}
          onClick={async (e) => {
          e.stopPropagation();

          const sat = raw[i];  // includes propagated latitude/longitude/altitude
          const info = await fetch(`/api/satinfo?satnum=${sat.satnum}`).then(r => r.json());

          setSelectedSatellite({
            ...info,          // DB metadata
            latitude: sat.latitude,
            longitude: sat.longitude,
            altitude: sat.altitude
          });
        }}


        >
          <sphereGeometry args={[0.004, 8, 8]} />
          <meshBasicMaterial color="#00ffcc" />
        </mesh>
      ))}
    </group>
  );
}
/* -------------------- Active HANDLER -------------------- */
function TLEMarkers({ selectedCountries, setSelectedSatellite }) {   // NEW ARG
  const [positions, setPositions] = useState([]);
  const [raw, setRaw] = useState([]); // NEW
  const SCALE = 1 / 3185;

  useEffect(() => {
    async function fetchActive() {
      try {
        const res = await fetch("/api/active");
        const data = await res.json();

        setRaw(data); // NEW

        const filtered = data.filter(
          (s) =>
            s &&
            s.cartesian &&
            s.cartesian.x !== undefined &&
            (selectedCountries.length === 0 ||
              selectedCountries.includes(s.country?.toUpperCase()))
        );

        const scaled = filtered.map((s) => ({
          x: s.cartesian.x * SCALE,
          y: s.cartesian.y * SCALE,
          z: s.cartesian.z * SCALE,
        }));

        setPositions(scaled);
      } catch (err) {
        console.error("TLE fetch error:", err);
      }
    }

    fetchActive();
  }, [selectedCountries]);

  return (
    <group>
      {positions.map((p, i) => (
        <mesh
          key={i}
          position={[p.x, p.y, p.z]}
          onClick={async (e) => {
          e.stopPropagation();

          const sat = raw[i];  // includes propagated latitude/longitude/altitude
          const info = await fetch(`/api/satinfo?satnum=${sat.satnum}`).then(r => r.json());

          setSelectedSatellite({
            ...info,          // DB metadata
            latitude: sat.latitude,
            longitude: sat.longitude,
            altitude: sat.altitude
          });
        }}
        >
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

  const [selectedSatellite, setSelectedSatellite] = useState(null);  // NEW

  // 🛰️ Fetch unique country codes from /api/active
  useEffect(() => {
    async function fetchCountries() {
      try {
        const res = await fetch("/api/active");
        const data = await res.json();

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

      {/* === Floating Info Card === */}
      {selectedSatellite && (
        <div className="
          fixed bottom-6 left-1/2 -translate-x-1/2
          bg-black/80 text-white p-4 rounded-lg shadow-xl
          w-[350px] backdrop-blur-md z-50 animate-slide-up
        ">
          <div className="flex justify-between mb-2">
            <h2 className="text-lg font-bold">{selectedSatellite.name}</h2>
            <button onClick={() => setSelectedSatellite(null)}>✖</button>
          </div>

          <p><b>Year:</b> {selectedSatellite.intldes_year}</p>
          <p><b>Latitude:</b> {selectedSatellite.latitude?.toFixed(4)}°</p>
          <p><b>Longitude:</b> {selectedSatellite.longitude?.toFixed(4)}°</p>
          <p><b>Altitude:</b> {selectedSatellite.altitude?.toFixed(2)} km</p>

          <p><b>Inclination:</b> {selectedSatellite.inclination_deg?.toFixed(2)}°</p>
          <p><b>Eccentricity:</b> {selectedSatellite.eccentricity}</p>
          <p><b>RAAN:</b> {selectedSatellite.raan_deg?.toFixed(2)}°</p>
          

              
        </div>
      )}

      {/* --- Control panel  --- */}
      <div className="absolute top-4 left-4 z-10 bg-black/50 text-white px-3 py-2 rounded space-y-2 w-56">
        <label className="block">
          <input type="checkbox" checked={showISS} onChange={(e) => setShowISS(e.target.checked)} /> Show ISS
        </label>
        <label className="block">
          <input type="checkbox" checked={showStarlink} onChange={(e) => setShowStarlink(e.target.checked)} /> Show Starlink
        </label>
        <label className="block">
          <input type="checkbox" checked={showBeidou} onChange={(e) => setShowBeidou(e.target.checked)} /> Show Beidou
        </label>
        <label className="block">
          <input type="checkbox" checked={showGlobalStar} onChange={(e) => setShowGlobalStar(e.target.checked)} /> Show GlobalStar
        </label>
        <label className="block">
          <input type="checkbox" checked={showGlonass} onChange={(e) => setShowGlonass(e.target.checked)} /> Show Glonass
        </label>
        <label className="block">
          <input type="checkbox" checked={showGPS} onChange={(e) => setShowGPS(e.target.checked)} /> Show GPS
        </label>
        <label className="block">
          <input type="checkbox" checked={showIridium} onChange={(e) => setShowIridium(e.target.checked)} /> Show Iridium
        </label>
        <label className="block">
          <input type="checkbox" checked={showOneWeb} onChange={(e) => setShowOneWeb(e.target.checked)} /> Show OneWeb
        </label>
        <label className="block">
          <input type="checkbox" checked={showTLE} onChange={(e) => setShowTLE(e.target.checked)} /> Show Other Active
        </label>
      </div>

      {/* --- 3D Scene --- */}
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        onPointerMissed={() => setSelectedSatellite(null)}   // NEW
      >
        <color attach="background" args={["#02050a"]} />
        <ambientLight intensity={0.15} color="#5ca9ff" />
        <directionalLight position={[3, 2, 5]} intensity={1.2} color="#7fc7ff" />

        <Earth>
          {showISS && <ISSMarker setSelectedSatellite={setSelectedSatellite} />}
          {showStarlink && <StarlinkMarkers setSelectedSatellite={setSelectedSatellite} />}
          {showBeidou && <BeidouMarkers setSelectedSatellite={setSelectedSatellite} />}
          {showGlobalStar && <GlobalStarMarkers setSelectedSatellite={setSelectedSatellite} />}
          {showGlonass && <GlonassMarkers setSelectedSatellite={setSelectedSatellite} />}
          {showGPS && <GPSMarkers setSelectedSatellite={setSelectedSatellite} />}
          {showIridium && <IridiumMarkers setSelectedSatellite={setSelectedSatellite} />}
          {showOneWeb && <OneWebMarkers setSelectedSatellite={setSelectedSatellite} />}
          {showTLE && <TLEMarkers selectedCountries={selectedCountries} setSelectedSatellite={setSelectedSatellite} />}
        </Earth>

        <ZoomHandler />
      </Canvas>
    </div>
  );
}
