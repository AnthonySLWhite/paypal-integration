import { Router } from 'express';
const router = Router();

import ApiRouter from './api';

router.use('/api', ApiRouter);

export default router;
