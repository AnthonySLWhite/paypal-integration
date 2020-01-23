import { Router } from 'express';
import httpCodes from 'http-status-codes';

import { ErrorHandler } from 'Middleware/error';
import User from 'Core/user/controller';
import Transactions from 'Core/transactions/controller';

// API ROUTER
const apiRouter = Router();
User(apiRouter);
Transactions(apiRouter);

// Main Router
const rootRouter = Router();
rootRouter.use('/api', apiRouter);
rootRouter.get('/', (req, res) => {
  res.sendStatus(httpCodes.IM_A_TEAPOT);
});
rootRouter.use(ErrorHandler);

// MISC
export default rootRouter;
