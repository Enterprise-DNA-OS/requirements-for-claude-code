import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {getDb,REPO_ROOT} from './lib/db.mjs';
export async function seed(db){await db.exec('begin');try{await db.exec(fs.readFileSync(path.join(REPO_ROOT,'supabase/seed.sql'),'utf8'));await db.exec('commit');}catch(e){await db.exec('rollback');throw e;}}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){if(process.env.DATABASE_URL)throw Error('Demo seed requires local DATA_DIR. Never seed a shared database.');const db=await getDb();try{if(db.mode!=='pglite')throw Error('Demo seed only runs on local PGlite');await seed(db);console.log('Seeded fictional Kauri Sensor Gateway.');}finally{await db.close();}}
