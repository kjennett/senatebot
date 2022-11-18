module.exports = {
  apps: [
    {
      name: 'Senatebot',
      script: './src/bot.js',
      max_restarts: 20,
      restart_delay: 5000,
      autorestart: true,
      env: {
        NODE_ENV: 'production',
      },
      node_args: '-r dotenv/config',
      interpreter: '/home/vq/.nvm/versions/node/v17.8.0/bin/node',
    },
  ],
};
