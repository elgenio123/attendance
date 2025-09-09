#!/usr/bin/env bash
echo "Upgrade php"
a2disconf php8.1-fpm
echo "Running composer"
composer global require hirak/prestissimo
composer install --no-dev --working-dir=/var/www/html
echo "Caching config..."
php artisan config:cache
echo "Caching routes..."
php artisan route:cache
echo "Caching views..."
php artisan view:cache
echo "Running migrations..."
php artisan migrate:fresh --seed --force
