const numberLine = document.querySelector("#number-line");
const startInput = document.querySelector("#start-number");
const topTargetInput = document.querySelector("#top-target");
const bottomTargetInput = document.querySelector("#bottom-target");
const goButton = document.querySelector("#go-button");
const resetButton = document.querySelector("#reset-button");
const tenthsToggle = document.querySelector("#tenths-toggle");
const hundredthsToggle = document.querySelector("#hundredths-toggle");
const statusMessage = document.querySelector("#status-message");

const MIN_POSITION = 4;
const MAX_POSITION = 96;
const TOTAL_STEPS = 200;
const SVG_NS = "http://www.w3.org/2000/svg";

let activeArcs = null;

function formatValue(value) {
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded)
    ? String(rounded)
    : String(rounded.toFixed(2).replace(/0$/, ""));
}

function getStartNumber() {
  const parsed = Number.parseInt(startInput.value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getLineEndNumber() {
  return getStartNumber() + TOTAL_STEPS / 100;
}

function positionForStep(step) {
  return MIN_POSITION + (step / TOTAL_STEPS) * (MAX_POSITION - MIN_POSITION);
}

function positionForValue(value) {
  const step = Math.round((value - getStartNumber()) * 100);
  return positionForStep(step);
}

function makeTick(step, type, value) {
  const tick = document.createElement("span");
  tick.className = `tick ${type}`;
  tick.style.left = `${positionForStep(step)}%`;
  tick.dataset.value = formatValue(value);

  return tick;
}

function addTickLabel(tick, value, isTenth = false) {
  const label = document.createElement("span");
  label.className = isTenth ? "tick-label tenth-label" : "tick-label";
  label.textContent = formatValue(value);
  tick.appendChild(label);
}

function makeSvgElement(tagName, attributes) {
  const element = document.createElementNS(SVG_NS, tagName);
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  return element;
}

function makeArc(svg, value, side) {
  const startX = positionForValue(getStartNumber());
  const endX = positionForValue(value);
  const midX = (startX + endX) / 2;
  const distance = Math.abs(endX - startX);
  const curveHeight = Math.min(24, Math.max(10, distance * 0.35));
  const axisY = 50;
  const controlY = side === "top" ? axisY - curveHeight : axisY + curveHeight;
  const path = makeSvgElement("path", {
    class: `arc-path ${side}`,
    d: `M ${startX} ${axisY} Q ${midX} ${controlY} ${endX} ${axisY}`,
  });
  const endpoint = makeSvgElement("circle", {
    class: `arc-endpoint ${side}`,
    cx: endX,
    cy: axisY,
    r: 1.4,
  });

  svg.append(path, endpoint);
}

function renderArcs() {
  const existingArcLayer = numberLine.querySelector(".arc-layer");
  if (existingArcLayer) {
    existingArcLayer.remove();
  }

  if (!activeArcs) {
    return;
  }

  const svg = makeSvgElement("svg", {
    class: "arc-layer",
    viewBox: "0 0 100 100",
    preserveAspectRatio: "none",
    "aria-hidden": "true",
  });

  makeArc(svg, activeArcs.top, "top");
  makeArc(svg, activeArcs.bottom, "bottom");
  numberLine.appendChild(svg);
}

function renderNumberLine() {
  const start = getStartNumber();
  const showTenths = tenthsToggle.checked;
  const showHundredths = hundredthsToggle.checked;

  numberLine.innerHTML = '<div class="axis-line" aria-hidden="true"></div>';

  for (let step = 0; step <= TOTAL_STEPS; step += 1) {
    const value = start + step / 100;
    const isMajor = step % 100 === 0;
    const isTenth = step % 10 === 0;

    if (!isMajor && !showHundredths && !(showTenths && isTenth)) {
      continue;
    }

    if (isMajor) {
      const tick = makeTick(step, "major", value);
      addTickLabel(tick, value);
      numberLine.appendChild(tick);
    } else if (showTenths && isTenth) {
      const tick = makeTick(step, "tenth", value);
      addTickLabel(tick, value, true);
      numberLine.appendChild(tick);
    } else if (showHundredths) {
      numberLine.appendChild(makeTick(step, "hundredth", value));
    }
  }

  renderArcs();
}

function showStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("error", isError);
}

function parseTarget(input, label) {
  const value = Number.parseFloat(input.value);
  if (!Number.isFinite(value)) {
    throw new Error(`Enter a number for the ${label} arc.`);
  }
  return Math.round(value * 100) / 100;
}

function drawRequestedArcs() {
  const start = getStartNumber();
  const end = getLineEndNumber();
  const topTarget = parseTarget(topTargetInput, "top");
  const bottomTarget = parseTarget(bottomTargetInput, "bottom");

  if (
    topTarget < start ||
    topTarget > end ||
    bottomTarget < start ||
    bottomTarget > end
  ) {
    throw new Error(
      `Both numbers must be between ${formatValue(start)} and ${formatValue(end)}.`,
    );
  }

  activeArcs = {
    top: topTarget,
    bottom: bottomTarget,
  };
  renderNumberLine();
  showStatus(
    `Arcs drawn from ${formatValue(start)} to ${formatValue(topTarget)} and ${formatValue(bottomTarget)}.`,
  );
}

function resetArcs() {
  activeArcs = null;
  topTargetInput.value = "";
  bottomTargetInput.value = "";
  renderNumberLine();
  showStatus("Enter two numbers in range, then press Go.");
}

startInput.addEventListener("input", () => {
  activeArcs = null;
  renderNumberLine();
  showStatus(
    "The range changed. Enter two numbers in the new range, then press Go.",
  );
});

goButton.addEventListener("click", () => {
  try {
    drawRequestedArcs();
  } catch (error) {
    showStatus(error.message, true);
  }
});

resetButton.addEventListener("click", resetArcs);
tenthsToggle.addEventListener("change", renderNumberLine);
hundredthsToggle.addEventListener("change", renderNumberLine);

renderNumberLine();
