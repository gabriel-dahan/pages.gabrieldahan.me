# Pages

My website, where I feature my work and resume.

Portfolio — available at <https://pages.gabrieldahan.me>

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Vite frontend (proxies `/api` to the API server) |
| `npm run dev-server` | Express API in watch mode |
| `npm run build` | Build frontend → `dist/` |
| `npm run build:server` | Build API → `dist-server/` |
| `npm start` | Run production server (`dist-server/server.js`) |
| `npm run deploy` | Trigger the GitHub Actions deploy workflow (`gh` required) |

## Deploy (VPS + GitHub Actions)

Deploy builds **on the VPS** and reloads the app with **pm2**. The VPS address is never committed — it lives in GitHub secrets.

### One-time: GitHub secrets

In [pages.gabrieldahan.me → Settings → Secrets and variables → Actions](https://github.com/gabriel-dahan/pages.gabrieldahan.me/settings/secrets/actions), create:

| Secret | Value |
| --- | --- |
| `SSH_HOST` | VPS hostname or IP |
| `SSH_USER` | SSH user (e.g. `dev`) |
| `SSH_PRIVATE_KEY` | Private key for that user (public key must be in `~/.ssh/authorized_keys` on the VPS) |
| `SSH_PASSPHRASE` | Passphrase for that private key (only if the key is encrypted) |

Prefer a **dedicated deploy key without a passphrase** for Actions, so you don’t store your personal key passphrase in GitHub.

### One-time: VPS setup

```bash
# Clone (if needed)
sudo mkdir -p /var/www/gabrieldahan.me
sudo chown "$USER":"$USER" /var/www/gabrieldahan.me
git clone https://github.com/gabriel-dahan/pages.gabrieldahan.me.git /var/www/gabrieldahan.me/pages
cd /var/www/gabrieldahan.me/pages

# Ensure the machine can pull (deploy key or HTTPS credentials)
# Copy .env.server into place (never commit it)
# cp /path/to/.env.server .env.server

npm i -g pm2
pm2 startup   # follow the printed command
```

First deploy (from your laptop after secrets are set):

```bash
npm run deploy
# or: gh workflow run deploy.yml
```

On the VPS after the first successful run:

```bash
pm2 save
```

### What the deploy does

`scripts/deploy.sh` (run over SSH by Actions):

1. `git fetch` + hard reset to `origin/main`
2. Download resume PDFs from [my-resume](https://github.com/gabriel-dahan/my-resume) into `public/files/`
3. `npm ci` (or `npm install` if no lockfile)
4. `npm run build` + `npm run build:server`
5. `pm2 startOrReload ecosystem.config.cjs`

## Resume sync (my-resume → VPS)

When resumes change in [my-resume](https://github.com/gabriel-dahan/my-resume), a workflow can SCP the PDFs onto the VPS (`public/files/` and `dist/files/`) without a full site rebuild.

1. Copy [`deploy/my-resume-sync-resumes.yml`](deploy/my-resume-sync-resumes.yml) to that repo as `.github/workflows/sync-resumes.yml`
2. Add the same `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY` secrets on **my-resume**

Full site deploys also re-fetch the resumes before building, so both paths stay consistent.
