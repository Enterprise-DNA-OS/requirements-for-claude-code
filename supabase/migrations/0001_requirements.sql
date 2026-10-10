create table documents (
 id uuid primary key default gen_random_uuid(), code text not null unique check (code ~ '^[A-Za-z0-9_-]+$'),
 title text not null check (length(trim(title))>0), owner text not null default '',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table items (
 id uuid primary key default gen_random_uuid(), document_id uuid not null references documents(id),
 code text not null unique, external_id text not null, kind text not null check(kind in ('requirement','test')),
 heading text not null check(length(trim(heading))>0), body text not null default '', owner text not null default '',
 source text not null default '', method text not null default '' check(method in ('','test','inspection','analysis','demonstration')),
 status text not null default 'draft' check(status in ('draft','review','approved','retired')),
 priority text not null default 'normal' check(priority in ('low','normal','high','critical')),
 due_on date, revision integer not null default 1 check(revision>0), approved_revision integer,
 approved_by text, approval_evidence text, approved_on timestamptz,
 personal_data boolean not null default false, retention_review_on date,
 source_data jsonb not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(document_id,external_id)
);
create index items_document on items(document_id);
create index items_due on items(due_on) where status <> 'retired';
create table links (
 id uuid primary key default gen_random_uuid(), from_id uuid not null references items(id), to_id uuid not null references items(id),
 kind text not null check(kind in ('verification','derives','depends')), from_revision integer not null, to_revision integer not null,
 actor text not null, evidence text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(from_id,to_id,kind), check(from_id<>to_id)
);
create index links_from on links(from_id); create index links_to on links(to_id);
create table runs (
 id uuid primary key default gen_random_uuid(), run_no bigint generated always as identity unique,
 test_id uuid not null references items(id), test_revision integer not null,
 result text not null check(result in ('pass','fail','blocked')), evidence text not null check(length(trim(evidence))>0),
 actor text not null check(length(trim(actor))>0), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index runs_test on runs(test_id,run_no desc);
create table run_coverage (
 id uuid primary key default gen_random_uuid(), run_id uuid not null references runs(id), requirement_id uuid not null references items(id),
 requirement_revision integer not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(run_id,requirement_id)
);
create index run_coverage_req on run_coverage(requirement_id); create index run_coverage_run on run_coverage(run_id);
create table baselines (
 id uuid primary key default gen_random_uuid(), code text not null unique, actor text not null, evidence text not null,
 snapshot jsonb not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table activity (
 id uuid primary key default gen_random_uuid(), sequence bigint generated always as identity unique,
 entity text not null, record_id uuid, actor text not null, action text not null, note text not null default '',
 before_data jsonb, after_data jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index activity_record on activity(record_id,sequence desc);
create function touch_updated() returns trigger language plpgsql as $$begin new.updated_at=clock_timestamp();return new;end$$;
create function revise_item() returns trigger language plpgsql as $$begin
 if (to_jsonb(new)-array['revision','approved_revision','approved_by','approval_evidence','approved_on','updated_at','status'])
 is distinct from (to_jsonb(old)-array['revision','approved_revision','approved_by','approval_evidence','approved_on','updated_at','status']) then
 new.revision=old.revision+1; new.approved_revision=null;new.approved_by=null;new.approval_evidence=null;new.approved_on=null;
 if new.status='approved' then new.status='review';end if;
 end if;return new;end$$;
create trigger item_revision before update on items for each row execute function revise_item();
do $$declare t text;begin foreach t in array array['documents','items','links','runs','run_coverage','baselines','activity'] loop
 execute format('create trigger touch before update on %I for each row execute function touch_updated()',t);
 execute format('alter table %I enable row level security',t);
 execute format('revoke all on %I from public',t);
end loop;end$$;
create view v_latest_runs with (security_invoker=true) as select distinct on(test_id) * from runs order by test_id,run_no desc;
create view v_verification with (security_invoker=true) as
 select r.id,r.code,r.heading,r.owner,r.status,r.priority,r.revision,r.due_on,
 count(l.id)::integer as linked_tests,
 count(l.id) filter(where x.result='pass' and x.test_revision=t.revision and c.requirement_revision=r.revision and l.from_revision=t.revision and l.to_revision=r.revision)::integer as current_passes,
 count(l.id) filter(where x.result='fail')::integer as latest_failures,
 count(l.id) filter(where x.id is not null and (x.test_revision<>t.revision or c.requirement_revision is distinct from r.revision or l.from_revision<>t.revision or l.to_revision<>r.revision))::integer as stale_results
 from items r left join links l on l.to_id=r.id and l.kind='verification' and exists(select 1 from items ti where ti.id=l.from_id and ti.status<>'retired')
 left join items t on t.id=l.from_id left join v_latest_runs x on x.test_id=t.id
 left join run_coverage c on c.run_id=x.id and c.requirement_id=r.id
 where r.kind='requirement' and r.status<>'retired' group by r.id;
create view v_suspect_links with (security_invoker=true) as
 select l.id,a.code as from_code,b.code as to_code,l.kind,l.from_revision as linked_from,a.revision as current_from,l.to_revision as linked_to,b.revision as current_to
 from links l join items a on a.id=l.from_id join items b on b.id=l.to_id
 where a.status<>'retired' and b.status<>'retired' and (l.from_revision<>a.revision or l.to_revision<>b.revision);
create view v_attention with (security_invoker=true) as
 select code,heading,owner,'overdue_review'::text as finding from items where status not in ('approved','retired') and due_on<current_date
 union all select code,heading,owner,'missing_source' from items where kind='requirement' and status<>'retired' and trim(source)=''
 union all select code,heading,owner,'missing_owner' from items where status<>'retired' and trim(owner)=''
 union all select code,heading,owner,'missing_method' from items where kind='requirement' and status<>'retired' and method=''
 union all select code,heading,owner,'unverified' from v_verification where linked_tests=0 or current_passes<linked_tests
 union all select code,heading,owner,'retention_review' from items where personal_data and status<>'retired' and (retention_review_on is null or retention_review_on<current_date);
revoke all on v_latest_runs,v_verification,v_suspect_links,v_attention from public;
