import { ObjectID } from 'mongodb';

export function ValidateID(req, res, next) {
  const { id } = req.params;
  if (!ObjectID.isValid(id)) {
    return res.status(400).send({
      error: 'Provided ID is invalid!',
    });
  }
  next();
}
