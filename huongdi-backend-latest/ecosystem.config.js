const fs = require('fs');
const dotenv = require('dotenv');
const envConfig = dotenv.parse(fs.readFileSync('/var/www/huongdi/backend/.env', 'utf8'));

module.exports = {
  apps: [{
    name: 'huongdi-api',
    script: 'dist/index.js',
    cwd: '/var/www/huongdi/backend',
    instances: 1,
    exec_mode: 'fork',
    env: Object.assign({}, envConfig, {
      NODE_ENV: 'production',
      PORT: '4001',
    }),
    max_memory_restart: '500M',
    error_file: '/var/log/pm2/huongdi-api-error.log',
    out_file: '/var/log/pm2/huongdi-api-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    restart_delay: 3000,
    max_restarts: 10,
    watch: false,
  }],
};
