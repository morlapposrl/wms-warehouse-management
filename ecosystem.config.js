// Configurazione PM2 per Gestionale Magazzino
module.exports = {
  apps: [{
    name: 'gestionale-magazzino',
    script: 'npm',
    args: 'start',
    cwd: '/root/warehouse/gestionale-magazzino',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3002
    },
    error_file: '/root/warehouse/logs/gestionale-magazzino-error.log',
    out_file: '/root/warehouse/logs/gestionale-magazzino-out.log',
    log_file: '/root/warehouse/logs/gestionale-magazzino.log',
    time: true,
    merge_logs: true
  }]
};