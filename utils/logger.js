const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logsDir = path.join(__dirname, '../logs');
    this.ensureLogsDir();
  }

  ensureLogsDir() {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir);
    }
  }

  formatMessage(level, message) {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] ${message}\n`;
  }

  writeToFile(filename, message) {
    const filePath = path.join(this.logsDir, filename);
    fs.appendFileSync(filePath, message);
  }

  info(message) {
    const formattedMessage = this.formatMessage('INFO', message);
    console.log(formattedMessage);
    this.writeToFile('info.log', formattedMessage);
  }

  error(message) {
    const formattedMessage = this.formatMessage('ERROR', message);
    console.error(formattedMessage);
    this.writeToFile('error.log', formattedMessage);
  }

  warn(message) {
    const formattedMessage = this.formatMessage('WARN', message);
    console.warn(formattedMessage);
    this.writeToFile('warn.log', formattedMessage);
  }

  debug(message) {
    if (process.env.NODE_ENV === 'development') {
      const formattedMessage = this.formatMessage('DEBUG', message);
      console.log(formattedMessage);
      this.writeToFile('debug.log', formattedMessage);
    }
  }
}

module.exports = new Logger();