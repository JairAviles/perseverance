const SOURCE = 'lightTime';
const LANDING = Date.UTC(2021, 1, 18, 20, 55);
const SOL_MS = 88775244;
const HISTORY_STEP_SOLS = 5;
const LIVE_INTERVAL_MS = 1000;
// Seconds for light to cross one astronomical unit
const LIGHT_SECONDS_PER_AU = 499.004784;
const J2000_MS = Date.UTC(2000, 0, 1, 12);
const CENTURY_MS = 36525 * 86400000;
const DEGREES = Math.PI / 180;
// JPL approximate orbits (1800-2050): value at J2000, then change per century, for
// semi-major axis (AU), eccentricity, inclination, mean longitude, longitude of perihelion, ascending node (degrees)
const EARTH_ORBIT = [1.00000261, 0.00000562, 0.01671123, -0.00004392, -0.00001531, -0.01294668, 100.46457166, 35999.37244981, 102.93768193, 0.32327364, 0, 0];
const MARS_ORBIT = [1.52371034, 0.00001847, 0.0933941, 0.00007882, 1.84969142, -0.00813131, -4.55343205, 19140.30268499, -23.94362959, 0.44441088, 49.55953891, -0.29257343];

// Position around the Sun in AU
function getPosition(orbit, centuries) {
  const [a, e, inclination, longitude, perihelion, node] = [0, 2, 4, 6, 8, 10].map(
    (i) => orbit[i] + orbit[i + 1] * centuries
  );
  const w = (perihelion - node) * DEGREES;
  const meanAnomaly = (longitude - perihelion) * DEGREES;
  let E = meanAnomaly;
  for (let i = 0; i < 8; i++) E -= (E - e * Math.sin(E) - meanAnomaly) / (1 - e * Math.cos(E));

  const x = a * (Math.cos(E) - e);
  const y = a * Math.sqrt(1 - e * e) * Math.sin(E);
  const cosW = Math.cos(w);
  const sinW = Math.sin(w);
  const cosNode = Math.cos(node * DEGREES);
  const sinNode = Math.sin(node * DEGREES);
  const cosI = Math.cos(inclination * DEGREES);
  const sinI = Math.sin(inclination * DEGREES);
  return [
    (cosW * cosNode - sinW * sinNode * cosI) * x + (-sinW * cosNode - cosW * sinNode * cosI) * y,
    (cosW * sinNode + sinW * cosNode * cosI) * x + (-sinW * sinNode + cosW * cosNode * cosI) * y,
    sinW * sinI * x + cosW * sinI * y,
  ];
}

// One-way light travel time between Earth and Mars in seconds
function getLightTime(time) {
  const centuries = (time - J2000_MS) / CENTURY_MS;
  const earth = getPosition(EARTH_ORBIT, centuries);
  const mars = getPosition(MARS_ORBIT, centuries);
  return Math.hypot(earth[0] - mars[0], earth[1] - mars[1], earth[2] - mars[2]) * LIGHT_SECONDS_PER_AU;
}

function getDatum(time) {
  return { sol: (time - LANDING) / SOL_MS, value: getLightTime(time) };
}

export function createLightTimeTelemetry(telemetry) {
  telemetry.addPoint({
    key: 'lightTime',
    name: 'Light travel time',
    unit: 's',
    decimals: 2,
    source: SOURCE,
    describe: (latest) =>
      `A radio command sent from Earth right now reaches Percy in ${Math.floor(latest.value / 60)} min ${Math.floor(latest.value % 60)} s.`,
  });

  telemetry.addProvider({
    name: 'JPL orbit calculation',
    supports: (point) => point.source === SOURCE,
    request: () => {
      const now = Date.now();
      const history = [];
      for (let time = LANDING; time < now; time += HISTORY_STEP_SOLS * SOL_MS) history.push(getDatum(time));
      history.push(getDatum(now));
      return Promise.resolve(history);
    },
    subscribe: (point, callback) => {
      const interval = setInterval(() => callback(getDatum(Date.now())), LIVE_INTERVAL_MS);
      return () => clearInterval(interval);
    },
  });
}
