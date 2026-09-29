#!/bin/bash
# Version: 2026-09-26-05 - Disable CLI OPcache and replace shell with server

set -e

echo "Starting Laravel API Backend..."

echo "PHP version:"
php -v

echo "Laravel version:"
php artisan --version

echo "Running database migrations..."
php -d opcache.enable_cli=0 -d opcache.jit=off -d opcache.jit_buffer_size=0 -d memory_limit=512M artisan migrate --force

echo "Caching configuration..."
php -d opcache.enable_cli=0 -d opcache.jit=off -d opcache.jit_buffer_size=0 -d memory_limit=512M artisan config:cache

echo "Caching routes..."
php -d opcache.enable_cli=0 -d opcache.jit=off -d opcache.jit_buffer_size=0 -d memory_limit=512M artisan route:cache

echo "Caching views..."
php -d opcache.enable_cli=0 -d opcache.jit=off -d opcache.jit_buffer_size=0 -d memory_limit=512M artisan view:cache

echo "Starting Laravel HTTP server..."
exec php -d opcache.enable_cli=0 -d opcache.jit=off -d opcache.jit_buffer_size=0 -d memory_limit=512M artisan serve --host=0.0.0.0 --port=${PORT:-8000}
