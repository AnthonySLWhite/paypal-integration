import { Router } from 'express';

import { PAYPAL_ID, PAYPAL_PROD, REDIRECT_URI } from 'Constants/configs';

// import { Secured, ValidateID } from 'Middleware';
import { userAuth } from './services';

const router = Router();


router.get('/', (req, res) => {
  res.send({
    link: `https://www.${PAYPAL_PROD ? '' : 'sandbox.'}paypal.com/connect?flowEntry=static&client_id=${PAYPAL_ID}&scope=openid&redirect_uri=${REDIRECT_URI}`,
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
