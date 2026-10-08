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
  /**
   * Pin-pick mode: renders a single draggable pin and reports its position
   * whenever the host moves it (drag end or map tap). Used by the listing
   * form — matches the web LocationPicker.
   */
  pin?: { lat: number; lng: number };
  onPinMoved?: (lat: number, lng: number) => void;
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
    display: flex; align-items: center; justify-content: center;
    width: 100%; height: 100%;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    padding: 0 8px; border-radius: 9999px; box-sizing: border-box;
    font: 700 12px system-ui, sans-serif;
    background: #84CC16; color: #1A2E05; border: 1px solid #fff;
    box-shadow: 0 1px 3px rgba(0,0,0,.25);
  }
  .stayos-price-pill.selected {
    background: #65A30D; border: 2px solid #A3E635;
    transform: scale(1.15);
  }
  .stayos-dot {
    width: 100%; height: 100%; border-radius: 9999px;
    background: #65A30D; border: 2px solid #fff;
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
    if (!label) {
      return L.divIcon({
        className: 'stayos-marker',
        html: '<div class="stayos-dot"></div>',
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });
    }
    // Real icon size gives Leaflet a proper hit area — a zero-size icon
    // leaves only a ~1px tap target at the anchor point.
    var w = Math.min(120, Math.max(64, String(label).length * 8 + 20));
    return L.divIcon({
      className: 'stayos-marker',
      html: '<div class="stayos-price-pill' + (selected ? ' selected' : '') + '">' + label + '</div>',
      iconSize: [w, 26],
      iconAnchor: [w / 2, 13]
    });
  }
  var pinLayer = L.layerGroup().addTo(map);
  var pinMarker = null;
  window.updatePin = function(lat, lng) {
    if (!pinMarker) {
      pinMarker = L.marker([lat, lng], { draggable: true }).addTo(pinLayer);
      pinMarker.on('dragend', function() {
        var p = pinMarker.getLatLng();
        post({ type: 'pin', lat: p.lat, lng: p.lng });
      });
      map.setView([lat, lng], Math.max(map.getZoom(), 14));
      return;
    }
    pinMarker.setLatLng([lat, lng]);
    // Programmatic moves (area pick, geocode) should pan the map; a drag
    // round-trip lands at the same spot so re-centering is a no-op there.
    map.panTo([lat, lng]);
  };
  map.on('click', function(e) {
    if (!pinMarker) return;
    pinMarker.setLatLng(e.latlng);
    post({ type: 'pin', lat: e.latlng.lat, lng: e.latlng.lng });
  });
  window.updateMarkers = function(markers) {
    markerLayer.clearLayers();
    var pts = [];
    markers.forEach(function(m) {
      if (typeof m.lat !== 'number' || typeof m.lng !== 'number') return;
      var mk = L.marker([m.lat, m.lng], { icon: icon(m.label, m.selected), zIndexOffset: m.selected ? 1000 : 0 }).addTo(markerLayer);
      mk.on('click', function() { post({ type: 'marker', id: m.id }); });
      pts.push([m.lat, m.lng]);
    });
    if (pts.length > 0 && !pinMarker) {
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
  pin,
  onPinMoved,
  style,
}: OsmMapProps) {
  const webRef = useRef<WebView>(null);
  const html = useRef(buildHtml(center, zoom)).current;
  const markersRef = useRef(markers);
  markersRef.current = markers;
  const pinRef = useRef(pin);
  pinRef.current = pin;
  const onMarkerPressRef = useRef(onMarkerPress);
  const onRegionChangedRef = useRef(onRegionChanged);
  const onPinMovedRef = useRef(onPinMoved);
  onMarkerPressRef.current = onMarkerPress;
  onRegionChangedRef.current = onRegionChanged;
  onPinMovedRef.current = onPinMoved;

  const pushMarkers = () => {
    webRef.current?.injectJavaScript(
      `if (window.updateMarkers) { window.updateMarkers(${JSON.stringify(markersRef.current)}); } true;`
    );
  };

  const pushPin = () => {
    const p = pinRef.current;
    if (!p) return;
    webRef.current?.injectJavaScript(
      `if (window.updatePin) { window.updatePin(${p.lat}, ${p.lng}); } true;`
    );
  };

  useEffect(() => {
    pushMarkers();
  }, [markers]);

  useEffect(() => {
    pushPin();
  }, [pin?.lat, pin?.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === "ready") {
        pushMarkers();
        pushPin();
      } else if (msg.type === "marker" && msg.id) {
        onMarkerPressRef.current?.(msg.id);
      } else if (msg.type === "pin") {
        onPinMovedRef.current?.(msg.lat, msg.lng);
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
        onLoadEnd={() => { pushMarkers(); pushPin(); }}
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
