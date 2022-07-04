module.exports = {
  apps: [
    {
      name: 'Senatebot',
      script: './src/index.js',
      max_restarts: 20,
      restart_delay: 5000,
      autorestart: true,
      env_production: {
        NODE_ENV: 'production',
      },
      node_args: '-r dotenv/config',
      interpreter: '/home/vq/.nvm/versions/node/v17.8.0/bin/node',
    },
  ],
};
