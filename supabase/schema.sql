-- KRC Alumni 사이트 저장소 (경기 호출·입장 체크). Supabase SQL Editor에 붙여 넣어 한 번 실행.
-- 서버만 service_role 키로 읽고 쓴다. 브라우저에서 직접 접근하지 않으므로 RLS를 켜고 정책은 만들지 않는다.

create table if not exists push_subs (
  endpoint text primary key,          -- 휴대폰(브라우저)마다 하나
  team int not null,                  -- 호출 받을 팀
  sub jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists push_subs_team on push_subs (team);

create table if not exists arrivals (  -- 심판이 체크한 대기석 도착
  event text not null, match text not null, team int not null,
  at timestamptz not null default now(),
  primary key (event, match, team)
);

create table if not exists push_log (  -- 보낸 호출 (같은 호출을 두 번 보내지 않게)
  key text primary key,
  event text not null, match text not null, team int not null,
  stage text not null,                -- '1', '2', 'manual'
  at timestamptz not null default now()
);
create index if not exists push_log_event on push_log (event);

alter table push_subs enable row level security;
alter table arrivals enable row level security;
alter table push_log enable row level security;
