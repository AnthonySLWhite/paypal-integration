/**
 * @typedef {object} ApiErrorSchema
 * @property {boolean} isCustomError
 * @property {Number} httpCode
 * @property {Number} errorCode
 * @property {String} message
 * @property {any} [description]
 * @property {any} [serverError]
 */

let order = 1;
const separator = 1000;

/** Order Maters */
export function ApiErrorGenerator() {
  let localCode = order;
  order += separator;

  /**
   * @param {Number} httpCode
   * @param {String} message
   */
  function ApiError(httpCode, message) {
    const errorCode = localCode;
    localCode++;

    /** @param {any} [description]
     * @param {any} [serverError] */
    return (description, serverError) => ({
      isCustomError: true,
      errorCode,
      httpCode,
      message,
      description: description || null,
      serverError: serverError || null,
    });
  }
  return ApiError;
}
