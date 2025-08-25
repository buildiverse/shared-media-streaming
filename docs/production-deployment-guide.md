# Production Deployment Guide (pnpm)

## Production Scripts Overview

### Available Production Commands

```bash
# Basic production build and run
pnpm run prod

# Production with PM2 process manager
pnpm run prod:pm2

# Production with Docker
pnpm run prod:docker

# Build only (production optimized)
pnpm run build:prod

# Start built application
pnpm run start
```

## Deployment Methods

### 1. Direct Node.js Deployment

```bash
# Build and run directly
pnpm run prod
```

### 2. PM2 Process Manager (Recommended for VPS/Dedicated Servers)

```bash
# Install PM2 globally
pnpm add -g pm2

# Build and start with PM2
pnpm run prod:pm2

# PM2 management commands
pm2 list                          # List all processes
pm2 stop shared-media-streaming-backend   # Stop app
pm2 restart shared-media-streaming-backend # Restart app
pm2 logs shared-media-streaming-backend   # View logs
pm2 monit                         # Monitor processes
```

### 3. Docker Deployment

#### Single Container

```bash
# Build and run with Docker
pnpm run prod:docker

# Or manually
docker build -t shared-media-streaming-backend .
docker run -p 3000:3000 --env-file .env.production shared-media-streaming-backend
```

#### Docker Compose (Full Stack)

```bash
# Start full production stack
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.prod.yml down
```

## Environment Setup

### 1. Configure Production Environment

Create `.env.production` with your production settings:

```bash
# Database Configuration
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/shared-media-streaming?retryWrites=true&w=majority

# Environment
NODE_ENV=production

# Server Configuration
PORT=3000
```

### 2. MongoDB Setup Options

#### Option A: MongoDB Atlas (Cloud)

1. Create cluster at https://cloud.mongodb.com/
2. Get connection string
3. Update `MONGO_URI` in `.env.production`

#### Option B: Self-hosted MongoDB

```bash
# Install MongoDB
sudo apt install mongodb-server

# Start MongoDB service
sudo systemctl start mongod
sudo systemctl enable mongod

# Use local connection string
MONGO_URI=mongodb://localhost:27017/shared-media-streaming
```

## Server Setup (Ubuntu/Debian)

### 1. Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm
curl -fsSL https://get.pnpm.io/install.sh | sh -
source ~/.bashrc

# Or via npm
npm install -g pnpm

# Enable corepack (Node.js 16.13+)
corepack enable
corepack prepare pnpm@latest --activate

# Install PM2 globally with pnpm
pnpm add -g pm2

# Install Docker (optional)
sudo apt install docker.io docker-compose
sudo usermod -aG docker $USER
```

### 2. Deploy Application

```bash
# Clone repository
git clone <your-repo-url>
cd shared-media-streaming

# Install dependencies (from root for monorepo)
pnpm install

# Navigate to backend
cd apps/backend

# Set up environment
cp .env.example .env.production
# Edit .env.production with your settings

# Deploy with PM2
pnpm run prod:pm2

# Set up PM2 startup
pm2 startup
pm2 save
```

### 3. Nginx Reverse Proxy (Optional)

```bash
# Install Nginx
sudo apt install nginx

# Create site configuration
sudo nano /etc/nginx/sites-available/shared-media-streaming

# Add configuration:
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/shared-media-streaming /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## pnpm-Specific Configuration

### 1. Workspace Setup

Since you're using a monorepo with pnpm workspaces, ensure your root `pnpm-workspace.yaml` is configured:

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### 2. Production Build from Root

```bash
# From project root, build all apps
pnpm run build

# Build specific backend
pnpm --filter backend run build:prod

# Run production for backend only
pnpm --filter backend run prod
```

### 3. Environment Variables in Workspace

You can also set environment variables at the workspace level:

```bash
# From project root
NODE_ENV=production pnpm --filter backend run start
```

## Monitoring and Logs

### PM2 Monitoring

```bash
pm2 monit                     # Real-time monitoring
pm2 logs                      # View all logs
pm2 logs --lines 200          # Last 200 lines
pm2 flush                     # Clear logs
```

### Docker Monitoring

```bash
docker logs shared-media-streaming-backend -f    # Follow logs
docker stats                                     # Resource usage
```

## Health Checks

The application includes health check endpoints:

- **HTTP Health Check**: `GET http://localhost:3000/`
- **Docker Health Check**: Built-in container health monitoring

## pnpm Performance Benefits

### Faster Installs

```bash
# pnpm is significantly faster than npm
pnpm install                    # Fast install
pnpm install --frozen-lockfile  # Production install (no lockfile changes)
```

### Disk Space Savings

- pnpm uses hard links to save disk space
- Shared dependencies across projects in monorepo

### Better Dependency Management

```bash
# List dependencies
pnpm list

# Audit dependencies
pnpm audit

# Update dependencies
pnpm update
```

## Production Commands Summary

### Development

```bash
pnpm run dev           # Start development server
pnpm run dev:local     # Start with explicit local env
```

### Building

```bash
pnpm run clean         # Clean dist folder
pnpm run build         # Build for development
pnpm run build:prod    # Build for production
```

### Production

```bash
pnpm run start         # Start production server
pnpm run prod          # Build and start production
pnpm run prod:pm2      # Build and start with PM2
pnpm run prod:docker   # Build and run with Docker
```

### Workspace Commands (from root)

```bash
# Install all dependencies
pnpm install

# Build all apps
pnpm run build

# Run backend in production
pnpm --filter backend run prod

# Install dependency for backend only
pnpm --filter backend add express

# Run script in all workspaces
pnpm -r run build
```

## Troubleshooting pnpm Issues

### Common pnpm Issues

1. **pnpm not found**:

   ```bash
   # Install pnpm
   npm install -g pnpm
   # Or use corepack
   corepack enable
   ```

2. **Lockfile issues**:

   ```bash
   # Remove lockfile and reinstall
   rm pnpm-lock.yaml
   pnpm install
   ```

3. **Permission issues**:

   ```bash
   # Fix pnpm global directory permissions
   mkdir -p ~/.pnpm
   pnpm config set store-dir ~/.pnpm
   ```

4. **Workspace issues**:
   ```bash
   # Verify workspace configuration
   pnpm list --depth=0
   pnpm why <package-name>
   ```

### Performance Tips

1. **Use frozen lockfile in production**:

   ```bash
   pnpm install --frozen-lockfile
   ```

2. **Enable shamefully-hoist for compatibility**:

   ```bash
   echo "shamefully-hoist=true" >> .npmrc
   ```

3. **Use production flag**:
   ```bash
   pnpm install --prod
   ```

## Security Checklist

- [ ] Use HTTPS/SSL certificates
- [ ] Set secure environment variables
- [ ] Configure firewall (UFW)
- [ ] Regular security updates with `pnpm audit`
- [ ] Database authentication enabled
- [ ] Rate limiting implemented
- [ ] Input validation in place
- [ ] Use `pnpm audit` regularly for vulnerability checks
- [ ] HSTS
