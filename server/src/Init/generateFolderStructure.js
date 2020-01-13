import { FOLDERS_TO_GENERATE } from 'Constants/configs';
import { mkdirSync } from 'fs';
FOLDERS_TO_GENERATE.forEach(async folder => {
  mkdirSync(folder, { recursive: true });
});
