# 🎃 FROST CARTEL

> **A cinematic, horror-themed competitive multiplayer gaming platform engineered for high-stakes tournament events.**

[![FROST CARTEL CI](https://github.com/Ananya-124/The-Frost-Cartel/actions/workflows/ci.yml/badge.svg)](https://github.com/Ananya-124/The-Frost-Cartel)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x%20%2F%207.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React 19](https://img.shields.io/badge/React-19.x-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Express 5](https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/SQLite-WAL%20Mode-003B57?logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Tests Passing](https://img.shields.io/badge/Tests-43%2F43%20Passing-brightgreen)](https://vitest.dev/)
[![Oxlint Clean](https://img.shields.io/badge/Oxlint-0%20Warnings-brightgreen)](https://oxc.rs/)

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Architecture & Key Features](#-architecture--key-features)
- [Tournament Gameplay (Round 1)](#-tournament-gameplay-round-1)
- [Quick Start](#-quick-start)
- [Credentials Roster](#-credentials-roster)
- [Security Posture](#-security-posture)
- [Verification & Testing](#-verification--testing)
- [Project Documentation](#-project-documentation)

---

## 🏛 Overview

**FROST CARTEL** is a browser-based, synchronized tournament gaming platform designed for 2-player squad collaboration. Teams authenticate using organizer-issued ritual passkeys to enter the haunted grounds, investigate occult relics, decipher ancient crypt diaries, and conquer the graveyard before the authoritative event countdown runs dry.

The platform provides a strict separation of concerns between the **Public Player Experience** and the **Hardened Organizer Vault**.

---

## ⚡ Architecture & Key Features

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FROST CARTEL RUNTIME                          │
└─────────────────────────────────────────────────────────────────────────┘
                    ▲                                 ▲
                    │                                 │
     ┌──────────────┴──────────────┐   ┌──────────────┴──────────────┐
     │    PLAYER PORTAL  (/)       │   │   ADMIN VAULT  (/admin)     │
     │  - Gothic crypt gates       │   │  - Unlinked secret route    │
     │  - Squad authentication     │   │  - Team roster CRUD         │
     │  - Arched dashboard         │   │  - Real-time timer control  │
     │  - Stage 1, 2, 3 gameplay   │   │  - Standings & CSV export   │
     └──────────────┬──────────────┘   └──────────────┬──────────────┘
                    │                                 │
                    ▼                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│               AUTHORITATIVE BACKEND (Express 5 @ Port 3001)             │
│  - HttpOnly Cookie Sessions    - scrypt Password Hashing                │
│  - Authoritative 22-min Timer  - Atomic Transaction Scoring (500 CR)    │
│  - Real-time SSE Multiplexer   - Append-only Audit Trail                │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│               DURABLE PERSISTENCE (Node 26 native SQLite)               │
│  - database/frost_cartel.db (WAL Mode, Foreign Key Cascades)            │
│  - Survives page reloads, browser restarts, and process crashes         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1. Dual-Portal System
- **Player Portal (`/`)**: Atmospheric landing with three runic circular crypt gates, dynamic audio ambiance, squad authentication, and cinematic team entrance.
- **Admin Control Vault (`/admin` / `#/admin`)**: Completely unlinked on the public home page. Hardened behind authentication with live metrics, team pause/resume, credential generation, and score realignments.

### 2. Permanent Authoritative Persistence
- Backed by Node.js native `node:sqlite` (`database/frost_cartel.db`) operating in high-performance **Write-Ahead Logging (WAL)** mode.
- Teams created by organizers persist across browser close, page refresh, and server restarts.
- Append-only transactional audit trail in `score_transactions`.

### 3. Real-Time Multiplayer Sync
- Built-in **Server-Sent Events (SSE)** endpoint (`/api/events/stream`) synchronizes credit balances and stage completions across teammates in real-time.

---

## 🎮 Tournament Gameplay (Round 1)

**Round 01: The Graveyard Escape** features 500 total available credits across three distinct challenges:

| Stage | Name | Credits | Status & Mechanics |
| :---: | :--- | :---: | :--- |
| **01** | **The Unknown Challenge** | `100 CR` | *Not Configured* (Reserved for custom organizer challenge) |
| **02** | **The Haunted Image Hunt** | `150 CR` | Scattered detective evidence desk with 8 photographs, zoomable inspection, 12 cursed relics, and -15 CR hint penalties. |
| **03** | **The Forgotten Graveyard** | `250 CR` | Atmospheric cemetery with three interactive open coffins (Grave I: Marked Remains, Grave II: Buried Diary, Grave III: Final Testament), runestone decoding, and a full-throttle horror jump scare upon final answer submission. |

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js `v22.0.0` or higher (`v26.5.0` recommended)
- npm `v10.0.0` or higher

### 2. Setup
```bash
# Clone the repository
git clone https://github.com/Ananya-124/The-Frost-Cartel.git
cd "winter arc"

# Install dependencies
npm install

# Initialize environment variables
cp .env.example .env
```

### 3. Run Development Servers
In terminal 1 (Authoritative Backend on Port 3001):
```bash
npm run server
```

In terminal 2 (Vite Frontend on Port 5173):
```bash
npm run dev
```

Visit `http://127.0.0.1:5173` in your browser.

---

## 🔑 Credentials Roster

### Organizer Vault (`http://127.0.0.1:5173/#/admin`)
- **Username**: `admin123`
- **Temporary Password**: `admin@1`
- *Note: Hardened route. Password change required on first login.*

### Pre-Seeded Tournament Squads (`http://127.0.0.1:5173/`)
- `TEAM AI` / `SQUAD@AI9`
- `TEAM1` / `TEAM1@2026`
- `Shadow Syndicate` / `SHADOW#88`
- `Grave Walkers` / `GRAVE#44`
- `Cursed Alchemists` / `ALCHEMY!22`

*(New squads can be created at any time in the Admin Vault and will persist indefinitely.)*

---

## 🛡 Security Posture

- **Admin Unlinked**: Zero references, links, or buttons to `/admin` exist on the public homepage.
- **Scrypt Password Hashing**: Passwords stored using `node:crypto.scryptSync` with unique 16-byte random salts.
- **Timing-Safe Checks**: Equal-time verification with `crypto.timingSafeEqual` prevents timing side-channel attacks.
- **HttpOnly Cookies**: Admin and team session tokens stored in HttpOnly, SameSite=Lax cookies.
- **100% Parameterized SQL**: Zero string interpolation; immunity to SQL injection.
- **Atomic Scoring**: Database transactions enforce credit ceilings (maximum 500 CR).

---

## 🧪 Verification & Testing

```bash
# Run code quality AST linter (Oxlint)
npm run lint

# Run automated unit, integration, and durability test suites (Vitest)
npm test

# Build production bundle
npm run build
```

### Verification Matrix
- ✅ **Linter**: 0 warnings, 0 errors across 93 files
- ✅ **Tests**: 43 / 43 tests passing (100% green)
- ✅ **Build**: Minified production build completed in 1.58s
- ✅ **Responsiveness**: Certified at 1280x720, 1366x768, 1440x900, 1536x864, 1920x1080, and 390x844 mobile.

---

## 📚 Project Documentation

Detailed technical manuals are available in the [`docs/`](./docs) directory:
- [**Development & Operations Guide**](./docs/DEVELOPMENT_GUIDE.md): Setup, configuration, and workflows.
- [**Architecture & Project Structure**](./docs/PROJECT_STRUCTURE.md): Comprehensive module breakdown.
- [**Security Hardening & Threat Model**](./docs/SECURITY_GUIDE.md): Cryptography, sessions, and isolation.
- [**Final A to Z Release Audit Report**](./docs/FINAL_A_TO_Z_RELEASE_AUDIT.md): Inventory table and hardening evidence.

---

## ⚖ License

Proprietary — Built exclusively for the FROST CARTEL Tournament. All rights reserved.
