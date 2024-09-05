import { createBackup, connection_main, createNewConnection } from './db.ts';
import type { RowDataPacket } from 'mysql2';

interface Row extends RowDataPacket {
  db_name: string;
}

export class ArchivingRepository {
  createBackup(db: string) {
    console.log(`Backing up ${db}`);
    createBackup(db).then(res => console.log(`Backup Created Successfully in file ${db}.sql.gz!`)).catch(err => console.error('Error in creating backup: ', err));
  }

  deleteDb(db: string) {
    console.log(`Deleting database: ${db}`);
    connection_main.query(`DROP DATABASE ${db}`, (err, res) => {
      if (err) console.error(err);
      else console.log(`Database ${db} deleted successfully!`);
    })
  }

  // Get db name
  async getDb(): Promise<{ db_name: string }> {
    const query = 'select db_name from dbDetail';
    return new Promise((resolve, reject) => connection_main.query<Row[]>(query, (err, res) => {
      if (err) reject(err);
      else resolve(res?.[0]);
    }))
  }

  private async createDb(db: string) {
    const query = `create database ${db}`;

    connection_main.query(query, (err, res) => {
      if (err) console.error(`${db} could not be created`);
      else console.log(`${db} created successfully!`)
    })
  }

  async restoreDb(db: string) {
    console.log(`Starting restoration of ${db}`);

    const filename = `${db}.sql.gz`;

    this.fetchFile(filename).then(async res => {
      console.log(`Unzipping file ${filename}`)
      const backup = Bun.gunzipSync(res);
      console.log(`File ${filename} unzipped successfully!`)

      const decoder = new TextDecoder();
      const backupDecoded = decoder.decode(backup);

      await this.createDb(db);

      const connection = await createNewConnection(db);

      const query = connection.query(backupDecoded);
      query
        .on('error', err => console.error('Error in restoring DB: ', err))
        .on('result', (row) => console.log('Row created: ', row))
        .on('fields', (field) => console.log('Field created: ', field))
        .on('end', () => console.log('DB restored successfully!'));

    }).catch(err => console.error(err))
  }

  async restoreDbToFile(db: string) {
    console.log(`Starting restoration of ${db} to ${db}.sql`);

    const filename = `${db}.sql.gz`

    this.fetchFile(filename).then(res => {
      console.log(`Unzipping file ${filename}`)
      const backup = Bun.gunzipSync(res);
      console.log(`File ${filename} unzipped successfully`)

      const dest = `${db}.sql`;
      Bun.write(dest, backup);
      console.log(`${db} restored successfully to ${db}.sql`);
    }).catch(err => console.error(err))
  }

  private fetchFile(filename: string): Promise<Uint8Array> {
    const file = Bun.file(filename);

    return new Promise(async (resolve, reject) => {
      if (await file.exists()) {
        resolve(file.bytes());
      }
      else reject(`File ${filename} does not exists in ${process.cwd()}!`)
    })
  }
}
