module.exports = {
  apps: [
    {
      name: 'thegridracing',
      script: 'dist/index.js',
      // Wichtig: Discord Bot Gateway Verbindungen dürfen nicht dupliziert werden,
      // daher ist fork-Mode mit 1 Instanz der empfohlene Best-Practice-Standard.
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'development',
        PORT: 8422,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 8422,
      },
      // Logging
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],
};

