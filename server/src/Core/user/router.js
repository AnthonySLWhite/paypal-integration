import { Router } from 'express';

import { PAYPAL_ID } from 'Constants/configs';

import { getPaypalToken, getPaypalUserInfo } from './operations';
// import jwt from 'jsonwebtoken';

// // import multer from 'multer';
// import { Secured, ValidateID } from 'Middleware';
// import { getToken } from './controller';

const router = Router();

router
  .route('/')
  .get((req, res) => {
    res.send({
      link: `https://www.sandbox.paypal.com/connect?flowEntry=static&client_id=${PAYPAL_ID}&scope=openid%20email&redirect_uri=http%3A%2F%2F127.0.0.1:3000%2Fpaypal-return`,
    });
  })
  .post(async (req, res) => {
    const { code } = req.body;
    console.log(code);
    // debugger;
    const data = await getPaypalToken({ initialCode: code });
    // console.timeLog('Request');
    if (!data) return res.status(400).send();
    const info = await getPaypalUserInfo(data.access_token);

    res.status(200).send({ data, info });
  });
export default router;
