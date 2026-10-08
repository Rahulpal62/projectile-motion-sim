const canvas = document.getElementById('simCanvas');
const ctx = canvas.getContext('2d');

const velocityInput = document.getElementById('velocity');
const angleInput = document.getElementById('angle');
const gravitySelect = document.getElementById('gravity');

const valVelocity = document.getElementById('val-velocity');
const valAngle = document.getElementById('val-angle');
const statTime = document.getElementById('stat-time');
const statHeight = document.getElementById('stat-height');
const statRange = document.getElementById('stat-range');

const launchBtn = document.getElementById('btn-launch');
const clearBtn = document.getElementById('btn-clear');

let animationId = null;
let historyTrails = [];

function updateTelemetry() {
  const v0 = parseFloat(velocityInput.value);
  const thetaDeg = parseFloat(angleInput.value);
  const g = parseFloat(gravitySelect.value);

  valVelocity.textContent = v0;
  valAngle.textContent = thetaDeg;

  const thetaRad = (thetaDeg * Math.PI) / 180;

  const totalTime = (2 * v0 * Math.sin(thetaRad)) / g;
  const maxHeight = (Math.pow(v0 * Math.sin(thetaRad), 2)) / (2 * g);
  const totalRange = (Math.pow(v0, 2) * Math.sin(2 * thetaRad)) / g;

  statTime.textContent = `${totalTime.toFixed(2)} s`;
  statHeight.textContent = `${maxHeight.toFixed(2)} m`;
  statRange.textContent = `${totalRange.toFixed(2)} m`;

  return { v0, thetaRad, g, totalTime, maxHeight, totalRange };
}

const PADDING = 40;
function toCanvasX(xMeters, scale) {
  return PADDING + xMeters * scale;
}
function toCanvasY(yMeters, scale) {
  return (canvas.height - PADDING) - (yMeters * scale);
}

function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;

  for (let x = PADDING; x < canvas.width; x += 50) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height - PADDING);
    ctx.stroke();
  }
  for (let y = canvas.height - PADDING; y > 0; y -= 50) {
    ctx.beginPath();
    ctx.moveTo(PADDING, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, canvas.height - PADDING);
  ctx.lineTo(canvas.width, canvas.height - PADDING);
  ctx.stroke();
}

function renderAllHistory() {
  historyTrails.forEach(trail => {
    if (trail.points.length < 2) return;
    ctx.strokeStyle = trail.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(trail.points[0].cx, trail.points[0].cy);
    for (let i = 1; i < trail.points.length; i++) {
      ctx.lineTo(trail.points[i].cx, trail.points[i].cy);
    }
    ctx.stroke();
  });
}

function launchProjectile() {
  if (animationId) cancelAnimationFrame(animationId);

  const { v0, thetaRad, g, totalTime, totalRange, maxHeight } = updateTelemetry();

  const availableWidth = canvas.width - (PADDING * 2);
  const availableHeight = canvas.height - (PADDING * 2);
  const scaleX = availableWidth / Math.max(totalRange * 1.15, 50);
  const scaleY = availableHeight / Math.max(maxHeight * 1.25, 20);
  const scale = Math.min(scaleX, scaleY);

  const vx = v0 * Math.cos(thetaRad);
  const vy = v0 * Math.sin(thetaRad);

  let t = 0;
  const timeStep = 0.03;
  const currentTrail = {
    color: '#38bdf8',
    points: []
  };

  function animate() {
    t += timeStep;
    if (t > totalTime) t = totalTime;

    const x = vx * t;
    const y = (vy * t) - (0.5 * g * Math.pow(t, 2));

    const cx = toCanvasX(x, scale);
    const cy = toCanvasY(Math.max(0, y), scale);

    currentTrail.points.push({ cx, cy });

    drawGrid();
    renderAllHistory();

    if (currentTrail.points.length > 1) {
      ctx.strokeStyle = currentTrail.color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(currentTrail.points[0].cx, currentTrail.points[0].cy);
      for (let pt of currentTrail.points) {
        ctx.lineTo(pt.cx, pt.cy);
      }
      ctx.stroke();
    }

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fill();

    if (t < totalTime) {
      animationId = requestAnimationFrame(animate);
    } else {
      currentTrail.color = 'rgba(56, 189, 248, 0.4)';
      historyTrails.push(currentTrail);
      animationId = null;
    }
  }

  animate();
}

[velocityInput, angleInput, gravitySelect].forEach(input => {
  input.addEventListener('input', updateTelemetry);
});

launchBtn.addEventListener('click', launchProjectile);

clearBtn.addEventListener('click', () => {
  if (animationId) cancelAnimationFrame(animationId);
  historyTrails = [];
  drawGrid();
  updateTelemetry();
});

drawGrid();
updateTelemetry();
    
