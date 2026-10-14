// Mobile controls: left-thumb virtual joystick (walk), drag anywhere else to look, and buttons for
// interact (E), run, view (V) and the menu.
const DEAD = 0.12;

export function isTouchDevice() {
  return matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
}

export class TouchControls {
  constructor({ root, canvas, controls, actions }) {
    this.root = root;
    this.controls = controls;
    this.actions = actions;      // { use, view, menu }
    this.joy = root.querySelector('#joy');
    this.knob = root.querySelector('#joy-knob');
    this.lookId = null;
    this.joyId = null;
    root.classList.remove('hidden');
    document.body.classList.add('touch');

    const joyStart = (e) => {
      e.preventDefault();
      this.joyId = e.pointerId;
      try { this.joy.setPointerCapture(e.pointerId); } catch { /* pointer already gone */ }
      this.moveJoy(e);
    };
    this.joy.addEventListener('pointerdown', joyStart);
    this.joy.addEventListener('pointermove', (e) => { if (e.pointerId === this.joyId) this.moveJoy(e); });
    const joyEnd = (e) => {
      if (e.pointerId !== this.joyId) return;
      this.joyId = null;
      controls.externalMove = null;
      this.knob.style.transform = 'translate(-50%, -50%)';
    };
    this.joy.addEventListener('pointerup', joyEnd);
    this.joy.addEventListener('pointercancel', joyEnd);

    // drag to look on the canvas
    let last = null;
    canvas.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' || this.lookId !== null) return;
      this.lookId = e.pointerId; last = [e.clientX, e.clientY];
    });
    window.addEventListener('pointermove', (e) => {
      if (e.pointerId !== this.lookId) return;
      const k = 0.0042 * (controls.sensitivity / 0.0022);
      controls.yaw -= (e.clientX - last[0]) * k;
      controls.pitch = Math.max(-1.45, Math.min(1.45, controls.pitch - (e.clientY - last[1]) * k));
      last = [e.clientX, e.clientY];
    });
    const lookEnd = (e) => { if (e.pointerId === this.lookId) this.lookId = null; };
    window.addEventListener('pointerup', lookEnd);
    window.addEventListener('pointercancel', lookEnd);

    const btn = (id, fn) => root.querySelector(`#${id}`).addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); fn(e.currentTarget); });
    btn('t-use', () => actions.use());
    btn('t-run', (b) => { controls.forceRun = !controls.forceRun; b.classList.toggle('on', controls.forceRun); });
    btn('t-view', () => actions.view());
    btn('t-menu', () => actions.menu());
  }

  moveJoy(e) {
    const r = this.joy.getBoundingClientRect();
    const R = r.width / 2;
    let dx = (e.clientX - (r.left + R)) / R, dy = (e.clientY - (r.top + R)) / R;
    const l = Math.hypot(dx, dy);
    if (l > 1) { dx /= l; dy /= l; }
    this.knob.style.transform = `translate(calc(-50% + ${dx * R * 0.6}px), calc(-50% + ${dy * R * 0.6}px))`;
    this.controls.externalMove = Math.hypot(dx, dy) < DEAD ? null : { x: dx, y: -dy };
  }

  setUseAvailable(on) { this.root.querySelector('#t-use').classList.toggle('ready', on); }
}
