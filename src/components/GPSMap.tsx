"use client";

import { MapContainer, TileLayer, Polyline, CircleMarker } from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface Props {
  positions: [number, number][];
  currentPos?: [number, number] | null;
  height?: number;
  interactive?: boolean;
}

export default function GPSMap({ positions, currentPos, height = 300, interactive = true }: Props) {
  const center: [number, number] = currentPos || positions[positions.length - 1] || [52.52, 13.405];

  return (
    <MapContainer
      center={center}
      zoom={16}
      style={{ height, width: "100%", borderRadius: 16 }}
      scrollWheelZoom={interactive}
      dragging={interactive}
      zoomControl={interactive}
      attributionControl={false}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {positions.length > 1 && (
        <Polyline positions={positions} pathOptions={{ color: "#7EE2B8", weight: 4 }} />
      )}
      {currentPos && (
        <CircleMarker center={currentPos} radius={8}
          pathOptions={{ color: "#7EE2B8", fillColor: "#7EE2B8", fillOpacity: 1, weight: 2 }} />
      )}
    </MapContainer>
  );
}
