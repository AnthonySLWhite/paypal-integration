import { Router } from 'express';

import { PAYPAL_ID } from 'Constants/configs';

// import { Secured, ValidateID } from 'Middleware';
import { userAuth } from './controller';

const router = Router();

router
  .route('/')
  .get((req, res) => {
    res.send({
      link: `https://www.sandbox.paypal.com/connect?flowEntry=static&client_id=${PAYPAL_ID}&scope=openid%20email&redirect_uri=http%3A%2F%2F127.0.0.1:3000%2Fpaypal-return`,
    });
  })
  .post(userAuth);
export default router;
