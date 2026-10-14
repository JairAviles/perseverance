// Mission telemetry, following Open MCT: data points describe themselves (name, unit, source)
// and providers supply their values, so the dashboard never knows where a number comes from
export function createTelemetry() {
  const points = [];
  const providers = [];

  function addPoint(point) {
    points.push(point);
  }

  function addProvider(provider) {
    providers.unshift(provider);
  }

  function getProvider(point) {
    return providers.find((provider) => provider.supports(point));
  }

  // Whole-mission history as { sol, value }, oldest first
  function request(point) {
    const provider = getProvider(point);
    return provider?.request ? provider.request(point) : Promise.resolve([]);
  }

  // Live values; returns a function that stops them
  function subscribe(point, callback) {
    const provider = getProvider(point);
    return provider?.subscribe ? provider.subscribe(point, callback) : () => {};
  }

  return { points, addPoint, addProvider, getProvider, request, subscribe };
}
