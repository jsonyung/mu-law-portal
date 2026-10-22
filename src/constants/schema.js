/** Supported generated-data schema versions (bump when breaking JSON shape). */
export const CURRICULUM_SCHEMA_VERSION = 1;
export const SEARCH_INDEX_VERSION = 2;

export function assertCurriculumSchema(meta) {
  const v = meta?.schemaVersion;
  if (v == null || v > CURRICULUM_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported curriculum schemaVersion (${v ?? 'missing'}). Rebuild with npm run build:curriculum.`,
    );
  }
}

export function assertSearchIndexSchema(meta) {
  if (!meta || meta.indexVersion !== SEARCH_INDEX_VERSION) {
    throw new Error(
      `Unsupported search index (indexVersion ${meta?.indexVersion ?? 'missing'}). Run npm run build:curriculum.`,
    );
  }
}
