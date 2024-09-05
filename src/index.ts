import { ArchivingRepository } from "./archive";

const archive = new ArchivingRepository();

const db = (await archive.getDb()).db_name;
console.log('db name fetched: ', db);

if (db) {
  archive.restoreDb(db);
}
