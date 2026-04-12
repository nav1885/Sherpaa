/**
 * Leaflet-based map rendered in a WebView.
 * Uses CartoDB Dark Matter tiles — no API key, no Google dependency.
 */
import React, { useRef, useCallback } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import WebView from 'react-native-webview';
import { LatLng } from '../utils/polyline';
import { MatchedSegment } from '../services/routeMatching';

interface Props {
  routePolyline: LatLng[] | null;
  matchedSegments: MatchedSegment[];
  /** Pixels to keep clear at the top (status bar + pills). */
  topPad?: number;
  style?: ViewStyle;
}

const MAP_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #111820; overflow: hidden; }
    #map { width: 100vw; height: 100vh; }
    .leaflet-control-zoom,
    .leaflet-control-attribution { display: none !important; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      zoomControl: false,
      attributionControl: false,
      fadeAnimation: false,
    }).setView([37.7749, -122.4194], 12);

    L.tileLayer(
      'https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png',
      { maxZoom: 19 }
    ).addTo(map);

    var routeLayer = null;
    var segLayers = [];

    function updateMap(data) {
      if (routeLayer) { map.removeLayer(routeLayer); routeLayer = null; }
      segLayers.forEach(function(l) { map.removeLayer(l); });
      segLayers = [];

      if (data.route && data.route.length > 0) {
        var coords = data.route.map(function(p) { return [p.lat, p.lng]; });
        routeLayer = L.polyline(coords, {
          color: '#F5C842',
          weight: 4,
          opacity: 0.9,
        }).addTo(map);
        var tp = data.topPad || 80;
        map.fitBounds(routeLayer.getBounds(), {
          paddingTopLeft:     [24, tp],
          paddingBottomRight: [24, 24],
        });
      }

      (data.segments || []).forEach(function(seg) {
        var c = L.circle([seg.lat, seg.lng], {
          radius: 80,
          color: '#F5C842',
          fillColor: '#F5C842',
          fillOpacity: 0.3,
          weight: 2,
        }).addTo(map);
        segLayers.push(c);
      });
    }

    // Signal RN that Leaflet is ready
    window.ReactNativeWebView && window.ReactNativeWebView.postMessage('ready');

    document.addEventListener('message', function(e) {
      try { updateMap(JSON.parse(e.data)); } catch(_) {}
    });
    window.addEventListener('message', function(e) {
      try { updateMap(JSON.parse(e.data)); } catch(_) {}
    });
  </script>
</body>
</html>
`;

export default function MapWebView({ routePolyline, matchedSegments, topPad = 80, style }: Props) {
  const webViewRef = useRef<WebView>(null);
  const isReadyRef = useRef(false);
  const pendingRef = useRef<string | null>(null);

  function buildJS(polyline: LatLng[] | null, segments: MatchedSegment[], tp: number) {
    const payload = JSON.stringify({
      route: polyline ?? [],
      segments: segments.map(ms => ({
        lat: ms.segment.startLat,
        lng: ms.segment.startLng,
      })),
      topPad: tp,
    });
    return `(function(){ try { updateMap(${payload}); } catch(e){} })(); true;`;
  }

  const inject = useCallback((polyline: LatLng[] | null, segs: MatchedSegment[], tp: number) => {
    const js = buildJS(polyline, segs, tp);
    if (isReadyRef.current) {
      webViewRef.current?.injectJavaScript(js);
    } else {
      pendingRef.current = js;
    }
  }, []);

  React.useEffect(() => {
    inject(routePolyline, matchedSegments, topPad);
  }, [routePolyline, matchedSegments, topPad, inject]);

  const handleMessage = useCallback(() => {
    isReadyRef.current = true;
    if (pendingRef.current) {
      webViewRef.current?.injectJavaScript(pendingRef.current);
      pendingRef.current = null;
    }
  }, []);

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        source={{ html: MAP_HTML }}
        style={StyleSheet.absoluteFill}
        scrollEnabled={false}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        onMessage={handleMessage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
});
