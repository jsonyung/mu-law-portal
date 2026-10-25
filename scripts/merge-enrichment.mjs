import { readdirSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENRICHMENT_DIR = join(__dirname, '../content/enrichment/topics');

/**
 * Overlay optional topic enrichment files onto curriculum subjects.
 */
export function mergeEnrichment(subjects) {
  if (!existsSync(ENRICHMENT_DIR)) return subjects;

  const files = readdirSync(ENRICHMENT_DIR).filter((f) => f.endsWith('.json'));
  const byTopicId = new Map();

  for (const file of files) {
    try {
      const data = JSON.parse(readFileSync(join(ENRICHMENT_DIR, file), 'utf8'));
      if (data.topicId) byTopicId.set(data.topicId, data);
    } catch {
      /* skip invalid */
    }
  }

  for (const subject of Object.values(subjects)) {
    for (const mod of subject.modules) {
      for (const topic of mod.topics) {
        const overlay = byTopicId.get(topic.id);
        if (!overlay) continue;

        if (overlay.definition) {
          topic.enrichment.definition = overlay.definition;
          topic.sourceStatus = 'supplementary';
        }
        if (overlay.statutoryReferences?.length) {
          topic.enrichment.statutory = overlay.statutoryReferences;
          topic.sourceStatus = 'supplementary';
        }
        if (overlay.cases?.length) {
          topic.enrichment.cases = overlay.cases;
          topic.sourceStatus = 'supplementary';
        }
        if (overlay.examChecklist?.length) {
          topic.enrichment.examChecklist = overlay.examChecklist;
        }
        if (overlay.lastVerified) {
          topic.enrichment.lastVerified = overlay.lastVerified;
        }
        if (overlay.reviewStatus) {
          topic.enrichment.reviewStatus = overlay.reviewStatus;
        }
      }
    }
  }

  return subjects;
}
