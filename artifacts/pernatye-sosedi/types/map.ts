export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface MarkerData {
  id: string;
  latitude: number;
  longitude: number;
  isSelected: boolean;
  onPress: () => void;
  markerColor: string;
  selectedColor: string;
}
