import { cleanSample, draft, validResume, type Draft } from "./model";
let opening: Promise<IDBDatabase> | undefined;
function database() {
  return (opening ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("resumora-studio", 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore("resumes", { keyPath: "id" });
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => {
        db.close();
        opening = undefined;
      };
      db.onclose = () => {
        opening = undefined;
      };
      resolve(db);
    };
    request.onerror = () => reject(request.error);
  }).catch((error) => {
    opening = undefined;
    throw error;
  }));
}
export async function persist(d: Draft | string) {
  const db = await database();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("resumes", "readwrite");
    const store = tx.objectStore("resumes");
    if (typeof d === "string") store.delete(d);
    else store.put(d);
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error);
    tx.onerror = () => reject(tx.error);
  });
}
export async function loadDrafts(): Promise<Draft[]> {
  const db = await database();
  const records = await new Promise<Draft[]>((resolve, reject) => {
    const req = db.transaction("resumes").objectStore("resumes").getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  for (const record of records) {
    const cleaned = cleanSample(record.resume);
    if (cleaned !== record.resume) {
      record.resume = cleaned;
      await persist(record);
    }
  }
  let legacy: unknown;
  try {
    legacy = JSON.parse(
      localStorage.getItem("resumora-phase1-draft-v1") || "null",
    );
  } catch {
    return records;
  }
  if (validResume(legacy)) {
    if (!records.some((d) => d.id === "starter-draft")) {
      const migrated = {
        ...draft(),
        id: "starter-draft",
        title: "Recovered starter draft",
        resume: cleanSample(legacy),
      };
      await persist(migrated);
      records.push(migrated);
    }
    try {
      localStorage.removeItem("resumora-phase1-draft-v1");
    } catch {
      /* Already migrated. */
    }
  }
  return records;
}
