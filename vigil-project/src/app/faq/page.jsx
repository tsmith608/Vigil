"use client";
import React, { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { motion, AnimatePresence } from "framer-motion";

function Accordion({ title, children, isOpen, onClick }) {
  return (
    <div className="border-b border-white/5 last:border-0 overflow-hidden">
      <button
        onClick={onClick}
        className="w-full py-6 px-6 flex items-center justify-between text-left hover:bg-white/[0.03] transition-colors group"
      >
        <span className="text-xl md:text-2xl font-light text-gray-300 group-hover:text-white transition-colors">
          {title}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="text-amber-500/80"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="px-6 pb-8 text-lg text-gray-400 leading-relaxed font-light italic border-l-2 border-amber-500/20 ml-6">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const FAQ_DATA = [
  {
    question: "Where does Vigil get satellite data?",
    answer: "Vigil pulls Two-Line Element (TLE) sets directly from CelesTrak. These TLEs are parsed, propagated using satellite.js (SGP4), and stored in our normalized PostgreSQL database for high-performance querying and historical tracking."
  },
  {
    question: "How accurate are the satellite positions?",
    answer: "We compute positions in real-time using the SGP4 propagation model—the aerospace industry standard for low-Earth-orbit tracking. While incredibly precise, accuracy depends on TLE freshness; Vigil refreshes its data pipeline every 2 minutes for active constellations."
  },
  {
    question: "What technologies power the interface?",
    answer: "Vigil is a state-of-the-art WebGL application built with Next.js, React Three Fiber (Three.js), and Framer Motion. Our database layer is powered by Supabase/PostgreSQL, ensuring sub-second response times for complex orbital queries."
  },
  {
    question: "Will Vigil include collision detection?",
    answer: "Yes. Our roadmap includes vector-based orbital prediction models and a 'Conjunction Alert' system. This will allow users to visualize potential near-misses and understand the growing challenges of space debris and orbital traffic management."
  },
  {
    question: "Does Vigil track military satellites?",
    answer: "We adhere strictly to public-domain transparency. Vigil only displays spacecraft with public orbital data (TLEs). Classified or restricted objects that are not listed in international space registries will not appear in the visualization."
  }
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="min-h-screen bg-[#020308] text-white selection:bg-purple-500/30 overflow-hidden relative">
      <Header />

      {/* Star Field Background */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20" />
      </div>

      <main className="relative pt-32 pb-20 px-6 max-w-4xl mx-auto">
        {/* Nebula Glows */}
        <div className="absolute top-40 right-0 w-96 h-96 bg-purple-600/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 left-0 w-80 h-80 bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10"
        >
          <div className="mb-16">
            <h1 className="text-5xl md:text-8xl font-black mb-6 tracking-tighter bg-gradient-to-r from-white via-gray-300 to-gray-600 bg-clip-text text-transparent serif-font italic">
              FAQ
            </h1>
            <p className="text-amber-400/70 text-lg md:text-xl font-light tracking-[0.2em] uppercase max-w-2xl">
              Orbital Mechanics & Platform Intelligence
            </p>
          </div>

          <div className="glass-card rounded-[2rem] border border-white/5 bg-white/[0.02] backdrop-blur-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
            {FAQ_DATA.map((item, index) => (
              <Accordion
                key={index}
                title={item.question}
                isOpen={openIndex === index}
                onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
              >
                {item.answer}
              </Accordion>
            ))}
          </div>

          {/* Call to Action */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-20 p-10 rounded-[2rem] border border-dashed border-white/5 text-center relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

            <p className="text-gray-500 text-xs uppercase tracking-[0.3em] mb-4 font-bold">Inquiries & Collaboration</p>
            <h3 className="text-2xl font-light text-gray-300 mb-6 italic serif-font">Our orbital specialists are ready to assist.</h3>
            <a
              href="mailto:contact@vigil.space"
              className="inline-block text-amber-500/80 hover:text-amber-400 transition-all border-b border-amber-500/20 hover:border-amber-500/50 pb-1 text-sm uppercase tracking-widest font-black"
            >
              Reach out to the team
            </a>
          </motion.div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
