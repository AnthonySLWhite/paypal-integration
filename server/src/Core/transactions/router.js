import { Router } from 'express';

import { PAYPAL_ID } from 'Constants/configs';

import { Secured } from 'Middleware';
// import { userAuth } from './controller';

const router = Router();

router
  .route('/')
  .get(Secured, (req, res) => res.send(req.user))
  .post();
export default router;
