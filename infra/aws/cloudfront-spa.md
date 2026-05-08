# CloudFront + S3 SPA Deployment Notes

- Use a private S3 bucket with CloudFront Origin Access Control.
- Configure the default root object as `index.html`.
- Return `/index.html` for `403` and `404` errors so Angular routes work on refresh.
- Cache hashed JS/CSS/assets with a long TTL and `immutable`.
- Keep `index.html` and `assets/config.json` on a short TTL or invalidate them on each deploy.
- Attach ACM certificate in `us-east-1` for CloudFront.
- Add response headers: HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and a CSP aligned with the backend/API domains.
