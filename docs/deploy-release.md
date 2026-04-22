# Atomic Release Deploy

Script: [`.zscripts/deploy-release.sh`](/Users/riskimaulanarahman/Downloads/nami/.zscripts/deploy-release.sh)

## Tujuan

Script ini membuat release folder baru yang berisi artifact build yang konsisten:

- `standalone`
- `static`
- `public`

Lalu script mengganti symlink `current` ke release baru secara aman, sehingga HTML dan asset `/_next/static` berasal dari build yang sama.

## Contoh penggunaan

Jalankan dari root repo di server atau workspace deploy:

```bash
./.zscripts/deploy-release.sh \
  --release-root /var/www/nami \
  --restart-command 'cd /var/www/nami/current/standalone && bun server.js'
```

Untuk reuse hasil build yang sudah ada:

```bash
./.zscripts/deploy-release.sh \
  --release-root /var/www/nami \
  --skip-build
```

Jika ingin menambah purge step setelah deploy:

```bash
./.zscripts/deploy-release.sh \
  --release-root /var/www/nami \
  --restart-command 'systemctl restart nami-web' \
  --purge-command 'curl -X POST https://example.invalid/purge'
```

## Layout release

Dengan `--release-root /var/www/nami`, hasilnya menjadi:

```text
/var/www/nami/
  current -> /var/www/nami/releases/<release-name>
  releases/
    <release-name>/
      standalone/
      static/
      public/
      release.env
```

`standalone/` juga sudah berisi:

- `standalone/.next/static`
- `standalone/public`

Jadi app dapat dijalankan langsung dari `current/standalone`.

## Flag penting

- `--release-root PATH`: root deploy tujuan
- `--release-name NAME`: nama release manual
- `--keep N`: jumlah release lama yang disimpan
- `--build-command CMD`: override command build
- `--restart-command CMD`: command restart process setelah switch symlink
- `--purge-command CMD`: command purge CDN/proxy setelah restart
- `--skip-build`: pakai artifact `.next` yang sudah ada

Secara default script ini menjalankan build dan restart dengan `NODE_ENV=production`.
Kalau memang perlu override, jalankan dengan `DEPLOY_NODE_ENV=<value>`.

## Verifikasi setelah deploy

```bash
curl -I https://your-host/login
curl -L -s https://your-host/login | rg '/_next/static/chunks/'
```

Ambil salah satu chunk dari HTML lalu cek:

```bash
curl -I https://your-host/_next/static/chunks/<file>.js
```

Kondisi yang diharapkan:

- `/login` tidak di-cache panjang
- chunk yang direferensikan HTML semuanya `200`
- symlink `current` mengarah ke release terbaru
