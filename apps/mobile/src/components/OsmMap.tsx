import { useEffect, useRef } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";

export interface OsmMapMarker {
  id: string;
  lat: number;
  lng: number;
  /** Price-pill label (already formatted/localized by the caller). */
  label?: string;
  /** Renders the pill in its emphasized selected state. */
  selected?: boolean;
}

export interface OsmMapBounds {
  sw_lat: number;
  sw_lng: number;
  ne_lat: number;
  ne_lng: number;
}

interface OsmMapProps {
  markers: OsmMapMarker[];
  /** Fallback center when there are no markers (defaults to Cairo). */
  center?: { lat: number; lng: number };
  zoom?: number;
  onMarkerPress?: (id: string) => void;
  /** Fired on every map move/zoom end with the current viewport bounds. */
  onRegionChanged?: (bounds: OsmMapBounds) => void;
  style?: ViewStyle;
}

const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

function buildHtml(center: { lat: number; lng: number }, zoom: number): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<link rel="stylesheet" href="${LEAFLET_CSS}">
<style>
  html, body, #map { height: 100%; margin: 0; padding: 0; }
  .stayos-price-pill {
    display: inline-block; width: max-content; max-width: 120px;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    transform: translate(-50%, -50%);
    padding: 2px 8px; border-radius: 9999px;
    font: 700 12px system-ui, sans-serif;
    background: #0F766E; color: #fff; border: 1px solid #fff;
    box-shadow: 0 1px 3px rgba(0,0,0,.25);
  }
  .stayos-price-pill.selected {
    background: #0D5A54; border: 2px solid #0F766E;
    transform: translate(-50%, -50%) scale(1.15);
  }
  .stayos-dot {
    width: 14px; height: 14px; border-radius: 9999px;
    transform: translate(-50%, -50%);
    background: #0F766E; border: 2px solid #fff;
    box-shadow: 0 1px 3px rgba(0,0,0,.35);
  }
</style>
</head>
<body>
<div id="map"></div>
<script src="${LEAFLET_JS}"></script>
<script>
  var map = L.map('map', { zoomControl: true, attributionControl: true });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map);
  map.setView([${center.lat}, ${center.lng}], ${zoom});
  var markerLayer = L.layerGroup().addTo(map);
  function post(msg) {
    try { window.ReactNativeWebView.postMessage(JSON.stringify(msg)); } catch (e) {}
  }
  function icon(label, selected) {
    var html = label
      ? '<div class="stayos-price-pill' + (selected ? ' selected' : '') + '">' + label + '</div>'
      : '<div class="stayos-dot"></div>';
    return L.divIcon({ className: 'stayos-marker', html: html, iconSize: [0,0], iconAnchor: [0,0] });
  }
  window.updateMarkers = function(markers) {
    markerLayer.clearLayers();
    var pts = [];
    markers.forEach(function(m) {
      if (typeof m.lat !== 'number' || typeof m.lng !== 'number') return;
      var mk = L.marker([m.lat, m.lng], { icon: icon(m.label, m.selected), zIndexOffset: m.selected ? 1000 : 0 }).addTo(markerLayer);
      mk.on('click', function() { post({ type: 'marker', id: m.id }); });
      pts.push([m.lat, m.lng]);
    });
    if (pts.length > 0) {
      map.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 15 });
    }
  };
  map.on('moveend zoomend', function() {
    var b = map.getBounds();
    post({ type: 'bounds', sw_lat: b.getSouth(), sw_lng: b.getWest(), ne_lat: b.getNorth(), ne_lng: b.getEast() });
  });
  post({ type: 'ready' });
</script>
</body>
</html>`;
}

/**
 * OpenStreetMap map rendered through Leaflet — the same provider/tiles as
 * the web product, with no API-key requirement. Marker taps and viewport
 * changes are bridged back through postMessage.
 */
export function OsmMap({
  markers,
  center = { lat: 30.0444, lng: 31.2357 },
  zoom = 11,
  onMarkerPress,
  onRegionChanged,
  style,
}: OsmMapProps) {
  const webRef = useRef<WebView>(null);
  const html = useRef(buildHtml(center, zoom)).current;
  const markersRef = useRef(markers);
  markersRef.current = markers;
  const onMarkerPressRef = useRef(onMarkerPress);
  const onRegionChangedRef = useRef(onRegionChanged);
  onMarkerPressRef.current = onMarkerPress;
  onRegionChangedRef.current = onRegionChanged;

  const pushMarkers = () => {
    webRef.current?.injectJavaScript(
      `if (window.updateMarkers) { window.updateMarkers(${JSON.stringify(markersRef.current)}); } true;`
    );
  };

  useEffect(() => {
    pushMarkers();
  }, [markers]);

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === "ready") {
        pushMarkers();
      } else if (msg.type === "marker" && msg.id) {
        onMarkerPressRef.current?.(msg.id);
      } else if (msg.type === "bounds") {
        onRegionChangedRef.current?.({
          sw_lat: msg.sw_lat,
          sw_lng: msg.sw_lng,
          ne_lat: msg.ne_lat,
          ne_lng: msg.ne_lng,
        });
      }
    } catch {
      // ignore malformed bridge messages
    }
  };

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webRef}
        source={{ html }}
        style={styles.webview}
        onMessage={handleMessage}
        onLoadEnd={pushMarkers}
        javaScriptEnabled
        originWhitelist={["*"]}
        scrollEnabled={false}
        nestedScrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
  },
  webview: {
    flex: 1,
    backgroundColor: "transparent",
  },
});
