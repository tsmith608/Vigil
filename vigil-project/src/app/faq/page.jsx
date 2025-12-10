import Header from "@/components/Header";
import Footer from "@/components/Footer";


export default function FAQPage() {
  return (
    <div className="p-12 text-white science">
      <Header />

      <h1 className="text-3xl font-bold mb-6">Frequently Asked Questions</h1>

      {/* Question 1 */}
      <div className="mb-6">
        <h2 className="asrocuus text-xl mb-2">
          ▸ Where does Vigil get satellite data?
        </h2>
        <p className="asrocuus text-lg leading-relaxed">
          Vigil pulls Two-Line Element (TLE) sets directly from{" "}
          CelesTrak. These TLEs are parsed,
          propagated using satellite.js, and
          stored in a PostgreSQL database for fast querying.
        </p>
      </div>

      {/* Question 2 */}
      <div className="mb-6">
        <h2 className="asrocuus text-xl mb-2">
          ▸ How accurate are the satellite positions?
        </h2>
        <p className="asrocuus text-lg leading-relaxed">
          Vigil computes positions in real time using the SGP4 propagation
          model, the same algorithm used by aerospace organizations for
          low-Earth-orbit tracking. Position accuracy depends on the freshness
          of the TLE data, typically within a few kilometers for active objects.
        </p>
      </div>


      {/* Question 4 */}
      <div className="mb-6">
        <h2 className="asrocuus text-xl mb-2">
          ▸ What technologies power Vigil?
        </h2>
        <p className="asrocuus text-lg leading-relaxed">
          Vigil is built using:
          <br />– Next.js for routing and API endpoints
          <br />– React Three Fiber / Three.js for 3D rendering
          <br />– Supabase PostgreSQL for satellite storage
          <br />– satellite.js for orbital mechanics
        </p>
      </div>

      {/* Question 5 */}
      <div className="mb-6">
        <h2 className="asrocuus text-xl mb-2">
          ▸ Will Vigil include collision or near-miss detection?
        </h2>
        <p className="asrocuus text-lg leading-relaxed">
          Yes — future updates plan to incorporate vector-based orbital
          prediction models and a “near-miss” detection system to visualize
          potential conjunction events.
        </p>
      </div>


      {/* Question 7 */}
      <div className="mb-6">
        <h2 className="asrocuus text-xl mb-2">
          ▸ Does Vigil track classified or military satellites?
        </h2>
        <p className="asrocuus text-lg leading-relaxed">
          Vigil only displays satellites with public TLEs. Classified, restricted,
          or non-listed spacecraft will not appear in the visualization.
        </p>
      </div>
    </div>
  );
}
