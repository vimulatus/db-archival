import { type ConnectionOptions, createConnection } from "mysql2";
import mysqldump from 'mysqldump';

const config = {
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  database: process.env.DB_NAME!,
  host: process.env.DB_HOST!,
};

const access: ConnectionOptions = { ...config };

const connection_main = createConnection(access);

const createNewConnection = async (db: string) => {
  return createConnection({
    ...access,
    multipleStatements: true,
    database: db
  })
}

const createBackup = async (db_name: string) => {
  return await mysqldump({
    connection: {
      ...config,
      database: db_name
    },
    dumpToFile: `./${db_name}.sql.gz`,
    compressFile: true,
  })
}

export { connection_main, createBackup, createNewConnection };
