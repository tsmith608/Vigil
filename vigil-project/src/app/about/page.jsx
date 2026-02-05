"use client";
import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";

export default function AboutPage() {
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-[#020308] text-white selection:bg-purple-500/30 overflow-hidden relative">
      <Header />

      {/* Star Field Background */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20" />
      </div>

      <main className="relative pt-32 pb-20 px-6 max-w-5xl mx-auto">
        {/* Nebula Glows */}
        <div className="absolute top-20 left-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-40 right-0 w-[400px] h-[400px] bg-amber-600/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute middle-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-[150px] pointer-events-none" />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="relative z-10"
        >
          {/* Hero Section */}
          <motion.div variants={itemVariants} className="mb-16 text-center">
            <h1 className="text-5xl md:text-8xl font-black mb-6 tracking-tighter bg-gradient-to-b from-white via-gray-300 to-gray-600 bg-clip-text text-transparent italic serif-font">
              About Vigil
            </h1>
            <p className="text-xl md:text-2xl text-amber-400/80 font-light tracking-[0.3em] uppercase">
              The Orbital Intelligence Network
            </p>
          </motion.div>

          {/* Main Content Card */}
          <motion.div
            variants={itemVariants}
            className="glass-card p-8 md:p-12 rounded-[2.5rem] border border-white/5 bg-white/[0.02] backdrop-blur-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] space-y-8 relative overflow-hidden"
          >
            {/* Inner rim glow */}
            <div className="absolute inset-0 border border-white/5 rounded-[2.5rem] pointer-events-none" />

            <section className="space-y-6">
              <p className="text-lg md:text-2xl leading-relaxed text-gray-300 font-light">
                <span className="text-white font-serif italic text-3xl mr-2">Vigil</span>
                is a deep-space visualization layer designed to map the silent architecture of our orbit. As humanity pushes further into the stars, the need to see, understand, and track our robotic emissaries has never been more critical.
              </p>

              <div className="grid md:grid-cols-2 gap-10 py-10">
                <div className="space-y-4 p-6 rounded-2xl bg-white/[0.01] border border-white/5">
                  <h3 className="text-indigo-400 font-black uppercase tracking-widest text-xs">Astrometric Rigor</h3>
                  <p className="text-gray-400 leading-relaxed italic text-sm">
                    Utilizing SGP4 propagation algorithms and high-fidelity TLE data streams, we translate raw physics into a navigable 3D cosmos.
                  </p>
                </div>
                <div className="space-y-4 p-6 rounded-2xl bg-white/[0.01] border border-white/5">
                  <h3 className="text-amber-500 font-black uppercase tracking-widest text-xs">Massive Instanced Rendering</h3>
                  <p className="text-gray-400 leading-relaxed italic text-sm">
                    Engineered to render 10,000+ entities in real-time. Our pipeline leverages modern GPU instancing to ensure the debris and the constellations remain visible and fluid.
                  </p>
                </div>
              </div>

              <p className="text-lg md:text-xl leading-relaxed text-gray-400 font-light">
                Founded as a portal into space situational awareness, Vigil merges the technical precision of aerospace engineering with the artistic clarity of cinematic visualization. We provide the eyes for the next era of orbital transit.
              </p>
            </section>

            {/* Footer / CTA in card */}
            <div className="pt-8 border-t border-white/5 flex flex-wrap gap-4 items-center justify-between">
              <div className="text-xs text-gray-600 uppercase tracking-widest font-bold">
                Orbital Feed: CelesTrak GP • SGP4 Core v2.1
              </div>
              <motion.a
                whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(245, 158, 11, 0.2)" }}
                whileTap={{ scale: 0.98 }}
                href="/"
                className="px-8 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-black tracking-[0.2em] hover:bg-amber-500/20 transition-all uppercase"
              >
                Launch Tracker
              </motion.a>
            </div>
          </motion.div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
