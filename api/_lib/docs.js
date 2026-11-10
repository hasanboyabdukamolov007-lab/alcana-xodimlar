/**
 * Required document checklist IDs (must match Mini App REQUIRED_DOCS).
 * Removed: no_criminal (Sudlanmaganligi haqida ma'lumotnoma)
 * Added: nps, life_wheel, currency_pledge, illegal_info_pledge
 */
const DOC_IDS = [
  'personal_info',
  'application',
  'passport',
  'photo_3x4',
  'inn',
  'company_form',
  'contract',
  'safety',
  'nps',
  'life_wheel',
  'currency_pledge',
  'illegal_info_pledge',
  'personality',
  'iq_test',
];

/** Legacy IDs kept only for migration / old file rows. */
const LEGACY_DOC_IDS = ['no_criminal'];

function emptyDocuments() {
  const docs = {};
  for (const id of DOC_IDS) {
    docs[id] = { present: false, files: [] };
  }
  return docs;
}

function isValidDocId(docId) {
  return DOC_IDS.includes(docId);
}

module.exports = { DOC_IDS, LEGACY_DOC_IDS, emptyDocuments, isValidDocId };
