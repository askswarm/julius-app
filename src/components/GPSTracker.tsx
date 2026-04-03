"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Pause, Play, Square, Lock, Unlock } from "lucide-react";
import dynamic from "next/dynamic";

const GPSMap = dynamic(() => import("./GPSMap"), { ssr: false });

interface GPSPoint {
  lat: number;
  lng: number;
  timestamp: number;
  accuracy: number;
}

interface Props {
  sport: string;
  userWeight: number;
  onFinish: (data: { route: GPSPoint[]; distanceM: number; durationSec: number; paceMinKm: number; kcal: number }) => void;
  onCancel: () => void;
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatPace(pace: number): string {
  if (!pace || !isFinite(pace)) return "--:--";
  const min = Math.floor(pace);
  const sec = Math.round((pace % 1) * 60);
  return `${min}:${String(sec).padStart(2, "0")}`;
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function GPSTracker({ sport, userWeight, onFinish, onCancel }: Props) {
  const [running, setRunning] = useState(true);
  const [locked, setLocked] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [points, setPoints] = useState<GPSPoint[]>([]);
  const [currentPos, setCurrentPos] = useState<[number, number] | null>(null);
  const [error, setError] = useState("");

  const watchRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pointsRef = useRef<GPSPoint[]>([]);

  // Start GPS watch
  useEffect(() => {
    if (!navigator.geolocation) {
      setError("GPS nicht verfuegbar");
      return;
    }

    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const p: GPSPoint = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          timestamp: Date.now(),
          accuracy: pos.coords.accuracy,
        };
        setCurrentPos([p.lat, p.lng]);
        if (p.accuracy < 30) {
          pointsRef.current = [...pointsRef.current, p];
          setPoints([...pointsRef.current]);
        }
      },
      (err) => setError(`GPS Fehler: ${err.message}`),
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );

    return () => {
      if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current);
    };
  }, []);

  // Timer
  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [running]);

  // Calculate distance
  const distanceM = points.reduce((total, p, i) => {
    if (i === 0) return 0;
    return total + haversine(points[i - 1].lat, points[i - 1].lng, p.lat, p.lng);
  }, 0);

  const distanceKm = distanceM / 1000;
  const paceMinKm = seconds > 0 && distanceKm > 0.01 ? (seconds / 60) / distanceKm : 0;
  const isCycling = sport.toLowerCase().includes("gravel") || sport.toLowerCase().includes("rad") || sport.toLowerCase().includes("bike");
  const kcal = Math.round(userWeight * distanceKm * (isCycling ? 0.45 : 1.036));

  const positions: [number, number][] = points.map((p) => [p.lat, p.lng]);

  function handleStop() {
    if (locked) return;
    setRunning(false);
    if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current);
    onFinish({
      route: pointsRef.current,
      distanceM: Math.round(distanceM),
      durationSec: seconds,
      paceMinKm: Math.round(paceMinKm * 100) / 100,
      kcal,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "var(--bg)" }}>
      {/* Map */}
      <div className="flex-1 relative" style={{ minHeight: "50%" }}>
        {error ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm" style={{ color: "#EF4444" }}>{error}</p>
          </div>
        ) : (
          <GPSMap positions={positions} currentPos={currentPos} height={999} interactive={false} />
        )}
      </div>

      {/* Stats bar */}
      <div className="px-4 py-4" style={{ background: "var(--card)" }}>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div>
            <p className="text-2xl font-bold" style={{ color: "var(--text)" }}>{distanceKm.toFixed(2)}</p>
            <p className="text-[10px]" style={{ color: "var(--text3)" }}>km</p>
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ color: "var(--text)" }}>{formatPace(paceMinKm)}</p>
            <p className="text-[10px]" style={{ color: "var(--text3)" }}>/km</p>
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ color: "var(--text)" }}>{formatTime(seconds)}</p>
            <p className="text-[10px]" style={{ color: "var(--text3)" }}>Zeit</p>
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ color: "var(--text)" }}>{kcal}</p>
            <p className="text-[10px]" style={{ color: "var(--text3)" }}>kcal</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-6 py-6" style={{ background: "var(--card)", borderTop: "1px solid var(--card-border)" }}>
        <button onClick={() => setLocked(!locked)} className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: "var(--subtle-bg)", color: locked ? "#F59E0B" : "var(--text3)" }}>
          {locked ? <Lock size={20} /> : <Unlock size={20} />}
        </button>

        <button onClick={() => setRunning(!running)}
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: running ? "var(--subtle-bg)" : "var(--grad-teal)", border: running ? "2px solid var(--accent)" : "none" }}>
          {running ? <Pause size={28} style={{ color: "var(--accent)" }} /> : <Play size={28} style={{ color: "#0D1117", marginLeft: 2 }} />}
        </button>

        <button onClick={handleStop} disabled={locked}
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: locked ? "var(--subtle-bg)" : "rgba(239,68,68,0.1)", border: "2px solid #EF4444", opacity: locked ? 0.3 : 1 }}>
          <Square size={18} style={{ color: "#EF4444" }} />
        </button>
      </div>

      {/* Cancel */}
      <button onClick={onCancel} className="py-3 text-center text-xs" style={{ color: "var(--text3)", background: "var(--card)" }}>
        Abbrechen
      </button>
    </div>
  );
}
