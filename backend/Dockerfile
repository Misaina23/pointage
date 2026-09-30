FROM php:8.3-fpm

ARG CACHE_BUST=2026-09-26-06

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

COPY . ./

RUN composer install --no-dev --optimize-autoloader --no-interaction

RUN printf '%s\n' 'opcache.enable_cli=0' 'opcache.jit=off' 'opcache.jit_buffer_size=0' \
    > /usr/local/etc/php/conf.d/zz-custom.ini \
    && printf '%s\n' 'memory_limit=256M' 'max_execution_time=120' \
    > /usr/local/etc/php/conf.d/zz-limits.ini

# Bind PHP-FPM to loopback only. Render scans 0.0.0.0 and would otherwise
# advertise port 9000 (FastCGI) as a candidate web port.
RUN sed -i 's/^listen = 9000$/listen = 127.0.0.1:9000/' /usr/local/etc/php-fpm.d/www.conf

# nginx.conf arrives with `COPY . ./` above, so it is available at /var/www/nginx.conf.
RUN cp /var/www/nginx.conf /etc/nginx/sites-available/default \
    && ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default \
    && rm -f /etc/nginx/conf.d/default.conf \
    && nginx -t

RUN chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache
RUN chmod -R 775 /var/www/storage /var/www/bootstrap/cache

EXPOSE 8000

RUN echo "Cache bust: ${CACHE_BUST}"

COPY start.sh /usr/local/bin/start.sh
RUN chmod +x /usr/local/bin/start.sh

CMD ["/usr/local/bin/start.sh"]
