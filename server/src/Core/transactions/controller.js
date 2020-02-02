import { Router } from 'express';

import { Secured } from 'Middleware';
import { getTransactions } from './services';
// import { userAuth } from './controller';

const router = Router();

router.get('/', Secured, async (req, res, next) => {
  console.log(req.user);
  const { userId } = req.user;
  const [error, data] = await getTransactions(userId);

  if (error) return next(data);
  res.send(data);
});

router.post('/');

/** @param {Router} handler */
export default handler => handler.use('/transactions', router);
