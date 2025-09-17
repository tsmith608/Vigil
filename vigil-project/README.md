# 🌍 Satellite Visualization Tool – Senior Project

## Overview
This project is a **satellite orbit visualization tool** built with **Next.js**.  
It fetches **Starlink TLEs** from [CelesTrak](https://celestrak.org/), parses them,  
and prepares the data for propagation with the [satellite.js](https://github.com/shashwatak/satellite-js) library.  

The long-term goal is to display satellites orbiting Earth on an interactive 3D globe.

---

## ✅ Current Progress
- Set up a **Next.js project** (App Router).  
- Added an API route at `/api/tle`.  
- Configured it to fetch **Starlink TLE feed** from:  
