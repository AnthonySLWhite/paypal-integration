import fs, { unlink } from 'fs';
import { promisify } from 'util';

export const deleteFile = promisify(unlink);

export const readFile = promisify(fs.readFile);
