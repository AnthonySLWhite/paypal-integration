import httpCode from 'http-status-codes';
/**
 * @typedef ServerError
 * @property {string} message
 * @property {number} statusCode
 * @property {boolean} [customError]
 */
/**
 * @param {object} error
 * @param {string} error.message
 * @param {number} error.statusCode
 * @returns {ServerError}
 * */
export function handleError(error) {
  return {
    ...error,
    customError: true,
  };
}
export { httpCode };
