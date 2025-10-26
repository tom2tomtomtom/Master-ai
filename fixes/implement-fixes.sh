#!/bin/bash

# Master-AI Fix Implementation Script
# Safe, idempotent automation for applying fixes

set -euo pipefail

# Colours for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
PROJECT_ROOT="/users/thomasdowuona-hyde/Master-AI"
FIXES_DIR="${PROJECT_ROOT}/fixes"
BACKUP_DIR="${PROJECT_ROOT}/backups/$(date +%Y%m%d_%H%M%S)"

# Function to print coloured output
log() {
    echo -e "${GREEN}[$(date +%T)]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Create backup directory
create_backup() {
    log "Creating backup directory: ${BACKUP_DIR}"
    mkdir -p "${BACKUP_DIR}"
    
    # Backup key directories
    for dir in src config lib middleware utils; do
        if [ -d "${PROJECT_ROOT}/${dir}" ]; then
            log "Backing up ${dir}..."
            cp -r "${PROJECT_ROOT}/${dir}" "${BACKUP_DIR}/" || warn "Could not backup ${dir}"
        fi
    done
    
    # Backup key files
    for file in package.json tsconfig.json .env prisma/schema.prisma; do
        if [ -f "${PROJECT_ROOT}/${file}" ]; then
            log "Backing up ${file}..."
            cp "${PROJECT_ROOT}/${file}" "${BACKUP_DIR}/" || warn "Could not backup ${file}"
        fi
    done
}

# Install dependencies
install_dependencies() {
    log "Installing required dependencies..."
    cd "${PROJECT_ROOT}"
    
    # Security dependencies
    npm install --save express-rate-limit rate-limit-redis
    npm install --save helmet csurf
    npm install --save dotenv zod
    
    # Performance dependencies
    npm install --save redis ioredis
    npm install --save winston pino pino-pretty
    
    # Dev dependencies
    npm install --save-dev @types/express-rate-limit
    npm install --save-dev @types/redis @types/ioredis
    npm install --save-dev jest @types/jest ts-jest
    npm install --save-dev supertest @types/supertest
    
    log "Dependencies installed successfully"
}

# Copy security fixes
copy_security_fixes() {
    log "Copying security fixes..."
    
    mkdir -p "${PROJECT_ROOT}/src/middleware/security"
    cp "${FIXES_DIR}/security/rateLimit.ts" "${PROJECT_ROOT}/src/middleware/security/"
    cp "${FIXES_DIR}/security/csrf.ts" "${PROJECT_ROOT}/src/middleware/security/"
    cp "${FIXES_DIR}/security/secureHeaders.ts" "${PROJECT_ROOT}/src/middleware/security/"
    
    log "Security fixes copied"
}

# Copy environment management
copy_env_management() {
    log "Setting up environment management..."
    
    mkdir -p "${PROJECT_ROOT}/src/config"
    cp "${FIXES_DIR}/env/env.schema.ts" "${PROJECT_ROOT}/src/config/"
    cp "${FIXES_DIR}/env/loadEnv.ts" "${PROJECT_ROOT}/src/config/"
    cp "${FIXES_DIR}/env/env.example" "${PROJECT_ROOT}/.env.example"
    
    # Create .env if it doesn't exist
    if [ ! -f "${PROJECT_ROOT}/.env" ]; then
        cp "${PROJECT_ROOT}/.env.example" "${PROJECT_ROOT}/.env"
        warn ".env file created from template - please update with real values"
    fi
    
    log "Environment management setup complete"
}

# Copy error handling
copy_error_handling() {
    log "Setting up error handling..."
    
    mkdir -p "${PROJECT_ROOT}/src/utils/errors"
    cp "${FIXES_DIR}/errors/AppError.ts" "${PROJECT_ROOT}/src/utils/errors/"
    cp "${FIXES_DIR}/errors/errorHandler.ts" "${PROJECT_ROOT}/src/middleware/"
    
    log "Error handling setup complete"
}

# Copy caching layer
copy_caching() {
    log "Setting up caching layer..."
    
    mkdir -p "${PROJECT_ROOT}/src/utils/cache"
    cp "${FIXES_DIR}/cache/redisClient.ts" "${PROJECT_ROOT}/src/utils/cache/"
    cp "${FIXES_DIR}/cache/cacheDecorator.ts" "${PROJECT_ROOT}/src/utils/cache/"
    
    log "Caching layer setup complete"
}

# Copy performance fixes
copy_performance_fixes() {
    log "Applying performance fixes..."
    
    mkdir -p "${PROJECT_ROOT}/src/database/migrations"
    cp "${FIXES_DIR}/perf/addIndexes.prisma.sql" "${PROJECT_ROOT}/src/database/migrations/"
    
    log "Performance fixes copied"
}

# Copy monitoring utilities
copy_monitoring() {
    log "Setting up monitoring..."
    
    mkdir -p "${PROJECT_ROOT}/src/utils/monitoring"
    cp "${FIXES_DIR}/monitoring/logger.ts" "${PROJECT_ROOT}/src/utils/"
    cp "${FIXES_DIR}/monitoring/requestMetrics.ts" "${PROJECT_ROOT}/src/middleware/"
    
    log "Monitoring setup complete"
}

# Copy documentation
copy_documentation() {
    log "Copying documentation..."
    
    mkdir -p "${PROJECT_ROOT}/docs"
    cp "${FIXES_DIR}/docs/API_DOCUMENTATION.md" "${PROJECT_ROOT}/docs/"
    
    log "Documentation copied"
}

# Copy tests
copy_tests() {
    log "Setting up test suite..."
    
    mkdir -p "${PROJECT_ROOT}/tests/e2e"
    mkdir -p "${PROJECT_ROOT}/tests/unit"
    
    cp "${FIXES_DIR}/tests/health.e2e.test.ts" "${PROJECT_ROOT}/tests/e2e/"
    cp "${FIXES_DIR}/tests/cacheDecorator.test.ts" "${PROJECT_ROOT}/tests/unit/"
    
    log "Test suite setup complete"
}

# Update configuration files
update_configs() {
    log "Updating configuration files..."
    
    # Add test script to package.json if not exists
    if ! grep -q "\"test\":" "${PROJECT_ROOT}/package.json"; then
        warn "Please add test scripts to package.json manually"
    fi
    
    # Create jest config if not exists
    if [ ! -f "${PROJECT_ROOT}/jest.config.js" ]; then
        cat > "${PROJECT_ROOT}/jest.config.js" << 'EOF'
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 85,
      statements: 85
    }
  }
};
EOF
        log "Created jest.config.js"
    fi
}

# Main execution
main() {
    log "Starting Master-AI fix implementation..."
    
    # Check if fixes directory exists
    if [ ! -d "${FIXES_DIR}" ]; then
        error "Fixes directory not found: ${FIXES_DIR}"
        exit 1
    fi
    
    # Confirmation
    echo -e "${YELLOW}This script will:"
    echo "1. Backup existing files to ${BACKUP_DIR}"
    echo "2. Install new dependencies"
    echo "3. Copy all fix files to appropriate locations"
    echo "4. Update configuration files"
    echo -e "${NC}"
    
    read -p "Continue? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "Implementation cancelled"
        exit 0
    fi
    
    # Execute steps
    create_backup
    install_dependencies
    copy_security_fixes
    copy_env_management
    copy_error_handling
    copy_caching
    copy_performance_fixes
    copy_monitoring
    copy_documentation
    copy_tests
    update_configs
    
    log "Implementation complete!"
    echo -e "${GREEN}✅ All fixes have been applied${NC}"
    echo
    echo "Next steps:"
    echo "1. Update .env file with your configuration"
    echo "2. Run database migrations: npm run migrate"
    echo "3. Run tests: npm test"
    echo "4. Review and adjust security settings as needed"
    echo
    echo "Backup location: ${BACKUP_DIR}"
}

# Run main function
main "$@"
