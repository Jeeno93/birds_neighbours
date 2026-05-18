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

export interface PickerLocation extends MapPressCoords {
  address?: string;
  city?: string;
}

export type NativeMapMode = "default" | "locationPicker";

interface NativeMapProps {
  region: Region;
  markers?: MarkerData[];
  onMarkerPress?: (id: string) => void;
  onMapPress?: (coords: MapPressCoords) => void;
  mode?: NativeMapMode;
  onLocationSelected?: (loc: PickerLocation) => void;
  onConfirm?: (loc: PickerLocation) => void;
  initialLat?: number;
  initialLng?: number;
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

function buildPickerHtml(apiKey: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; }
    #map { width: 100%; height: 100%; }

    #address-bar {
      position: absolute;
      top: 0; left: 0; right: 0;
      z-index: 1000;
      background: white;
      padding: 16px;
      padding-top: 20px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }
    #address-text {
      font-size: 16px;
      font-weight: 600;
      color: #1a1a2e;
      line-height: 1.3;
    }
    #address-sub {
      font-size: 13px;
      color: #6b7c71;
      margin-top: 2px;
    }

    #center-marker {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -100%);
      font-size: 36px;
      z-index: 1000;
      pointer-events: none;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
    }

    #confirm-btn {
      position: absolute;
      bottom: 32px;
      left: 16px;
      right: 16px;
      z-index: 1000;
      background: #2d7d52;
      color: white;
      border: none;
      border-radius: 12px;
      padding: 16px;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
    #confirm-btn:disabled {
      opacity: 0.6;
    }
  </style>
</head>
<body>
  <div id="address-bar">
    <div id="address-text">Определяем местоположение…</div>
    <div id="address-sub"></div>
  </div>

  <div id="map"></div>
  <div id="center-marker">📍</div>

  <button id="confirm-btn" type="button">Подтвердить адрес</button>

  <script src="https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=ru_RU" type="text/javascript"></script>
  <script>
    var DEFAULT_LAT = 55.7558;
    var DEFAULT_LNG = 37.6173;
    var lastLat = (typeof window.initialLat === 'number') ? window.initialLat : DEFAULT_LAT;
    var lastLng = (typeof window.initialLng === 'number') ? window.initialLng : DEFAULT_LNG;
    var lastAddress = '';
    var lastCity = '';
    var geocodeTimer = null;
    var geocodeReqId = 0;
    var map;

    function postMsg(payload) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(payload));
      }
    }

    function reverseGeocode(lat, lng) {
      clearTimeout(geocodeTimer);
      geocodeTimer = setTimeout(function() {
        var reqId = ++geocodeReqId;
        ymaps.geocode([lat, lng], { results: 1 }).then(function(res) {
          if (reqId !== geocodeReqId) return;
          var obj = res.geoObjects.get(0);
          if (!obj) return;
          var address = obj.getAddressLine();
          var city = '';
          var components = obj.properties.get('metaDataProperty.GeocoderMetaData.Address.Components') || [];
          for (var i = 0; i < components.length; i++) {
            if (components[i].kind === 'locality') { city = components[i].name; break; }
          }
          if (!city) {
            for (var j = 0; j < components.length; j++) {
              if (components[j].kind === 'province') { city = components[j].name; break; }
            }
          }
          lastLat = lat;
          lastLng = lng;
          lastAddress = address;
          lastCity = city;
          document.getElementById('address-text').textContent = address || 'Адрес не найден';
          document.getElementById('address-sub').textContent = city;
          postMsg({
            type: 'addressUpdated',
            latitude: lat,
            longitude: lng,
            address: address,
            city: city
          });
        });
      }, 400);
    }

    ymaps.ready(function() {
      map = new ymaps.Map('map', {
        center: [lastLat, lastLng],
        zoom: 16,
        controls: ['geolocationControl', 'zoomControl']
      });

      // Отступы под address-bar сверху и кнопку снизу — чтобы Яндекс
      // позиционировал свои контролы (геолокация, зум) с учётом UI.
      try {
        map.margin.addArea({ top: 0, left: 0, right: 0, width: 9999, height: 80 });
        map.margin.addArea({ bottom: 0, left: 0, right: 0, width: 9999, height: 110 });
      } catch (e) {}

      map.events.add('actionend', function() {
        var c = map.getCenter();
        reverseGeocode(c[0], c[1]);
      });

      var geolocationControl = map.controls.get('geolocationControl');
      if (geolocationControl && geolocationControl.events) {
        geolocationControl.events.add('locationchange', function(e) {
          var position = e.get('position');
          if (position) {
            map.setCenter(position, 16);
            reverseGeocode(position[0], position[1]);
          }
        });
      }

      // Если переданы начальные координаты — центрируемся на них и геокодим.
      // Если нет — пытаемся автоматически определить браузерную геолокацию.
      if (typeof window.initialLat === 'number' && typeof window.initialLng === 'number') {
        map.setCenter([window.initialLat, window.initialLng], 16);
        reverseGeocode(window.initialLat, window.initialLng);
      } else {
        try {
          ymaps.geolocation
            .get({ provider: 'browser', mapStateAutoApply: false })
            .then(function(result) {
              var pos = result.geoObjects.get(0);
              if (pos) {
                var coords = pos.geometry.getCoordinates();
                map.setCenter(coords, 16);
                reverseGeocode(coords[0], coords[1]);
              } else {
                reverseGeocode(lastLat, lastLng);
              }
            })
            .catch(function() {
              reverseGeocode(lastLat, lastLng);
            });
        } catch (e) {
          reverseGeocode(lastLat, lastLng);
        }
      }
    });

    document.getElementById('confirm-btn').addEventListener('click', function() {
      var lat = lastLat;
      var lng = lastLng;
      if (map) {
        var c = map.getCenter();
        lat = c[0];
        lng = c[1];
      }
      postMsg({
        type: 'confirmed',
        latitude: lat,
        longitude: lng,
        address: lastAddress,
        city: lastCity
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
  onConfirm,
  initialLat,
  initialLng,
  zoom = 11,
}: NativeMapProps) {
  const webViewRef = useRef<WebView>(null);

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
          data?.type === "addressUpdated" &&
          typeof data.latitude === "number" &&
          typeof data.longitude === "number" &&
          onLocationSelected
        ) {
          onLocationSelected({
            latitude: data.latitude,
            longitude: data.longitude,
            address: typeof data.address === "string" ? data.address : undefined,
            city: typeof data.city === "string" ? data.city : undefined,
          });
        }
        if (
          data?.type === "confirmed" &&
          typeof data.latitude === "number" &&
          typeof data.longitude === "number" &&
          onConfirm
        ) {
          onConfirm({
            latitude: data.latitude,
            longitude: data.longitude,
            address: typeof data.address === "string" ? data.address : undefined,
            city: typeof data.city === "string" ? data.city : undefined,
          });
        }
      } catch {
        // ignore malformed payloads
      }
    },
    [onMarkerPress, onMapPress, onLocationSelected, onConfirm]
  );

  const html = useMemo(() => {
    if (mode === "locationPicker") {
      return buildPickerHtml(YANDEX_API_KEY);
    }
    return buildDefaultHtml(region, markers, YANDEX_API_KEY, zoom);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, region, markers, zoom]);

  const injectedBeforeLoad = useMemo(() => {
    if (mode !== "locationPicker") return undefined;
    const latLit =
      typeof initialLat === "number" && Number.isFinite(initialLat)
        ? String(initialLat)
        : "undefined";
    const lngLit =
      typeof initialLng === "number" && Number.isFinite(initialLng)
        ? String(initialLng)
        : "undefined";
    return `window.initialLat = ${latLit}; window.initialLng = ${lngLit}; true;`;
  }, [mode, initialLat, initialLng]);

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
        geolocationEnabled
        injectedJavaScriptBeforeContentLoaded={injectedBeforeLoad}
        onError={(e) => console.warn("WebView error:", e.nativeEvent)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});
