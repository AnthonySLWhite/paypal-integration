import { Router } from 'express';
import { ErrorHandler } from 'Middleware/error';
import User from 'Core/user/router';

const router = Router();

// Own Routes
router.get('/', (req, res) => {
  res.send('There is an API here!').status(200);
});

// - Attach routes
// Users
router.use('/user', User);

// Post MIDDLEWARE
router.use(ErrorHandler);

// MISC
export default router;
