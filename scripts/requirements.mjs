#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import {parseCsv} from './lib/csv.mjs';
import {table} from './lib/format.mjs';
export const reports={
 'coverage':'select code,heading,owner,linked_tests,current_passes,latest_failures,stale_results from v_verification order by code',
 'attention':'select * from v_attention order by code,finding',
 'suspect-links':'select * from v_suspect_links order by from_code,to_code',
 'review-queue':"select code,heading,owner,status,due_on,revision from items where status in ('draft','review') order by due_on nulls last,code",
 'overdue-reviews':"select code,heading,owner,due_on from items where status in ('draft','review') and due_on<current_date order by due_on,code",
 'source-gaps':"select code,heading,owner from items where kind='requirement' and status<>'retired' and source='' order by code",
 'owner-load':"select coalesce(nullif(owner,''),'Unassigned') as owner,count(*)::int as items,count(*) filter(where due_on<current_date and status<>'approved')::int as overdue from items where status<>'retired' group by owner order by overdue desc,owner",
 'release-readiness':"select code,heading,status,linked_tests,current_passes,case when status='approved' and linked_tests>0 and current_passes=linked_tests then 'ready' else 'hold' end as readiness from v_verification order by code",
 'run-history':'select t.code,x.run_no,x.test_revision,x.result,x.evidence,x.actor,x.created_at from runs x join items t on t.id=x.test_id order by x.run_no desc',
 'activity':'select sequence,entity,record_id,actor,action,note,before_data,after_data,created_at from activity order by sequence desc',
 'compliance':"select code,heading,owner,finding,case when finding='retention_review' then 'NZ Privacy Act IPP9: purpose review' when finding in ('missing_source','missing_method','unverified') then 'NASA matrix guidance: local engineering rule' else 'Local review policy' end as rule from v_attention order by code,finding"
};
export const commands=[...Object.keys(reports),'help','list','show','weekly-review','change-impact','add','update','log','link','confirm-link','record-run','approve','baseline','baseline-diff','import','export','draft-spec','draft-review'];
const required=(o,k)=>{if(typeof o[k]!=='string'||!o[k].trim())throw Error(`Required --${k}=value`);return o[k].trim();};
const actor=o=>required(o,'actor');
const entities={items:'items',documents:'documents',links:'links',runs:'runs',baselines:'baselines',activity:'activity'};
function allowed(o,keys){for(const key of ['dry-run','update'])if(o[key]!==undefined&&o[key]!==true)throw Error(`Use --${key} without a value`);for(const k of Object.keys(o))if(![...keys,'json'].includes(k))throw Error(`Unknown option --${k}`);}
function date(value){if(value===''||value===null)return null;if(!/^\d{4}-\d{2}-\d{2}$/.test(value)||new Date(value+'T00:00:00Z').toISOString().slice(0,10)!==value)throw Error('Date must be valid YYYY-MM-DD');return value;}
const changeFields=['heading','body','owner','source','method','priority','due_on','personal_data','retention_review_on'];
function changes(o){const result={};for(const key of changeFields){const flag=key.replaceAll('_','-');if(o[flag]!==undefined){let v=o[flag];if(key.endsWith('_on'))v=date(v);if(key==='personal_data'){if(!['true','false'].includes(v))throw Error('personal-data must be true or false');v=v==='true';}result[key]=v;}}return result;}
async function resolve(db,kind,ref){
 if(!['items','documents','baselines'].includes(kind))throw Error('Unsupported record kind');
 const label=kind==='items'?'heading':kind==='documents'?'title':'code';
 let rows=await db.query(`select * from ${kind} where lower(code)=lower($1) or id::text=$1`,[ref]);
 if(!rows.length) rows=await db.query(`select * from ${kind} where starts_with(id::text,lower($1)) or position(lower($1) in lower(${label}))>0 order by code`,[ref]);
 if(rows.length!==1)throw Error(rows.length?`Ambiguous reference: ${rows.map(r=>r.code+' '+r[label]).join('; ')}`:`No ${kind} match: ${ref}`);
 return rows[0];
}
async function audit(db,entity,id,who,action,before,after,note=''){await db.query('insert into activity(entity,record_id,actor,action,before_data,after_data,note) values($1,$2,$3,$4,$5,$6,$7)',[entity,id,who,action,before?JSON.stringify(before):null,after?JSON.stringify(after):null,note]);}
async function tx(db,fn,dry=false){await db.exec('begin isolation level serializable');try{const out=await fn();await db.exec(dry?'rollback':'commit');return out;}catch(e){await db.exec('rollback');throw e;}}
async function snapshot(db){const result={};for(const name of ['documents','items','links','runs','run_coverage','activity'])result[name]=await db.query(`select * from ${name} order by id`);return result;}
async function insertItem(db,o,who,raw={}){
 const doc=await resolve(db,'documents',required(o,'document'));const ext=required(o,'external-id');
 const values={document_id:doc.id,external_id:ext,code:`${doc.code}:${ext}`,kind:o.kind||'requirement',heading:required(o,'heading'),...changes(o),source_data:JSON.stringify(raw)};
 const keys=Object.keys(values);const [r]=await db.query(`insert into items(${keys.join(',')}) values(${keys.map((_,i)=>'$'+(i+1)).join(',')}) returning *`,Object.values(values));
 await audit(db,'items',r.id,who,'add',null,r);return r;
}
async function updateItem(db,before,values,who){
 const keys=Object.keys(values);if(!keys.length)throw Error('No changed fields supplied');
 const [r]=await db.query(`update items set ${keys.map((k,i)=>`${k}=$${i+1}`).join(',')} where id=$${keys.length+1} returning *`,[...Object.values(values),before.id]);
 await audit(db,'items',r.id,who,'update',before,r);return r;
}
export async function run(db,cmd,o={},pos=[]){
 if(reports[cmd]){allowed(o,[]);return db.query(reports[cmd]);}
 if(cmd==='help'){allowed(o,[]);return commands.map(command=>({command}));}
 if(cmd==='list'){allowed(o,['kind']);const name=entities[o.kind||'items'];if(!name)throw Error('Unknown kind');return db.query(`select * from ${name} order by created_at,id`);}
 if(cmd==='show'){allowed(o,['kind','ref']);const r=await resolve(db,o.kind||'items',required(o,'ref'));return [r];}
 if(cmd==='weekly-review'){allowed(o,[]);const out={};for(const r of ['release-readiness','attention','suspect-links','owner-load'])out[r]=await db.query(reports[r]);return out;}
 if(cmd==='change-impact'){
  allowed(o,['ref']);const r=await resolve(db,'items',required(o,'ref'));
  return db.query(`with recursive impact(id) as (select $1::uuid union select l.from_id from links l join impact i on l.to_id=i.id) select a.code,a.heading,a.kind,a.owner,a.status from impact join items a on a.id=impact.id where a.id<>$1 order by a.code`,[r.id]);
 }
 if(cmd==='add'){
  allowed(o,['kind','code','title','document','external-id','actor',...changeFields.map(k=>k.replaceAll('_','-'))]);const who=actor(o);
  return tx(db,async()=>{if(o.kind==='document'){const [r]=await db.query('insert into documents(code,title,owner) values($1,$2,$3) returning *',[required(o,'code'),required(o,'title'),o.owner||who]);await audit(db,'documents',r.id,who,'add',null,r);return [r];}return [await insertItem(db,o,who)];});
 }
 if(cmd==='update'){
  allowed(o,['ref','actor','status',...changeFields.map(k=>k.replaceAll('_','-'))]);const who=actor(o);
  return tx(db,async()=>{const r=await resolve(db,'items',required(o,'ref'));const values=changes(o);if(o.status!==undefined){if(!['draft','review','retired'].includes(o.status))throw Error('Use approve for approved status');values.status=o.status;values.approved_revision=null;values.approved_by=null;values.approved_on=null;values.approval_evidence=null;}return [await updateItem(db,r,values,who)];});
 }
 if(cmd==='log'){allowed(o,['ref','actor','note']);return tx(db,async()=>{const r=await resolve(db,'items',required(o,'ref'));await audit(db,'items',r.id,actor(o),'note',null,null,required(o,'note'));return [{code:r.code,logged:true}];});}
 if(cmd==='link'||cmd==='confirm-link'){
  allowed(o,['from','to','kind','actor','evidence']);const who=actor(o);const proof=required(o,'evidence');
  return tx(db,async()=>{const a=await resolve(db,'items',required(o,'from'));const b=await resolve(db,'items',required(o,'to'));const kind=required(o,'kind');
   if(a.status==='retired'||b.status==='retired')throw Error('Cannot link retired items');
   if(kind==='verification'&&(a.kind!=='test'||b.kind!=='requirement'))throw Error('Verification runs from test to requirement');
   if(['derives','depends'].includes(kind)&&(a.kind!=='requirement'||b.kind!=='requirement'))throw Error('Requirement dependency needs two requirements');
   if(kind!=='verification'){
    const cycle=await db.query(`with recursive walk(id) as (select $1::uuid union select l.to_id from links l join walk w on l.from_id=w.id where l.kind in ('depends','derives')) select id from walk where id=$2`,[b.id,a.id]);if(cycle.length)throw Error('Dependency cycle rejected');
   }
   let r;
   if(cmd==='confirm-link'){[r]=await db.query('update links set from_revision=$4,to_revision=$5,actor=$6,evidence=$7 where from_id=$1 and to_id=$2 and kind=$3 returning *',[a.id,b.id,kind,a.revision,b.revision,who,proof]);if(!r)throw Error('Link does not exist');}
   else [r]=await db.query('insert into links(from_id,to_id,kind,from_revision,to_revision,actor,evidence) values($1,$2,$3,$4,$5,$6,$7) returning *',[a.id,b.id,kind,a.revision,b.revision,who,proof]);
   await audit(db,'links',r.id,who,cmd,null,r);return [r];
  });
 }
 if(cmd==='record-run'){
  allowed(o,['ref','result','evidence','actor']);const who=actor(o);const evidence=required(o,'evidence');
  return tx(db,async()=>{const t=await resolve(db,'items',required(o,'ref'));if(t.kind!=='test'||t.status==='retired')throw Error('An active test is required');
   const [r]=await db.query('insert into runs(test_id,test_revision,result,evidence,actor) values($1,$2,$3,$4,$5) returning *',[t.id,t.revision,required(o,'result'),evidence,who]);
   await db.query("insert into run_coverage(run_id,requirement_id,requirement_revision) select $1,i.id,i.revision from links l join items i on i.id=l.to_id where l.from_id=$2 and l.kind='verification' and i.status<>'retired'",[r.id,t.id]);
   await audit(db,'runs',r.id,who,'record-run',null,r);return [r];
  });
 }
 if(cmd==='approve'){
  allowed(o,['ref','actor','evidence']);const who=actor(o);return tx(db,async()=>{const r=await resolve(db,'items',required(o,'ref'));
   if(r.status==='retired'||!r.body.trim()||!r.owner.trim()||!r.source.trim()||!r.method)throw Error('Approval requires active item, body, owner, source and verification method');
   const [after]=await db.query("update items set status='approved',approved_revision=revision,approved_by=$2,approval_evidence=$3,approved_on=now() where id=$1 returning *",[r.id,who,required(o,'evidence')]);await audit(db,'items',r.id,who,'approve',r,after);return [after];
  });
 }
 if(cmd==='baseline'){
  allowed(o,['code','actor','evidence']);return tx(db,async()=>{const who=actor(o);const data=await snapshot(db);const [r]=await db.query('insert into baselines(code,actor,evidence,snapshot) values($1,$2,$3,$4) returning id,code,actor,evidence,created_at',[required(o,'code'),who,required(o,'evidence'),JSON.stringify(data)]);await audit(db,'baselines',r.id,who,'baseline',null,r);return [r];});
 }
 if(cmd==='baseline-diff'){
  allowed(o,['ref']);const b=await resolve(db,'baselines',required(o,'ref'));const now=await snapshot(db);const out=[];
  for(const kind of ['documents','items','links','runs','run_coverage']){const old=new Map(b.snapshot[kind].map(x=>[x.id,x]));for(const r of now[kind]){const before=old.get(r.id);const normalize=x=>JSON.stringify(Object.fromEntries(Object.entries(x).filter(([k])=>!['created_at','updated_at'].includes(k)).sort()));if(!before||normalize(before)!==normalize(r))out.push({kind,code:r.code||r.id,change:before?'changed':'added'});old.delete(r.id);}for(const r of old.values())out.push({kind,code:r.code||r.id,change:'removed'});}return out;
 }
 if(cmd==='import'){
  allowed(o,['file','document','kind','actor','dry-run','update','map']);if(pos[0]!=='reqview')throw Error('Use import reqview');const who=actor(o);const rows=parseCsv(fs.readFileSync(required(o,'file'),'utf8'));if(!rows.length)throw Error('CSV is empty');
  const map=o.map?JSON.parse(fs.readFileSync(o.map,'utf8')):{};for(const key of Object.keys(map))if(!['id',...changeFields].includes(key))throw Error(`Unknown mapping: ${key}`);
  const col=(row,k)=>row[map[k]||k]??'';const seen=new Set();
  return tx(db,async()=>{const doc=await resolve(db,'documents',required(o,'document'));let inserted=0,unchanged=0,updated=0;
   for(const row of rows){if(!Object.hasOwn(row,map.id||'id')||!Object.hasOwn(row,map.heading||'heading')||!Object.hasOwn(row,map.body||'text'))throw Error('ReqView CSV requires id, heading and text headers (or explicit map)');const ext=col(row,'id').trim();if(!ext||seen.has(ext))throw Error('Missing or duplicate document id');seen.add(ext);
    const attrs={document:doc.code,'external-id':ext,kind:o.kind||'requirement',heading:col(row,'heading')||`Object ${ext}`,body:row[map.body||'text']};
    for(const k of changeFields.filter(x=>!['heading','body'].includes(x))){const v=col(row,k);if(v!=='')attrs[k.replaceAll('_','-')]=v;}
    const [old]=await db.query('select * from items where document_id=$1 and external_id=$2',[doc.id,ext]);
    if(old){if(old.kind!==attrs.kind)throw Error(`Kind conflict: ${old.code}`);const same=JSON.stringify(Object.entries(old.source_data).sort())===JSON.stringify(Object.entries(row).sort());if(same){unchanged++;continue;}if(!o.update)throw Error(`Changed source row ${old.code}; inspect it and use --update explicitly`);await updateItem(db,old,{...changes(attrs),source_data:JSON.stringify(row)},who);updated++;}
    else{await insertItem(db,attrs,who,row);inserted++;}
   }
   return [{inserted,updated,unchanged,dry_run:!!o['dry-run'],links:'Retained as source columns; review and map with link. Imported records start draft.'}];
  },!!o['dry-run']);
 }
 if(cmd==='export'){
  allowed(o,['file','kind']);const file=path.resolve(required(o,'file'));fs.mkdirSync(path.dirname(file),{recursive:true});
  if(o.kind){if(!entities[o.kind])throw Error('Unknown kind');const rows=await db.query(`select * from ${entities[o.kind]} order by id`);const columns=rows.length?Object.keys(rows[0]):['id'];const cell=v=>'"'+String(typeof v==='object'&&v!==null?JSON.stringify(v):v??'').replaceAll('"','""')+'"';fs.writeFileSync(file,[columns.map(cell).join(','),...rows.map(r=>columns.map(k=>cell(r[k])).join(','))].join('\r\n')+'\r\n');return [{file,rows:rows.length}];}
  const data=await snapshot(db);data.baselines=await db.query('select * from baselines order by id');fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n');return [{file,entities:Object.keys(data).length}];
 }
 if(cmd==='draft-spec'||cmd==='draft-review'){
  allowed(o,[]);const data=cmd==='draft-spec'?await db.query('select code,heading,body,source,method,status from items order by code'):await run(db,'weekly-review');
  const dir=path.resolve(process.env.OUTPUT_DIR||REPO_ROOT,'drafts');fs.mkdirSync(dir,{recursive:true});const file=path.join(dir,`${cmd}-${Date.now()}.md`);fs.writeFileSync(file,`# ${cmd==='draft-spec'?'Requirements specification':'Weekly requirements review'}\n\nDraft for human review. Fictional data only when using the demo.\n\n${format(data)}\n`);return [{file}];
 }
 throw Error(`Unknown command ${cmd}. Run help.`);
}
export function format(value){if(Array.isArray(value)){if(!value.length)return '(none)';const rows=value.map(r=>Object.fromEntries(Object.entries(r).map(([k,v])=>[k,typeof v==='object'&&v!==null?JSON.stringify(v):v])));return table(rows,Object.keys(rows[0]).map(key=>({key,label:key,width:70})));}return Object.entries(value).map(([k,v])=>k+'\n'+format(v)).join('\n\n');}
export function parse(args){const o={},pos=[];for(const a of args){if(a.startsWith('--')){const n=a.indexOf('=');const k=a.slice(2,n<0?undefined:n);if(Object.hasOwn(o,k))throw Error(`Repeated --${k}`);o[k]=n<0?true:a.slice(n+1);}else pos.push(a);}return {o,pos};}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){let db;try{const [cmd='help',...args]=process.argv.slice(2);const {o,pos}=parse(args);if(pos.length&&!(cmd==='import'&&pos.length===1))throw Error('Unexpected positional argument');db=await getDb();const out=await run(db,cmd,o,pos);console.log(o.json?JSON.stringify(out,null,2):format(out));}catch(e){console.error(e.message);process.exitCode=1;}finally{await db?.close();}}
