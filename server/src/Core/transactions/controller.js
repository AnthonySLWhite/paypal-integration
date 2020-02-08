import { Router } from 'express';

import httpStatus from 'http-status-codes';
import { Secured } from 'Middleware';
import { InvalidError } from 'Constants/errors';
import { getTransactions, addTransactions } from './services';
// import { userAuth } from './controller';

const router = Router();

router.get('/', Secured, async (req, res, next) => {
  console.log(req.user);
  const { userId } = req.user;
  const [error, data] = await getTransactions(userId);

  if (error) return next(data);
  res.send(data);
});

router.post('/', Secured, async (req, res, next) => {
  const { body, user } = req;
  if (!body || !body.length) return next(InvalidError.schema('No transactions sent'));
  const { userId } = user;
  const [error, data] = await addTransactions(userId, body);
  if (error) return next(data);
  return res.status(httpStatus.CREATED).send();
});

/** @param {Router} handler */
export default handler => handler.use('/transactions', router);
