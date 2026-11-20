// 팀 로고: public/team-logos/<팀번호>.<확장자>에 파일을 넣고 src/data/team-logos.json에 파일 이름을 적는다. 없으면 KRC 기본 로고.
import files from '../data/team-logos.json';

const byTeam = new Map((files as string[]).map((f) => [f.replace(/\.[^.]+$/, ''), `/team-logos/${f}`]));

export const logoFor = (team: number) => ({ src: byTeam.get(String(team)) ?? '/krc-logo.svg' });
export const hasOwnLogo = (team: number) => byTeam.has(String(team));
