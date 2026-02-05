"use client";
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars, useTexture } from "@react-three/drei";
import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import * as satellite from "satellite.js";
import { Line } from "@react-three/drei";

const EARTH_RADIUS_KM = 6371;
const SCALE = 1 / 3185;

function getSatelliteCartesian(lat, lon, alt) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const radius = EARTH_RADIUS_KM + alt;
  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  return { x, y, z };
}

/* -------------------- CACHE LOGIC -------------------- */
const SATELLITE_CACHE = new Map();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

async function fetchWithCache(url) {
  const cached = SATELLITE_CACHE.get(url);
  const now = Date.now();
  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  const res = await fetch(url);
  const data = await res.json();
  SATELLITE_CACHE.set(url, { data, timestamp: now });
  return data;
}/* -------------------- COLOR PALETTE -------------------- */
const SATELLITE_COLORS = {
  ISS: "#ff4d4d",        // Vibrant Red
  Starlink: "#00ffcc",   // Cyan/Teal
  Beidou: "#fd07b3",     // Pink/Magenta
  GlobalStar: "#3366ff", // Bright Blue
  Glonass: "#15ff00",    // Neon Green
  GPS: "#ffffff",        // Pure White
  Iridium: "#ffd900",    // Golden Yellow
  OneWeb: "#ff9500",     // Vibrant Orange
  TLE: "#00ddeb"         // Azure Cyan
};

/* -------------------- EARTH COMPONENT -------------------- */
function Earth({ children }) {
  const texture = useTexture("/earth.jpg");
  const earthRef = useRef();
  const visible = useRef(true); // Internal visibility for rotation logic
  const velocity = useRef({ x: 0, y: 0 });
  const friction = 0.95;

  // Use R3F's internal state to handle global dragging
  const { size, viewport, gl } = useThree();
  const isDragging = useRef(false);
  const prev = useRef({ x: 0, y: 0 });
  const sensitivity = 0.0025;

  useEffect(() => {
    const handleDown = (e) => {
      isDragging.current = true;
      prev.current = { x: e.clientX, y: e.clientY };
    };
    const handleUp = () => {
      isDragging.current = false;
    };
    const handleMove = (e) => {
      if (!isDragging.current) return;
      const dx = e.clientX - prev.current.x;
      const dy = e.clientY - prev.current.y;
      prev.current = { x: e.clientX, y: e.clientY };

      velocity.current.x = dx * sensitivity;
      velocity.current.y = dy * sensitivity;
    };

    const canvas = gl.domElement;
    canvas.addEventListener('pointerdown', handleDown);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointermove', handleMove);

    return () => {
      canvas.removeEventListener('pointerdown', handleDown);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointermove', handleMove);
    };
  }, [gl]);

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

  return (
    <mesh ref={earthRef}>
      <sphereGeometry args={[2, 64, 64]} />
      <meshStandardMaterial map={texture} metalness={0.3} roughness={0.7} />
      {children}
    </mesh>
  );
}

/* -------------------- ISS HANDLER -------------------- */
function ISSMarker({ visible, setSelectedSatellite, onLoaded }) {
  const markerRef = useRef();
  const hasLoadedOnce = useRef(false);

  useEffect(() => {
    async function fetchISS() {
      try {
        const data = await fetchWithCache("/api/iss");

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
    <group visible={visible}>
      <mesh
        ref={markerRef}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedSatellite({ name: "ISS", ...markerRef.current.position });
        }}
      >
        <sphereGeometry args={[0.01, 16, 16]} />
        <meshBasicMaterial color={SATELLITE_COLORS.ISS} />
      </mesh>
    </group>
  );
}


function StarlinkMarkers({ visible, setSelectedSatellite, onLoaded }) {
  const meshRef = useRef();
  const [temp] = useState(() => new THREE.Object3D());
  const [raw, setRaw] = useState([]);
  const hasLoadedOnce = useRef(false);

  useEffect(() => {
    async function fetchStarlink() {
      try {
        const data = await fetchWithCache("/api/starlink");
        setRaw(data);
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

  useEffect(() => {
    if (meshRef.current && raw.length > 0) {
      temp.scale.set(1, 1, 1);
      temp.rotation.set(0, 0, 0);
      raw.forEach((s, i) => {
        temp.position.set(s.cartesian.x * SCALE, s.cartesian.y * SCALE, s.cartesian.z * SCALE);
        temp.updateMatrix();
        meshRef.current.setMatrixAt(i, temp.matrix);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [raw]);

  return (
    <instancedMesh
      key={`starlink-${raw.length}`}
      ref={meshRef}
      args={[null, null, raw.length]}
      visible={visible}
      onClick={async (e) => {
        e.stopPropagation();
        const instanceId = e.instanceId;
        const sat = raw[instanceId];
        const info = await fetchWithCache(`/api/satinfo?satnum=${sat.satnum}`);
        setSelectedSatellite({
          ...info,
          latitude: sat.latitude,
          longitude: sat.longitude,
          altitude: sat.altitude
        });
      }}
    >
      <sphereGeometry args={[0.005, 8, 8]} />
      <meshBasicMaterial color={SATELLITE_COLORS.Starlink} />
    </instancedMesh>
  );
}
/* -------------------- Beidou HANDLER -------------------- */
function BeidouMarkers({ visible, setSelectedSatellite, onLoaded }) {
  const meshRef = useRef();
  const [temp] = useState(() => new THREE.Object3D());
  const [raw, setRaw] = useState([]);
  const hasLoadedOnce = useRef(false);

  useEffect(() => {
    async function fetchBeidou() {
      try {
        const data = await fetchWithCache("/api/beidou");
        setRaw(data);
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

  useEffect(() => {
    if (meshRef.current && raw.length > 0) {
      temp.scale.set(1, 1, 1);
      temp.rotation.set(0, 0, 0);
      raw.forEach((s, i) => {
        temp.position.set(s.cartesian.x * SCALE, s.cartesian.y * SCALE, s.cartesian.z * SCALE);
        temp.updateMatrix();
        meshRef.current.setMatrixAt(i, temp.matrix);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [raw]);

  return (
    <instancedMesh key={`beidou-${raw.length}`} ref={meshRef} args={[null, null, raw.length]} visible={visible}
      onClick={async (e) => {
        e.stopPropagation();
        const sat = raw[e.instanceId];
        const info = await fetchWithCache(`/api/satinfo?satnum=${sat.satnum}`);
        setSelectedSatellite({ ...info, latitude: sat.latitude, longitude: sat.longitude, altitude: sat.altitude });
      }}
    >
      <sphereGeometry args={[0.007, 8, 8]} />
      <meshBasicMaterial color={SATELLITE_COLORS.Beidou} />
    </instancedMesh>
  );
}

/* -------------------- GlobalStar HANDLER -------------------- */
function GlobalStarMarkers({ visible, setSelectedSatellite, onLoaded }) {
  const meshRef = useRef();
  const [temp] = useState(() => new THREE.Object3D());
  const [raw, setRaw] = useState([]);
  const hasLoadedOnce = useRef(false);

  useEffect(() => {
    async function fetchGlobalStar() {
      try {
        const data = await fetchWithCache("/api/globalstar");
        setRaw(data);
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

  useEffect(() => {
    if (meshRef.current && raw.length > 0) {
      temp.scale.set(1, 1, 1);
      temp.rotation.set(0, 0, 0);
      raw.forEach((s, i) => {
        temp.position.set(s.cartesian.x * SCALE, s.cartesian.y * SCALE, s.cartesian.z * SCALE);
        temp.updateMatrix();
        meshRef.current.setMatrixAt(i, temp.matrix);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [raw]);

  return (
    <instancedMesh key={`globalstar-${raw.length}`} ref={meshRef} args={[null, null, raw.length]} visible={visible}
      onClick={async (e) => {
        e.stopPropagation();
        const sat = raw[e.instanceId];
        const info = await fetchWithCache(`/api/satinfo?satnum=${sat.satnum}`);
        setSelectedSatellite({ ...info, latitude: sat.latitude, longitude: sat.longitude, altitude: sat.altitude });
      }}
    >
      <sphereGeometry args={[0.008, 8, 8]} />
      <meshBasicMaterial color={SATELLITE_COLORS.GlobalStar} />
    </instancedMesh>
  );
}

/* -------------------- Glonass HANDLER -------------------- */
function GlonassMarkers({ visible, setSelectedSatellite, onLoaded }) {
  const meshRef = useRef();
  const [temp] = useState(() => new THREE.Object3D());
  const [raw, setRaw] = useState([]);
  const hasLoadedOnce = useRef(false);

  useEffect(() => {
    async function fetchGlonass() {
      try {
        const data = await fetchWithCache("/api/glonass");
        setRaw(data);
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

  useEffect(() => {
    if (meshRef.current && raw.length > 0) {
      temp.scale.set(1, 1, 1);
      temp.rotation.set(0, 0, 0);
      raw.forEach((s, i) => {
        temp.position.set(s.cartesian.x * SCALE, s.cartesian.y * SCALE, s.cartesian.z * SCALE);
        temp.updateMatrix();
        meshRef.current.setMatrixAt(i, temp.matrix);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [raw]);

  return (
    <instancedMesh key={`glonass-${raw.length}`} ref={meshRef} args={[null, null, raw.length]} visible={visible}
      onClick={async (e) => {
        e.stopPropagation();
        const sat = raw[e.instanceId];
        const info = await fetchWithCache(`/api/satinfo?satnum=${sat.satnum}`);
        setSelectedSatellite({ ...info, latitude: sat.latitude, longitude: sat.longitude, altitude: sat.altitude });
      }}
    >
      <sphereGeometry args={[0.007, 8, 8]} />
      <meshBasicMaterial color={SATELLITE_COLORS.Glonass} />
    </instancedMesh>
  );
}

/* -------------------- GPS HANDLER -------------------- */
function GPSMarkers({ visible, setSelectedSatellite, onLoaded }) {
  const meshRef = useRef();
  const [temp] = useState(() => new THREE.Object3D());
  const [raw, setRaw] = useState([]);
  const hasLoadedOnce = useRef(false);

  useEffect(() => {
    async function fetchGPS() {
      try {
        const data = await fetchWithCache("/api/gps");
        setRaw(data);
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

  useEffect(() => {
    if (meshRef.current && raw.length > 0) {
      temp.scale.set(1, 1, 1);
      temp.rotation.set(0, 0, 0);
      raw.forEach((s, i) => {
        temp.position.set(s.cartesian.x * SCALE, s.cartesian.y * SCALE, s.cartesian.z * SCALE);
        temp.updateMatrix();
        meshRef.current.setMatrixAt(i, temp.matrix);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [raw]);

  return (
    <instancedMesh key={`gps-${raw.length}`} ref={meshRef} args={[null, null, raw.length]} visible={visible}
      onClick={async (e) => {
        e.stopPropagation();
        const sat = raw[e.instanceId];
        const info = await fetchWithCache(`/api/satinfo?satnum=${sat.satnum}`);
        setSelectedSatellite({ ...info, latitude: sat.latitude, longitude: sat.longitude, altitude: sat.altitude });
      }}
    >
      <sphereGeometry args={[0.012, 8, 8]} />
      <meshBasicMaterial color={SATELLITE_COLORS.GPS} />
    </instancedMesh>
  );
}

/* -------------------- Iridium HANDLER -------------------- */
function IridiumMarkers({ visible, setSelectedSatellite, onLoaded }) {
  const meshRef = useRef();
  const [temp] = useState(() => new THREE.Object3D());
  const [raw, setRaw] = useState([]);
  const hasLoadedOnce = useRef(false);

  useEffect(() => {
    async function fetchIridium() {
      try {
        const data = await fetchWithCache("/api/iridium");
        setRaw(data);
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

  useEffect(() => {
    if (meshRef.current && raw.length > 0) {
      temp.scale.set(1, 1, 1);
      temp.rotation.set(0, 0, 0);
      raw.forEach((s, i) => {
        temp.position.set(s.cartesian.x * SCALE, s.cartesian.y * SCALE, s.cartesian.z * SCALE);
        temp.updateMatrix();
        meshRef.current.setMatrixAt(i, temp.matrix);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [raw]);

  return (
    <instancedMesh key={`iridium-${raw.length}`} ref={meshRef} args={[null, null, raw.length]} visible={visible}
      onClick={async (e) => {
        e.stopPropagation();
        const sat = raw[e.instanceId];
        const info = await fetchWithCache(`/api/satinfo?satnum=${sat.satnum}`);
        setSelectedSatellite({ ...info, latitude: sat.latitude, longitude: sat.longitude, altitude: sat.altitude });
      }}
    >
      <sphereGeometry args={[0.009, 8, 8]} />
      <meshBasicMaterial color={SATELLITE_COLORS.Iridium} />
    </instancedMesh>
  );
}

/* -------------------- OneWeb HANDLER -------------------- */
function OneWebMarkers({ visible, setSelectedSatellite, onLoaded }) {
  const meshRef = useRef();
  const [temp] = useState(() => new THREE.Object3D());
  const [raw, setRaw] = useState([]);
  const hasLoadedOnce = useRef(false);

  useEffect(() => {
    async function fetchOneWeb() {
      try {
        const data = await fetchWithCache("/api/oneweb");
        setRaw(data);
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

  useEffect(() => {
    if (meshRef.current && raw.length > 0) {
      temp.scale.set(1, 1, 1);
      temp.rotation.set(0, 0, 0);
      raw.forEach((s, i) => {
        temp.position.set(s.cartesian.x * SCALE, s.cartesian.y * SCALE, s.cartesian.z * SCALE);
        temp.updateMatrix();
        meshRef.current.setMatrixAt(i, temp.matrix);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [raw]);

  return (
    <instancedMesh key={`oneweb-${raw.length}`} ref={meshRef} args={[null, null, raw.length]} visible={visible}
      onClick={async (e) => {
        e.stopPropagation();
        const sat = raw[e.instanceId];
        const info = await fetchWithCache(`/api/satinfo?satnum=${sat.satnum}`);
        setSelectedSatellite({ ...info, latitude: sat.latitude, longitude: sat.longitude, altitude: sat.altitude });
      }}
    >
      <sphereGeometry args={[0.004, 8, 8]} />
      <meshBasicMaterial color={SATELLITE_COLORS.OneWeb} />
    </instancedMesh>
  );
}
/* -------------------- Active HANDLER -------------------- */
function TLEMarkers({ visible, selectedCountries, setSelectedSatellite, onLoaded }) {
  const meshRef = useRef();
  const [data, setData] = useState([]);
  const hasLoadedOnce = useRef(false);

  useEffect(() => {
    async function fetchActive() {
      try {
        const res = await fetchWithCache("/api/active");
        setData(res);
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
  }, []);

  const filtered = data.filter(
    (s) =>
      s &&
      s.cartesian &&
      s.cartesian.x !== undefined &&
      (selectedCountries.length === 0 ||
        selectedCountries.includes(s.country?.toUpperCase()))
  );

  const [temp] = useState(() => new THREE.Object3D());

  useEffect(() => {
    if (meshRef.current && data.length > 0) {
      temp.scale.set(1, 1, 1);
      temp.rotation.set(0, 0, 0);
      filtered.forEach((s, i) => {
        temp.position.set(s.cartesian.x * SCALE, s.cartesian.y * SCALE, s.cartesian.z * SCALE);
        temp.updateMatrix();
        meshRef.current.setMatrixAt(i, temp.matrix);
      });
      // Set count to only render/raycast filtered instances
      meshRef.current.count = filtered.length;
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [filtered, data.length]);

  return (
    <instancedMesh key={`tle-${data.length}`} ref={meshRef} args={[null, null, data.length]} visible={visible}
      onClick={async (e) => {
        e.stopPropagation();
        const sat = filtered[e.instanceId];
        if (!sat) return;
        const info = await fetchWithCache(`/api/satinfo?satnum=${sat.satnum}`);
        setSelectedSatellite({ ...info, latitude: sat.latitude, longitude: sat.longitude, altitude: sat.altitude });
      }}
    >
      <sphereGeometry args={[0.006, 8, 8]} />
      <meshBasicMaterial color={SATELLITE_COLORS.TLE} />
    </instancedMesh>
  );
}

/* -------------------- ORBITAL PATH -------------------- */
function OrbitalPath({ selectedSatellite }) {
  const [points, setPoints] = useState([]);

  useEffect(() => {
    if (!selectedSatellite?.line1 || !selectedSatellite?.line2) {
      setPoints([]);
      return;
    }

    const satrec = satellite.twoline2satrec(selectedSatellite.line1, selectedSatellite.line2);
    const pathPoints = [];
    const now = new Date();

    // Propagate 120 minutes for a fuller view
    for (let i = 0; i <= 120; i += 2) {
      const time = new Date(now.getTime() + i * 60 * 1000);
      const gmst = satellite.gstime(time);
      const pv = satellite.propagate(satrec, time);

      if (pv?.position) {
        const gd = satellite.eciToGeodetic(pv.position, gmst);
        const lat = satellite.radiansToDegrees(gd.latitude);
        const lon = satellite.radiansToDegrees(gd.longitude);
        const alt = gd.height;
        const pos = getSatelliteCartesian(lat, lon, alt);
        pathPoints.push(new THREE.Vector3(pos.x * SCALE, pos.y * SCALE, pos.z * SCALE));
      }
    }
    setPoints(pathPoints);
  }, [selectedSatellite]);

  if (points.length < 2) return null;

  return (
    <group>
      {/* Outer Glow */}
      <Line
        points={points}
        color="#00ffff"
        lineWidth={4}
        transparent
        opacity={0.15}
      />
      {/* Middle Glow */}
      <Line
        points={points}
        color="#00ffff"
        lineWidth={2}
        transparent
        opacity={0.3}
      />
      {/* Core Line */}
      <Line
        points={points}
        color="#ffffff"
        lineWidth={0.5}
        transparent
        opacity={0.8}
      />
    </group>
  );
}

/* -------------------- GLOBAL SEARCH -------------------- */
function GlobalSearch({ setSelectedSatellite, setIsFollowing }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data);
        setShowDropdown(true);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <div className="fixed top-24 left-6 z-50 w-64 pointer-events-auto">
      <div className="relative group/search">
        <input
          type="text"
          placeholder="Search Satellites..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setShowDropdown(true)}
          className="
            w-full bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl px-5 py-3 text-sm text-white
            focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20
            transition-all placeholder:text-white/20 shadow-2xl
          "
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center space-x-2">
          {isSearching ? (
            <div className="w-3 h-3 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          ) : (
            <svg
              className="text-white/20 group-focus-within/search:text-cyan-500/50 transition-colors"
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showDropdown && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 8, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="
              absolute top-full left-0 right-0 
              bg-[#0a0a0a] border border-white/10 rounded-2xl 
              overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.9)] 
              z-50 py-2 border-t-cyan-500/30
            "
          >
            {results.map((sat) => (
              <button
                key={sat.satnum}
                onClick={() => {
                  setSelectedSatellite(sat);
                  setIsFollowing(true);
                  setShowDropdown(false);
                  setQuery("");
                }}
                className="
                  w-full px-5 py-3 text-left hover:bg-white/5 transition-colors
                  flex items-center justify-between group
                "
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-white/80 group-hover:text-cyan-400 transition-colors line-clamp-1">
                    {sat.name}
                  </span>
                  <span className="text-[10px] text-white/30 uppercase tracking-widest">
                    NORAD {sat.satnum}
                  </span>
                </div>
                <svg
                  className="text-white/0 group-hover:text-cyan-500/50 transition-all -translate-x-2 group-hover:translate-x-0"
                  width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* -------------------- ZOOM HANDLER -------------------- */
function CameraHandler({ selectedSatellite, isFollowing, setIsFollowing }) {
  const { camera } = useThree();
  const [zoom, setZoom] = useState(6);
  const satrecRef = useRef(null);

  useEffect(() => {
    if (selectedSatellite?.line1 && selectedSatellite?.line2) {
      satrecRef.current = satellite.twoline2satrec(selectedSatellite.line1, selectedSatellite.line2);
    } else {
      satrecRef.current = null;
    }
  }, [selectedSatellite]);

  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const currentLookAt = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((state, delta) => {
    if (isFollowing && satrecRef.current) {
      const nowDate = new Date();
      const gmst = satellite.gstime(nowDate);
      const pv = satellite.propagate(satrecRef.current, nowDate);

      if (pv?.position) {
        const gd = satellite.eciToGeodetic(pv.position, gmst);
        const lat = satellite.radiansToDegrees(gd.latitude);
        const lon = satellite.radiansToDegrees(gd.longitude);
        const alt = gd.height;
        const pos = getSatelliteCartesian(lat, lon, alt);

        targetLookAt.current.set(pos.x * SCALE, pos.y * SCALE, pos.z * SCALE);
      }
    } else {
      targetLookAt.current.set(0, 0, 0);
    }

    // Smoothly lerp the lookAt target
    currentLookAt.current.lerp(targetLookAt.current, 0.1);
    camera.lookAt(currentLookAt.current);
  });

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
  const [isFollowing, setIsFollowing] = useState(false);

  const satelliteLayers = [
    { id: 'iss', label: 'ISS', state: showISS, setter: setShowISS, color: SATELLITE_COLORS.ISS },
    { id: 'starlink', label: 'Starlink', state: showStarlink, setter: setShowStarlink, color: SATELLITE_COLORS.Starlink },
    { id: 'beidou', label: 'Beidou', state: showBeidou, setter: setShowBeidou, color: SATELLITE_COLORS.Beidou },
    { id: 'globalstar', label: 'GlobalStar', state: showGlobalStar, setter: setShowGlobalStar, color: SATELLITE_COLORS.GlobalStar },
    { id: 'glonass', label: 'Glonass', state: showGlonass, setter: setShowGlonass, color: SATELLITE_COLORS.Glonass },
    { id: 'gps', label: 'GPS', state: showGPS, setter: setShowGPS, color: SATELLITE_COLORS.GPS },
    { id: 'iridium', label: 'Iridium', state: showIridium, setter: setShowIridium, color: SATELLITE_COLORS.Iridium },
    { id: 'oneweb', label: 'OneWeb', state: showOneWeb, setter: setShowOneWeb, color: SATELLITE_COLORS.OneWeb },
    { id: 'tle', label: 'Other Active', state: showTLE, setter: setShowTLE, color: SATELLITE_COLORS.TLE },
  ];

  //not used anymore
  useEffect(() => {
    async function fetchCountries() {
      try {
        const data = await fetchWithCache("/api/active");

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
      <GlobalSearch setSelectedSatellite={setSelectedSatellite} setIsFollowing={setIsFollowing} />

      <AnimatePresence>
        {selectedSatellite && (
          <motion.div
            initial={{ opacity: 0, y: 100, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 100, x: "-50%" }}
            className="
              fixed bottom-8 left-1/2
              glass-panel text-white p-5 rounded-2xl shadow-2xl
              w-[380px] z-50
            "
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">{selectedSatellite.name}</h2>
                <div className="flex items-center space-x-2">
                  <p className="text-white/50 text-sm">Orbital Parameters</p>
                  <button
                    onClick={() => setIsFollowing(!isFollowing)}
                    className={`
                      text-[10px] px-2 py-0.5 rounded-full border transition-all uppercase tracking-tighter
                      ${isFollowing
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 shadow-[0_0_10px_rgba(0,163,255,0.3)]'
                        : 'bg-white/5 border-white/10 text-white/30 hover:text-white/60'}
                    `}
                  >
                    {isFollowing ? 'Target Locked' : 'Lock Target'}
                  </button>
                </div>
              </div>
              <button
                onClick={() => setSelectedSatellite(null)}
                className="hover:bg-white/10 p-1 rounded-full transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm mt-2">
              <div className="glass-item p-2 rounded-lg">
                <span className="text-white/40 block text-xs uppercase">Year</span>
                <span className="font-mono">{selectedSatellite.intldes_year}</span>
              </div>
              <div className="glass-item p-2 rounded-lg">
                <span className="text-white/40 block text-xs uppercase">Altitude</span>
                <span className="font-mono">{selectedSatellite.altitude?.toFixed(1)} km</span>
              </div>
              <div className="glass-item p-2 rounded-lg">
                <span className="text-white/40 block text-xs uppercase">Latitude</span>
                <span className="font-mono">{selectedSatellite.latitude?.toFixed(4)}°</span>
              </div>
              <div className="glass-item p-2 rounded-lg">
                <span className="text-white/40 block text-xs uppercase">Longitude</span>
                <span className="font-mono">{selectedSatellite.longitude?.toFixed(4)}°</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-3 gap-2 text-[10px] text-center uppercase tracking-widest text-white/30">
              <div>INC: {selectedSatellite.inclination_deg?.toFixed(1)}°</div>
              <div>ECC: {selectedSatellite.eccentricity}</div>
              <div>RAAN: {selectedSatellite.raan_deg?.toFixed(1)}°</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Satellite Control Center  --- */}
      <div className="fixed top-1/2 -translate-y-1/2 left-6 z-40 flex items-center pointer-events-none">
        <motion.div
          initial={false}
          animate={{ x: panelOpen ? 0 : -20, opacity: panelOpen ? 1 : 0 }}
          className={`
            pointer-events-auto glass-panel rounded-3xl overflow-hidden
            transition-all duration-500 ease-in-out
          `}
          style={{
            width: panelOpen ? "16rem" : "0",
            boxShadow: panelOpen ? "0 20px 50px rgba(0,0,0,0.5)" : "none"
          }}
        >
          <div className="p-6 space-y-6">
            <div className="border-b border-white/10 pb-4">
              <p className="text-[10px] text-white/40 leading-tight uppercase tracking-widest font-bold">Constellations</p>
            </div>

            <div className="space-y-3">
              {satelliteLayers.map((layer) => (
                <div
                  key={layer.id}
                  className="flex items-center justify-between group cursor-pointer"
                  onClick={() => layer.setter(!layer.state)}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                      style={{
                        backgroundColor: layer.color,
                        boxShadow: layer.state ? `0 0 12px ${layer.color}` : 'none',
                        opacity: layer.state ? 1 : 0.3
                      }}
                    />
                    <span className={`text-sm transition-colors ${layer.state ? 'text-white' : 'text-white/30'}`}>
                      {layer.label}
                    </span>
                  </div>

                  <div className="relative inline-block w-8 h-4 transition duration-200 ease-in-out bg-white/10 rounded-full">
                    <input
                      type="checkbox"
                      checked={layer.state}
                      onChange={() => { }}
                      className="absolute opacity-0 w-0 h-0"
                    />
                    <div
                      className={`absolute left-1 top-1 w-2 h-2 rounded-full transition-transform duration-200 ease-in-out ${layer.state ? 'translate-x-4' : 'bg-white/20'
                        }`}
                      style={{ backgroundColor: layer.state ? layer.color : undefined }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-white/10">
              <p className="text-[10px] text-white/20 leading-tight">
                Real-time orbital propagation using SGP4/TLE model.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Toggle button*/}
        <motion.button
          whileHover={{ scale: 1.1, x: 5 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setPanelOpen(!panelOpen)}
          className="
            pointer-events-auto ml-2 flex items-center justify-center
            w-10 h-24 glass-panel rounded-2xl text-white/60 hover:text-white
            transition-colors group
          "
        >
          <div className="flex flex-col items-center space-y-1">
            <div className={`w-1 h-1 rounded-full bg-current transition-all ${panelOpen ? 'scale-150' : 'opacity-50'}`} />
            <div className={`w-1 h-1 rounded-full bg-current transition-all ${panelOpen ? 'scale-150' : 'opacity-50'}`} />
            <div className={`w-1 h-1 rounded-full bg-current transition-all ${panelOpen ? 'scale-150' : 'opacity-50'}`} />
          </div>
        </motion.button>
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
          <p className="serif-font text-xl mb-6 animate-pulse">Loading Vigil</p>

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
                <circle cx="0" cy="0" r="6" className="spinner-dot-1" />
                <circle cx="0" cy="0" r="6" className="spinner-dot-2" />
                <circle cx="0" cy="0" r="6" className="spinner-dot-3" />
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
          <ISSMarker visible={showISS} setSelectedSatellite={setSelectedSatellite} onLoaded={onLoaded} />
          <StarlinkMarkers visible={showStarlink} setSelectedSatellite={setSelectedSatellite} onLoaded={onLoaded} />
          <BeidouMarkers visible={showBeidou} setSelectedSatellite={setSelectedSatellite} onLoaded={onLoaded} />
          <GlobalStarMarkers visible={showGlobalStar} setSelectedSatellite={setSelectedSatellite} onLoaded={onLoaded} />
          <GlonassMarkers visible={showGlonass} setSelectedSatellite={setSelectedSatellite} onLoaded={onLoaded} />
          <GPSMarkers visible={showGPS} setSelectedSatellite={setSelectedSatellite} onLoaded={onLoaded} />
          <IridiumMarkers visible={showIridium} setSelectedSatellite={setSelectedSatellite} onLoaded={onLoaded} />
          <OneWebMarkers visible={showOneWeb} setSelectedSatellite={setSelectedSatellite} onLoaded={onLoaded} />
          <TLEMarkers visible={showTLE} selectedCountries={selectedCountries} setSelectedSatellite={setSelectedSatellite} onLoaded={onLoaded} />
          <OrbitalPath selectedSatellite={selectedSatellite} />
        </Earth>
        <CameraHandler
          selectedSatellite={selectedSatellite}
          isFollowing={isFollowing}
          setIsFollowing={setIsFollowing}
        />
      </Canvas>
    </div>
  );
}
