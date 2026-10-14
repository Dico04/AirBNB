// P: high-resolution PNG. Re-renders the current view at up to 2× the window size (max 4096 px wide),
// reads the canvas in the same task (no preserveDrawingBuffer needed) and downloads it.
export function takeScreenshot({ renderer, post, camera, width, height, scale = 2 }) {
  const s = Math.min(scale, 4096 / width);
  const w = Math.round(width * s), h = Math.round(height * s);
  const prevRatio = renderer.getPixelRatio();
  renderer.setPixelRatio(1);
  renderer.setSize(w, h, false);
  post.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.info.reset();
  post.render(1 / 60);
  const url = renderer.domElement.toDataURL('image/png');
  // restore
  renderer.setPixelRatio(prevRatio);
  renderer.setSize(width, height, false);
  post.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
  const a = document.createElement('a');
  a.href = url;
  a.download = `frankrijklei-${stamp}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  return { width: w, height: h, bytes: Math.round(url.length * 0.75) };
}
