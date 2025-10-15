#!/bin/bash

# Database Restore Script
# Restores PostgreSQL database from backup file

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔄 Database Restore Script${NC}"

# Check if backup file is provided
if [ -z "$1" ]; then
    echo -e "${RED}❌ ERROR: Please provide backup file path${NC}"
    echo "Usage: ./scripts/restore-database.sh <backup-file.sql.gz>"
    echo ""
    echo "Available backups:"
    ls -lh ./backups/*.sql.gz 2>/dev/null || echo "No backups found"
    exit 1
fi

BACKUP_FILE=$1

# Check if file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ ERROR: Backup file not found: $BACKUP_FILE${NC}"
    exit 1
fi

# Load environment variables
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ ERROR: DATABASE_URL not set${NC}"
    exit 1
fi

# Confirmation prompt
echo -e "${YELLOW}⚠️  WARNING: This will overwrite your current database!${NC}"
echo -e "${YELLOW}Database: $DATABASE_URL${NC}"
echo -e "${YELLOW}Backup file: $BACKUP_FILE${NC}"
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${GREEN}Restore cancelled.${NC}"
    exit 0
fi

# Decompress if needed
if [[ $BACKUP_FILE == *.gz ]]; then
    echo -e "${YELLOW}📦 Decompressing backup...${NC}"
    TEMP_FILE="${BACKUP_FILE%.gz}"
    gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"
    RESTORE_FILE="$TEMP_FILE"
else
    RESTORE_FILE="$BACKUP_FILE"
fi

# Restore database
echo -e "${YELLOW}🔄 Restoring database...${NC}"

if command -v psql &> /dev/null; then
    psql "$DATABASE_URL" < "$RESTORE_FILE"
    echo -e "${GREEN}✅ Database restored successfully${NC}"
else
    echo -e "${RED}❌ ERROR: psql not found. Please install PostgreSQL client tools.${NC}"
    exit 1
fi

# Clean up temp file
if [ "$RESTORE_FILE" != "$BACKUP_FILE" ]; then
    rm "$RESTORE_FILE"
fi

echo -e "${GREEN}✅ Restore complete!${NC}"
echo -e "${YELLOW}⚠️  Remember to run migrations if needed: pnpm prisma migrate deploy${NC}"

