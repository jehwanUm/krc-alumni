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

-- 홈페이지 회원 (가입 → 운영진 승인 → 로그인). 비밀번호는 scrypt 해시만 저장
create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,          -- 소문자로 저장
  pw text not null,                    -- scrypt "salt:hash"
  name text not null,
  school text not null,
  team text not null,                  -- 소속 팀 이름
  verify text not null,                -- 팀 인증 신청 내용 (시즌·파트·팀장 확인 메모, 졸업생은 증빙 안내)
  role text not null default '',
  intro text not null default '',
  status text not null default 'pending',   -- pending · approved · rejected
  admin boolean not null default false,
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by text
);
create index if not exists members_status on members (status);
alter table members enable row level security;
