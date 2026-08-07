import { useCallback, useEffect, useRef } from 'react';

class Noise {
  constructor(seed) {
    this.p = new Uint8Array(512);
    this.seed = seed > 0 && seed < 1 ? seed : Math.random();
    this.grad3 = [
      [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
      [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
      [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1],
    ];
    this.init(this.seed);
  }

  init(seed) {
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i += 1) p[i] = i;
    for (let i = 0; i < 256; i += 1) {
      const j = Math.floor(seed * (i + 1)) % 256;
      const k = p[i];
      p[i] = p[j];
      p[j] = k;
    }
    for (let i = 0; i < 512; i += 1) this.p[i] = p[i & 255];
  }

  dot(g, x, y) {
    return g[0] * x + g[1] * y;
  }

  perlin2(x, y) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const localX = x - Math.floor(x);
    const localY = y - Math.floor(y);
    const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
    const lerp = (a, b, amount) => a + amount * (b - a);
    const u = fade(localX);
    const v = fade(localY);
    const p = this.p;
    const grad3 = this.grad3;

    const n00 = this.dot(grad3[p[X + p[Y]] % 12], localX, localY);
    const n01 = this.dot(grad3[p[X + p[Y + 1]] % 12], localX, localY - 1);
    const n10 = this.dot(grad3[p[X + 1 + p[Y]] % 12], localX - 1, localY);
    const n11 = this.dot(grad3[p[X + 1 + p[Y + 1]] % 12], localX - 1, localY - 1);

    return lerp(lerp(n00, n10, u), lerp(n01, n11, u), v);
  }
}

const animationConfig = {
  GRID_X_GAP: 10,
  GRID_Y_GAP: 32,
  GRID_WIDTH_OFFSET: 200,
  GRID_HEIGHT_OFFSET: 30,
  WAVE_TIME_X_FACTOR: 0.0125,
  WAVE_NOISE_X_FACTOR: 0.002,
  WAVE_TIME_Y_FACTOR: 0.005,
  WAVE_NOISE_Y_FACTOR: 0.0015,
  WAVE_NOISE_MAGNITUDE: 12,
  WAVE_AMPLITUDE_X: 32,
  WAVE_AMPLITUDE_Y: 16,
  MOUSE_INFLUENCE_RADIUS: 175,
  MOUSE_FALLOFF_FACTOR: 0.001,
  MOUSE_FORCE_FACTOR: 0.00065,
  MOUSE_SMOOTHING_FACTOR: 0.1,
  MAX_MOUSE_VELOCITY: 100,
  TENSION_STRENGTH: 0.005,
  FRICTION: 0.925,
  CURSOR_DISPLACEMENT_STRENGTH: 2,
  MAX_CURSOR_DISPLACEMENT: 100,
};

export default function InteractiveWaves() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const animationState = useRef({
    ctx: null,
    mouse: { x: -10, y: 0, lx: 0, ly: 0, sx: 0, sy: 0, v: 0, vs: 0, a: 0, set: false },
    lines: [],
    noise: new Noise(Math.random()),
    bounding: null,
    animationFrameId: null,
  });

  const moved = useCallback((point, withCursorForce = true) => ({
    x: Math.round((point.x + point.wave.x + (withCursorForce ? point.cursor.x : 0)) * 10) / 10,
    y: Math.round((point.y + point.wave.y + (withCursorForce ? point.cursor.y : 0)) * 10) / 10,
  }), []);

  useEffect(() => {
    const state = animationState.current;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return undefined;

    state.ctx = canvas.getContext('2d');

    const setSize = () => {
      state.bounding = container.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = state.bounding.width * pixelRatio;
      canvas.height = state.bounding.height * pixelRatio;
      canvas.style.width = `${state.bounding.width}px`;
      canvas.style.height = `${state.bounding.height}px`;
      state.ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const setLines = () => {
      if (!state.bounding) return;
      const { width, height } = state.bounding;
      state.lines = [];
      const { GRID_X_GAP, GRID_Y_GAP, GRID_WIDTH_OFFSET, GRID_HEIGHT_OFFSET } = animationConfig;
      const totalLines = Math.ceil((width + GRID_WIDTH_OFFSET) / GRID_X_GAP);
      const totalPoints = Math.ceil((height + GRID_HEIGHT_OFFSET) / GRID_Y_GAP);
      const xStart = (width - GRID_X_GAP * totalLines) / 2;
      const yStart = (height - GRID_Y_GAP * totalPoints) / 2;

      for (let i = 0; i <= totalLines; i += 1) {
        const points = [];
        for (let j = 0; j <= totalPoints; j += 1) {
          points.push({
            x: xStart + GRID_X_GAP * i,
            y: yStart + GRID_Y_GAP * j,
            wave: { x: 0, y: 0 },
            cursor: { x: 0, y: 0, vx: 0, vy: 0 },
          });
        }
        state.lines.push(points);
      }
    };

    const movePoints = (time) => {
      const { lines, mouse, noise } = state;
      const {
        WAVE_TIME_X_FACTOR, WAVE_NOISE_X_FACTOR, WAVE_TIME_Y_FACTOR, WAVE_NOISE_Y_FACTOR,
        WAVE_NOISE_MAGNITUDE, WAVE_AMPLITUDE_X, WAVE_AMPLITUDE_Y, MOUSE_INFLUENCE_RADIUS,
        MOUSE_FALLOFF_FACTOR, MOUSE_FORCE_FACTOR, TENSION_STRENGTH, FRICTION,
        CURSOR_DISPLACEMENT_STRENGTH, MAX_CURSOR_DISPLACEMENT,
      } = animationConfig;

      lines.forEach((points) => {
        points.forEach((point) => {
          const noiseInputX = (point.x + time * WAVE_TIME_X_FACTOR) * WAVE_NOISE_X_FACTOR;
          const noiseInputY = (point.y + time * WAVE_TIME_Y_FACTOR) * WAVE_NOISE_Y_FACTOR;
          const move = noise.perlin2(noiseInputX, noiseInputY) * WAVE_NOISE_MAGNITUDE;
          point.wave.x = Math.cos(move) * WAVE_AMPLITUDE_X;
          point.wave.y = Math.sin(move) * WAVE_AMPLITUDE_Y;

          const dx = point.x - mouse.sx;
          const dy = point.y - mouse.sy;
          const d = Math.hypot(dx, dy);
          const influenceRadius = Math.max(MOUSE_INFLUENCE_RADIUS, mouse.vs);

          if (d < influenceRadius) {
            const falloff = 1 - d / influenceRadius;
            const force = Math.cos(d * MOUSE_FALLOFF_FACTOR) * falloff;
            const forceFactor = force * influenceRadius * mouse.vs * MOUSE_FORCE_FACTOR;
            point.cursor.vx += Math.cos(mouse.a) * forceFactor;
            point.cursor.vy += Math.sin(mouse.a) * forceFactor;
          }

          point.cursor.vx += (0 - point.cursor.x) * TENSION_STRENGTH;
          point.cursor.vy += (0 - point.cursor.y) * TENSION_STRENGTH;
          point.cursor.vx *= FRICTION;
          point.cursor.vy *= FRICTION;
          point.cursor.x += point.cursor.vx * CURSOR_DISPLACEMENT_STRENGTH;
          point.cursor.y += point.cursor.vy * CURSOR_DISPLACEMENT_STRENGTH;
          point.cursor.x = Math.min(MAX_CURSOR_DISPLACEMENT, Math.max(-MAX_CURSOR_DISPLACEMENT, point.cursor.x));
          point.cursor.y = Math.min(MAX_CURSOR_DISPLACEMENT, Math.max(-MAX_CURSOR_DISPLACEMENT, point.cursor.y));
        });
      });
    };

    const drawLines = () => {
      const { ctx, bounding, lines } = state;
      if (!ctx || !bounding) return;

      ctx.clearRect(0, 0, bounding.width, bounding.height);
      ctx.beginPath();
      ctx.strokeStyle = getComputedStyle(container).getPropertyValue('--wave-line-color').trim() || 'rgba(59, 130, 246, 0.28)';
      ctx.lineWidth = 0.65;

      lines.forEach((points) => {
        const p1 = moved(points[0], false);
        ctx.moveTo(p1.x, p1.y);
        for (let i = 0; i < points.length - 1; i += 1) {
          const currentPoint = moved(points[i], true);
          const nextPoint = moved(points[i + 1], true);
          const xc = (currentPoint.x + nextPoint.x) / 2;
          const yc = (currentPoint.y + nextPoint.y) / 2;
          ctx.quadraticCurveTo(currentPoint.x, currentPoint.y, xc, yc);
        }
      });

      ctx.stroke();
    };

    const tick = (time) => {
      const { mouse } = state;
      const { MOUSE_SMOOTHING_FACTOR, MAX_MOUSE_VELOCITY } = animationConfig;

      mouse.sx += (mouse.x - mouse.sx) * MOUSE_SMOOTHING_FACTOR;
      mouse.sy += (mouse.y - mouse.sy) * MOUSE_SMOOTHING_FACTOR;

      const dx = mouse.sx - mouse.lx;
      const dy = mouse.sy - mouse.ly;
      const d = Math.hypot(dx, dy);
      mouse.v = d;
      mouse.vs += (d - mouse.vs) * MOUSE_SMOOTHING_FACTOR;
      mouse.vs = Math.min(MAX_MOUSE_VELOCITY, mouse.vs);
      mouse.a = Math.atan2(dy, dx);
      mouse.lx = mouse.sx;
      mouse.ly = mouse.sy;

      movePoints(time);
      drawLines();
      state.animationFrameId = requestAnimationFrame(tick);
    };

    const updateMousePosition = (clientX, clientY) => {
      if (!state.bounding) return;
      const { mouse } = state;
      mouse.x = clientX - state.bounding.left;
      mouse.y = clientY - state.bounding.top;
      if (!mouse.set) {
        mouse.sx = mouse.x;
        mouse.sy = mouse.y;
        mouse.lx = mouse.x;
        mouse.ly = mouse.y;
        mouse.set = true;
      }
    };

    const onResize = () => {
      setSize();
      setLines();
    };
    const onMouseMove = (event) => updateMousePosition(event.clientX, event.clientY);
    const onTouchMove = (event) => {
      if (event.touches[0]) updateMousePosition(event.touches[0].clientX, event.touches[0].clientY);
    };

    setSize();
    setLines();
    window.addEventListener('resize', onResize);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    state.animationFrameId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      cancelAnimationFrame(state.animationFrameId);
    };
  }, [moved]);

  return (
    <div ref={containerRef} className="waves-container" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}
