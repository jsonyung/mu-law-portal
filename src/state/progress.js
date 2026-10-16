const KEY = 'mu-law-checklist';

function loadAll() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

function saveAll(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function isChecked(topicId, itemId) {
  const all = loadAll();
  return Boolean(all[`${topicId}:${itemId}`]);
}

export function toggleCheck(topicId, itemId) {
  const all = loadAll();
  const k = `${topicId}:${itemId}`;
  all[k] = !all[k];
  if (!all[k]) delete all[k];
  saveAll(all);
  return Boolean(all[k]);
}

export function topicProgress(topic) {
  const items = topic.enrichment?.examChecklist || [];
  if (!items.length) return null;
  const done = items.filter((i) => isChecked(topic.id, i.id)).length;
  return { done, total: items.length };
}

export function subjectProgress(subject) {
  let done = 0;
  let total = 0;
  for (const mod of subject.modules) {
    for (const topic of mod.topics) {
      const p = topicProgress(topic);
      if (p) {
        done += p.done;
        total += p.total;
      }
    }
  }
  return total ? Math.round((done / total) * 100) : null;
}
