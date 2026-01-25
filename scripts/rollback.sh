#!/bin/bash
# ============================================================================
# Johnson Bros Plumbing - Deployment Rollback Script
# Rolls back to a previous deployment backup
# Usage: ./scripts/rollback.sh [backup-name]
# ============================================================================

set -e

# Configuration
DEPLOY_DIR="${DEPLOY_DIR:-/var/www/johnsonbros}"
BACKUP_DIR="$DEPLOY_DIR/backups"
CURRENT_DIR="$DEPLOY_DIR/current"
APP_NAME="johnsonbros"
HEALTH_URL="http://localhost:5000/health"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

echo_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

echo_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as appropriate user
if [ "$(id -u)" -eq 0 ]; then
    echo_warn "Running as root. Consider using a deploy user instead."
fi

# Navigate to deploy directory
cd "$DEPLOY_DIR" || {
    echo_error "Deploy directory not found: $DEPLOY_DIR"
    exit 1
}

# List available backups
list_backups() {
    echo_info "Available backups:"
    if [ -d "$BACKUP_DIR" ]; then
        ls -lt "$BACKUP_DIR" | grep "^d" | head -10 | awk '{print "  " NR ". " $NF " (" $6 " " $7 " " $8 ")"}'
    else
        echo "  (no backups found)"
    fi
}

# Determine which backup to restore
if [ -n "$1" ]; then
    BACKUP="$1"
    # If just a name is given, assume it's in the backup directory
    if [[ ! "$BACKUP" = /* ]]; then
        BACKUP="$BACKUP_DIR/$BACKUP"
    fi
else
    # Find most recent backup
    BACKUP=$(ls -dt "$BACKUP_DIR"/backup-* 2>/dev/null | head -1)
fi

# Validate backup exists
if [ -z "$BACKUP" ] || [ ! -d "$BACKUP" ]; then
    echo_error "No valid backup found"
    echo ""
    list_backups
    echo ""
    echo "Usage: $0 [backup-name]"
    echo "Example: $0 backup-20260124-120000"
    exit 1
fi

# Get backup info
BACKUP_NAME=$(basename "$BACKUP")
echo ""
echo "============================================"
echo "  Johnson Bros Plumbing - Rollback"
echo "============================================"
echo ""
echo_info "Preparing to rollback to: $BACKUP_NAME"
echo ""

# Show current deployment info
if [ -f "$CURRENT_DIR/DEPLOY_INFO.json" ]; then
    echo_info "Current deployment:"
    cat "$CURRENT_DIR/DEPLOY_INFO.json" | sed 's/^/  /'
    echo ""
fi

# Show backup deployment info
if [ -f "$BACKUP/DEPLOY_INFO.json" ]; then
    echo_info "Backup deployment:"
    cat "$BACKUP/DEPLOY_INFO.json" | sed 's/^/  /'
    echo ""
fi

# Confirmation prompt
echo_warn "This will replace the current deployment with the backup."
read -p "Continue? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo_info "Rollback aborted"
    exit 0
fi

echo ""
echo_info "Starting rollback..."

# Save current deployment as "failed" for debugging
FAILED_NAME="failed-$(date +%Y%m%d-%H%M%S)"
if [ -d "$CURRENT_DIR" ]; then
    echo_info "Saving current deployment as: $FAILED_NAME"
    mv "$CURRENT_DIR" "$BACKUP_DIR/$FAILED_NAME"
fi

# Restore backup
echo_info "Restoring backup: $BACKUP_NAME"
cp -r "$BACKUP" "$CURRENT_DIR"

# Restart application
echo_info "Restarting application..."
if command -v pm2 &> /dev/null; then
    pm2 reload "$APP_NAME" --update-env || pm2 start "$CURRENT_DIR/dist/index.js" --name "$APP_NAME"
else
    echo_warn "PM2 not found, attempting direct restart..."
    pkill -f "node.*dist/index.js" || true
    cd "$CURRENT_DIR"
    nohup node dist/index.js > /dev/null 2>&1 &
fi

# Wait for application to start
echo_info "Waiting for application to start..."
sleep 5

# Health check
echo_info "Running health check..."
MAX_RETRIES=5
RETRY_COUNT=0
HEALTH_OK=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -sf "$HEALTH_URL" > /dev/null 2>&1; then
        HEALTH_OK=true
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo_warn "Health check attempt $RETRY_COUNT/$MAX_RETRIES failed, retrying..."
    sleep 3
done

echo ""
if [ "$HEALTH_OK" = true ]; then
    echo "============================================"
    echo_info "Rollback successful!"
    echo "============================================"
    echo ""
    echo_info "Restored to: $BACKUP_NAME"
    echo_info "Failed deployment saved as: $FAILED_NAME"
    echo ""
    echo_info "Verify the application manually:"
    echo "  curl $HEALTH_URL"
    echo ""
else
    echo "============================================"
    echo_error "Rollback completed but health check failed!"
    echo "============================================"
    echo ""
    echo_error "The application may not be running correctly."
    echo_error "Check logs: pm2 logs $APP_NAME"
    echo ""
    exit 1
fi
