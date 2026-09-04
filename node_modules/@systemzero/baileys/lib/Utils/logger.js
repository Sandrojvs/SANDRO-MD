import P from 'pino';
const logger = P({ timestamp: () => `,"time":"${new Date().toJSON()}"` });
export const errorLog = (msg) => logger.error(msg);
export const warningLog = (msg) => logger.warn(msg);
export default logger;
//# sourceMappingURL=logger.js.map