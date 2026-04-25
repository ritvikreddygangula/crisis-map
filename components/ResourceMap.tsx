'use client';

import { useState, useEffect } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { Resource, ResourceStatus } from '@/types';

// AZ geographic center — zoom 7 fits the full state with all pins visible
const AZ_CENTER = { lat: 34.0, lng: -111.5 };
const DEFAULT_ZOOM = 7;

const STATUS_COLORS: Record<ResourceStatus, string> = {
  open: '#16a34a',
  limited: '#d97706',
  closed: '#dc2626',
  unknown: '#6b7280',
};

interface Props {
  resources: Resource[];
  selectedId: string | null;
  onMarkerClick: (r: Resource) => void;
  showHeatmap: boolean;
}

interface HeatmapLayerType {
  setMap: (map: google.maps.Map | null) => void;
}

interface VisualizationLibrary {
  HeatmapLayer: new (opts: {
    data: google.maps.LatLng[];
    radius: number;
    opacity: number;
    map: google.maps.Map;
  }) => HeatmapLayerType;
}

function HeatmapOverlay({ resources }: { resources: Resource[] }) {
  const map = useMap();
  const visualization = useMapsLibrary('visualization') as VisualizationLibrary | null;

  useEffect(() => {
    if (!map || !visualization) return;
    const layer = new visualization.HeatmapLayer({
      data: resources.map(
        (r) => new google.maps.LatLng(r.location.lat, r.location.lng)
      ),
      radius: 60,
      opacity: 0.5,
      map: map as unknown as google.maps.Map,
    });
    return () => {
      layer.setMap(null);
    };
  }, [map, visualization, resources]);

  return null;
}

export default function ResourceMap({
  resources,
  selectedId,
  onMarkerClick,
  showHeatmap,
}: Props) {
  const [openInfoId, setOpenInfoId] = useState<string | null>(null);
  const openResource = resources.find((r) => r.id === openInfoId) ?? null;

  function handleMarkerClick(r: Resource) {
    setOpenInfoId(r.id);
    onMarkerClick(r);
  }

  return (
    // Height lives here on a plain div — Map fills it 100%
    <div className="relative w-full" style={{ height: 'clamp(350px, 60vh, 640px)' }}>
      <APIProvider
        apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''}
        libraries={['visualization']}
      >
        {/* DEMO_MAP_ID is Google's reserved test map ID — works without creating one in Cloud Console */}
        <Map
          defaultCenter={AZ_CENTER}
          defaultZoom={DEFAULT_ZOOM}
          mapId="DEMO_MAP_ID"
          style={{ width: '100%', height: '100%' }}
          gestureHandling="greedy"
          disableDefaultUI={false}
        >
          {resources.map((r) => (
            <AdvancedMarker
              key={r.id}
              position={{ lat: r.location.lat, lng: r.location.lng }}
              onClick={() => handleMarkerClick(r)}
              title={r.name}
            >
              <Pin
                background={STATUS_COLORS[r.status] ?? STATUS_COLORS.unknown}
                glyphColor="#ffffff"
                borderColor="#ffffff"
                scale={r.id === selectedId ? 1.35 : 1}
              />
            </AdvancedMarker>
          ))}

          {openResource && (
            <InfoWindow
              position={{
                lat: openResource.location.lat,
                lng: openResource.location.lng,
              }}
              onCloseClick={() => setOpenInfoId(null)}
              pixelOffset={[0, -40]}
            >
              <div className="text-sm min-w-40 max-w-55">
                <p className="font-semibold text-gray-900 leading-snug">
                  {openResource.name}
                </p>
                <p className="text-gray-500 text-xs mt-0.5">{openResource.type}</p>
                <p className="text-xs mt-1 text-gray-600 truncate">
                  {openResource.address}
                </p>
                <span
                  className={`inline-block mt-1.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
                    openResource.status === 'open'
                      ? 'bg-green-100 text-green-700'
                      : openResource.status === 'limited'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {openResource.status.charAt(0).toUpperCase() +
                    openResource.status.slice(1)}
                </span>
              </div>
            </InfoWindow>
          )}

          {showHeatmap && <HeatmapOverlay resources={resources} />}
        </Map>
      </APIProvider>
    </div>
  );
}
