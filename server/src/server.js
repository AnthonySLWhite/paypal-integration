import express from 'express';
import path from 'path';

import { PORT } from './configs';
import routes from "./routes/main";

const app = express();
app.use(express.json());


// Serve the static files from the React app
app.use(express.static(path.join(__dirname, 'client/build')));

app.use(routes);

// Turn on that server!
app.listen(PORT, () => {
    console.log(`Server running on port: ${PORT}`);
});
