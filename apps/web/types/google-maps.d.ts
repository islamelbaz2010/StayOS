declare namespace google {
  namespace maps {
    class Map {
      constructor(
        el: Element,
        opts?: {
          center?: { lat: number; lng: number };
          zoom?: number;
          disableDefaultUI?: boolean;
          zoomControl?: boolean;
          clickableIcons?: boolean;
          [key: string]: unknown;
        }
      );
    }

    class Marker {
      constructor(opts: {
        position: { lat: number; lng: number };
        map?: Map;
        title?: string;
        [key: string]: unknown;
      });
    }
  }
}
