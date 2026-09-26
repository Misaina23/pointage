#!/bin/bash

set -e

echo "Starting Laravel API Backend..."

echo "PHP version:"
php -v

echo "Laravel version:"
php artisan --version

echo "Running database migrations..."
php artisan migrate --force

echo "Caching configuration..."
php artisan config:cache

echo "Caching routes..."
php artisan route:cache

echo "Caching views..."
php artisan view:cache

echo "Starting Laravel HTTP server on port ${PORT:-8000}..."
exec php artisan serve --host=0.0.0.0 --port=${PORT:-8000}
