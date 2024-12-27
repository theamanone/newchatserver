module.exports = {
  apps: [{
    name: 'websocket-server',
    script: 'socket.js',
    instances: 'max',
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '8G',
    node_args: '--max-old-space-size=8192',
    exp_backoff_restart_delay: 100,
    env: {
      NODE_ENV: 'production',
      WS_PORT: 9000
    },
    error_file: 'logs/err.log',
    out_file: 'logs/out.log',
    merge_logs: true,
    time: true
  }]
};
