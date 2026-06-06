# Zephyr

> AI-powered urban cleanliness analysis platform — built for **Cursor Hackathon 2026: AI-Driven Urban Solutions**.

Zephyr helps municipalities improve their environmental cleaning operations. Using computer vision models trained on Hugging Face datasets, Zephyr detects litter and environmental pollution on the ground from street imagery, calculates **garbage density**, builds a **cleaning-priority map**, and helps municipalities plan their cleaning operations more efficiently.

The entire system is **KVKK-compliant**: it analyzes only inanimate public objects (litter, trash, polluted areas). It performs **no** face recognition, plate reading, or person/vehicle tracking.

## Problem

Municipal cleaning crews often work on fixed routes without real-time insight into where pollution actually accumulates. This wastes time and budget while some areas stay dirty longer than they should.

## Solution

Zephyr turns public street imagery into actionable cleaning priorities:

1. **Collect** — street/environment images are pulled via the Google Street View API.
2. **Anonymize** — any human faces and vehicle plates are irreversibly blurred before any processing (KVKK requirement).
3. **Detect** — a computer-vision model (Hugging Face) detects litter and environmental pollution.
4. **Score** — Zephyr computes a garbage-density score per location.
5. **Prioritize** — locations are ranked into a cleaning-priority list / map.
6. **Present** — results are served through a Next.js web panel and an Expo mobile app.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Web | Next.js + TypeScript |
| Mobile | Expo |
| Backend | Go (Golang) — **masterfabric-go** architecture (mandatory) |
| AI / CV | Hugging Face models, Computer Vision |
| Data source | Google Street View API |
| Hosting | Vercel (web), Render.com (backend) |

## Architecture

```
                 ┌─────────────────────┐
                 │  Google Street View  │
                 │        API           │
                 └──────────┬──────────┘
                            │ images
                            ▼
                 ┌─────────────────────┐
                 │   Anonymization      │  faces & plates blurred (KVKK)
                 └──────────┬──────────┘
                            ▼
                 ┌─────────────────────┐
                 │  CV Model (HF)       │  litter / pollution detection
                 └──────────┬──────────┘
                            ▼
        ┌──────────────────────────────────────┐
        │  Go Backend (masterfabric-go)         │
        │  density scoring + priority ranking   │
        └───────────┬───────────────┬──────────┘
                    ▼               ▼
        ┌────────────────┐  ┌────────────────┐
        │  Next.js Web    │  │   Expo Mobile  │
        │  (dashboard)    │  │   (field app)  │
        └────────────────┘  └────────────────┘
```

All HTTP APIs use a consistent REST response envelope:

```json
{ "success": true, "data": {} }
```

```json
{ "success": false, "message": "" }
```

## AI & Cursor Usage

This project is developed entirely inside **Cursor IDE** with an agentic workflow.

- **Cursor Ruleset** — project-wide rules live in [`.cursor/rules/hackathon-rules.mdc`](.cursor/rules/hackathon-rules.mdc) and enforce our stack, feature-first architecture, REST conventions, KVKK rules, and commit discipline. These rules are `alwaysApply: true`, so every agent action follows the hackathon constraints automatically.
- **Prompting** — we use Cursor's agent to scaffold features, generate typed services, and keep the README in sync with the codebase.
- **Hugging Face** — pretrained CV models are fine-tuned / used for litter and pollution detection.

> _This section is kept up to date as the AI workflow evolves, including any Cursor CLI / SDK automation._

## KVKK & Data Privacy

Zephyr is built privacy-first:

- **Purpose limitation** — models target only inanimate urban objects (litter, trash, damaged roads, etc.).
- **No personal data** — no identity detection, face recognition, plate reading, or profiling.
- **Mandatory anonymization** — human faces and vehicle plates are irreversibly blurred before model processing.
- **Data security** — raw imagery is never pushed to public repos or unencrypted storage.
- **Deletion commitment** — all raw images are permanently deleted after the hackathon, documented in writing.

## Repository Structure

```
zephyr-ai-urban-solutions/
├─ web/        # Next.js dashboard
├─ mobile/     # Expo field app
├─ backend/    # Go API (masterfabric-go)
├─ ai/         # CV model training & inference
└─ .cursor/    # Cursor agentic ruleset
```

## Team

| Role | Members |
|------|---------|
| Web Developer | Mert Ali Işık, Yunus Emre Günaydın |
| Mobile Developer | Asaf Güner |
| Documentation Writer | Ege Dündar |
| Backend / AI | Mert Ali Işık, Yunus Emre Günaydın |

## License

Built for Cursor Hackathon 2026.
