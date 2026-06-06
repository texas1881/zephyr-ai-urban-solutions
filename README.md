# Zephyr

AI-powered urban monitoring and municipal decision support platform developed for **Cursor Hackathon 2026 — AI Driven Urban Solutions**.

Zephyr helps municipalities monitor public spaces and make faster, data-driven decisions while staying fully privacy-compliant.

## Team

| Role | Members |
|------|---------|
| Web Developer | Mert Ali Işık, Yunus Emre Günaydın |
| Mobile Developer | Asaf Güner |
| Documentation Writer | Ege Dündar |
| Backend / AI | Mert Ali Işık, Yunus Emre Günaydın |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js, TypeScript |
| Mobile | Expo |
| Backend | Golang (masterfabric-go architecture) |
| AI | Hugging Face models, Computer Vision |
| Deployment | Vercel, Render |
| Data | Google Street View API |

## Architecture

The project follows a **feature-first** structure to keep components small and business logic separated from the UI.

```
web/
├─ app/
├─ features/
├─ components/
├─ services/
├─ lib/
└─ types/
```

APIs are REST-based with a consistent response envelope:

```json
{ "success": true, "data": {} }
```

## Privacy

Zephyr is designed to be **KVKK-compliant**. It never implements face recognition, person tracking, vehicle tracking, or plate recognition.

## AI Usage

This project was built with Cursor. Cursor rules, prompts, and AI workflow are documented in [`.cursor/rules/hackathon-rules.mdc`](.cursor/rules/hackathon-rules.mdc).
