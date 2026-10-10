insert into documents(code,title,owner) values ('SRS','Kauri Sensor Gateway Requirements','Mara Chen'),('TEST','Gateway Verification Procedures','Ari Patel') on conflict do nothing;
insert into items(document_id,code,external_id,kind,heading,body,owner,source,method,status,priority,due_on,personal_data,retention_review_on)
select d.id,v.code,v.ext,v.kind,v.heading,v.body,v.owner,v.source,v.method,v.status,v.priority,current_date+v.days,v.personal,current_date-7 from (values
 ('SRS','SRS:1','1','requirement','Buffer readings','The gateway shall retain 24 hours of readings during disconnection.','Mara Chen','BRIEF-04 paragraph 2','test','review','high',-3,false),
 ('SRS','SRS:2','2','requirement','Restore transmission','The gateway shall resume queued transmission within 60 seconds.','Mara Chen','BRIEF-04 paragraph 3','test','review','critical',2,false),
 ('SRS','SRS:3','3','requirement','Operator access','Operators shall have access limited to their assigned site.','','','', 'draft','high',-5,true),
 ('SRS','SRS:4','4','requirement','Cabinet label','The cabinet shall display the gateway serial number.','Ari Patel','BRIEF-04 paragraph 7','inspection','review','normal',7,false),
 ('TEST','TEST:1','1','test','Buffer disconnection test','Disconnect for 24 hours, then compare stored readings.','Ari Patel','SRS:1','test','review','high',-1,false),
 ('TEST','TEST:2','2','test','Restore timing test','Measure elapsed time from reconnection to transmission.','Ari Patel','SRS:2','test','review','critical',1,false),
 ('TEST','TEST:3','3','test','Label inspection','Read cabinet serial number against the build sheet.','Ari Patel','SRS:4','inspection','review','normal',3,false)
) v(doc,code,ext,kind,heading,body,owner,source,method,status,priority,days,personal) join documents d on d.code=v.doc on conflict do nothing;
insert into links(from_id,to_id,kind,from_revision,to_revision,actor,evidence)
select a.id,b.id,v.kind,1,1,'Demo author','Fictional review record' from (values ('TEST:1','SRS:1','verification'),('TEST:2','SRS:2','verification'),('TEST:3','SRS:4','verification'),('SRS:2','SRS:1','depends')) v(a,b,kind) join items a on a.code=v.a join items b on b.code=v.b on conflict do nothing;
insert into runs(test_id,test_revision,result,evidence,actor)
select i.id,1,v.result,'demo/'||v.file,'Demo technician' from (values ('TEST:1','pass','buffer-run.txt'),('TEST:2','fail','timing-run.txt'),('TEST:3','pass','label-photo.txt')) v(code,result,file) join items i on i.code=v.code where not exists(select 1 from runs r where r.test_id=i.id);
insert into run_coverage(run_id,requirement_id,requirement_revision) select x.id,l.to_id,1 from runs x join links l on l.from_id=x.test_id and l.kind='verification' on conflict do nothing;
-- Deliberately stale evidence: a reviewed change after the recorded passing run.
update items set body='The gateway shall retain 48 hours of readings during disconnection.' where code='SRS:1' and revision=1;
