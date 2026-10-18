module.exports = {
  apps: [
    {
      name: 'pages',
      cwd: __dirname,
      script: 'dist-server/server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
      max_memory_restart: '512M',
      time: true,
    },
  ],
}
