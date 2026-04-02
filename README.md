# Julius App — Longevity Dashboard

Next.js Dashboard fuer das Julius Longevity System. Verbindet sich mit Supabase als Backend (Daten kommen vom Julius Telegram Bot).

## Quickstart

```bash
npm install
npm run dev
# → http://localhost:3000
```

## Seiten

| Route | Status | Inhalt |
|-------|--------|--------|
| `/` | Fertig | Home: Score-Ringe, Autophagie-Timer, Makros, Training, Supplements |
| `/ernaehrung` | Fertig | Heute: Mahlzeiten-Feed. Wochenplan + Einkaufsliste Placeholder |
| `/training` | Placeholder | Phase 2 |
| `/schlaf` | Placeholder | Phase 2 |
| `/supplements` | Placeholder | Phase 2 |
| `/profil` | Fertig | Profil-Daten, Familien-Switcher |

## Komponenten

- `BottomNav` — Mobile Bottom + Desktop Sidebar
- `FamilySwitcher` — Pill-Toggle Vincent/Maria
- `ScoreRing` — Animierter SVG Ring
- `MacroBar` — Fortschrittsbalken
- `Card` — Basis Card
- `AutophagieTimer` — Essensfenster Countdown
- `SupplementStatus` — 5 Zeitpunkt-Kreise

## Tech

Next.js 15 + TypeScript + Tailwind + Supabase + Recharts + date-fns + lucide-react
