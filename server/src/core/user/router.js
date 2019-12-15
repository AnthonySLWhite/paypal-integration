import { Router } from 'express';
import multer from 'multer';
import { Secured, ValidateID } from '../../middleware';
import {
    createUser,
    deleteUser,
    editUser,
    getAllUsers,
    getOwnUser,
    getUser,
    loginUser,
    logoutAllUser,
    logoutUser,
    getAvatar,
    uploadAvatar,
    deleteAvatar,
} from './controller';

const router = Router();

const upload = multer({
    limits: {
        fileSize: 1000 * 1000, // bytes to megabytes
    },
    fileFilter(req, file, cb) {
        const regFilter = /\.(png|jpg|jpeg)$/;
        if (!file.originalname.match(regFilter)) {
            cb(
                Error(
                    `Please upload an image with a valid type!`,
                ),
            );
        }

        return cb(undefined, true);
    },
});

// GET
router.get('/', Secured, getAllUsers);
router.get('/me', Secured, getOwnUser);
router.get('/:id', ValidateID, getUser);
router.get('/:id/avatar', ValidateID, getAvatar);

// POST
router.post('/', createUser);
router.post('/login', loginUser);
router.post('/logout', Secured, logoutUser);
router.post('/logoutAll', Secured, logoutAllUser);

router.post(
    '/me/avatar',
    Secured,
    upload.single('upload'),
    uploadAvatar,
);

// DELETE
router.delete('/me', Secured, deleteUser);
router.delete('/me/avatar', Secured, deleteAvatar);

// PATCH
router.patch('/me', Secured, editUser);

export default router;
