"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars, useTexture } from "@react-three/drei";
import { useRef, useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";



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
function ISSMarker({ setSelectedSatellite, onLoaded }) {    
  const markerRef = useRef();
  const hasLoadedOnce = useRef(false);

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
      } finally {
        if (!hasLoadedOnce.current) {
          onLoaded?.();
          hasLoadedOnce.current = true;
        }
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
function StarlinkMarkers({ setSelectedSatellite, onLoaded }) {  
  const [positions, setPositions] = useState([]);
  const [raw, setRaw] = useState([]); 
  const SCALE = 1 / 3185;
  const hasLoadedOnce = useRef(false);

  useEffect(() => {
    async function fetchStarlink() {
      try {
        const res = await fetch("/api/starlink");
        const data = await res.json();

        setRaw(data);

        const scaled = data.map((s) => ({
          x: s.cartesian.x * SCALE,
          y: s.cartesian.y * SCALE,
          z: s.cartesian.z * SCALE,
        }));
        setPositions(scaled);
      } catch (err) {
        console.error("Starlink fetch error:", err);
      } finally {
        if (!hasLoadedOnce.current) {
          onLoaded?.();
          hasLoadedOnce.current = true;
        }
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
function BeidouMarkers({ setSelectedSatellite, onLoaded }) {   
  const [positions, setPositions] = useState([]);
  const [raw, setRaw] = useState([]); 
  const SCALE = 1 / 3185;
  const hasLoadedOnce = useRef(false);

  useEffect(() => {
    async function fetchBeidou() {
      try {
        const res = await fetch("/api/beidou");
        const data = await res.json();

        setRaw(data); 

        const scaled = data.map((s) => ({
          x: s.cartesian.x * SCALE,
          y: s.cartesian.y * SCALE,
          z: s.cartesian.z * SCALE,
        }));
        setPositions(scaled);
      } catch (err) {
        console.error("Beidou fetch error:", err);
      } finally {
        if (!hasLoadedOnce.current) {
          onLoaded?.();
          hasLoadedOnce.current = true;
        }
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
function GlobalStarMarkers({ setSelectedSatellite, onLoaded }) {   
  const [positions, setPositions] = useState([]);
  const [raw, setRaw] = useState([]);  
  const SCALE = 1 / 3185;
  const hasLoadedOnce = useRef(false);

  useEffect(() => {
    async function fetchGlobalStar() {
      try {
        const res = await fetch("/api/globalstar");
        const data = await res.json();

        setRaw(data);  

        const scaled = data.map((s) => ({
          x: s.cartesian.x * SCALE,
          y: s.cartesian.y * SCALE,
          z: s.cartesian.z * SCALE,
        }));
        setPositions(scaled);
      } catch (err) {
        console.error("GlobalStar fetch error:", err);
      } finally {
        if (!hasLoadedOnce.current) {
          onLoaded?.();
          hasLoadedOnce.current = true;
        }
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
function GlonassMarkers({ setSelectedSatellite, onLoaded }) {    
  const [positions, setPositions] = useState([]);
  const [raw, setRaw] = useState([]);  
  const SCALE = 1 / 3185;
  const hasLoadedOnce = useRef(false);

  useEffect(() => {
    async function fetchGlonass() {
      try {
        const res = await fetch("/api/glonass");
        const data = await res.json();

        setRaw(data);  

        const scaled = data.map((s) => ({
          x: s.cartesian.x * SCALE,
          y: s.cartesian.y * SCALE,
          z: s.cartesian.z * SCALE,
        }));
        setPositions(scaled);
      } catch (err) {
        console.error("Glonass fetch error:", err);
      } finally {
        if (!hasLoadedOnce.current) {
          onLoaded?.();
          hasLoadedOnce.current = true;
        }
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
function GPSMarkers({ setSelectedSatellite, onLoaded }) {    
  const [positions, setPositions] = useState([]);
  const [raw, setRaw] = useState([]);  
  const SCALE = 1 / 3185;
  const hasLoadedOnce = useRef(false);

  useEffect(() => {
    async function fetchGPS() {
      try {
        const res = await fetch("/api/gps");
        const data = await res.json();

        setRaw(data);  

        const scaled = data.map((s) => ({
          x: s.cartesian.x * SCALE,
          y: s.cartesian.y * SCALE,
          z: s.cartesian.z * SCALE,
        }));
        setPositions(scaled);
      } catch (err) {
        console.error("GPS fetch error:", err);
      } finally {
        if (!hasLoadedOnce.current) {
          onLoaded?.();
          hasLoadedOnce.current = true;
        }
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
function IridiumMarkers({ setSelectedSatellite, onLoaded }) {    
  const [positions, setPositions] = useState([]);
  const [raw, setRaw] = useState([]);  
  const SCALE = 1 / 3185;
  const hasLoadedOnce = useRef(false);

  useEffect(() => {
    async function fetchIridium() {
      try {
        const res = await fetch("/api/iridium");
        const data = await res.json();

        setRaw(data);  

        const scaled = data.map((s) => ({
          x: s.cartesian.x * SCALE,
          y: s.cartesian.y * SCALE,
          z: s.cartesian.z * SCALE,
        }));
        setPositions(scaled);
      } catch (err) {
        console.error("Iridium fetch error:", err);
      } finally {
        if (!hasLoadedOnce.current) {
          onLoaded?.();
          hasLoadedOnce.current = true;
        }
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
function OneWebMarkers({ setSelectedSatellite, onLoaded }) {    
  const [positions, setPositions] = useState([]);
  const [raw, setRaw] = useState([]);  
  const SCALE = 1 / 3185;
  const hasLoadedOnce = useRef(false);

  useEffect(() => {
    async function fetchOneWeb() {
      try {
        const res = await fetch("/api/oneweb");
        const data = await res.json();

        setRaw(data);  

        const scaled = data.map((s) => ({
          x: s.cartesian.x * SCALE,
          y: s.cartesian.y * SCALE,
          z: s.cartesian.z * SCALE,
        }));
        setPositions(scaled);
      } catch (err) {
        console.error("OneWeb fetch error:", err);
      } finally {
        if (!hasLoadedOnce.current) {
          onLoaded?.();
          hasLoadedOnce.current = true;
        }
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
function TLEMarkers({ selectedCountries, setSelectedSatellite, onLoaded }) {   
  const hasLoadedOnce = useRef(false); 
  const [positions, setPositions] = useState([]);
  const [raw, setRaw] = useState([]);  
  const SCALE = 1 / 3185;
  
  useEffect(() => {
    async function fetchActive() {
      try {
        const res = await fetch("/api/active");
        const data = await res.json();

        setRaw(data);  

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
      } finally {
      if (!hasLoadedOnce.current) {
        onLoaded?.();
        hasLoadedOnce.current = true;
        }
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
  const TOTAL_CONSTELLATIONS = 9;

  const [remainingLoads, setRemainingLoads] = useState(TOTAL_CONSTELLATIONS);
  const [isLoading, setIsLoading] = useState(true);
  const [shouldRenderLoader, setShouldRenderLoader] = useState(true);
  const [loadingStep, setLoadingStep] = useState(0);


  function onLoaded() {
  console.log("%c onLoaded CALLED", "color: yellow; font-weight: bold;");
  setRemainingLoads(prev => {
    console.log("Remaining before:", prev, " → after:", prev - 1);
    return prev - 1;
  });
}

useEffect(() => {
  // Reveal lines one by one while loading
  const timers = [
    setTimeout(() => setLoadingStep(1), 700),
    setTimeout(() => setLoadingStep(2), 1400),
    setTimeout(() => setLoadingStep(3), 2100),
  ];

  return () => timers.forEach(clearTimeout);
}, []);


  useEffect(() => {
  if (remainingLoads === 0) {
    // start fade-out
    setIsLoading(false);

    // wait for CSS transition before unmount
    setTimeout(() => setShouldRenderLoader(false), 700);
  }
}, [remainingLoads]);


  const [showISS, setShowISS] = useState(true);
  const [showStarlink, setShowStarlink] = useState(true);
  const [showBeidou, setShowBeidou] = useState(true);
  const [showGlobalStar, setShowGlobalStar] = useState(true);
  const [showGlonass, setShowGlonass] = useState(true);
  const [showGPS, setShowGPS] = useState(true);
  const [showIridium, setShowIridium] = useState(true);
  const [showOneWeb, setShowOneWeb] = useState(true);
  const [showTLE, setShowTLE] = useState(true);
  const [panelOpen, setPanelOpen] = useState(true);
  const [filterOptions, setFilterOptions] = useState([]);
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [selectedSatellite, setSelectedSatellite] = useState(null);   

  //not used anymore
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
      <Header />

      {/* === Floating Info Card === */}
      {selectedSatellite && (
        <div className="
          fixed bottom-6 left-1/2 -translate-x-1/2
          bg-black/80 text-white p-4 rounded-lg shadow-xl
          w-[350px] backdrop-blur-md z-50 animate-slide-up
        ">
          <div className="flex justify-between mb-2">
            <h2 className="Arial text-lg font-bold">{selectedSatellite.name}</h2>
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
      <div className="asrocuus absolute top-1/2 -translate-y-1/2 left-4 z-20 flex items-center pointer-events-none">

        {/* Toggle button*/}
        <button
          onClick={() => setPanelOpen(!panelOpen)}
          className="pointer-events-auto bg-black/40 hover:bg-black/60 text-white rounded-r px-2 py-6 transition-all"
        >
          {panelOpen ? "<" : ">"}
        </button>

        {/* Animated Panel */}
        <div
          className={`
            pointer-events-auto bg-black/50 text-white rounded-l space-y-2 overflow-hidden 
            transition-[clip-path,opacity] duration-300 ease-in-out
            ${panelOpen
              ? "opacity-100 clip-path-[inset(0%_0%_0%_0%)]"
              : "opacity-0 clip-path-[inset(0%_100%_0%_0%)]"
            }
          `}
          style={{ width: "14rem" }}  
        >
          <div className="px-3 py-2 space-y-2">
            <label className="block">
              <input type="checkbox" checked={showISS} onChange={(e) => setShowISS(e.target.checked)} /> ISS
            </label>

            <label className="block">
              <input type="checkbox" checked={showStarlink} onChange={(e) => setShowStarlink(e.target.checked)} /> Starlink
            </label>

            <label className="block">
              <input type="checkbox" checked={showBeidou} onChange={(e) => setShowBeidou(e.target.checked)} /> Beidou
            </label>

            <label className="block">
              <input type="checkbox" checked={showGlobalStar} onChange={(e) => setShowGlobalStar(e.target.checked)} /> GlobalStar
            </label>

            <label className="block">
              <input type="checkbox" checked={showGlonass} onChange={(e) => setShowGlonass(e.target.checked)} /> Glonass
            </label>

            <label className="block">
              <input type="checkbox" checked={showGPS} onChange={(e) => setShowGPS(e.target.checked)} /> GPS
            </label>

            <label className="block">
              <input type="checkbox" checked={showIridium} onChange={(e) => setShowIridium(e.target.checked)} /> Iridium
            </label>

            <label className="block">
              <input type="checkbox" checked={showOneWeb} onChange={(e) => setShowOneWeb(e.target.checked)} /> OneWeb
            </label>

            <label className="block">
              <input type="checkbox" checked={showTLE} onChange={(e) => setShowTLE(e.target.checked)} /> Other Active Satellites
            </label>
          </div>
        </div>
      </div>
      <Footer />

      {/* --- Loading Overlay --- */}
      {shouldRenderLoader && (
  <div
    className="fixed inset-0 bg-black text-white 
               flex flex-col items-center justify-center
               transition-opacity duration-700 
               z-50"
    style={{
      opacity: isLoading ? 1 : 0,
      pointerEvents: isLoading ? "auto" : "none",
      willChange: "opacity",      
      transform: "translateZ(0)"   
    }}
  >
    {/* Loading Text */}
    <p className="science text-xl mb-6 animate-pulse">Loading Vigil</p>

    {/* Animated Loader SVG */}
    <svg
      viewBox="0 0 57 60"
      xmlns="http://www.w3.org/2000/svg"
      stroke="hsla(0, 0%, 100%, 1.00)"
      width="60"
      height="60"
      className="mt-2"
    >
      <g fill="none" fillRule="evenodd">
        <g transform="translate(1 1)" strokeWidth="3">
          <circle cx="5" cy="50" r="5">
            <animate attributeName="cy" dur="2.2s"
              values="50;5;50;50" repeatCount="indefinite" />
            <animate attributeName="cx" dur="2.2s"
              values="5;27;49;5" repeatCount="indefinite" />
          </circle>

          <circle cx="27" cy="5" r="5">
            <animate attributeName="cy" dur="2.2s"
              values="5;50;50;5" repeatCount="indefinite" />
            <animate attributeName="cx" dur="2.2s"
              values="27;49;5;27" repeatCount="indefinite" />
          </circle>

          <circle cx="49" cy="50" r="5">
            <animate attributeName="cy" dur="2.2s"
              values="50;50;5;50" repeatCount="indefinite" />
            <animate attributeName="cx" dur="2.2s"
              values="49;5;27;49" repeatCount="indefinite" />
          </circle>
        </g>
      </g>
    </svg>
  </div>
)}




      {/* --- 3D Scene --- */}
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        onPointerMissed={() => setSelectedSatellite(null)}    
      >
        <color attach="background" args={["#02050a"]} />
        <ambientLight intensity={0.15} color="#5ca9ff" />
        <directionalLight position={[3, 2, 5]} intensity={1.2} color="#7fc7ff" />

        <Earth>
          {showISS && <ISSMarker setSelectedSatellite={setSelectedSatellite} onLoaded={onLoaded} />}
          {showStarlink && <StarlinkMarkers setSelectedSatellite={setSelectedSatellite} onLoaded={onLoaded} />}
          {showBeidou && <BeidouMarkers setSelectedSatellite={setSelectedSatellite} onLoaded={onLoaded} />}
          {showGlobalStar && <GlobalStarMarkers setSelectedSatellite={setSelectedSatellite} onLoaded={onLoaded} />}
          {showGlonass && <GlonassMarkers setSelectedSatellite={setSelectedSatellite} onLoaded={onLoaded} />}
          {showGPS && <GPSMarkers setSelectedSatellite={setSelectedSatellite} onLoaded={onLoaded} />}
          {showIridium && <IridiumMarkers setSelectedSatellite={setSelectedSatellite} onLoaded={onLoaded} />}
          {showOneWeb && <OneWebMarkers setSelectedSatellite={setSelectedSatellite} onLoaded={onLoaded} />}
          {showTLE && <TLEMarkers selectedCountries={selectedCountries} setSelectedSatellite={setSelectedSatellite} onLoaded={onLoaded} />}
        </Earth>
        <ZoomHandler />
      </Canvas>
    </div>
  );
}
