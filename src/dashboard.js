import './dashboard.css';

const CHART_HEIGHT = 52;
const CHART_PADDING = 4;
const CHART_COLOR = '#ffb878';
const TOGGLE_KEY = 'KeyT';

function createElement(tag, className, text = '') {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = text;
  return element;
}

// Maps sols and values to pixels inside the chart
function getScale(canvas, history) {
  const values = history.map((datum) => datum.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const firstSol = history[0].sol;
  const lastSol = history[history.length - 1].sol;
  const width = canvas.clientWidth - CHART_PADDING * 2;
  return {
    x: (datum) => CHART_PADDING + ((datum.sol - firstSol) / (lastSol - firstSol)) * width,
    y: (datum) => CHART_HEIGHT - CHART_PADDING - ((datum.value - min) / (max - min || 1)) * (CHART_HEIGHT - CHART_PADDING * 2),
    sol: (pixel) => firstSol + ((pixel - CHART_PADDING) / width) * (lastSol - firstSol),
  };
}

function drawChart(canvas, history, hovered) {
  const width = canvas.clientWidth;
  const ratio = Math.min(window.devicePixelRatio, 2);
  canvas.width = width * ratio;
  canvas.height = CHART_HEIGHT * ratio;
  const context = canvas.getContext('2d');
  context.scale(ratio, ratio);

  const { x, y } = getScale(canvas, history);

  context.beginPath();
  history.forEach((datum, i) => (i ? context.lineTo(x(datum), y(datum)) : context.moveTo(x(datum), y(datum))));
  context.strokeStyle = CHART_COLOR;
  context.lineWidth = 1.2;
  context.lineJoin = 'round';
  context.stroke();

  // Soft fill under the line
  context.lineTo(x(history[history.length - 1]), CHART_HEIGHT);
  context.lineTo(x(history[0]), CHART_HEIGHT);
  const gradient = context.createLinearGradient(0, 0, 0, CHART_HEIGHT);
  gradient.addColorStop(0, 'rgba(255, 184, 120, 0.3)');
  gradient.addColorStop(1, 'rgba(255, 184, 120, 0)');
  context.fillStyle = gradient;
  context.fill();

  // The latest reading
  const latest = history[history.length - 1];
  context.beginPath();
  context.arc(x(latest), y(latest), 2.5, 0, Math.PI * 2);
  context.fillStyle = '#fff';
  context.fill();

  // The reading under the pointer
  if (hovered) {
    context.fillStyle = 'rgba(255, 244, 232, 0.5)';
    context.fillRect(Math.round(x(hovered)), 0, 1, CHART_HEIGHT);
    context.beginPath();
    context.arc(x(hovered), y(hovered), 3, 0, Math.PI * 2);
    context.fillStyle = '#fff';
    context.fill();
  }
}

function createCard(telemetry, point) {
  const card = createElement('article', 'telemetry-card');
  card.dataset.key = point.key;
  card.dataset.loaded = 'false';

  const head = createElement('div', 'telemetry-head');
  head.append(createElement('span', 'telemetry-name', point.name), createElement('span', 'telemetry-provider', telemetry.getProvider(point).name));
  const reading = createElement('div', 'telemetry-reading');
  const value = createElement('span', 'telemetry-value', '···');
  reading.append(value, createElement('span', 'telemetry-unit', point.unit));
  const plot = createElement('div', 'telemetry-plot');
  const canvas = createElement('canvas', 'telemetry-chart');
  const tooltip = createElement('span', 'telemetry-tooltip');
  tooltip.hidden = true;
  plot.append(canvas, tooltip);
  const axis = createElement('div', 'telemetry-axis');
  const description = createElement('p', 'telemetry-description', 'Waiting for signal');
  card.append(head, reading, plot, axis, description);

  let history = [];
  let hovered = null;

  function showTooltip() {
    tooltip.hidden = !hovered;
    if (!hovered) return;
    tooltip.textContent = `${hovered.value.toFixed(point.decimals)} ${point.unit} · Sol ${Math.floor(hovered.sol)}`;
    // Keep the label inside the chart near the edges
    const x = getScale(canvas, history).x(hovered);
    const left = Math.min(Math.max(x - tooltip.offsetWidth / 2, 0), canvas.clientWidth - tooltip.offsetWidth);
    tooltip.style.transform = `translateX(${left}px)`;
  }

  // The reading closest to the pointer along the mission
  canvas.addEventListener('pointermove', (event) => {
    if (history.length < 2) return;
    const sol = getScale(canvas, history).sol(event.offsetX);
    hovered = history.reduce((closest, datum) => (Math.abs(datum.sol - sol) < Math.abs(closest.sol - sol) ? datum : closest));
    drawChart(canvas, history, hovered);
    showTooltip();
  });
  canvas.addEventListener('pointerleave', () => {
    hovered = null;
    drawChart(canvas, history);
    showTooltip();
  });

  function render() {
    const latest = history[history.length - 1];
    const values = history.map((datum) => datum.value);
    value.textContent = latest.value.toFixed(point.decimals);
    card.dataset.value = `${value.textContent} ${point.unit}`;
    description.textContent = point.describe(latest, history);
    axis.replaceChildren(
      createElement('span', '', `Sol ${Math.floor(history[0].sol)}`),
      createElement('span', '', `${Math.min(...values).toFixed(point.decimals)} to ${Math.max(...values).toFixed(point.decimals)} ${point.unit}`),
      createElement('span', '', `Sol ${Math.floor(latest.sol)}`)
    );
    drawChart(canvas, history, hovered);
    card.dataset.loaded = String(history.length > 1 && Number.isFinite(latest.value));
  }

  telemetry
    .request(point)
    .then((data) => {
      history = data;
      render();
      // Live readings replace the newest point on the chart
      telemetry.subscribe(point, (datum) => {
        history[history.length - 1] = datum;
        render();
      });
    })
    .catch((error) => {
      description.textContent = 'No signal';
      console.error(`Telemetry "${point.name}" failed to load`, error);
    });

  window.addEventListener('resize', () => history.length > 1 && drawChart(canvas, history, hovered));

  return { element: card };
}

export function createDashboard(telemetry) {
  const element = createElement('aside', 'dashboard');
  const header = createElement('header', 'dashboard-header');
  header.append(createElement('span', '', 'Mission control'), createElement('span', 'dashboard-hint', 'T to hide'));
  const cards = telemetry.points.map((point) => createCard(telemetry, point));
  element.append(header, ...cards.map((card) => card.element));
  document.body.appendChild(element);

  window.addEventListener('keydown', (event) => {
    if (event.code === TOGGLE_KEY && !event.repeat) element.classList.toggle('is-hidden');
  });

  return { element };
}
