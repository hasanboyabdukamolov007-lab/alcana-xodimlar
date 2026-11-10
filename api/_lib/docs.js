/** 11 required document checklist IDs (must match Mini App REQUIRED_DOCS). */
const DOC_IDS = [
  'personal_info',
  'application',
  'passport',
  'photo_3x4',
  'inn',
  'company_form',
  'contract',
  'safety',
  'no_criminal',
  'personality',
  'iq_test',
];

function emptyDocuments() {
  const docs = {};
  for (const id of DOC_IDS) {
    docs[id] = { present: false };
  }
  return docs;
}

function isValidDocId(docId) {
  return DOC_IDS.includes(docId);
}

module.exports = { DOC_IDS, emptyDocuments, isValidDocId };
