import sharp from 'sharp';
import uuid from 'uuid/v4';
import { PATH_PUBLIC_AVATARS } from '../../configs';
import { deleteFile, readFile } from '../../utils';
import { User } from './model';

export async function getAllUsers(req, res) {
    try {
        const users = await User.find();
        if (!users) res.status(404);
        res.send(users);
    } catch (err) {
        res.status(500).send(err);
    }
}

export async function getOwnUser(req, res) {
    res.send(req.user);
}

export async function getUser(req, res) {
    const { id } = req.params;

    try {
        const user = await User.findById(id);
        if (!user) res.status(404);
        res.send(user);
    } catch (err) {
        res.status(500).send(err);
    }
}

export async function createUser(req, res) {
    const { body } = req;
    const user = new User(body);

    try {
        await user.save();

        const token = await user.generateAuthToken();
        res.send({ user, token });
    } catch (err) {
        res.status(400).send(err);
    }
}

export async function deleteUser(req, res) {
    try {
        const { user } = req;
        await user.remove();

        res.send(user);
    } catch (err) {
        console.log(err);

        res.status(500).send();
    }
}

export async function editUser(req, res) {
    const { body, user } = req;

    try {
        const userData = await User.findById(user._id);

        if (!userData) return res.status(404).send();

        // Write new props
        Object.assign(userData, body);

        await userData.save();

        res.send(userData);
    } catch (err) {
        res.status(400).send(err);
    }
}

export async function loginUser(req, res) {
    const { email, password } = req.body;
    try {
        const user = await User.findByCredentials(
            email,
            password,
        );

        if (!user) {
            return res.status(400).send();
        }

        const token = await user.generateAuthToken();
        // const profile = await user.getPublicProfile();

        res.send({ user, token });
    } catch (err) {
        res.status(500).send(err);
        console.log(err);
    }
}

export async function logoutUser(req, res) {
    try {
        const { tokens } = req.user;
        req.user.tokens = tokens.filter(
            token => token !== req.token,
        );

        await req.user.save();
        res.send();
    } catch (err) {
        res.status(500).send();
    }
}

export async function logoutAllUser(req, res) {
    try {
        const { user } = req;
        user.tokens = [];
        await user.save();
        res.send(user);
    } catch (err) {
        res.status(500).send();
    }
}
export async function getAvatar(req, res) {
    try {
        const { params } = req;
        const user = await User.findById(params.id);

        if (!user || !user.avatar) {
            return res.status(404).send();
        }

        await res.sendFile(PATH_PUBLIC_AVATARS + user.avatar);
    } catch (error) {
        res.status(500).send();
        console.log(error);
    }
}
export async function uploadAvatar(req, res) {
    try {
        const { file, user } = req;

        const filename = `${uuid()}.jpeg`;

        await sharp(file.buffer)
            .resize(250, 250)
            .jpeg()
            .toFile(PATH_PUBLIC_AVATARS + filename);

        if (user.avatar) {
            deleteFile(PATH_PUBLIC_AVATARS + user.avatar); // Delete old avatar
        }
        user.avatar = filename;

        await user.save();

        res.send();
    } catch (error) {
        console.log(error);
        res.status(500).send();
    }
}
export async function deleteAvatar(req, res) {
    const { user } = req;
    if (!user.avatar) return res.status(404).send();

    deleteFile(PATH_PUBLIC_AVATARS + user.avatar); // Delete Avatar

    user.avatar = undefined;
    await user.save();
    return res.send();
}
