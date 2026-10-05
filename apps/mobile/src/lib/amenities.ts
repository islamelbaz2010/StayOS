// Shared amenity vocabulary. Values must match the backend/web amenity
// strings (lowercase snake_case) — search filters and the web host form
// operate on these exact values.

export const AMENITY_VALUES = [
  "wifi",
  "air_conditioning",
  "heating",
  "kitchen",
  "parking",
  "pool",
  "gym",
  "washer",
  "tv",
  "elevator",
];

export function amenityLabel(value: string, t: (key: string) => string): string {
  const key = `amenity_${value.toLowerCase()}`;
  const label = t(key);
  return label === key ? value.replace(/_/g, " ") : label;
}
