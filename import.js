
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'fs';

// --- Configuration ---
const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));
const SERVANTS_COLLECTION = 'servants';
const RESULTS_COLLECTION = 'courseResults';
const EVALUATIONS_COLLECTION = 'evaluations'; // New collection for evaluations

const SERVANTS_JSON_FILE = './servants.json';
const RESULTS_JSON_FILE = './courseResults.json';
const EVALUATIONS_JSON_FILE = './evaluations.json'; // New data file for evaluations
// -------------------

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

// Helper to clear a collection
const clearCollection = async (collectionName) => {
    console.log(`Clearing collection '${collectionName}'...`);
    const snapshot = await db.collection(collectionName).limit(500).get();
    if (snapshot.empty) {
        console.log(`Collection '${collectionName}' is already empty.`);
        return;
    }
    const deleteBatch = db.batch();
    snapshot.docs.forEach(doc => deleteBatch.delete(doc.ref));
    await deleteBatch.commit();
    // Recursively delete if there are more documents
    if (snapshot.size >= 500) {
        await clearCollection(collectionName);
    } else {
        console.log(`Collection '${collectionName}' cleared.`);
    }
};

const importServants = async () => {
    if (!existsSync(SERVANTS_JSON_FILE)) {
        console.warn(`File not found: ${SERVANTS_JSON_FILE}. Skipping servants import.`);
        return;
    }
    const servantsList = JSON.parse(readFileSync(SERVANTS_JSON_FILE, 'utf8'));
    console.log(`Processing ${servantsList.length} servant entries from JSON...`);

    const servantsMap = new Map();
    for (const servant of servantsList) {
        if (!servant.code) continue; // Skip entries without a code
        const code = String(servant.code);

        if (!servantsMap.has(code)) {
            // First time seeing this servant, initialize with data and a Set for services
            servantsMap.set(code, {
                ...servant,
                allServices: new Set(servant.primaryService ? [servant.primaryService.trim()] : [])
            });
        } else {
            // Existing servant, just add the new service to their Set
            const existingServant = servantsMap.get(code);
            if (servant.primaryService && servant.primaryService.trim()) {
                existingServant.allServices.add(servant.primaryService.trim());
            }
        }
    }

    console.log(`Importing ${servantsMap.size} unique servant profiles to '${SERVANTS_COLLECTION}'...`);
    const batch = db.batch();
    for (const [code, servant] of servantsMap.entries()) {
      const docRef = db.collection(SERVANTS_COLLECTION).doc(code);
      // Convert the Set of services to an Array for Firestore compatibility
      const { allServices, ...servantData } = servant;
      const finalData = { ...servantData, allServices: Array.from(allServices) };
      batch.set(docRef, finalData);
    }
    await batch.commit();
    console.log(`✅ Servants import completed.`);
};

const importCourseResults = async () => {
    if (!existsSync(RESULTS_JSON_FILE)) {
        console.warn(`File not found: ${RESULTS_JSON_FILE}. Skipping course results import.`);
        return;
    }
    const results = JSON.parse(readFileSync(RESULTS_JSON_FILE, 'utf8'));
    console.log(`Importing ${results.length} course results to '${RESULTS_COLLECTION}'...`);
    const batch = db.batch();
    for (const result of results) {
      const docRef = db.collection(RESULTS_COLLECTION).doc(); // Auto-generate ID
      batch.set(docRef, result);
    }
    await batch.commit();
    console.log(`✅ Course results import completed.`);
};

const importEvaluations = async () => {
    if (!existsSync(EVALUATIONS_JSON_FILE)) {
        console.warn(`File not found: ${EVALUATIONS_JSON_FILE}. Skipping evaluations import.`);
        return;
    }
    const evaluations = JSON.parse(readFileSync(EVALUATIONS_JSON_FILE, 'utf8'));
    console.log(`Importing ${evaluations.length} evaluations to '${EVALUATIONS_COLLECTION}'...`);
    const batch = db.batch();
    for (const evaluation of evaluations) {
      const docRef = db.collection(EVALUATIONS_COLLECTION).doc(); // Auto-generate ID
      batch.set(docRef, evaluation);
    }
    await batch.commit();
    console.log(`✅ Evaluations import completed.`);
};


const importData = async () => {
  console.log(`Starting data import from normalized JSON files...`);

  try {
    // --- Clear existing data for a clean import ---
    console.log(`Clearing all existing data...`);
    await Promise.all([
        clearCollection(SERVANTS_COLLECTION),
        clearCollection(RESULTS_COLLECTION),
        clearCollection(EVALUATIONS_COLLECTION),
    ]);
    console.log('All collections cleared.');

    // --- Import new data sequentially ---
    await importServants();
    await importCourseResults();
    await importEvaluations();
    
    console.log('✨ Full data import successful!');

  } catch (error) {
    console.error('❌ Error during data import:', error);
    process.exit(1);
  }
};

importData();
