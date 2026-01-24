# Production Deployment Guide (Linux Server)

This guide provides step-by-step instructions for deploying the **RoboTech** application (Django + React) on a Linux server (Ubuntu/Debian).

## 1. Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- A domain name (optional but recommended for SSL)
- Root or sudo access

## 2. System Dependencies

Update the system and install necessary packages (including PostgreSQL):

```bash
sudo apt update
sudo apt install python3-pip python3-venv nginx git curl libpq-dev postgresql postgresql-contrib -y
```

## 3. Database Setup (PostgreSQL)

1. **Access PostgreSQL**:
   ```bash
   sudo -u postgres psql
   ```

2. **Create Database and User**:
   ```sql
   CREATE DATABASE robotech_db;
   CREATE USER robotech_user WITH PASSWORD 'your-secure-password';
   ALTER ROLE robotech_user SET client_encoding TO 'utf8';
   ALTER ROLE robotech_user SET default_transaction_isolation TO 'read committed';
   ALTER ROLE robotech_user SET timezone TO 'UTC';
   GRANT ALL PRIVILEGES ON DATABASE robotech_db TO robotech_user;
   \q
   ```

## 4. Clone and Setup Backend

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url> /var/www/robotech
   cd /var/www/robotech/backend_django
   ```

2. **Create a Virtual Environment**:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Variables**:
   Copy the example env and fill in your details:
   ```bash
   cp .env.example .env
   nano .env
   ```
   *Set `DEBUG=False`, `SECRET_KEY`, `ALLOWED_HOSTS`, and `CORS_ALLOWED_ORIGINS`.*

5. **Initialize Database and Static Files**:
   ```bash
   python manage.py migrate
   python manage.py collectstatic --noinput
   python manage.py create_superuser  # If you have the script
   ```

## 5. Setup Gunicorn (Backend Server)

Create a systemd socket and service for Gunicorn to keep it running in the background.

1. **Create Gunicorn Socket**: `sudo nano /etc/systemd/system/gunicorn.socket`
   ```ini
   [Unit]
   Description=gunicorn socket

   [Socket]
   ListenStream=/run/gunicorn.sock

   [Install]
   WantedBy=sockets.target
   ```

2. **Create Gunicorn Service**: `sudo nano /etc/systemd/system/gunicorn.service`
   *(Replace `youruser` with your Linux username and `/var/www/robotech` with your path)*
   ```ini
   [Unit]
   Description=gunicorn daemon
   Requires=gunicorn.socket
   After=network.target

   [Service]
   User=youruser
   Group=www-data
   WorkingDirectory=/var/www/robotech/backend_django
   ExecStart=/var/www/robotech/backend_django/venv/bin/gunicorn \
             --access-logfile - \
             --workers 3 \
             --bind unix:/run/gunicorn.sock \
             config.wsgi:application

   [Install]
   WantedBy=multi-user.target
   ```

3. **Start and Enable Gunicorn**:
   ```bash
   sudo systemctl start gunicorn.socket
   sudo systemctl enable gunicorn.socket
   ```

## 6. Build Frontend

1. **Install Node.js & NPM**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs
   ```

2. **Build the production bundle**:
   ```bash
   cd /var/www/robotech/frontend
   # Update .env with production API URL
   echo "VITE_API_BASE_URL=https://yourdomain.com/api" > .env
   npm install
   npm run build
   ```
   *Note: Vite embeds environment variables into the JS bundle during the build step. If you change the API URL later, you must rebuild the frontend.*

   *This creates a `dist/` folder.*

## 7. Configure Nginx

Create a new Nginx configuration: `sudo nano /etc/nginx/sites-available/robotech`

```nginx
server {
    listen 80;
    server_name yourdomain.com your-server-ip;

    # Frontend - Serve built files
    location / {
        root /var/www/robotech/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API and Admin
    location ~ ^/(api|admin) {
        include proxy_params;
        proxy_pass http://unix:/run/gunicorn.sock;
    }

    # Static files for Django Admin
    location /static/ {
        alias /var/www/robotech/backend_django/staticfiles/;
    }

    # Media files
    location /media/ {
        alias /var/www/robotech/backend_django/media/;
    }
}
```

Enable the configuration:
```bash
sudo ln -s /etc/nginx/sites-available/robotech /etc/nginx/sites-enabled
sudo nginx -t
sudo systemctl restart nginx
```

## 8. Security (SSL)

It's highly recommended to use SSL:
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com
```

## 9. Summary of changes made for Production

- **Database Migration**: Pivoted from SQLite to **PostgreSQL** for production reliability.
- **Environment Separation**: Moved sensitive keys and DB credentials to `.env`.
- **WhiteNoise**: Configured Django to serve its own static files efficiently in production.
- **Security**: Disabled `DEBUG` mode and restricted `ALLOWED_HOSTS`.
- **Reverse Proxy**: Nginx handles SSL and acts as a gateway for both Frontend (static) and Backend (API).
