/**
 * @param {import('Utils/errors').ApiErrorSchema} err
 * @param {import('express').Response} res
 */
export function ErrorHandler(err, req, res, next) {
  try {
    if (err && err.isCustomError) {
      /** @type {import('Utils/errors').ApiErrorSchema} */
      const {
        errorCode, httpCode, message, description, serverError,
      } = err;

      const toSend = {
        message,
        errorCode,
      };
      if (description) toSend.description = description;
      if (serverError) console.error(serverError);
      return res.status(httpCode).send(toSend);
    }
    throw Error();
  } catch (error) {
    res.status(500).send({
      error: 'Unexpected server error!',
    });
  }
}
