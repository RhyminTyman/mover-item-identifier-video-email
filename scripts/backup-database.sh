#!/bin/bash

# Database Backup Script
# Backs up PostgreSQL database to local file and optionally to S3

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔄 Starting database backup...${NC}"

# Load environment variables
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ ERROR: DATABASE_URL not set${NC}"
    exit 1
fi

# Create backup directory
BACKUP_DIR="./backups"
mkdir -p $BACKUP_DIR

# Generate backup filename with timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"

echo -e "${YELLOW}📦 Creating backup: $BACKUP_FILE${NC}"

# Extract database connection details from DATABASE_URL
# Format: postgresql://user:password@host:port/database
DB_URL=$DATABASE_URL

# Use pg_dump to create backup
if command -v pg_dump &> /dev/null; then
    pg_dump "$DB_URL" > "$BACKUP_FILE"
    echo -e "${GREEN}✅ Database backup created successfully${NC}"
else
    echo -e "${RED}❌ ERROR: pg_dump not found. Please install PostgreSQL client tools.${NC}"
    exit 1
fi

# Compress backup
echo -e "${YELLOW}🗜️  Compressing backup...${NC}"
gzip "$BACKUP_FILE"
BACKUP_FILE="${BACKUP_FILE}.gz"
echo -e "${GREEN}✅ Backup compressed: $BACKUP_FILE${NC}"

# Get file size
FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo -e "${GREEN}📊 Backup size: $FILE_SIZE${NC}"

# Optional: Upload to S3
if [ ! -z "$AWS_S3_BACKUP_BUCKET" ]; then
    echo -e "${YELLOW}☁️  Uploading to S3...${NC}"
    
    if command -v aws &> /dev/null; then
        aws s3 cp "$BACKUP_FILE" "s3://$AWS_S3_BACKUP_BUCKET/backups/$(basename $BACKUP_FILE)"
        echo -e "${GREEN}✅ Backup uploaded to S3${NC}"
    else
        echo -e "${YELLOW}⚠️  AWS CLI not found. Skipping S3 upload.${NC}"
    fi
fi

# Clean up old backups (keep last 7 days)
echo -e "${YELLOW}🧹 Cleaning up old backups...${NC}"
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete
echo -e "${GREEN}✅ Old backups cleaned up${NC}"

# List recent backups
echo -e "${GREEN}📋 Recent backups:${NC}"
ls -lh $BACKUP_DIR | tail -5

echo -e "${GREEN}✅ Backup complete!${NC}"
echo -e "${GREEN}📁 Backup location: $BACKUP_FILE${NC}"

