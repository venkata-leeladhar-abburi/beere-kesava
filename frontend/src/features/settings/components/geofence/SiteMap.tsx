import { F, T } from "../labelSettings/primitives";

/**
 * The site and its radius drawn over an OpenStreetMap tile.
 *
 * A radius is a number nobody can sanity-check by reading it — 100 metres
 * over this particular building either covers the premises or it doesn't, and
 * the only way to know is to see it. This is the single most useful control
 * on the page for that reason.
 *
 * Static tiles via an <img>, no map library and no API key: the map is never
 * panned or zoomed, so a slippy-map dependency would cost a few hundred KB of
 * bundle to deliver a picture. The circle is SVG on top, sized from the tile's
 * real metres-per-pixel at this latitude, so it is a true 100m — not a
 * decorative ring.
 */

/** Web Mercator ground resolution: metres per pixel at a given zoom/latitude. */
function metresPerPixel(latitude: number, zoom: number): number {
  return (156543.03392 * Math.cos((latitude * Math.PI) / 180)) / Math.pow(2, zoom);
}

const TILE_SIZE = 256;

export function SiteMap({
  latitude,
  longitude,
  radiusMeters,
  width = 300,
  height = 240,
}: {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  /** Frame size in px. Kept under 320 so the card never forces a mobile
   *  viewport to scroll sideways — the tile maths needs real pixels. */
  width?: number;
  height?: number;
}) {
  // Chosen so a 100m radius fills a useful share of the frame without the
  // building leaving it. Higher zoom = more detail, smaller ground coverage.
  const zoom = 17;
  const mpp = metresPerPixel(latitude, zoom);
  const radiusPx = radiusMeters / mpp;

  // OSM's static tile endpoint has no "centre on this point" parameter, so
  // the centre tile is computed and drawn as a 3x3 block offset by the
  // fractional position of the point within its own tile.
  const n = Math.pow(2, zoom);
  const xExact = ((longitude + 180) / 360) * n;
  const latRad = (latitude * Math.PI) / 180;
  const yExact =
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
  const xTile = Math.floor(xExact);
  const yTile = Math.floor(yExact);
  const offsetX = (xExact - xTile) * TILE_SIZE;
  const offsetY = (yExact - yTile) * TILE_SIZE;

  const tiles = [-1, 0, 1].flatMap((dy) => [-1, 0, 1].map((dx) => ({ dx, dy })));

  return (
    <div>
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: width,
          height,
          borderRadius: 14,
          overflow: "hidden",
          border: `1px solid ${T.borderGold}`,
          background: T.silkCream,
        }}
      >
        <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
          {tiles.map(({ dx, dy }) => (
            <img
              key={`${dx}:${dy}`}
              src={`https://tile.openstreetmap.org/${zoom}/${xTile + dx}/${yTile + dy}.png`}
              alt=""
              aria-hidden
              width={TILE_SIZE}
              height={TILE_SIZE}
              loading="lazy"
              style={{
                position: "absolute",
                left: width / 2 - offsetX + dx * TILE_SIZE,
                top: height / 2 - offsetY + dy * TILE_SIZE,
                // A tile that fails to load leaves the cream background rather
                // than a broken-image glyph; the circle and pin still render,
                // so the control degrades to "no photo" instead of breaking.
                maxWidth: "none",
              }}
            />
          ))}
        </div>

        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
          role="img"
          aria-label={`Map showing a ${radiusMeters} metre radius around the site`}
        >
          <circle
            cx={width / 2}
            cy={height / 2}
            r={radiusPx}
            fill="rgba(110,15,45,0.16)"
            stroke={T.royalBurgundy}
            strokeWidth={2}
          />
          <circle cx={width / 2} cy={height / 2} r={5} fill={T.royalBurgundy} stroke="#FFFDF9" strokeWidth={2} />
        </svg>
      </div>

      <div
        style={{
          fontFamily: F.ui,
          fontSize: 11,
          color: T.taupe,
          marginTop: 6,
          maxWidth: width,
        }}
      >
        Map data © OpenStreetMap contributors. The shaded circle is the {radiusMeters} m radius at
        this scale.
      </div>
    </div>
  );
}
