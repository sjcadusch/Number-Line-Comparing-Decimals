const numberLine = document.querySelector('#number-line');
const startInput = document.querySelector('#start-number');
const tenthsToggle = document.querySelector('#tenths-toggle');
const hundredthsToggle = document.querySelector('#hundredths-toggle');
const selectedValue = document.querySelector('#selected-value');

const MIN_POSITION = 4;
const MAX_POSITION = 96;
const TOTAL_STEPS = 200;

let selectedTickButton = null;
let lastSelectedValue = null;

function formatValue(value) {
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded.toFixed(2).replace(/0$/, ''));
}

function getStartNumber() {
  const parsed = Number.parseInt(startInput.value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function positionForStep(step) {
  return MIN_POSITION + (step / TOTAL_STEPS) * (MAX_POSITION - MIN_POSITION);
}

function makeTick(step, type, value) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `tick ${type}`;
  button.style.left = `${positionForStep(step)}%`;
  button.dataset.value = formatValue(value);
  button.setAttribute('aria-label', `Select ${formatValue(value)}`);

  button.addEventListener('click', () => {
    if (selectedTickButton) {
      selectedTickButton.classList.remove('selected');
    }

    button.classList.add('selected');
    selectedTickButton = button;
    lastSelectedValue = button.dataset.value;
    selectedValue.textContent = button.dataset.value;
  });

  return button;
}

function renderNumberLine() {
  const start = getStartNumber();
  const showTenths = tenthsToggle.checked;
  const showHundredths = hundredthsToggle.checked;

  numberLine.innerHTML = '<div class="axis-line" aria-hidden="true"></div>';
  selectedTickButton = null;

  for (let step = 0; step <= TOTAL_STEPS; step += 1) {
    const value = start + step / 100;
    const isMajor = step % 100 === 0;
    const isTenth = step % 10 === 0;

    if (!isMajor && !showHundredths && !(showTenths && isTenth)) {
      continue;
    }

    if (!isMajor && showHundredths && showTenths && isTenth) {
      numberLine.appendChild(makeTick(step, 'tenth', value));
      continue;
    }

    if (isMajor) {
      const tick = makeTick(step, 'major', value);
      const label = document.createElement('span');
      label.className = 'tick-label';
      label.textContent = formatValue(value);
      tick.appendChild(label);
      numberLine.appendChild(tick);
    } else if (showTenths && isTenth) {
      numberLine.appendChild(makeTick(step, 'tenth', value));
    } else if (showHundredths) {
      numberLine.appendChild(makeTick(step, 'hundredth', value));
    }
  }

  if (lastSelectedValue !== null) {
    const matchingTick = numberLine.querySelector(`[data-value="${lastSelectedValue}"]`);
    if (matchingTick) {
      matchingTick.classList.add('selected');
      selectedTickButton = matchingTick;
    } else {
      lastSelectedValue = null;
      selectedValue.textContent = 'Click a tick mark';
    }
  }
}

startInput.addEventListener('input', () => {
  lastSelectedValue = null;
  selectedValue.textContent = 'Click a tick mark';
  renderNumberLine();
});

tenthsToggle.addEventListener('change', renderNumberLine);
hundredthsToggle.addEventListener('change', renderNumberLine);

renderNumberLine();
