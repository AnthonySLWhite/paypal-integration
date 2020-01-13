/**
 * @param {import('Utils/errors').ServerError} err
 * @param {import('express').Response} res
 */
export function ErrorHandler(err, req, res, next) {
  try {
    console.log('here');

    if (!(err || {}).customError) {
      throw Error();
    }
    const { message, statusCode } = err;
    return res.status(statusCode).send({ message });
  } catch (error) {
    res.status(500).send({
      error: 'Unexpected server error!',
    });
  }
}
