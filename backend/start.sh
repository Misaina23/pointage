#!/bin/bash

set -e

echo "Starting Laravel API Backend..."

# Disable OPcache JIT to prevent segmentation faults in PHP 8.2 CLI
export PHP_OPCACHE_JIT=off
export PHP_MEMORY_LIMIT=512M

echo "PHP version:"
php -v

echo "Laravel version:"
php artisan --version

echo "Running database migrations..."
php -d opcache.jit=off -d memory_limit=512M artisan migrate --force

echo "Caching configuration..."
php -d opcache.jit=off -d memory_limit=512M artisan config:cache

echo "Caching routes..."
php -d opcache.jit=off -d memory_limit=512M artisan route:cache

echo "Caching views..."
php -d opcache.jit=off -d memory_limit=512M artisan view:cache

echo "Starting PHP-FPM server..."
php-fpm