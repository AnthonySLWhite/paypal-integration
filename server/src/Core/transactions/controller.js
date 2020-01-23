import { Router } from 'express';

import { Secured } from 'Middleware';
// import { userAuth } from './controller';

const router = Router();

router.get('/', Secured, (req, res) => {
  res.send(req.user);
});

router.post('/');

/** @param {Router} handler */
export default handler => handler.use('/transactions', router);
