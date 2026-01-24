#!/bin/bash
# ============================================================================
# Johnson Bros Plumbing - SSL Setup Script
# Sets up Let's Encrypt SSL certificate with auto-renewal
# Usage: ./scripts/setup-ssl.sh domain.com [admin-email]
# ============================================================================

set -e

# Configuration
DOMAIN="$1"
EMAIL="${2:-admin@thejohnsonbros.com}"
NGINX_CONF="/etc/nginx/sites-available/johnsonbros"
NGINX_ENABLED="/etc/nginx/sites-enabled/johnsonbros"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

echo_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

echo_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$(id -u)" -ne 0 ]; then
    echo_error "This script must be run as root"
    echo "Usage: sudo $0 domain.com [admin-email]"
    exit 1
fi

# Validate domain argument
if [ -z "$DOMAIN" ]; then
    echo_error "Domain is required"
    echo ""
    echo "Usage: $0 domain.com [admin-email]"
    echo ""
    echo "Examples:"
    echo "  $0 johnsonbrosplumbing.com"
    echo "  $0 johnsonbrosplumbing.com admin@example.com"
    exit 1
fi

echo ""
echo "============================================"
echo "  Johnson Bros Plumbing - SSL Setup"
echo "============================================"
echo ""
echo_info "Domain: $DOMAIN"
echo_info "Email: $EMAIL"
echo ""

# Install certbot if not present
if ! command -v certbot &> /dev/null; then
    echo_info "Installing certbot..."
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
    echo_info "Certbot installed successfully"
fi

# Check if nginx is installed
if ! command -v nginx &> /dev/null; then
    echo_error "Nginx is not installed"
    echo_info "Install nginx first: apt-get install nginx"
    exit 1
fi

# Check nginx configuration
echo_info "Checking nginx configuration..."
nginx -t || {
    echo_error "Nginx configuration test failed"
    exit 1
}

# Check if certificate already exists
if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    echo_warn "Certificate already exists for $DOMAIN"
    read -p "Do you want to renew/replace it? (y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo_info "SSL setup aborted"
        exit 0
    fi
fi

# Create temporary nginx config for certificate verification (if no config exists)
if [ ! -f "$NGINX_CONF" ]; then
    echo_info "Creating temporary nginx configuration..."
    cat > "$NGINX_CONF" << EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://\$server_name\$request_uri;
    }
}
EOF
    ln -sf "$NGINX_CONF" "$NGINX_ENABLED"
    nginx -t && systemctl reload nginx
fi

# Obtain certificate
echo_info "Obtaining SSL certificate..."
certbot --nginx \
    -d "$DOMAIN" \
    -d "www.$DOMAIN" \
    --non-interactive \
    --agree-tos \
    --email "$EMAIL" \
    --redirect \
    --hsts \
    --staple-ocsp

# Verify certificate
echo_info "Verifying certificate..."
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo_info "Certificate obtained successfully"

    # Show certificate info
    echo ""
    echo_info "Certificate details:"
    openssl x509 -in "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" -noout -dates | sed 's/^/  /'
else
    echo_error "Certificate file not found"
    exit 1
fi

# Setup auto-renewal cron job
echo_info "Setting up auto-renewal..."
CRON_JOB="0 3 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'"

if ! crontab -l 2>/dev/null | grep -q "certbot renew"; then
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    echo_info "Auto-renewal cron job added (runs daily at 3 AM)"
else
    echo_info "Auto-renewal cron job already exists"
fi

# Test renewal
echo_info "Testing renewal process..."
certbot renew --dry-run || echo_warn "Dry-run renewal test had warnings"

# Reload nginx to apply changes
echo_info "Reloading nginx..."
systemctl reload nginx

# Final verification
echo ""
echo "============================================"
echo_info "SSL Setup Complete!"
echo "============================================"
echo ""
echo_info "Your site is now accessible at:"
echo "  https://$DOMAIN"
echo "  https://www.$DOMAIN"
echo ""
echo_info "Certificate auto-renewal is configured."
echo ""
echo_info "Next steps:"
echo "  1. Update DNS records to point to this server"
echo "  2. Test SSL: https://www.ssllabs.com/ssltest/analyze.html?d=$DOMAIN"
echo "  3. Verify site loads correctly"
echo ""
echo_info "Certificate locations:"
echo "  Certificate: /etc/letsencrypt/live/$DOMAIN/fullchain.pem"
echo "  Private Key: /etc/letsencrypt/live/$DOMAIN/privkey.pem"
echo ""
