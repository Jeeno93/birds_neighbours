import * as Location from "expo-location";
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
  draggable?: boolean;
}

export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta?: number;
  longitudeDelta?: number;
}

export interface MapPressCoords {
  latitude: number;
  longitude: number;
}

export type NativeMapMode = "default" | "locationPicker";

interface NativeMapProps {
  region: Region;
  markers?: MarkerData[];
  onMarkerPress?: (id: string) => void;
  onMapPress?: (coords: MapPressCoords) => void;
  mode?: NativeMapMode;
  onLocationSelected?: (coords: MapPressCoords) => void;
  zoom?: number;
}

const YANDEX_API_KEY = process.env.EXPO_PUBLIC_YANDEX_MAPS_API_KEY ?? "";

function buildDefaultHtml(
  region: Region,
  markers: MarkerData[],
  apiKey: string,
  zoom: number
): string {
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
    window.mapZoom = ${zoom};
  </script>
  <script src="https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=ru_RU" type="text/javascript"></script>
  <script>
    ymaps.ready(function () {
      var map = new ymaps.Map('map', {
        center: [window.region.latitude, window.region.longitude],
        zoom: window.mapZoom,
        controls: ['zoomControl']
      });

      map.events.add('click', function(e) {
        var coords = e.get('coords');
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'mapPress',
            latitude: coords[0],
            longitude: coords[1]
          }));
        }
      });

      window.markers.forEach(function(marker) {
        var options = marker.markerColor
          ? {
              iconLayout: 'default#imageWithContent',
              iconImageHref: 'data:image/svg+xml;utf8,' + encodeURIComponent(
                '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22"><circle cx="11" cy="11" r="8" fill="' + marker.markerColor + '" stroke="#fff" stroke-width="2"/></svg>'
              ),
              iconImageSize: [22, 22],
              iconImageOffset: [-11, -11],
              draggable: !!marker.draggable
            }
          : {
              preset: marker.isSelected
                ? 'islands#redDotIcon'
                : 'islands#greenDotIcon',
              draggable: !!marker.draggable
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
        if (marker.draggable) {
          placemark.events.add('dragend', function() {
            var coords = placemark.geometry.getCoordinates();
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'mapPress',
                latitude: coords[0],
                longitude: coords[1]
              }));
            }
          });
        }
        map.geoObjects.add(placemark);
      });
    });
  </script>
</body>
</html>`;
}

function buildPickerHtml(region: Region, apiKey: string, zoom: number): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; }
    #map { width: 100%; height: 100%; }
    #centerMarker {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -100%);
      font-size: 32px;
      line-height: 32px;
      z-index: 1000;
      pointer-events: none;
      filter: drop-shadow(0 2px 3px rgba(0,0,0,0.35));
    }
    #geoBtn {
      position: absolute;
      bottom: 16px;
      right: 16px;
      width: 44px;
      height: 44px;
      border-radius: 22px;
      background: #fff;
      border: none;
      font-size: 20px;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <div id="centerMarker">📍</div>
  <button id="geoBtn" type="button">➤</button>
  <script>
    window.region = ${JSON.stringify(region)};
    window.mapZoom = ${zoom};
  </script>
  <script src="https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=ru_RU" type="text/javascript"></script>
  <script>
    ymaps.ready(function () {
      var map = new ymaps.Map('map', {
        center: [window.region.latitude, window.region.longitude],
        zoom: window.mapZoom,
        controls: []
      });
      window.__map = map;

      function postCenter() {
        var c = map.getCenter();
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'centerChanged',
            latitude: c[0],
            longitude: c[1]
          }));
        }
      }

      map.events.add('actionend', postCenter);

      // initial centerChanged so parent gets the starting address
      setTimeout(postCenter, 50);

      document.getElementById('geoBtn').addEventListener('click', function() {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'requestGeo'
          }));
        }
      });
    });
  </script>
</body>
</html>`;
}

export default function NativeMap({
  region,
  markers = [],
  onMarkerPress,
  onMapPress,
  mode = "default",
  onLocationSelected,
  zoom = 11,
}: NativeMapProps) {
  const webViewRef = useRef<WebView>(null);

  // For picker mode, capture the initial region once so user pans aren't
  // overwritten by parent state changes (parent gets coords via callback).
  const initialRegionRef = useRef<Region>(region);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data?.type === "markerPress" && typeof data.id === "string" && onMarkerPress) {
          onMarkerPress(data.id);
        }
        if (
          data?.type === "mapPress" &&
          typeof data.latitude === "number" &&
          typeof data.longitude === "number" &&
          onMapPress
        ) {
          onMapPress({ latitude: data.latitude, longitude: data.longitude });
        }
        if (
          data?.type === "centerChanged" &&
          typeof data.latitude === "number" &&
          typeof data.longitude === "number" &&
          onLocationSelected
        ) {
          onLocationSelected({
            latitude: data.latitude,
            longitude: data.longitude,
          });
        }
        if (data?.type === "requestGeo") {
          (async () => {
            try {
              const { status } = await Location.requestForegroundPermissionsAsync();
              if (status !== "granted") return;
              const loc = await Location.getCurrentPositionAsync({});
              const lat = loc.coords.latitude;
              const lng = loc.coords.longitude;
              webViewRef.current?.injectJavaScript(
                `if (window.__map) { window.__map.setCenter([${lat}, ${lng}], 16, { duration: 250 }); } true;`
              );
            } catch {
              // ignore — пользователь подвинет карту вручную
            }
          })();
        }
      } catch {
        // ignore malformed payloads
      }
    },
    [onMarkerPress, onMapPress, onLocationSelected]
  );

  const html = useMemo(() => {
    if (mode === "locationPicker") {
      return buildPickerHtml(initialRegionRef.current, YANDEX_API_KEY, zoom);
    }
    return buildDefaultHtml(region, markers, YANDEX_API_KEY, zoom);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, region, markers, zoom]);

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
