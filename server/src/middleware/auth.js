import jwt from 'jsonwebtoken';
import { SESSION_SECRET } from '../configs';
import { User } from '../core/user/model';

export async function Secured(req, res, next) {
    try {
        const token = req
            .header('Authorization')
            .replace('Bearer ', '');

        const decoded = jwt.verify(token, SESSION_SECRET);

        const user = await User.findOne({
            _id: decoded._id,
            tokens: token,
        });

        if (!user) throw 'User does not exist!';

        req.user = user;
        req.token = token;
        next();
    } catch (err) {
        res.status(401).send({
            error: 'Invalid token provided!',
        });
    }
}
