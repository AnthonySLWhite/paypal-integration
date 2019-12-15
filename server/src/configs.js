import dotenv from 'dotenv';
dotenv.config();

const {
    PORT = 8080,
    MONGO_DB_URL,
    SESSION_SECRET,
    EMAIL_USER,
    EMAIL_PASS,
} = process.env;

// EXPORTS
export {
    PORT,
    MONGO_DB_URL,
    SESSION_SECRET,
    EMAIL_USER,
    EMAIL_PASS,
};
export * from './constants';
