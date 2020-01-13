import { Router } from 'express';
import httpCodes from "http-status-codes";

import { ErrorHandler } from 'Middleware/error';
import User from 'Core/user/router';
import Transactions from 'Core/transactions/router';

// API ROUTER
const apiRouter = Router();
apiRouter.use('/users', User);
apiRouter.use('/transactions', Transactions);

// Main Router
const rootRouter = Router();
rootRouter.use('/api', apiRouter);
rootRouter.get('/', (req, res) => {
  res.sendStatus(httpCodes.IM_A_TEAPOT);
});
rootRouter.use(ErrorHandler);

// MISC
export default rootRouter;
