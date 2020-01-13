import babel from 'rollup-plugin-babel';
import filesize from 'rollup-plugin-filesize';
import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import replace from 'rollup-plugin-replace';
import copy from 'rollup-plugin-copy-glob';
import serve from 'rollup-plugin-serve';
import url from '@rollup/plugin-url';
import livereload from 'rollup-plugin-livereload';
import includePaths from 'rollup-plugin-includepaths';
import del from 'rollup-plugin-delete';
import { terser } from 'rollup-plugin-terser';

const pkg = require('./package.json');

const external = Object.keys(pkg.dependencies);

const isProd = (process.env.NODE_ENV || '').toLowerCase().includes('prod');

const devFolder = '.cache/';
const buildFolder = 'build/';

const configs = [
  {
    basePath: '',
    isBrowser: false,
  },
];

export default configs.map(({ basePath, isBrowser }) => {
  const activeFolder = `${basePath}${isProd ? buildFolder : devFolder}`;
  return {
    input: `${basePath}src/app.js`,
    external: isBrowser ? null : external,
    output: [
      {
        esModule: false,
        dir: activeFolder,
        // format: isBrowser ? 'iife' : 'cjs',
        format: isBrowser ? 'iife' : 'umd',
        sourcemap: isProd ? false : 'inline',
      },
    ],
    plugins: [
      del({ targets: `${activeFolder}/*` }),
      copy(
        [
          {
            files: 'public/**/*',
            dest: `${activeFolder}/`,
          },
        ],
        {
          verbose: true,
          watch: true,
        },
      ),
      includePaths({
        paths: ['src'],
      }),
      nodeResolve({}),
      json(),
      url({}),
      commonjs({
        include: isBrowser ? ['node_modules/**'] : [],
        // include: isBrowser ? ['node_modules/**'] : [],
        // exclude: ['node_modules/process-es6/**'],
      }),
      babel({
        babelrc: false,
        runtimeHelpers: true,
        plugins: [
          '@babel/plugin-proposal-class-properties',
          [
            '@babel/plugin-transform-runtime',
            {
              regenerator: true,
            },
          ],
        ],
        presets: [
          [
            '@babel/preset-env',
            {
              modules: false,
              targets: isBrowser
                ? 'last 2 versions, > 5%, safari tp'
                : 'node 10',
            },
          ],
          '@babel/preset-react',
        ],
      }),
      filesize(),

      ...(isBrowser ? [replace({ 'process.env': process.env })] : []),

      ...(isProd ? [terser()] : []),

      ...(isBrowser && !isProd
        ? [
            serve({
              open: true,
              verbose: false,
              contentBase: activeFolder,
              historyApiFallback: true,
              host: 'localhost',
              port: 3000,
            }),
            livereload({
              watch: activeFolder,
            }),
          ]
        : []),
    ],
  };
});
