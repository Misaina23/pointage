FROM php:8.2-fpm

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

RUN echo "opcache.jit=off" >> /usr/local/etc/php/conf.d/docker-php-ext-opcache.ini \
    && echo "memory_limit=512M" >> /usr/local/etc/php/conf.d/docker-php-ext-opcache.ini

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

COPY . ./

RUN composer install --no-dev --optimize-autoloader --no-interaction

RUN chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache
RUN chmod -R 775 /var/www/storage /var/www/bootstrap/cache

EXPOSE 8000

COPY start.sh /usr/local/bin/start.sh
RUN chmod +x /usr/local/bin/start.sh

CMD ["/usr/local/bin/start.sh"]
