FROM php:8.3-fpm

RUN apt-get update && apt-get install -y \
    git \
    curl \
    nginx \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libzip-dev \
    zip \
    unzip \
    libpq-dev \
    && docker-php-ext-install pdo_pgsql pgsql mbstring exif pcntl bcmath gd zip \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

COPY backend/ ./

RUN composer install --no-dev --optimize-autoloader --no-interaction

RUN chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache
RUN chmod -R 775 /var/www/storage /var/www/bootstrap/cache

# Laravel's `artisan` commands run under the CLI SAPI. Keep OPcache (and JIT)
# disabled there; this also matches backend/Dockerfile.
RUN printf '%s\n' 'opcache.enable_cli=0' 'opcache.jit=off' 'opcache.jit_buffer_size=0' \
    > /usr/local/etc/php/conf.d/zz-custom.ini

RUN printf '%s\n' 'memory_limit=256M' 'max_execution_time=120' \
    > /usr/local/etc/php/conf.d/zz-limits.ini

EXPOSE 8000

RUN cp backend/nginx.conf /etc/nginx/sites-available/default \
    && sed -i 's/listen 8000;/listen 10000;/' /etc/nginx/sites-available/default \
    && sed -i 's/listen \[::\]:8000;/listen [::]:10000;/' /etc/nginx/sites-available/default \
    && rm -f /etc/nginx/sites-enabled/default

COPY backend/start.sh /usr/local/bin/start.sh
RUN chmod +x /usr/local/bin/start.sh

CMD ["/usr/local/bin/start.sh"]
