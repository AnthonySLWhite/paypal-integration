import { Router } from 'express';

import { PAYPAL_ID } from 'Constants/configs';

// import { Secured, ValidateID } from 'Middleware';
import { userAuth } from './services';

const router = Router();


router.get('/', (req, res) => {
  res.send({
    link: `https://www.sandbox.paypal.com/connect?flowEntry=static&client_id=${PAYPAL_ID}&scope=openid%20email&redirect_uri=http%3A%2F%2F127.0.0.1:3000%2Fpaypal-return`,
  });
});

router.post('/', async (req, res, next) => {
  const { code } = req.body;
  const [error, data] = await userAuth(code);
  if (error) return next(data);
  return res.send(data);
});


/** @param {Router} handler */
export default handler => handler.use('/users', router);
