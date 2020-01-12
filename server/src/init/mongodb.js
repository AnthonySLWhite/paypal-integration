import { MONGO_DB_URL } from 'Constants/configs';

import mongoose from 'mongoose';

mongoose.connect(MONGO_DB_URL, {
    useNewUrlParser: true,
    useFindAndModify: false,
    useCreateIndex: true,
});
