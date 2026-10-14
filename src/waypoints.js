// NASA's driving history: one entry per place the real rover stopped
const WAYPOINTS_URL = 'https://mars.nasa.gov/mmgis-maps/M20/Layers/json/M20_waypoints.json';
const SOURCE = 'waypoints';
const READ = {
  distance: (waypoint) => waypoint.dist_total_m / 1000,
  elevation: (waypoint) => waypoint.elev_geoid,
  slope: (waypoint) => waypoint.tilt,
};

export function createWaypointTelemetry(telemetry) {
  let waypoints = null;

  // All three data points share one download
  function load() {
    waypoints ??= fetch(WAYPOINTS_URL)
      .then((response) => {
        if (!response.ok) throw new Error(`Waypoints request failed: ${response.status}`);
        return response.json();
      })
      .then((data) => {
        const list = data.features.map((feature) => feature.properties).sort((a, b) => a.sol - b.sol);
        // Mid-drive entries have no running total, so they keep the last known one
        let total = 0;
        list.forEach((waypoint) => {
          total = Math.max(total, waypoint.dist_total_m);
          waypoint.dist_total_m = total;
        });
        return list;
      });
    return waypoints;
  }

  telemetry.addPoint({
    key: 'distance',
    name: 'Distance traveled',
    unit: 'km',
    decimals: 2,
    source: SOURCE,
    describe: (latest) =>
      `Percy has driven ${latest.value.toFixed(2)} km across Jezero Crater since landing, as of sol ${latest.sol}.`,
  });
  telemetry.addPoint({
    key: 'elevation',
    name: 'Terrain elevation',
    unit: 'm',
    decimals: 1,
    source: SOURCE,
    describe: (latest, history) =>
      `Height of the ground under Percy against Mars's zero level. It has climbed ${(latest.value - history[0].value).toFixed(0)} m since landing.`,
  });
  telemetry.addPoint({
    key: 'slope',
    name: 'Slope',
    unit: '°',
    decimals: 1,
    source: SOURCE,
    describe: (latest, history) =>
      `How far Percy was leaning at its latest stop. The steepest so far was ${Math.max(...history.map((datum) => datum.value)).toFixed(1)}°.`,
  });

  telemetry.addProvider({
    name: 'NASA M20 waypoints',
    supports: (point) => point.source === SOURCE,
    request: (point) =>
      load().then((list) => list.map((waypoint) => ({ sol: waypoint.sol, value: READ[point.key](waypoint) }))),
  });
}
