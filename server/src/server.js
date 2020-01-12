import express from 'express';
import cors from 'cors';

import routes from 'Routes';
import { PORT } from 'Constants/configs';

const app = express();
app.use(cors());
app.use(express.json());

app.use(routes);

app.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});
