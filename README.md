# 🌍 Satellite Visualization Tool – Senior Project

## Overview
This project is a **satellite orbit visualization tool** built with **Next.js**.  
It fetches **Starlink TLEs** from [CelesTrak](https://celestrak.org/), parses them,  
and prepares the data for propagation with the [satellite.js](https://github.com/shashwatak/satellite-js) library.  

The long-term goal is to display satellites orbiting Earth on an interactive 3D globe.

---

## ✅ Current Progress
- Set up a **Next.js project** (App Router).   
- Added an API route at /api/iss that:
  - Fetches the ISS TLE from CelesTrak (stations.txt).
  - Runs it through propagateSatellite to return the current position (lat, lon, alt, ECI, velocity).
  
- Added an API route at /api/fullday that:
  - Fetches the ISS TLE from CelesTrak.
  - Calls propagateFullDay to precompute a 24-hour ground track (1-minute step).
  - Returns the full track as JSON for visualization.
- Verified output in the browser (current ISS snapshot + full-day JSON track).
