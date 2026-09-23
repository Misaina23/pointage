#!/bin/bash

# Start script for Laravel API Backend

set -e

echo "Starting Laravel API Backend..."

# Wait for database to be ready
echo "Waiting for database..."
until php artisan migrate --force 2>/dev/null; do
    echo "Database not ready, waiting 5 seconds..."
    sleep 5
done

echo "Running migrations..."
php artisan migrate --force

echo "Caching configuration..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "Starting PHP-FPM server..."
php-fpm