module.exports = {
  apps: [
    {
      name: 'shared-media-streaming-backend',
      script: './dist/index.js',
      instances: 'max', // Use all available CPU cores
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      // Logging
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Auto restart configuration
      max_memory_restart: '1G',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Health monitoring
      kill_timeout: 5000,
      listen_timeout: 3000,
      
      // Source map support for better error tracking
      source_map_support: true,
      
      // Auto restart when file changes (disable in production)
      watch: false,
      ignore_watch: ['node_modules', 'logs']
    }
  ],

  deploy: {
    production: {
      user: 'node',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'git@github.com:username/shared-media-streaming.git',
      path: '/var/www/production',
      'post-deploy': 'pnpm install && pnpm run build:prod && pm2 reload ecosystem.config.js --env production'
    }
  }
};
