import React, { useCallback, useMemo, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";

export interface MarkerData {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  markerColor?: string;
  isSelected?: boolean;
}

export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta?: number;
  longitudeDelta?: number;
}

interface NativeMapProps {
  region: Region;
  markers?: MarkerData[];
  onMarkerPress?: (id: string) => void;
}

const YANDEX_API_KEY = process.env.EXPO_PUBLIC_YANDEX_MAPS_API_KEY ?? "";

function buildMapHtml(region: Region, markers: MarkerData[], apiKey: string): string {
  const markersJson = JSON.stringify(markers);
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    window.markers = ${markersJson};
    window.region = ${JSON.stringify(region)};
  </script>
  <script src="https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=ru_RU" type="text/javascript"></script>
  <script>
    ymaps.ready(function () {
      var map = new ymaps.Map('map', {
        center: [window.region.latitude, window.region.longitude],
        zoom: 11,
        controls: ['zoomControl']
      });

      window.markers.forEach(function(marker) {
        var options = marker.markerColor
          ? {
              iconLayout: 'default#imageWithContent',
              iconImageHref: 'data:image/svg+xml;utf8,' + encodeURIComponent(
                '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22"><circle cx="11" cy="11" r="8" fill="' + marker.markerColor + '" stroke="#fff" stroke-width="2"/></svg>'
              ),
              iconImageSize: [22, 22],
              iconImageOffset: [-11, -11]
            }
          : {
              preset: marker.isSelected
                ? 'islands#redDotIcon'
                : 'islands#greenDotIcon'
            };
        var placemark = new ymaps.Placemark(
          [marker.latitude, marker.longitude],
          { balloonContent: marker.title },
          options
        );
        placemark.events.add('click', function() {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'markerPress',
              id: marker.id
            }));
          }
        });
        map.geoObjects.add(placemark);
      });
    });
  </script>
</body>
</html>`;
}

export default function NativeMap({ region, markers = [], onMarkerPress }: NativeMapProps) {
  const webViewRef = useRef<WebView>(null);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data?.type === "markerPress" && typeof data.id === "string" && onMarkerPress) {
          onMarkerPress(data.id);
        }
      } catch {
        // ignore malformed payloads
      }
    },
    [onMarkerPress]
  );

  const html = useMemo(
    () => buildMapHtml(region, markers, YANDEX_API_KEY),
    [region, markers]
  );

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html, baseUrl: "https://api-maps.yandex.ru" }}
        style={styles.map}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={["*"]}
        mixedContentMode="always"
        onError={(e) => console.warn("WebView error:", e.nativeEvent)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});
