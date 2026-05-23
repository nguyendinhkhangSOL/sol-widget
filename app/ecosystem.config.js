/**
 * PM2 ecosystem config — Sol Widget
 * Deploy: pm2 start ecosystem.config.js --env production
 */

module.exports = {
  apps: [
    {
      name: 'sol-widget',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      cwd: '/var/www/sol-widget',
      instances: 1,                    // 2GB RAM, để 1 instance đủ
      exec_mode: 'fork',               // fork mode đơn giản
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',      // restart nếu chiếm > 500MB
      min_uptime: '10s',
      max_restarts: 10,
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/pm2/sol-widget-error.log',
      out_file: '/var/log/pm2/sol-widget-out.log',
      log_file: '/var/log/pm2/sol-widget-combined.log',
      time: true,
      merge_logs: true
    }
  ]
};
