'use client';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, Navigation, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Props {
  enderecoDestino: string;
  pedidoId: string;
}

const MOTO_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="48" height="48">
  <circle cx="32" cy="32" r="30" fill="#e84010" stroke="white" stroke-width="3"/>
  <text x="32" y="40" font-size="28" text-anchor="middle" fill="white">🛵</text>
</svg>
`;

const DESTINO_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 48" width="32" height="48">
  <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 32 16 32S32 28 32 16C32 7.163 24.837 0 16 0z" fill="#e84010"/>
  <circle cx="16" cy="16" r="8" fill="white"/>
</svg>
`;

async function geocodificarEndereco(endereco: string): Promise<[number, number] | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(endereco)}&limit=1`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'pt-BR' } });
    const data = await res.json();
    if (data.length > 0) return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    return null;
  } catch { return null; }
}

async function buscarRota(origem: [number, number], destino: [number, number]): Promise<[number, number][]> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${origem[1]},${origem[0]};${destino[1]},${destino[0]}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.routes?.[0]?.geometry?.coordinates) {
      return data.routes[0].geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]);
    }
    return [origem, destino];
  } catch { return [origem, destino]; }
}

export default function MapaEntrega({ enderecoDestino, pedidoId }: Props) {
  const router = useRouter();
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<import('leaflet').Map | null>(null);
  const motoMarker = useRef<import('leaflet').Marker | null>(null);
  const destinoMarker = useRef<import('leaflet').Marker | null>(null);
  const rotaLayer = useRef<import('leaflet').Polyline | null>(null);
  const watchId = useRef<number | null>(null);
  const [status, setStatus] = useState<'carregando' | 'pronto' | 'sem-gps'>('carregando');
  const [distancia, setDistancia] = useState<string | null>(null);
  const destinoCoords = useRef<[number, number] | null>(null);

  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    let mounted = true;

    async function init() {
      const L = (await import('leaflet')).default;

      // Fix leaflet default icon paths in Next.js
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (!mapRef.current || !mounted) return;

      const map = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([-5.1, -38.5], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);
      L.control.attribution({ position: 'bottomleft', prefix: '© OSM' }).addTo(map);

      leafletMap.current = map;

      // Geocode destination
      const coords = await geocodificarEndereco(enderecoDestino);
      if (!mounted) return;

      if (coords) {
        destinoCoords.current = coords;

        const destinoIcon = L.divIcon({
          html: DESTINO_SVG,
          iconSize: [32, 48],
          iconAnchor: [16, 48],
          className: '',
        });

        destinoMarker.current = L.marker(coords, { icon: destinoIcon })
          .addTo(map)
          .bindPopup(`<b>Destino</b><br/>${enderecoDestino}`)
          .openPopup();
      }

      // Watch GPS position
      if (navigator.geolocation) {
        watchId.current = navigator.geolocation.watchPosition(
          async (pos) => {
            if (!mounted) return;
            const origem: [number, number] = [pos.coords.latitude, pos.coords.longitude];

            const motoIcon = L.divIcon({
              html: MOTO_SVG,
              iconSize: [48, 48],
              iconAnchor: [24, 24],
              className: '',
            });

            if (!motoMarker.current) {
              motoMarker.current = L.marker(origem, { icon: motoIcon, zIndexOffset: 1000 }).addTo(map);
            } else {
              motoMarker.current.setLatLng(origem);
            }

            if (destinoCoords.current) {
              // Fit both points
              const bounds = L.latLngBounds([origem, destinoCoords.current]);
              map.fitBounds(bounds, { padding: [60, 60] });

              // Draw route
              const pontos = await buscarRota(origem, destinoCoords.current);
              if (!mounted) return;

              if (rotaLayer.current) {
                rotaLayer.current.setLatLngs(pontos);
              } else {
                rotaLayer.current = L.polyline(pontos, {
                  color: '#e84010',
                  weight: 5,
                  opacity: 0.85,
                  lineJoin: 'round',
                }).addTo(map);
              }

              // Calculate distance (straight line as fallback display)
              const dist = map.distance(origem, destinoCoords.current);
              if (dist < 1000) {
                setDistancia(`${Math.round(dist)} m`);
              } else {
                setDistancia(`${(dist / 1000).toFixed(1)} km`);
              }
            } else {
              map.setView(origem, 15);
            }

            setStatus('pronto');
          },
          () => {
            if (mounted && destinoCoords.current) {
              map.setView(destinoCoords.current, 15);
              setStatus('sem-gps');
            } else if (mounted) {
              setStatus('sem-gps');
            }
          },
          { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
        );
      } else {
        if (destinoCoords.current) map.setView(destinoCoords.current, 15);
        setStatus('sem-gps');
      }
    }

    init();

    return () => {
      mounted = false;
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
      leafletMap.current?.remove();
      leafletMap.current = null;
      motoMarker.current = null;
      destinoMarker.current = null;
      rotaLayer.current = null;
    };
  }, [enderecoDestino]);

  function abrirGoogleMaps() {
    const dest = encodeURIComponent(enderecoDestino);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}&origin=${pos.coords.latitude},${pos.coords.longitude}&travelmode=driving`, '_blank'),
        () => window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`, '_blank'),
        { timeout: 5000 }
      );
    } else {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`, '_blank');
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col">
      {/* Map */}
      <div ref={mapRef} className="flex-1 w-full" />

      {/* Loading overlay */}
      {status === 'carregando' && (
        <div className="absolute inset-0 bg-gray-900/70 flex items-center justify-center z-10">
          <div className="bg-white rounded-2xl p-6 flex flex-col items-center gap-3 shadow-xl">
            <Loader2 size={32} className="animate-spin text-orange-500" style={{ color: '#e84010' }} />
            <p className="text-gray-700 font-semibold text-sm">Carregando mapa e rota...</p>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-safe-top pt-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1 bg-white rounded-2xl shadow-lg px-4 py-2.5">
            <p className="text-xs text-gray-400 font-medium">Entregando para</p>
            <p className="text-gray-900 font-bold text-sm truncate">{enderecoDestino}</p>
          </div>
        </div>
      </div>

      {/* Distance badge */}
      {distancia && (
        <div className="absolute top-20 right-4 z-20 bg-white rounded-xl shadow-lg px-3 py-1.5">
          <p className="text-xs text-gray-400">Distância</p>
          <p className="text-gray-900 font-black text-sm">{distancia}</p>
        </div>
      )}

      {/* No GPS warning */}
      {status === 'sem-gps' && (
        <div className="absolute top-20 left-4 right-4 z-20 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
          <p className="text-amber-700 text-sm font-semibold">GPS não disponível — mostrando destino</p>
        </div>
      )}

      {/* Bottom action */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-4 pb-safe-bottom">
        <button
          onClick={abrirGoogleMaps}
          className="w-full bg-white rounded-2xl shadow-xl px-4 py-4 flex items-center gap-3 hover:bg-gray-50 transition-colors"
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#e84010' }}
          >
            <Navigation size={18} className="text-white" />
          </div>
          <div className="text-left">
            <p className="text-gray-900 font-bold text-sm">Abrir no Google Maps</p>
            <p className="text-gray-400 text-xs">Para navegação assistida por voz</p>
          </div>
        </button>
      </div>
    </div>
  );
}
