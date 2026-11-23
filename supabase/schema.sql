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
-- 회원 계정 관리 (2026-11-23 추가): 세션 버전(비밀번호 바꾸면 다른 기기 로그아웃), 로그인 잠금, 비밀번호 재설정 링크
alter table members add column if not exists sess int not null default 0;
alter table members add column if not exists fails int not null default 0;
alter table members add column if not exists locked_until timestamptz;
alter table members add column if not exists reset_hash text;
alter table members add column if not exists reset_exp timestamptz;

-- 팀 설정 (2026-11-23 추가): 회원 ↔ 팀 번호(관리자가 승인할 때 지정), 팀원이 고치는 팀 페이지 내용
alter table members add column if not exists team_no int;            -- 가입 때 적은 팀 번호 (승인 전엔 신청일 뿐)
alter table members add column if not exists team_leader boolean not null default false;   -- 팀장: 팀 설정·팀원 승인/내보내기
create table if not exists team_profiles (
  team int primary key,
  school text not null default '', region text not null default '',
  intro text not null default '', robot_name text not null default '',
  logo_url text, robot_url text,                    -- Supabase Storage 공개 주소 (버킷 team-images)
  instagram text not null default '', youtube text not null default '', web text not null default '', email text not null default '',
  sponsors text[] not null default '{}',
  sponsors_ok boolean not null default true,        -- 팀이 후원사를 바꾸면 false → 운영진 확인 후 true
  updated_at timestamptz not null default now(), updated_by text
);
alter table team_profiles enable row level security;
-- 사진: 공개 읽기 버킷. 쓰기는 서버(service_role)만
insert into storage.buckets (id, name, public) values ('team-images', 'team-images', true) on conflict (id) do nothing;
