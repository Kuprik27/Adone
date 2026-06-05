# ADONE — adone.agency

Static landing: Google & Meta Ads launch setup (% of ad spend).

## Deploy (GitHub Pages)

1. Push this repo to GitHub
2. **Settings → Pages → Source:** Deploy from branch `main` / folder `/ (root)`
3. **Custom domain:** `adone.agency` (file `CNAME` already in repo)
4. At your domain registrar, set DNS:
   - `A` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `CNAME` `www` → `YOUR_USERNAME.github.io` (optional)

## Form → Google Sheets

See `scripts/LEADS-SETUP.md` and `scripts/leads-webhook.gs`.

## Local preview

```bash
python3 -m http.server 8765
# http://127.0.0.1:8765/
```
