// ============================================================================
// Johnson Bros Plumbing - PM2 Ecosystem Configuration
// Production process management with clustering and auto-restart
// ============================================================================

module.exports = {
  apps: [
    {
      // Main Application
      name: 'johnsonbros',
      script: 'dist/index.js',
      cwd: '/var/www/johnsonbros/current',

      // Clustering
      instances: 'max', // Use all available CPUs
      exec_mode: 'cluster',

      // Auto-restart configuration
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',

      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,

      // Environment
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },

      // Environment file
      env_file: '.env.production',

      // Logging
      error_file: '/var/log/johnsonbros/error.log',
      out_file: '/var/log/johnsonbros/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // Restart delay
      restart_delay: 4000,
      exp_backoff_restart_delay: 100,

      // Process management
      min_uptime: 5000,
      max_restarts: 10,

      // Node.js specific
      node_args: [
        '--max-old-space-size=1024',
        '--optimize-for-size',
      ],

      // Source maps for error tracking
      source_map_support: true,

      // Instance variable for cluster identification
      instance_var: 'INSTANCE_ID',
    },

    // MCP Server (optional - uncomment if running separately)
    // {
    //   name: 'johnsonbros-mcp',
    //   script: 'dist/mcp-http-server.js',
    //   cwd: '/var/www/johnsonbros/current',
    //   instances: 1,
    //   exec_mode: 'fork',
    //   autorestart: true,
    //   watch: false,
    //   max_memory_restart: '512M',
    //   env: {
    //     NODE_ENV: 'production',
    //     MCP_PORT: 3001,
    //   },
    //   env_file: '.env.production',
    //   error_file: '/var/log/johnsonbros/mcp-error.log',
    //   out_file: '/var/log/johnsonbros/mcp-out.log',
    //   log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    //   merge_logs: true,
    // },
  ],

  // Deployment configuration (for pm2 deploy)
  deploy: {
    production: {
      user: 'deploy',
      host: ['production-server.com'],
      ref: 'origin/main',
      repo: 'git@github.com:JohnsonBros/JohnsonBros.com.git',
      path: '/var/www/johnsonbros',
      'pre-deploy-local': '',
      'post-deploy': 'npm ci --only=production && npm run db:push && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      env: {
        NODE_ENV: 'production',
      },
    },

    staging: {
      user: 'deploy',
      host: ['staging-server.com'],
      ref: 'origin/develop',
      repo: 'git@github.com:JohnsonBros/JohnsonBros.com.git',
      path: '/var/www/johnsonbros-staging',
      'post-deploy': 'npm ci && npm run db:push && pm2 reload ecosystem.config.js --env staging',
      env: {
        NODE_ENV: 'staging',
      },
    },
  },
};
