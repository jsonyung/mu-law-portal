export function focusTopicElement(id) {
  const el = document.getElementById(`topic-${id}`);
  if (!el) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
  el.classList.add('topic-highlight');
  el.setAttribute('tabindex', '-1');
  el.focus({ preventScroll: true });
  window.setTimeout(() => el.classList.remove('topic-highlight'), 2000);
}
