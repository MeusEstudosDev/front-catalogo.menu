"use client";

import { Box } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";

interface GoogleMapProps {
  latitude: number | null;
  longitude: number | null;
  onLocationChange?: (lat: number, lng: number) => void;
  height?: string;
  zoom?: number;
}

export function GoogleMap({
  latitude,
  longitude,
  onLocationChange,
  height = "400px",
  zoom = 17,
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);

  useEffect(() => {
    if (!mapRef.current || typeof window === 'undefined' || !window.google) return;

    // Coordenadas padrão (centro do Brasil) caso não tenha coordenadas
    const defaultLat = latitude || -14.235004;
    const defaultLng = longitude || -51.92528;

    // Criar o mapa
    const newMap = new google.maps.Map(mapRef.current, {
      center: { lat: defaultLat, lng: defaultLng },
      zoom: latitude && longitude ? zoom : 4,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      zoomControl: true,
    });

    setMap(newMap);

    // Criar marcador inicial se houver coordenadas
    if (latitude && longitude) {
      const newMarker = new google.maps.Marker({
        position: { lat: latitude, lng: longitude },
        map: newMap,
        draggable: true,
        title: "Arraste para ajustar a localização",
      });

      setMarker(newMarker);

      // Atualizar coordenadas quando o marcador for arrastado
      newMarker.addListener("dragend", () => {
        const position = newMarker.getPosition();
        if (position && onLocationChange) {
          onLocationChange(position.lat(), position.lng());
        }
      });
    }

    // Adicionar marcador ao clicar no mapa
    newMap.addListener("click", (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();

        // Atualizar ou criar marcador
        if (marker) {
          marker.setPosition({ lat, lng });
        } else {
          const newMarker = new google.maps.Marker({
            position: { lat, lng },
            map: newMap,
            draggable: true,
            title: "Arraste para ajustar a localização",
          });

          newMarker.addListener("dragend", () => {
            const position = newMarker.getPosition();
            if (position && onLocationChange) {
              onLocationChange(position.lat(), position.lng());
            }
          });

          setMarker(newMarker);
        }

        if (onLocationChange) {
          onLocationChange(lat, lng);
        }
      }
    });

    return () => {
      // Cleanup
      if (marker) {
        marker.setMap(null);
      }
    };
  }, []);

  // Atualizar posição do marcador quando as coordenadas mudarem
  useEffect(() => {
    if (!map) return;

    if (latitude && longitude) {
      const newPosition = { lat: latitude, lng: longitude };

      // Centralizar mapa na nova posição
      map.setCenter(newPosition);
      map.setZoom(zoom);

      // Atualizar ou criar marcador
      if (marker) {
        marker.setPosition(newPosition);
      } else {
        const newMarker = new google.maps.Marker({
          position: newPosition,
          map: map,
          draggable: true,
          title: "Arraste para ajustar a localização",
        });

        newMarker.addListener("dragend", () => {
          const position = newMarker.getPosition();
          if (position && onLocationChange) {
            onLocationChange(position.lat(), position.lng());
          }
        });

        setMarker(newMarker);
      }
    }
  }, [latitude, longitude, map, zoom]);

  return (
    <Box
      ref={mapRef}
      w="100%"
      h={height}
      borderRadius="md"
      overflow="hidden"
      border="1px solid"
      borderColor="gray.200"
    />
  );
}
