import { Router } from 'express';
import { generateImport } from './utils';
import { ErrorHandler } from '../middleware/error';
const router = Router();

// Own Routes
router.get('/', (req, res) => {
    res.send('There is an API here!').status(200);
});

// - Attach routes
// Users
// router.use('/users', getRouter('user'));

// Post MIDDLEWARE
router.use(ErrorHandler);

// MISC
export default router;

function getRouter(name) {
    return generateImport('../core/', '/router.js')(name);
}
