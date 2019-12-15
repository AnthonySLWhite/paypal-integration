import { Schema, model } from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { SESSION_SECRET } from '../../configs';
import { Task } from '../tasks/model';

const userSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
            trim: true,
            minlength: 6,
        },
        email: {
            type: Schema.Types.String,
            trim: true,
            lowercase: true,
            unique: true,
            required: true,
            validate(value) {
                if (!validator.isEmail(value))
                    throw Error('Email is invalid');
            },
        },
        age: {
            type: Number,
            default: 0,
            validate(value) {
                if (value < 0)
                    throw Error('Age must be positive');
            },
        },
        avatar: {
            type: String,
        },
        tokens: [
            {
                type: String,
                required: true,
            },
        ],
    },
    {
        timestamps: true,
    },
);

userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner',
});

userSchema.methods.generateAuthToken = generateAuthToken;
userSchema.methods.toJSON = toJSON;

userSchema.statics.findByCredentials = findByCredentials;

userSchema.pre('remove', deleteUserTasks);
userSchema.pre('save', hashPassword);
userSchema.pre('findOneAndUpdate', hashPassword);

async function generateAuthToken() {
    const user = this;
    const token = jwt.sign(
        { _id: user._id.toString() },
        SESSION_SECRET,
        { expiresIn: '7 days' },
    );

    user.tokens = user.tokens.concat(token);
    await user.save();

    return token;
}

function toJSON() {
    const user = this;
    const userData = user.toObject();

    delete userData.tokens;
    delete userData.__v;
    delete userData.password;
    delete userData.avatar;

    return userData;
}

async function findByCredentials(email, password) {
    const user = await User.findOne({ email });

    if (!user) return false;

    const isMatch = await bcrypt.compare(
        password,
        user.password,
    );

    return isMatch ? user : false;
}

async function hashPassword(next) {
    const user = this;

    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8);
    }

    next();
}

async function deleteUserTasks(next) {
    const user = this;
    await Task.deleteMany({ owner: user._id });
    next();
}

export const User = model('User', userSchema);
