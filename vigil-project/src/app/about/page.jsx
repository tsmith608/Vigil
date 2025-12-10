import Header from "@/components/Header";

export default function AboutPage() {
  return (
    <div className="p-12 text-white science">
      <Header />

      <h1 className="text-3xl font-bold mb-6">About Vigil</h1>

      <p className="asrocuus mb-4 leading-relaxed text-lg">
        <span className="font-bold">Vigil</span> is a real-time satellite
        visualization platform built to make orbital activity intuitive,
        accessible, and visually engaging. Using live orbital mechanics,
        Three.js rendering, and a custom data pipeline powered by
        Supabase/PostgreSQL, Vigil transforms raw TLE data into an
        interactive 3D experience.
      </p>

      <p className="asrocuus mb-4 leading-relaxed text-lg">
        The system continuously ingests Two-Line Element sets from
        <span className="font-bold"> CelesTrak</span>, propagates satellite
        orbits using <span className="font-bold">satellite.js</span>, and
        stores normalized metadata for fast querying. Each satellite is
        rendered as a dynamic object on a 3D globe with accurate position,
        altitude, inclination, eccentricity, and RAAN values.
      </p>

      <p className="asrocuus mb-4 leading-relaxed text-lg">
        Vigil was developed as part of a senior capstone project, with a
        focus on performance, clarity, and real scientific accuracy. The goal
        is to provide an intuitive interface for understanding orbital
        traffic — from massive constellations like Starlink and OneWeb to
        regional GNSS systems such as GPS, GLONASS, Galileo, and BeiDou.
      </p>

      <p className="asrocuus leading-relaxed text-lg">
        Future expansions may include , RAG-powered
        analysis of satellite missions
        and deeper public-facing educational tools.
      </p>
    </div>
  );
}
