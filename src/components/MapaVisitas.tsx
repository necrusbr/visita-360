import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Map as MapIcon, 
  Thermometer,
  MapPin,
  Layers
} from "lucide-react";
import { Visita } from "../types";

interface MapaVisitasProps {
  visitas: Visita[];
}

// Declarar tipos globais para Leaflet
declare global {
  interface Window {
    L: any;
  }
}

export default function MapaVisitas({ visitas }: MapaVisitasProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [markersLayer, setMarkersLayer] = useState<any>(null);
  const [heatLayer, setHeatLayer] = useState<any>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const visitasComCoordenadas = visitas.filter(v => v.lat && v.lng);

  useEffect(() => {
    if (!window.L) {
      // Carregar Leaflet CSS
      const cssLink = document.createElement('link');
      cssLink.rel = 'stylesheet';
      cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(cssLink);

      // Carregar Leaflet JS
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => {
        // Carregar plugin de heatmap
        const heatScript = document.createElement('script');
        heatScript.src = 'https://unpkg.com/leaflet.heat/dist/leaflet-heat.js';
        heatScript.onload = () => {
          initializeMap();
        };
        document.head.appendChild(heatScript);
      };
      document.head.appendChild(script);
    } else {
      initializeMap();
    }

    return () => {
      if (map) {
        map.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (map && markersLayer) {
      renderMarkers();
    }
  }, [visitas, map, markersLayer]);

  const initializeMap = () => {
    if (!mapRef.current || !window.L) return;

    // Coordenadas do Brasil (centro aproximado)
    const centerLat = visitasComCoordenadas.length > 0 
      ? visitasComCoordenadas.reduce((sum, v) => sum + (v.lat || 0), 0) / visitasComCoordenadas.length
      : -15.7801;
    
    const centerLng = visitasComCoordenadas.length > 0
      ? visitasComCoordenadas.reduce((sum, v) => sum + (v.lng || 0), 0) / visitasComCoordenadas.length
      : -47.9292;

    const newMap = window.L.map(mapRef.current).setView([centerLat, centerLng], visitasComCoordenadas.length > 0 ? 10 : 5);

    // Adicionar tiles do OpenStreetMap
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(newMap);

    const newMarkersLayer = window.L.layerGroup().addTo(newMap);
    
    setMap(newMap);
    setMarkersLayer(newMarkersLayer);
    setIsLoading(false);
  };

  const renderMarkers = () => {
    if (!markersLayer || !window.L) return;
    
    markersLayer.clearLayers();

    visitasComCoordenadas.forEach((visita) => {
      if (!visita.lat || !visita.lng) return;

      // Definir cor do marcador baseado na classificação
      let markerColor = '#6b7280'; // cinza padrão
      if (visita.classificacao === 'Forte') markerColor = '#16a34a'; // verde
      else if (visita.classificacao === 'Médio') markerColor = '#f59e0b'; // amarelo
      else if (visita.classificacao === 'Fraco') markerColor = '#dc2626'; // vermelho

      // Criar ícone personalizado
      const customIcon = window.L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            background: ${markerColor};
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 12px;
          ">
            ${visita.id}
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = window.L.marker([visita.lat, visita.lng], { icon: customIcon });
      
      // Popup com informações da visita
      marker.bindPopup(`
        <div style="min-width: 200px;">
          <h3 style="margin: 0 0 8px 0; font-weight: bold; color: #1f2937;">
            ${visita.empresa}
          </h3>
          <div style="margin-bottom: 6px;">
            <strong>Endereço:</strong><br>
            <span style="font-size: 0.9em;">${visita.endereco}</span>
          </div>
          <div style="margin-bottom: 6px;">
            <strong>Data:</strong> ${new Date(visita.data).toLocaleDateString('pt-BR')}
          </div>
          <div style="margin-bottom: 6px;">
            <strong>Segmento:</strong> ${visita.segmento}
          </div>
          <div style="margin-bottom: 6px;">
            <strong>Estágio:</strong> ${visita.estagio}
          </div>
          <div style="margin-bottom: 8px;">
            <strong>Classificação:</strong> 
            <span style="
              background: ${markerColor};
              color: white;
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 0.8em;
            ">
              ${visita.classificacao}
            </span>
          </div>
          ${visita.obs ? `
            <div style="margin-bottom: 6px;">
              <strong>Observações:</strong><br>
              <span style="font-size: 0.9em; font-style: italic;">${visita.obs}</span>
            </div>
          ` : ''}
          ${visita.contato ? `
            <div style="margin-bottom: 6px;">
              <strong>Contato:</strong> ${visita.contato}
            </div>
          ` : ''}
        </div>
      `);

      markersLayer.addLayer(marker);
    });

    // Ajustar zoom para mostrar todos os marcadores
    if (visitasComCoordenadas.length > 0) {
      const group = new window.L.featureGroup(markersLayer.getLayers());
      map.fitBounds(group.getBounds().pad(0.1));
    }
  };

  const toggleHeatmap = () => {
    if (!map || !window.L || !window.L.heatLayer) return;

    if (showHeatmap && heatLayer) {
      map.removeLayer(heatLayer);
      setHeatLayer(null);
      setShowHeatmap(false);
    } else {
      const heatPoints = visitasComCoordenadas.map(visita => [
        visita.lat!,
        visita.lng!,
        visita.classificacao === 'Forte' ? 1.0 : 
        visita.classificacao === 'Médio' ? 0.6 : 0.3
      ]);

      if (heatPoints.length > 0) {
        const newHeatLayer = window.L.heatLayer(heatPoints, {
          radius: 25,
          blur: 15,
          maxZoom: 17,
          gradient: {
            0.2: '#313695',
            0.4: '#4575b4', 
            0.6: '#74add1',
            0.8: '#abd9e9',
            1.0: '#e0f3f8'
          }
        });
        
        newHeatLayer.addTo(map);
        setHeatLayer(newHeatLayer);
        setShowHeatmap(true);
      }
    }
  };

  if (isLoading) {
    return (
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapIcon className="w-5 h-5" />
            Mapa de Visitas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 bg-muted/20 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Carregando mapa...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapIcon className="w-5 h-5" />
              Mapa de Visitas
            </div>
            <div className="flex gap-2">
              <Button
                variant={showHeatmap ? "default" : "outline"}
                size="sm"
                onClick={toggleHeatmap}
                disabled={visitasComCoordenadas.length === 0}
                className="flex items-center gap-2"
              >
                <Thermometer className="w-4 h-4" />
                {showHeatmap ? 'Ocultar' : 'Mostrar'} Mapa de Calor
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Estatísticas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 rounded-lg bg-brand-50">
                <div className="text-2xl font-bold text-brand-600">{visitas.length}</div>
                <div className="text-sm text-muted-foreground">Total de Visitas</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-success/10">
                <div className="text-2xl font-bold text-success">{visitasComCoordenadas.length}</div>
                <div className="text-sm text-muted-foreground">Com Localização</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-warning/10">
                <div className="text-2xl font-bold text-warning">
                  {visitas.filter(v => v.classificacao === 'Forte').length}
                </div>
                <div className="text-sm text-muted-foreground">Classificação Forte</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/20">
                <div className="text-2xl font-bold text-muted-foreground">
                  {[...new Set(visitas.map(v => v.segmento))].length}
                </div>
                <div className="text-sm text-muted-foreground">Segmentos</div>
              </div>
            </div>

            {/* Legenda */}
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-success border-2 border-white shadow-sm"></div>
                <span>Forte</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-warning border-2 border-white shadow-sm"></div>
                <span>Médio</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-destructive border-2 border-white shadow-sm"></div>
                <span>Fraco</span>
              </div>
            </div>

            {/* Mapa */}
            <div className="relative">
              <div 
                ref={mapRef} 
                className="h-96 w-full rounded-lg shadow-lg border border-glass-border"
                style={{ minHeight: '400px' }}
              />
              {visitasComCoordenadas.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/80 rounded-lg">
                  <div className="text-center">
                    <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">
                      Nenhuma visita com coordenadas cadastradas
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Adicione latitude e longitude nas visitas para visualizá-las no mapa
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Lista de visitas sem coordenadas */}
            {visitas.length > visitasComCoordenadas.length && (
              <Card className="bg-warning/10 border-warning/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2 text-warning">
                    <MapPin className="w-4 h-4" />
                    Visitas sem localização ({visitas.length - visitasComCoordenadas.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {visitas
                      .filter(v => !v.lat || !v.lng)
                      .slice(0, 5)
                      .map(visita => (
                        <div key={visita.id} className="flex items-center justify-between text-sm">
                          <span>#{visita.id} - {visita.empresa}</span>
                          <Badge variant="outline">Sem coordenadas</Badge>
                        </div>
                      ))}
                    {visitas.filter(v => !v.lat || !v.lng).length > 5 && (
                      <div className="text-xs text-muted-foreground text-center pt-2">
                        E mais {visitas.filter(v => !v.lat || !v.lng).length - 5} visitas...
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}