const winston = require('winston');

exports.log = winston.createLogger({
  level: 'info',
  transports: [
    new winston.transports.File({
      filename: 'logs/all.log',
      format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
      level: 'info',
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
      level: 'error',
    }),
    new winston.transports.Console({
      level: 'info',
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
  ],
});
