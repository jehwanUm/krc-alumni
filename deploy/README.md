# Ubuntu 24.04 서버에 올리기

홈페이지(Next.js)는 서버에서 `npm run build` → `npm run start`로 돌아가요. 저장소는 **SQLite 파일 하나**(Node 내장 `node:sqlite`)이고, 팀 사진은 서버 폴더에 저장돼요. 추가 DB 서버는 필요 없어요.

| 무엇 | 어디 (예시) |
|---|---|
| 앱 코드 | `/srv/krc-alumni` |
| SQLite 파일 | `/var/lib/krc-alumni/krc.sqlite` (`DB_PATH`) |
| 팀 사진 | `/var/lib/krc-alumni/uploads` (`UPLOAD_DIR`) |
| 실행 | systemd `krc-alumni` (홈페이지), `krc-alumni-tick` (경기 호출) |
| 앞단 | nginx → `127.0.0.1:3000` |

## 1. 준비 (한 번)

```bash
# Node 24 LTS (node:sqlite가 들어 있어요. 22.13 이상이면 동작)
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs nginx git

# 실행용 계정과 폴더
sudo useradd --system --create-home --shell /usr/sbin/nologin krc
sudo mkdir -p /srv/krc-alumni /var/lib/krc-alumni/uploads
sudo chown -R krc:krc /srv/krc-alumni /var/lib/krc-alumni
```

## 2. 코드 받기와 설정

```bash
sudo -u krc git clone https://github.com/<계정>/krc-alumni.git /srv/krc-alumni
cd /srv/krc-alumni
sudo -u krc cp .env.example .env
sudo -u krc nano .env
```

`.env`에서 꼭 채울 것:

| 키 | 값 |
|---|---|
| `SITE_URL` | `https://krcalumni.com` |
| `SESSION_SECRET` | `openssl rand -hex 32` 결과 |
| `DB_PATH` | `/var/lib/krc-alumni/krc.sqlite` |
| `UPLOAD_DIR` | `/var/lib/krc-alumni/uploads` |
| `FTC_API_USER`, `FTC_API_TOKEN` | FTC Events API 계정 |
| `VAPID_*`, `CRON_SECRET`, `QUEUE_PIN` | 지금 쓰는 값 그대로 (바꾸면 호출 구독을 다시 해야 함) |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | 오류 알림 |

`.env`는 비밀 값이에요. `chmod 600 .env`로 다른 사람이 못 읽게 하고, git에는 절대 올리지 마세요.

## 3. 빌드

```bash
cd /srv/krc-alumni
sudo -u krc npm ci
sudo -u krc npm run build
```

## 4. 예전 데이터 옮기기 (한 번, 지금 Vercel+Supabase에서 옮길 때만)

```bash
sudo -u krc env SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… npm run import:supabase
```

회원·팀 설정·오토 경로·호출 기록과 팀 사진을 SQLite와 `UPLOAD_DIR`로 옮겨요. 여러 번 실행해도 같은 줄은 건너뛰어요.

## 5. 켜기

```bash
sudo cp deploy/krc-alumni.service deploy/krc-alumni-tick.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now krc-alumni krc-alumni-tick
systemctl status krc-alumni --no-pager
curl -I http://127.0.0.1:3000        # 200이면 성공
```

## 6. nginx

`deploy/nginx-krc-alumni.conf`를 보고 기존 krcalumni.com 설정에 `location /`를 넣어요. **KRC Tech가 쓰는 `/api/auth/` 등은 KRC Tech로 보내는 줄을 먼저** 두세요. 홈페이지 API는 겹치지 않는 경로를 써요.

```bash
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d krcalumni.com -d www.krcalumni.com   # HTTPS (처음 한 번)
```

## 7. 첫 관리자

홈페이지에서 회원가입한 뒤:

```bash
cd /srv/krc-alumni && sudo -u krc npm run admin -- <이메일>
```

## 업데이트할 때

```bash
cd /srv/krc-alumni
sudo -u krc git pull
sudo -u krc npm ci
sudo -u krc npm run build
sudo systemctl restart krc-alumni
```

## 백업 (주 1회)

```bash
cd /srv/krc-alumni && sudo -u krc npm run backup
```

SQLite 파일과 팀 사진을 **암호로 잠근 파일 하나**(`backups/날짜.krcbak`)로 만들고, 30일이 지난 백업은 지워요. 서버가 켜져 있어도 돼요. 백업 파일은 서버 밖(외장하드 등)에 한 부 더 두세요. 푸는 법은 `scripts/backup.mjs` 맨 위에 있어요.

## 문제가 생기면

| 증상 | 확인 |
|---|---|
| 페이지가 안 열림 | `journalctl -u krc-alumni -n 50` |
| 로그인하면 오류 | `.env`에 `SESSION_SECRET`이 있는지 |
| 사진이 안 보임 | `UPLOAD_DIR` 폴더 권한(`krc`가 쓸 수 있는지) |
| 가입이 「너무 많아요」로 막힘 | nginx에 `X-Real-IP` 줄이 있는지 (없으면 모든 사람이 같은 IP로 보임) |
| 경기 호출이 안 감 | `journalctl -u krc-alumni-tick -n 20`, `.env`의 `CRON_SECRET` |
