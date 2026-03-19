# Aliyun ECS Deployment

1. Upload the contents of this folder to `/var/www/portfolio`.
2. Copy `deploy/nginx-portfolio.conf` to `/etc/nginx/conf.d/portfolio.conf`.
3. Replace `your-domain.com` with your real domain.
4. Run `nginx -t` and then `systemctl reload nginx`.
5. Point your domain `A` record to the ECS public IP.

Optional HTTPS:

1. Install Certbot.
2. Run `certbot --nginx -d your-domain.com -d www.your-domain.com`.
