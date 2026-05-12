FROM php:8.5-fpm

ARG user=rms
ARG uid=1000
ARG gid=1000

RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libzip-dev \
    zip \
    unzip \
    default-mysql-client \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

RUN docker-php-ext-install \
    pdo \
    pdo_mysql \
    mbstring \
    exif \
    pcntl \
    bcmath \
    gd \
    zip

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

RUN groupadd -g ${gid} ${user} \
    && useradd -u ${uid} -g ${gid} -G www-data,root -m -d /home/${user} ${user} \
    && mkdir -p /home/${user}/.composer \
    && chown -R ${user}:${user} /home/${user}

WORKDIR /var/www

RUN chown -R ${user}:${user} /var/www

RUN sed -ri "s/^user = .*/user = ${user}/" /usr/local/etc/php-fpm.d/www.conf \
    && sed -ri "s/^group = .*/group = ${user}/" /usr/local/etc/php-fpm.d/www.conf

USER ${user}

CMD ["php-fpm"]
