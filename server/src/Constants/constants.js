import { join, resolve } from 'path';

// GLOBALS
export const PATH_ROOT = resolve(`${__dirname}/../`);
export const PATH_PUBLIC = resolve(`${PATH_ROOT}/Public/`);

// PARTIALS
export const PATH_PUBLIC_AVATARS = join(
  PATH_PUBLIC,
  '/Avatars/',
);

export const FOLDERS_TO_GENERATE = [PATH_PUBLIC_AVATARS];
