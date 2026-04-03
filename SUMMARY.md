# Julius App — Build Summary

## Neue Features

### Block 1: Auto-Macro-Adjustment
- Automatische Anpassung der Tagesziele nach Training
- Kraft/HYROX/CrossFit: +250 kcal, +20g Protein
- Cardio (60min): +300 kcal, +15g Protein
- Home Dashboard zeigt angepasste Ziele mit (+X) Indikator
- Daten: `macro_adjustments` Tabelle

### Block 2: Behavior Journal (`/journal`)
- Quick-Toggle Buttons fuer 8 taegliche Gewohnheiten
- Alkohol, Koffein, Sauna, Meditation, Bildschirm, Supplements, Stress, Outdoor
- Korrelations-Engine vergleicht Journal mit Schlaf/Readiness Scores
- Top-3 Insights nach 7+ Tagen (z.B. "Sauna → +8 Schlaf-Score")
- API: `/api/journal` (GET/POST)

### Block 3: Life Timeline (Home)
- Vertikaler Zeitstrahl 06:00-23:00 auf der Home-Seite
- Events: Mahlzeiten (gruen), Training (orange), Supplements (teal)
- Essensfenster als hinterlegter Bereich
- Pulsierender roter Marker fuer aktuelle Uhrzeit

### Block 4: Muskelgruppen-Heatmap (Training Performance Tab)
- SVG Koerper-Silhouette (Vorder- + Rueckansicht)
- 13 Muskelgruppen mit Farbintensitaet nach 7-Tage Volumen
- Mapping von Sportart zu Muskelgruppen
- Legende und aktive Muskelgruppen-Tags

### Block 5: Dynamische Supplement-Empfehlungen
- 3 Regel-Kategorien: Ernaehrung, Blutwerte, Training
- "Julius empfiehlt" Card im Supplements Tagesplan
- Farbcodiert: gruen (bestaetigt), gelb (Empfehlung), rot (Warnung)
- Beispiele: Omega-3 nach Fisch-Konsum, Vitamin D nach Blutwert

### Block 6: Wochen-Report (`/report`)
- Aggregierte Wochen-Daten mit Score-Ringen
- Training: Sessions, Minuten, RPE, Typ-Verteilung
- Ernaehrung: kcal + Protein Durchschnitt vs Ziel
- Schlaf: Scores + beste Nacht
- Supplements: Compliance-Ring
- "Julius sagt": personalisierte Empfehlungen

### Block 7: Navigation Polish
- Journal in BottomNav integriert
- Wochen-Report Card auf Home verlinkt
- Chat FAB auf allen Seiten

## Alle API Routes

| Route | Methode | Funktion |
|-------|---------|----------|
| `/api/chat` | POST | Claude Chat mit Konversations-History |
| `/api/training` | POST/GET | Training loggen + Macro-Adjustment |
| `/api/nutrition` | POST | Mahlzeit via Text/Foto analysieren |
| `/api/supplements` | POST/GET | Supplement-Einnahme loggen |
| `/api/journal` | POST/GET | Taegliches Verhaltenstagebuch |
| `/api/transcribe` | POST | Whisper Spracherkennung |
| `/api/push` | POST | Push-Subscription speichern |
| `/api/cron/morning` | GET | Morgen-Nachricht |
| `/api/cron/lunch` | GET | Protein-Check mittags |
| `/api/cron/evening` | GET | Abend-Supplements Erinnerung |
| `/api/cron/summary` | GET | Tages-Zusammenfassung |
| `/api/cron/oura` | GET | Oura API Pull (Placeholder) |

## Neue Supabase Tabellen (muessen erstellt werden)

```sql
CREATE TABLE IF NOT EXISTS conversations (
  id SERIAL PRIMARY KEY,
  chat_id BIGINT,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS macro_adjustments (
  id SERIAL PRIMARY KEY,
  chat_id BIGINT,
  datum DATE NOT NULL,
  kcal_adjustment FLOAT DEFAULT 0,
  protein_adjustment FLOAT DEFAULT 0,
  training_typ TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(chat_id, datum)
);

CREATE TABLE IF NOT EXISTS journal_entries (
  id SERIAL PRIMARY KEY,
  chat_id BIGINT,
  datum DATE NOT NULL,
  alkohol BOOLEAN,
  koffein_letzte TEXT,
  sauna BOOLEAN,
  meditation BOOLEAN,
  bildschirm_spaet BOOLEAN,
  supplements_komplett BOOLEAN,
  stress_level INT,
  outdoor_zeit TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(chat_id, datum)
);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id SERIAL PRIMARY KEY,
  chat_id BIGINT UNIQUE,
  subscription JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Neue Dateien

### Seiten (pages)
- `src/app/chat/page.tsx` — Vollbild-Chat
- `src/app/journal/page.tsx` — Behavior Journal
- `src/app/report/page.tsx` — Wochen-Report

### Komponenten
- `src/components/ChatFAB.tsx` — Chat Floating Action Button
- `src/components/LifeTimeline.tsx` — Tagesverlauf-Timeline
- `src/components/MuscleMap.tsx` — SVG Muskelgruppen-Heatmap
- `src/components/PushSetup.tsx` — Push Notification Setup
- `src/components/SupplementAdvisor.tsx` — Dynamische Empfehlungen
- `src/components/VoiceRecorder.tsx` — Press-and-Hold Sprachaufnahme

### Bibliotheken
- `src/lib/correlations.ts` — Journal/Schlaf Korrelations-Engine
- `src/lib/macroAdjustment.ts` — Makro-Anpassung nach Training
- `src/lib/prompts.ts` — Julius System Prompt
- `src/lib/push.ts` — Web Push Utility
- `src/lib/supabase-server.ts` — Server-Side Supabase Client
- `src/lib/supplementLogic.ts` — Supplement-Empfehlungs-Engine

## Environment Variables (Vercel + .env.local)

- `SUPABASE_SERVICE_ROLE_KEY` — gesetzt
- `ANTHROPIC_API_KEY` — fuer Chat (muss gesetzt werden)
- `OPENAI_API_KEY` — fuer Whisper Voice (optional)
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` — fuer Push
- `VAPID_PRIVATE_KEY` — fuer Push

## Bekannte Limitations

- Oura API Integration ist ein Placeholder
- "Aus Wochenplan" Option im Meal-Logger noch nicht implementiert
- Push Notifications benoetigen VAPID Keys
- Profil-Seite nicht mehr in BottomNav (erreichbar via /profil direkt)
