FROM php:8.3-fpm

ARG CACHE_BUST=2026-09-26-06

RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libzip-dev \
    zip \
    unzip \
    libpq-dev \
    && docker-php-ext-install pdo_pgsql pgsql mbstring exif pcntl bcmath gd zip

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

COPY . ./

RUN composer install --no-dev --optimize-autoloader --no-interaction

RUN echo "opcache.jit=off" > /usr/local/etc/php/conf.d/zz-custom.ini \
    && echo "memory_limit=256M" >> /usr/local/etc/php/conf.d/zz-custom.ini

RUN chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache
RUN chmod -R 775 /var/www/storage /var/www/bootstrap/cache

EXPOSE 8000

RUN echo "Cache bust: ${CACHE_BUST}"

COPY start.sh /usr/local/bin/start.sh
RUN chmod +x /usr/local/bin/start.sh

CMD ["/usr/local/bin/start.sh"]
