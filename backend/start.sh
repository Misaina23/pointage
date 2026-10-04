#!/bin/sh
set -eu

if [ -z "${APP_KEY:-}" ]; then
    echo "APP_KEY is required. Generate one with: php artisan key:generate --show" >&2
    exit 1
fi

case "${RUN_MIGRATIONS:-true}" in
    true|false)
        ;;
    *)
        echo "RUN_MIGRATIONS must be either 'true' or 'false'." >&2
        exit 1
        ;;
esac

if [ "${RUN_MIGRATIONS:-true}" = "true" ] && [ "${APP_ENV:-production}" = "production" ]; then
    case "${DB_SCHEMA:-}" in
        ""|public)
            echo "DB_SCHEMA must be set to a dedicated schema before production migrations." >&2
            exit 1
            ;;
    esac
fi

mkdir -p \
    bootstrap/cache \
    storage/app/public \
    storage/framework/cache/data \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs

chown -R www-data:www-data bootstrap/cache storage
chmod -R ug+rwX bootstrap/cache storage

php artisan package:discover --ansi

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
    attempt=0

    until php artisan db:show --no-interaction >/dev/null 2>&1; do
        attempt=$((attempt + 1))

        if [ "$attempt" -ge 30 ]; then
            echo "Database is unavailable after 60 seconds; cannot run migrations." >&2
            php artisan db:show --no-interaction >&2
            exit 1
        fi

        echo "Waiting for the database ($attempt/30)..."
        sleep 2
    done

    php artisan migrate --force
fi

exec "$@"
