#!/bin/bash
# Version: 2026-09-29-01 - Nginx + PHP-FPM with crash-resilient artisan bootstrap

set -u

PHP_FLAGS="-d opcache.enable_cli=0 -d opcache.jit=off -d opcache.jit_buffer_size=0 -d memory_limit=256M"

# The artisan CLI occasionally dies with SIGSEGV on this platform. Retry a few
# times so a single bad process does not abort the whole deploy.
run_artisan() {
    local label="$1"; shift
    local attempt
    for attempt in 1 2 3 4 5; do
        echo ">>> ${label} (attempt ${attempt}/5)"
        if php ${PHP_FLAGS} artisan "$@"; then
            return 0
        fi
        echo "!!! ${label} failed with status $? (retrying)"
        sleep 2
    done
    echo "!!! ${label} failed after 5 attempts"
    return 1
}

echo "Starting Laravel API Backend..."

echo "PHP version:"
php -v

echo "Laravel version:"
run_artisan "artisan --version" --version || echo "!!! could not read Laravel version, continuing"

echo "Running database migrations..."
run_artisan "migrate" migrate --force || echo "!!! migrations failed, continuing to serve"

echo "Caching configuration..."
run_artisan "config:cache" config:cache || echo "!!! config:cache failed, continuing"

echo "Caching routes..."
run_artisan "route:cache" route:cache || echo "!!! route:cache failed, continuing"

echo "Caching views..."
run_artisan "view:cache" view:cache || echo "!!! view:cache failed, continuing"

PORT="${PORT:-10000}"
sed -i -E "s#listen (\[:::\])?[0-9]+;#listen \1${PORT};#g" /etc/nginx/sites-available/default

echo "Active nginx server block:"
grep -n "listen" /etc/nginx/sites-available/default

nginx -t

echo "Starting PHP-FPM on port 9000..."
php-fpm --daemonize

echo "Starting Nginx on port ${PORT}..."
nginx -g "daemon off;" &
NGINX_PID=$!

# Supervise: if either process dies, bring the container down so Render's health
# check restarts it cleanly instead of serving 502s from a half-dead process.
while true; do
    if ! kill -0 "${NGINX_PID}" 2>/dev/null; then
        echo "!!! Nginx exited, shutting down"
        exit 1
    fi
    sleep 5
done
