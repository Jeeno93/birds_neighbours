export interface PickedLocation {
  lat: number;
  lng: number;
  address: string;
  city: string;
}

let pending: PickedLocation | null = null;

export function setPickedLocation(p: PickedLocation): void {
  pending = p;
}

export function consumePickedLocation(): PickedLocation | null {
  const result = pending;
  pending = null;
  return result;
}
