// ==============================================================================
// PM2 Process Manager Configuration for NV Cyclothon Backend
// Enables clustering, automatic zero-downtime reloads, and memory guardrails
// ==============================================================================

module.exports = {
  apps: [
    {
      name: "nvcyclothon-api",
      script: "src/server.js",
      cwd: "/var/www/nv_cyclothon/backend",
      instances: 2, // 2 cluster workers balance CPU cores nicely on VPS without starving Postgres
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: "450M", // Automatically restarts a worker if memory leaks exceed 450 MB
      exp_backoff_restart_delay: 100,
      env: {
        NODE_ENV: "production",
        ENVIRONMENT: "production",
        PORT: 8000,
      },
      error_file: "/var/log/nv_cyclothon/api-err.log",
      out_file: "/var/log/nv_cyclothon/api-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
    },
  ],
};
