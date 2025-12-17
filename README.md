# SafePH – Web Emergency & First Aid Companion

SafePH is a multilingual emergency and first-aid companion app built for the Philippine context. It provides a simple SOS flow, structured first-aid guides with videos, a live map with disaster information, and an emergency history timeline, all implemented as a modern web app. [file:1]

> Stack: **Next.js (App Router) · React 18 · TypeScript · Prisma · PostgreSQL · Vercel · Leaflet · Tailwind** [file:1]

---

## Features

- **SOS Dashboard**
  - Prominent SOS button with animated sending state and confirmation.
  - Simulated SMS/push notification copy plus location-sharing explanation.
  - Quick actions: Share Location, Disaster Alerts, Quick Dial to emergency contacts. [file:1]

- **First-Aid Guides**
  - Searchable catalog (CPR, choking, severe bleeding, burns, fractures, sprains, head injury, hypothermia, drowning, seizures, stroke, typhoon, etc.).
  - Per-guide detail view: full description, YouTube thumbnail + link, and numbered step-by-step instructions.
  - Guide views logged to history for later review. [file:1]

- **Map & Disaster Alerts**
  - Leaflet + OpenStreetMap live map (geolocation-centered when permitted).
  - Evacuation routes and hazard overlay sections (layout ready for more layers).
  - Disaster alerts fetched from `/api/alerts` using user coordinates; handles “no alerts” and failure states. [file:1]

- **Emergency History**
  - Timeline of SOS alerts and viewed guides, combined into a unified history model.
  - Summary cards: SOS count, total events, resolved percent (prototype uses 100%).
  - Filter support: All / SOS Alerts / Calls / Disaster. [file:1]

- **Settings & Multilingual UI**
  - Language selector: **English**, **Tagalog**, **Cebuano**.
  - All strings defined in a centralized `translations` object and auto-switched based on the active language.
  - Emergency contacts presets (e.g., PNP, BFP, Red Cross, NDRRMC) with `tel:` quick dial links. [file:1]

---

## Tech Stack

- **Frontend**
  - Next.js (App Router) + React 18
  - TypeScript (strict)
  - Tailwind CSS + Lucide Icons [file:1]

- **Mapping & Geolocation**
  - Leaflet for interactive map (`LiveMap` component)
  - OpenStreetMap tiles
  - Browser Geolocation API (with graceful fallbacks) [file:1]

- **Backend / Data**
  - Next.js API Routes (serverless on Vercel)
  - Prisma ORM
  - PostgreSQL (Vercel Postgres or external instance)
  - Example endpoints:
    - `GET /api/history` – load emergency + guide history
    - `POST /api/history/emergency` – log SOS / emergency events
    - `POST /api/history/guide` – log guide views
    - `GET /api/alerts` – fetch disaster alerts by `lat` / `lng` [file:1]

---

## Architecture Overview

- `EmergencyApp` is the main shell component that manages global state:
  - `activeTab`, `sosActive`, `selectedGuide`, `searchTerm`, `lastSharedLocation`,
    `disasterAlerts`, `emergencyHistory`, `guideHistory`, `historyFilter`, and `language`. [file:1]
- Tabs (Home, Guides, Map, History, Settings) are rendered via helpers:
  - `renderHome`, `renderGuides`, `renderMap`, `renderHistory`, `renderSettings`. [file:1]
- History is normalized through a `combinedHistory` array of `HistoryEvent` objects,
  with a `kind` discriminator: `sos`, `call`, `disaster`, `guide`, `other`. [file:1]
- All UI text is centralized in `translations: Record<Language, Record<string, string>>`,
  so changing `language` instantly localizes the entire app. Guides are also built from
  these translation strings. [file:1]

### Core Types (simplified)
type GuideStep = {
stepNumber: number;
title: string;
description: string;
};

type FirstAidGuide = {
id: string;
title: string;
category: 'Critical' | 'Injury' | 'Disaster' | 'Medical';
updated: string;
shortDescription: string;
fullDescription: string;
steps: GuideStep[];
thumbnail: string;
videoUrl: string;
};

type EmergencyHistoryItem = {
icon: React.ComponentType;
time: React.ReactNode;
id: number;
type: string;
date: string;
location: string;
status: string;
responders: string;
color: 'red' | 'blue' | 'green' | 'orange';
createdAt: string;
category: 'sos' | 'call' | 'disaster' | 'other';
};

type GuideHistoryItem = {
id: number;
guideId: string;
guideTitle: string;
viewedAt: string;
createdAt: string;
};

type HistoryEventKind = 'sos' | 'call' | 'disaster' | 'guide' | 'other';

type HistoryEvent = {
id: number;
kind: HistoryEventKind;
icon: React.ComponentType;
title: string;
description?: string;
date: string;
location?: string;
status?: string;
responders?: string;
};

type Language = 'en' | 'tl' | 'ceb';


[file:1]

---

## Key Flows

### SOS Flow

- `handleSOSPress`:
  - Sets `sosActive = true`.
  - Creates a new `EmergencyHistoryItem` (e.g., type `"SOS Alert"`, location `"Lapu-Lapu City, Cebu"`, responders `"PNP Emergency, Red Cross"`, status `"Resolved"`). [file:1]
  - Optimistically adds it to `emergencyHistory` state.
  - `POST http://localhost:3000/api/history/emergency` with the new item (adjust base URL for prod).
  - Resets `sosActive` and shows `t.sossent` confirmation. [file:1]

### Location & Alerts

- `handleShareLocation`:
  - Uses `navigator.geolocation`.
  - On success: stores `lat,lng` in `lastSharedLocation` and shows a simulated “Location shared” alert.
  - On error: shows `t.geounableLocation`. [file:1]

- `handleFetchDisasterAlerts`:
  - Requires geolocation; fetches `/api/alerts?lat=…&lng=…`.
  - Maps `data.alerts` to human-readable lines.
  - Uses localized alerts for “no active alerts”, “loaded”, and “failed” cases. [file:1]

### Guides

- `firstAidGuides: FirstAidGuide[]` is assembled from translation keys:
  - Topics include CPR, choking, severe bleeding, burns, fractures, sprains/strains,
    head injury, hypothermia, drowning, seizures, stroke, and typhoon readiness. [file:1]
- `renderGuides`:
  - Filters guides by `searchTerm` across title, category, short, and full descriptions.
  - Shows “Showing X of Y guides” plus a “No guides found…” message when empty. [file:1]
- `handleOpenGuide`:
  - Sets `selectedGuide`.
  - Appends a `GuideHistoryItem` to `guideHistory`.
  - `POST /api/history/guide` with the new guide history record. [file:1]

### Map / LiveMap

- `LiveMap`:
  - Dynamically imports `leaflet` on the client.
  - Initializes a map, sets a default center, then attempts to recenter on real geolocation and add a “You are here” marker.
  - Cleans up Leaflet instance on unmount. [file:1]

### History

- On mount, a `useEffect` calls `GET /api/history`:
  - Normalizes emergency history into `EmergencyHistoryItem[]`.
  - Normalizes guide history into `GuideHistoryItem[]`.
- `combinedHistory` merges both and sorts by date descending.
- `historyFilter` controls which `kind` values are visible (all, sos, call, disaster). [file:1]

### Settings / Language

- Language toggles: `setLanguage('en' | 'tl' | 'ceb')`.
- Active language button is highlighted.
- Because all UI text and guides read from `translations[language]`, the full interface re-localizes instantly. [file:1]

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm / yarn / npm
- PostgreSQL instance
- (Optional) Vercel account for deployment [file:1]

### Setup

install dependencies
pnpm install # or yarn / npm install

copy env and configure Prisma/Postgres
cp .env.example .env

set DATABASE_URL, etc.
run migrations
pnpm prisma migrate dev

start dev server
pnpm dev

app runs on http://localhost:3000

API calls are currently pointed at `http://localhost:3000/api/...`. Update these or use relative URLs if deploying behind another domain. [file:1]

---

## Suggested Project Structure

app/
page.tsx # Entry, renders <EmergencyApp />
api/
history/
route.ts # GET/POST history
alerts/
route.ts # GET alerts by lat/lng
components/
EmergencyApp.tsx # Main UI shell and logic
LiveMap.tsx # Leaflet map wrapper
...
prisma/
schema.prisma # Prisma models
public/
SafePH.png # Logo and static assets


[file:1]

---

## Limitations / TODO

- Alerts and outbound notifications (SMS/push) are simulated; no real gateway integration yet.
- History and alerts endpoints are demo-oriented and may need schema changes for production.
- No authentication / multi-tenant logic implemented.
- No formal performance/usability testing has been done. [file:1]

Planned enhancements:

- Real SMS or messaging integration for SOS.
- More complete hazard overlays (e.g., weather, flood, PAGASA/NDRRMC data).
- Authentication and per-user history separation.
- Formal usability and accessibility audits. [file:1]

---

## Disclaimer & License

SafePH is a prototype / educational project and **does not replace professional medical advice or official emergency systems**. Always contact local emergency services in real emergencies. [file:1]

Add your chosen open-source license here (e.g., MIT).

