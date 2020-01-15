(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('knex'), require('dotenv'), require('path'), require('express'), require('cors'), require('http-status-codes'), require('jsonwebtoken'), require('fs'), require('util'), require('querystring'), require('axios'), require('@hapi/joi')) :
    typeof define === 'function' && define.amd ? define(['knex', 'dotenv', 'path', 'express', 'cors', 'http-status-codes', 'jsonwebtoken', 'fs', 'util', 'querystring', 'axios', '@hapi/joi'], factory) :
    (global = global || self, factory(global.knex, global.dotenv, global.path, global.express, global.cors, global.httpCode, global.jwt, global.fs, global.util, global.queryString, global.axios, global.Joi));
}(this, (function (knex, dotenv, path, express, cors, httpCode, jwt, fs, util, queryString, axios, Joi) { 'use strict';

    knex = knex && knex.hasOwnProperty('default') ? knex['default'] : knex;
    dotenv = dotenv && dotenv.hasOwnProperty('default') ? dotenv['default'] : dotenv;
    var express__default = 'default' in express ? express['default'] : express;
    cors = cors && cors.hasOwnProperty('default') ? cors['default'] : cors;
    httpCode = httpCode && httpCode.hasOwnProperty('default') ? httpCode['default'] : httpCode;
    jwt = jwt && jwt.hasOwnProperty('default') ? jwt['default'] : jwt;
    var fs__default = 'default' in fs ? fs['default'] : fs;
    queryString = queryString && queryString.hasOwnProperty('default') ? queryString['default'] : queryString;
    axios = axios && axios.hasOwnProperty('default') ? axios['default'] : axios;
    Joi = Joi && Joi.hasOwnProperty('default') ? Joi['default'] : Joi;

    const PATH_ROOT = path.resolve(__dirname + '/../');
    const PATH_PUBLIC = path.resolve(PATH_ROOT + '/Public/'); // PARTIALS

    const PATH_PUBLIC_AVATARS = path.join(PATH_PUBLIC, '/Avatars/');

    dotenv.config();
    const {
      PORT = 8080,
      PAYPAL_ID,
      PAYPAL_SECRET,
      DATABASE_URL,
      SESSION_SECRET = 'fmjsdfbhjeg784t36745gr23'
    } = process.env;
    const PAYPAL_API_URL = 'https://api.sandbox.paypal.com';

    var Knex = knex({
      client: 'pg',
      connection: DATABASE_URL
    });

    /**
     * @param {import('Utils/errors').ServerError} err
     * @param {import('express').Response} res
     */
    function ErrorHandler(err, req, res, next) {
      try {
        if (!(err || {}).customError) {
          throw Error();
        }

        const {
          message,
          statusCode
        } = err;
        return res.status(statusCode).send({
          message
        });
      } catch (error) {
        res.status(500).send({
          error: 'Unexpected server error!'
        });
      }
    }

    const deleteFile = util.promisify(fs.unlink);
    const readFile = util.promisify(fs__default.readFile);

    /**
     * @typedef ServerError
     * @property {string} message
     * @property {number} statusCode
     * @property {boolean} [customError]
     */

    /**
     * @param {object} error
     * @param {string} error.message
     * @param {number} error.statusCode
     * @returns {ServerError}
     * */

    function handleError(error) {
      return { ...error,
        customError: true
      };
    }

    /**
     * @typedef {object} getPaypalTokenReturnData
     * @property {string} access_token
     * @property {string} [refresh_token]
     * @property {number} expires_in
     */

    /**
     * @param {object} codes
     * @param {string} [codes.initialCode]
     * @param {string} [codes.refreshToken]
     * @returns {Promise<getPaypalTokenReturnData|null>}
     */

    async function getPaypalToken(codes) {
      const auth = Buffer.from(`${PAYPAL_ID}:${PAYPAL_SECRET}`).toString('base64');
      const isRefreshToken = codes.refreshToken && !codes.initialCode;
      const payload = {};

      if (isRefreshToken) {
        payload.grant_type = 'refresh_token';
        payload.refresh_token = codes.refreshToken;
      } else {
        payload.grant_type = 'authorization_code';
        payload.code = codes.initialCode;
      }

      try {
        const {
          data
        } = await axios.post(`${PAYPAL_API_URL}/v1/oauth2/token`, // @ts-ignore
        queryString.stringify(payload), {
          headers: { ...axios.defaults.headers,
            Authorization: `Basic ${auth}`,
            'Content-type': 'application/x-www-form-urlencoded'
          }
        });
        const {
          access_token,
          refresh_token,
          expires_in
        } = data;
        const dataToReturn = {
          access_token,
          expires_in
        };
        if (refresh_token) dataToReturn.refresh_token = refresh_token;
        return dataToReturn;
      } catch (err) {
        return null;
      }
    }
    /**
     * @typedef {object} getPaypalUserInfoReturnData
     * @property {string} userId
     * @property {string} email
     */

    /**
     * @param {string} activeToken
     * @returns {Promise<getPaypalUserInfoReturnData|null>}
     */

    async function getPaypalUserInfo(activeToken) {
      try {
        const res = await axios.get(`${PAYPAL_API_URL}/v1/identity/oauth2/userinfo?schema=paypalv1.1`, {
          headers: {
            Authorization: `Bearer ${activeToken}`,
            'Content-Type': 'application/json'
          }
        });
        const {
          data
        } = res;
        const {
          user_id,
          emails = []
        } = data;
        const {
          value: primaryEmail
        } = emails.find(({
          primary
        }) => primary === true);
        return {
          email: primaryEmail,
          userId: user_id
        };
      } catch ({
        response
      }) {
        const {
          data
        } = response;
        console.log(data);
        return null;
      }
    }

    /* eslint-disable lines-between-class-members */
    const User = {
      userId: 'userId',
      refreshToken: 'refreshToken',
      email: 'email',

      /** @returns Promise<{{error: object, data: object }}> */
      validate: async data => ({
        error: {},
        data: {}
      })
    };
    const userSchema = Joi.object({
      [User.userId]: Joi.string().required(),
      [User.refreshToken]: Joi.string().required(),
      [User.email]: Joi.string().required()
    });

    User.validate = async data => {
      const validation = {
        data: null,
        error: null
      };

      try {
        validation.data = await userSchema.validateAsync(data, {
          presence: 'required'
        });
      } catch (error) {
        validation.error = error.details;
      }

      return validation;
    };

    /* eslint-disable no-shadow */
    async function userAuth(req, res, next) {
      try {
        const {
          code
        } = req.body; // debugger;

        const tokens = await getPaypalToken({
          initialCode: code
        }); // console.timeLog('Request');

        if (!tokens) {
          return next(handleError({
            message: 'Invalid code',
            statusCode: httpCode.BAD_REQUEST
          }));
        }

        const info = await getPaypalUserInfo(tokens.access_token);
        const user = {
          [User.userId]: info.userId,
          [User.email]: info.email,
          [User.refreshToken]: tokens.refresh_token
        };
        const {
          data,
          error
        } = await User.validate(user);
        if (error) return res.status(httpCode.BAD_REQUEST).send({
          error
        });

        try {
          const res = await Knex('users').where({
            userId: info.userId
          }).update(user);

          if (res === 0) {
            const res = await Knex('users').insert(user); // @ts-ignore

            if (!(res === null || res === void 0 ? void 0 : res.rowCount)) {
              throw Error;
            }
          } // eslint-disable-next-line no-shadow

        } catch (error) {
          // If couldn't create user
          console.error(error);
          handleError({
            statusCode: httpCode.INTERNAL_SERVER_ERROR,
            message: 'Could not create user'
          });
        }

        const token = jwt.sign({
          userId: info.userId,
          paypalToken: tokens.access_token
        }, SESSION_SECRET, {
          expiresIn: tokens.expires_in - 100
        });
        return res.status(200).send({
          user: info,
          token
        });
      } catch (error) {
        console.log(error);
        return next(handleError({
          message: 'Invalid request',
          statusCode: httpCode.BAD_REQUEST
        }));
      }
    }

    const router = express.Router();
    router.route('/').get((req, res) => {
      res.send({
        link: `https://www.sandbox.paypal.com/connect?flowEntry=static&client_id=${PAYPAL_ID}&scope=openid%20email&redirect_uri=http%3A%2F%2F127.0.0.1:3000%2Fpaypal-return`
      });
    }).post(userAuth);

    /**
     * Adds ***user*** and ***token*** to request object
     */

    async function Secured(req, res, next) {
      try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const data = jwt.verify(token, SESSION_SECRET);
        req.user = data;
        req.token = token;
        next();
      } catch (err) {
        res.status(401).send({
          message: 'Invalid token provided!'
        });
      }
    }

    const router$1 = express.Router();
    router$1.route('/').get(Secured, (req, res) => res.send(req.user)).post();

    const apiRouter = express.Router();
    apiRouter.use('/users', router);
    apiRouter.use('/transactions', router$1); // Main Router

    const rootRouter = express.Router();
    rootRouter.use('/api', apiRouter);
    rootRouter.get('/', (req, res) => {
      res.sendStatus(httpCode.IM_A_TEAPOT);
    });
    rootRouter.use(ErrorHandler); // MISC

    const app = express__default();
    app.use(cors());
    app.use(express__default.json());
    app.use(rootRouter);
    app.listen(PORT, () => {
      console.log(`Server running on port: ${PORT}`);
    });

})));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlcyI6WyIuLi9zcmMvQ29uc3RhbnRzL2NvbnN0YW50cy5qcyIsIi4uL3NyYy9Db25zdGFudHMvY29uZmlncy5qcyIsIi4uL3NyYy9Jbml0L2RhdGFiYXNlLmpzIiwiLi4vc3JjL01pZGRsZXdhcmUvZXJyb3IuanMiLCIuLi9zcmMvVXRpbHMvZmlsZXMuanMiLCIuLi9zcmMvVXRpbHMvZXJyb3JzLmpzIiwiLi4vc3JjL0NvcmUvdXNlci9vcGVyYXRpb25zLmpzIiwiLi4vc3JjL0NvcmUvdXNlci9tb2RlbC5qcyIsIi4uL3NyYy9Db3JlL3VzZXIvY29udHJvbGxlci5qcyIsIi4uL3NyYy9Db3JlL3VzZXIvcm91dGVyLmpzIiwiLi4vc3JjL01pZGRsZXdhcmUvYXV0aC5qcyIsIi4uL3NyYy9Db3JlL3RyYW5zYWN0aW9ucy9yb3V0ZXIuanMiLCIuLi9zcmMvUm91dGVzL2luZGV4LmpzIiwiLi4vc3JjL3NlcnZlci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBqb2luLCByZXNvbHZlIH0gZnJvbSAncGF0aCc7XG5cbi8vIEdMT0JBTFNcbmV4cG9ydCBjb25zdCBQQVRIX1JPT1QgPSByZXNvbHZlKF9fZGlybmFtZSArICcvLi4vJyk7XG5leHBvcnQgY29uc3QgUEFUSF9QVUJMSUMgPSByZXNvbHZlKFBBVEhfUk9PVCArICcvUHVibGljLycpO1xuXG4vLyBQQVJUSUFMU1xuZXhwb3J0IGNvbnN0IFBBVEhfUFVCTElDX0FWQVRBUlMgPSBqb2luKFxuICAgIFBBVEhfUFVCTElDLFxuICAgICcvQXZhdGFycy8nLFxuKTtcblxuZXhwb3J0IGNvbnN0IEZPTERFUlNfVE9fR0VORVJBVEUgPSBbUEFUSF9QVUJMSUNfQVZBVEFSU107XG4iLCJpbXBvcnQgZG90ZW52IGZyb20gJ2RvdGVudic7XG5cbmRvdGVudi5jb25maWcoKTtcblxuY29uc3Qge1xuICBQT1JUID0gODA4MCxcbiAgUEFZUEFMX0lELFxuICBQQVlQQUxfU0VDUkVULFxuICBEQVRBQkFTRV9VUkwsXG4gIFNFU1NJT05fU0VDUkVUID0gJ2ZtanNkZmJoamVnNzg0dDM2NzQ1Z3IyMycsXG59ID0gcHJvY2Vzcy5lbnY7XG5cbmV4cG9ydCB7IFBPUlQsIFBBWVBBTF9JRCwgUEFZUEFMX1NFQ1JFVCwgREFUQUJBU0VfVVJMLCBTRVNTSU9OX1NFQ1JFVCB9O1xuZXhwb3J0IGNvbnN0IFBBWVBBTF9BUElfVVJMID0gJ2h0dHBzOi8vYXBpLnNhbmRib3gucGF5cGFsLmNvbSc7XG5cbmV4cG9ydCAqIGZyb20gJy4vY29uc3RhbnRzJztcbiIsImltcG9ydCBrbmV4IGZyb20gJ2tuZXgnO1xuaW1wb3J0IHsgREFUQUJBU0VfVVJMIH0gZnJvbSAnQ29uc3RhbnRzL2NvbmZpZ3MnO1xuXG5leHBvcnQgZGVmYXVsdCBrbmV4KHtcbiAgY2xpZW50OiAncGcnLFxuICBjb25uZWN0aW9uOiBEQVRBQkFTRV9VUkwsXG59KTtcbiIsIi8qKlxuICogQHBhcmFtIHtpbXBvcnQoJ1V0aWxzL2Vycm9ycycpLlNlcnZlckVycm9yfSBlcnJcbiAqIEBwYXJhbSB7aW1wb3J0KCdleHByZXNzJykuUmVzcG9uc2V9IHJlc1xuICovXG5leHBvcnQgZnVuY3Rpb24gRXJyb3JIYW5kbGVyKGVyciwgcmVxLCByZXMsIG5leHQpIHtcbiAgdHJ5IHtcbiAgICBpZiAoIShlcnIgfHwge30pLmN1c3RvbUVycm9yKSB7XG4gICAgICB0aHJvdyBFcnJvcigpO1xuICAgIH1cbiAgICBjb25zdCB7IG1lc3NhZ2UsIHN0YXR1c0NvZGUgfSA9IGVycjtcbiAgICByZXR1cm4gcmVzLnN0YXR1cyhzdGF0dXNDb2RlKS5zZW5kKHsgbWVzc2FnZSB9KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICByZXMuc3RhdHVzKDUwMCkuc2VuZCh7XG4gICAgICBlcnJvcjogJ1VuZXhwZWN0ZWQgc2VydmVyIGVycm9yIScsXG4gICAgfSk7XG4gIH1cbn1cbiIsImltcG9ydCBmcywgeyB1bmxpbmsgfSBmcm9tICdmcyc7XG5pbXBvcnQgeyBwcm9taXNpZnkgfSBmcm9tICd1dGlsJztcblxuZXhwb3J0IGNvbnN0IGRlbGV0ZUZpbGUgPSBwcm9taXNpZnkodW5saW5rKTtcblxuZXhwb3J0IGNvbnN0IHJlYWRGaWxlID0gcHJvbWlzaWZ5KGZzLnJlYWRGaWxlKTtcbiIsImltcG9ydCBodHRwQ29kZSBmcm9tICdodHRwLXN0YXR1cy1jb2Rlcyc7XG4vKipcbiAqIEB0eXBlZGVmIFNlcnZlckVycm9yXG4gKiBAcHJvcGVydHkge3N0cmluZ30gbWVzc2FnZVxuICogQHByb3BlcnR5IHtudW1iZXJ9IHN0YXR1c0NvZGVcbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gW2N1c3RvbUVycm9yXVxuICovXG4vKipcbiAqIEBwYXJhbSB7b2JqZWN0fSBlcnJvclxuICogQHBhcmFtIHtzdHJpbmd9IGVycm9yLm1lc3NhZ2VcbiAqIEBwYXJhbSB7bnVtYmVyfSBlcnJvci5zdGF0dXNDb2RlXG4gKiBAcmV0dXJucyB7U2VydmVyRXJyb3J9XG4gKiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGhhbmRsZUVycm9yKGVycm9yKSB7XG4gIHJldHVybiB7XG4gICAgLi4uZXJyb3IsXG4gICAgY3VzdG9tRXJyb3I6IHRydWUsXG4gIH07XG59XG5leHBvcnQgeyBodHRwQ29kZSB9O1xuIiwiaW1wb3J0IHF1ZXJ5U3RyaW5nIGZyb20gJ3F1ZXJ5c3RyaW5nJztcbmltcG9ydCBheGlvcyBmcm9tICdheGlvcyc7XG5pbXBvcnQgeyBQQVlQQUxfSUQsIFBBWVBBTF9TRUNSRVQsIFBBWVBBTF9BUElfVVJMIH0gZnJvbSAnQ29uc3RhbnRzL2NvbmZpZ3MnO1xuXG4vKipcbiAqIEB0eXBlZGVmIHtvYmplY3R9IGdldFBheXBhbFRva2VuUmV0dXJuRGF0YVxuICogQHByb3BlcnR5IHtzdHJpbmd9IGFjY2Vzc190b2tlblxuICogQHByb3BlcnR5IHtzdHJpbmd9IFtyZWZyZXNoX3Rva2VuXVxuICogQHByb3BlcnR5IHtudW1iZXJ9IGV4cGlyZXNfaW5cbiAqL1xuLyoqXG4gKiBAcGFyYW0ge29iamVjdH0gY29kZXNcbiAqIEBwYXJhbSB7c3RyaW5nfSBbY29kZXMuaW5pdGlhbENvZGVdXG4gKiBAcGFyYW0ge3N0cmluZ30gW2NvZGVzLnJlZnJlc2hUb2tlbl1cbiAqIEByZXR1cm5zIHtQcm9taXNlPGdldFBheXBhbFRva2VuUmV0dXJuRGF0YXxudWxsPn1cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldFBheXBhbFRva2VuKGNvZGVzKSB7XG4gIGNvbnN0IGF1dGggPSBCdWZmZXIuZnJvbShgJHtQQVlQQUxfSUR9OiR7UEFZUEFMX1NFQ1JFVH1gKS50b1N0cmluZygnYmFzZTY0Jyk7XG4gIGNvbnN0IGlzUmVmcmVzaFRva2VuID0gY29kZXMucmVmcmVzaFRva2VuICYmICFjb2Rlcy5pbml0aWFsQ29kZTtcbiAgY29uc3QgcGF5bG9hZCA9IHt9O1xuICBpZiAoaXNSZWZyZXNoVG9rZW4pIHtcbiAgICBwYXlsb2FkLmdyYW50X3R5cGUgPSAncmVmcmVzaF90b2tlbic7XG4gICAgcGF5bG9hZC5yZWZyZXNoX3Rva2VuID0gY29kZXMucmVmcmVzaFRva2VuO1xuICB9IGVsc2Uge1xuICAgIHBheWxvYWQuZ3JhbnRfdHlwZSA9ICdhdXRob3JpemF0aW9uX2NvZGUnO1xuICAgIHBheWxvYWQuY29kZSA9IGNvZGVzLmluaXRpYWxDb2RlO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBjb25zdCB7IGRhdGEgfSA9IGF3YWl0IGF4aW9zLnBvc3QoXG4gICAgICBgJHtQQVlQQUxfQVBJX1VSTH0vdjEvb2F1dGgyL3Rva2VuYCxcbiAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgIHF1ZXJ5U3RyaW5nLnN0cmluZ2lmeShwYXlsb2FkKSxcbiAgICAgIHtcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgIC4uLmF4aW9zLmRlZmF1bHRzLmhlYWRlcnMsXG4gICAgICAgICAgQXV0aG9yaXphdGlvbjogYEJhc2ljICR7YXV0aH1gLFxuICAgICAgICAgICdDb250ZW50LXR5cGUnOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgKTtcblxuICAgIGNvbnN0IHsgYWNjZXNzX3Rva2VuLCByZWZyZXNoX3Rva2VuLCBleHBpcmVzX2luIH0gPSBkYXRhO1xuXG4gICAgY29uc3QgZGF0YVRvUmV0dXJuID0geyBhY2Nlc3NfdG9rZW4sIGV4cGlyZXNfaW4gfTtcblxuICAgIGlmIChyZWZyZXNoX3Rva2VuKSBkYXRhVG9SZXR1cm4ucmVmcmVzaF90b2tlbiA9IHJlZnJlc2hfdG9rZW47XG5cbiAgICByZXR1cm4gZGF0YVRvUmV0dXJuO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG4vKipcbiAqIEB0eXBlZGVmIHtvYmplY3R9IGdldFBheXBhbFVzZXJJbmZvUmV0dXJuRGF0YVxuICogQHByb3BlcnR5IHtzdHJpbmd9IHVzZXJJZFxuICogQHByb3BlcnR5IHtzdHJpbmd9IGVtYWlsXG4gKi9cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IGFjdGl2ZVRva2VuXG4gKiBAcmV0dXJucyB7UHJvbWlzZTxnZXRQYXlwYWxVc2VySW5mb1JldHVybkRhdGF8bnVsbD59XG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRQYXlwYWxVc2VySW5mbyhhY3RpdmVUb2tlbikge1xuICB0cnkge1xuICAgIGNvbnN0IHJlcyA9IGF3YWl0IGF4aW9zLmdldChcbiAgICAgIGAke1BBWVBBTF9BUElfVVJMfS92MS9pZGVudGl0eS9vYXV0aDIvdXNlcmluZm8/c2NoZW1hPXBheXBhbHYxLjFgLFxuICAgICAge1xuICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke2FjdGl2ZVRva2VufWAsXG4gICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgKTtcbiAgICBjb25zdCB7IGRhdGEgfSA9IHJlcztcbiAgICBjb25zdCB7IHVzZXJfaWQsIGVtYWlscyA9IFtdIH0gPSBkYXRhO1xuXG4gICAgY29uc3QgeyB2YWx1ZTogcHJpbWFyeUVtYWlsIH0gPSBlbWFpbHMuZmluZChcbiAgICAgICh7IHByaW1hcnkgfSkgPT4gcHJpbWFyeSA9PT0gdHJ1ZSxcbiAgICApO1xuXG4gICAgcmV0dXJuIHsgZW1haWw6IHByaW1hcnlFbWFpbCwgdXNlcklkOiB1c2VyX2lkIH07XG4gIH0gY2F0Y2ggKHsgcmVzcG9uc2UgfSkge1xuICAgIGNvbnN0IHsgZGF0YSB9ID0gcmVzcG9uc2U7XG4gICAgY29uc29sZS5sb2coZGF0YSk7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cbiIsIi8qIGVzbGludC1kaXNhYmxlIGxpbmVzLWJldHdlZW4tY2xhc3MtbWVtYmVycyAqL1xuaW1wb3J0IEpvaSBmcm9tICdAaGFwaS9qb2knO1xuXG5jb25zdCBVc2VyID0ge1xuICB1c2VySWQ6ICd1c2VySWQnLFxuICByZWZyZXNoVG9rZW46ICdyZWZyZXNoVG9rZW4nLFxuICBlbWFpbDogJ2VtYWlsJyxcblxuICAvKiogQHJldHVybnMgUHJvbWlzZTx7e2Vycm9yOiBvYmplY3QsIGRhdGE6IG9iamVjdCB9fT4gKi9cbiAgdmFsaWRhdGU6IGFzeW5jIGRhdGEgPT4gKHsgZXJyb3I6IHt9LCBkYXRhOiB7fSB9KSxcbn07XG5jb25zdCB1c2VyU2NoZW1hID0gSm9pLm9iamVjdCh7XG4gIFtVc2VyLnVzZXJJZF06IEpvaS5zdHJpbmcoKS5yZXF1aXJlZCgpLFxuICBbVXNlci5yZWZyZXNoVG9rZW5dOiBKb2kuc3RyaW5nKCkucmVxdWlyZWQoKSxcbiAgW1VzZXIuZW1haWxdOiBKb2kuc3RyaW5nKCkucmVxdWlyZWQoKSxcbn0pO1xuXG5Vc2VyLnZhbGlkYXRlID0gYXN5bmMgZGF0YSA9PiB7XG4gIGNvbnN0IHZhbGlkYXRpb24gPSB7XG4gICAgZGF0YTogbnVsbCxcbiAgICBlcnJvcjogbnVsbCxcbiAgfTtcblxuICB0cnkge1xuICAgIHZhbGlkYXRpb24uZGF0YSA9IGF3YWl0IHVzZXJTY2hlbWEudmFsaWRhdGVBc3luYyhkYXRhLCB7XG4gICAgICBwcmVzZW5jZTogJ3JlcXVpcmVkJyxcbiAgICB9KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICB2YWxpZGF0aW9uLmVycm9yID0gZXJyb3IuZGV0YWlscztcbiAgfVxuXG4gIHJldHVybiB2YWxpZGF0aW9uO1xufTtcbmV4cG9ydCB7IFVzZXIgfTtcbiIsIi8qIGVzbGludC1kaXNhYmxlIG5vLXNoYWRvdyAqL1xuaW1wb3J0IGp3dCBmcm9tICdqc29ud2VidG9rZW4nO1xuXG5pbXBvcnQgS25leCBmcm9tICdJbml0L2RhdGFiYXNlJztcbmltcG9ydCB7IFNFU1NJT05fU0VDUkVUIH0gZnJvbSAnQ29uc3RhbnRzL2NvbmZpZ3MnO1xuaW1wb3J0IHsgaGFuZGxlRXJyb3IsIGh0dHBDb2RlIH0gZnJvbSAnVXRpbHMnO1xuXG5pbXBvcnQgeyBnZXRQYXlwYWxUb2tlbiwgZ2V0UGF5cGFsVXNlckluZm8gfSBmcm9tICcuL29wZXJhdGlvbnMnO1xuaW1wb3J0IHsgVXNlciB9IGZyb20gJy4vbW9kZWwnO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdXNlckF1dGgocmVxLCByZXMsIG5leHQpIHtcbiAgdHJ5IHtcbiAgICBjb25zdCB7IGNvZGUgfSA9IHJlcS5ib2R5O1xuICAgIC8vIGRlYnVnZ2VyO1xuICAgIGNvbnN0IHRva2VucyA9IGF3YWl0IGdldFBheXBhbFRva2VuKHsgaW5pdGlhbENvZGU6IGNvZGUgfSk7XG4gICAgLy8gY29uc29sZS50aW1lTG9nKCdSZXF1ZXN0Jyk7XG4gICAgaWYgKCF0b2tlbnMpIHtcbiAgICAgIHJldHVybiBuZXh0KFxuICAgICAgICBoYW5kbGVFcnJvcih7XG4gICAgICAgICAgbWVzc2FnZTogJ0ludmFsaWQgY29kZScsXG4gICAgICAgICAgc3RhdHVzQ29kZTogaHR0cENvZGUuQkFEX1JFUVVFU1QsXG4gICAgICAgIH0pLFxuICAgICAgKTtcbiAgICB9XG4gICAgY29uc3QgaW5mbyA9IGF3YWl0IGdldFBheXBhbFVzZXJJbmZvKHRva2Vucy5hY2Nlc3NfdG9rZW4pO1xuXG4gICAgY29uc3QgdXNlciA9IHtcbiAgICAgIFtVc2VyLnVzZXJJZF06IGluZm8udXNlcklkLFxuICAgICAgW1VzZXIuZW1haWxdOiBpbmZvLmVtYWlsLFxuICAgICAgW1VzZXIucmVmcmVzaFRva2VuXTogdG9rZW5zLnJlZnJlc2hfdG9rZW4sXG4gICAgfTtcblxuICAgIGNvbnN0IHsgZGF0YSwgZXJyb3IgfSA9IGF3YWl0IFVzZXIudmFsaWRhdGUodXNlcik7XG5cbiAgICBpZiAoZXJyb3IpIHJldHVybiByZXMuc3RhdHVzKGh0dHBDb2RlLkJBRF9SRVFVRVNUKS5zZW5kKHsgZXJyb3IgfSk7XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgS25leCgndXNlcnMnKVxuICAgICAgICAud2hlcmUoeyB1c2VySWQ6IGluZm8udXNlcklkIH0pXG4gICAgICAgIC51cGRhdGUodXNlcik7XG5cbiAgICAgIGlmIChyZXMgPT09IDApIHtcbiAgICAgICAgY29uc3QgcmVzID0gYXdhaXQgS25leCgndXNlcnMnKS5pbnNlcnQodXNlcik7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgaWYgKCFyZXM/LnJvd0NvdW50KSB7XG4gICAgICAgICAgdGhyb3cgRXJyb3I7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1zaGFkb3dcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgLy8gSWYgY291bGRuJ3QgY3JlYXRlIHVzZXJcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgaGFuZGxlRXJyb3Ioe1xuICAgICAgICBzdGF0dXNDb2RlOiBodHRwQ29kZS5JTlRFUk5BTF9TRVJWRVJfRVJST1IsXG4gICAgICAgIG1lc3NhZ2U6ICdDb3VsZCBub3QgY3JlYXRlIHVzZXInLFxuICAgICAgfSk7XG4gICAgfVxuICAgIGNvbnN0IHRva2VuID0gand0LnNpZ24oXG4gICAgICB7IHVzZXJJZDogaW5mby51c2VySWQsIHBheXBhbFRva2VuOiB0b2tlbnMuYWNjZXNzX3Rva2VuIH0sXG4gICAgICBTRVNTSU9OX1NFQ1JFVCxcbiAgICAgIHsgZXhwaXJlc0luOiB0b2tlbnMuZXhwaXJlc19pbiAtIDEwMCB9LFxuICAgICk7XG5cbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLnNlbmQoeyB1c2VyOiBpbmZvLCB0b2tlbiB9KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmxvZyhlcnJvcik7XG5cbiAgICByZXR1cm4gbmV4dChcbiAgICAgIGhhbmRsZUVycm9yKHtcbiAgICAgICAgbWVzc2FnZTogJ0ludmFsaWQgcmVxdWVzdCcsXG4gICAgICAgIHN0YXR1c0NvZGU6IGh0dHBDb2RlLkJBRF9SRVFVRVNULFxuICAgICAgfSksXG4gICAgKTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgUm91dGVyIH0gZnJvbSAnZXhwcmVzcyc7XG5cbmltcG9ydCB7IFBBWVBBTF9JRCB9IGZyb20gJ0NvbnN0YW50cy9jb25maWdzJztcblxuLy8gaW1wb3J0IHsgU2VjdXJlZCwgVmFsaWRhdGVJRCB9IGZyb20gJ01pZGRsZXdhcmUnO1xuaW1wb3J0IHsgdXNlckF1dGggfSBmcm9tICcuL2NvbnRyb2xsZXInO1xuXG5jb25zdCByb3V0ZXIgPSBSb3V0ZXIoKTtcblxucm91dGVyXG4gIC5yb3V0ZSgnLycpXG4gIC5nZXQoKHJlcSwgcmVzKSA9PiB7XG4gICAgcmVzLnNlbmQoe1xuICAgICAgbGluazogYGh0dHBzOi8vd3d3LnNhbmRib3gucGF5cGFsLmNvbS9jb25uZWN0P2Zsb3dFbnRyeT1zdGF0aWMmY2xpZW50X2lkPSR7UEFZUEFMX0lEfSZzY29wZT1vcGVuaWQlMjBlbWFpbCZyZWRpcmVjdF91cmk9aHR0cCUzQSUyRiUyRjEyNy4wLjAuMTozMDAwJTJGcGF5cGFsLXJldHVybmAsXG4gICAgfSk7XG4gIH0pXG4gIC5wb3N0KHVzZXJBdXRoKTtcbmV4cG9ydCBkZWZhdWx0IHJvdXRlcjtcbiIsImltcG9ydCBqd3QgZnJvbSAnanNvbndlYnRva2VuJztcbmltcG9ydCB7IFNFU1NJT05fU0VDUkVUIH0gZnJvbSAnQ29uc3RhbnRzL2NvbmZpZ3MnO1xuXG4vKipcbiAqIEFkZHMgKioqdXNlcioqKiBhbmQgKioqdG9rZW4qKiogdG8gcmVxdWVzdCBvYmplY3RcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIFNlY3VyZWQocmVxLCByZXMsIG5leHQpIHtcbiAgdHJ5IHtcbiAgICBjb25zdCB0b2tlbiA9IHJlcS5oZWFkZXIoJ0F1dGhvcml6YXRpb24nKS5yZXBsYWNlKCdCZWFyZXIgJywgJycpO1xuXG4gICAgY29uc3QgZGF0YSA9IGp3dC52ZXJpZnkodG9rZW4sIFNFU1NJT05fU0VDUkVUKTtcblxuICAgIHJlcS51c2VyID0gZGF0YTtcbiAgICByZXEudG9rZW4gPSB0b2tlbjtcbiAgICBuZXh0KCk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHJlcy5zdGF0dXMoNDAxKS5zZW5kKHtcbiAgICAgIG1lc3NhZ2U6ICdJbnZhbGlkIHRva2VuIHByb3ZpZGVkIScsXG4gICAgfSk7XG4gIH1cbn1cbiIsImltcG9ydCB7IFJvdXRlciB9IGZyb20gJ2V4cHJlc3MnO1xuXG5pbXBvcnQgeyBQQVlQQUxfSUQgfSBmcm9tICdDb25zdGFudHMvY29uZmlncyc7XG5cbmltcG9ydCB7IFNlY3VyZWQgfSBmcm9tICdNaWRkbGV3YXJlJztcbi8vIGltcG9ydCB7IHVzZXJBdXRoIH0gZnJvbSAnLi9jb250cm9sbGVyJztcblxuY29uc3Qgcm91dGVyID0gUm91dGVyKCk7XG5cbnJvdXRlclxuICAucm91dGUoJy8nKVxuICAuZ2V0KFNlY3VyZWQsIChyZXEsIHJlcykgPT4gcmVzLnNlbmQocmVxLnVzZXIpKVxuICAucG9zdCgpO1xuZXhwb3J0IGRlZmF1bHQgcm91dGVyO1xuIiwiaW1wb3J0IHsgUm91dGVyIH0gZnJvbSAnZXhwcmVzcyc7XG5pbXBvcnQgaHR0cENvZGVzIGZyb20gXCJodHRwLXN0YXR1cy1jb2Rlc1wiO1xuXG5pbXBvcnQgeyBFcnJvckhhbmRsZXIgfSBmcm9tICdNaWRkbGV3YXJlL2Vycm9yJztcbmltcG9ydCBVc2VyIGZyb20gJ0NvcmUvdXNlci9yb3V0ZXInO1xuaW1wb3J0IFRyYW5zYWN0aW9ucyBmcm9tICdDb3JlL3RyYW5zYWN0aW9ucy9yb3V0ZXInO1xuXG4vLyBBUEkgUk9VVEVSXG5jb25zdCBhcGlSb3V0ZXIgPSBSb3V0ZXIoKTtcbmFwaVJvdXRlci51c2UoJy91c2VycycsIFVzZXIpO1xuYXBpUm91dGVyLnVzZSgnL3RyYW5zYWN0aW9ucycsIFRyYW5zYWN0aW9ucyk7XG5cbi8vIE1haW4gUm91dGVyXG5jb25zdCByb290Um91dGVyID0gUm91dGVyKCk7XG5yb290Um91dGVyLnVzZSgnL2FwaScsIGFwaVJvdXRlcik7XG5yb290Um91dGVyLmdldCgnLycsIChyZXEsIHJlcykgPT4ge1xuICByZXMuc2VuZFN0YXR1cyhodHRwQ29kZXMuSU1fQV9URUFQT1QpO1xufSk7XG5yb290Um91dGVyLnVzZShFcnJvckhhbmRsZXIpO1xuXG4vLyBNSVNDXG5leHBvcnQgZGVmYXVsdCByb290Um91dGVyO1xuIiwiaW1wb3J0IGV4cHJlc3MgZnJvbSAnZXhwcmVzcyc7XG5pbXBvcnQgY29ycyBmcm9tICdjb3JzJztcblxuaW1wb3J0IHJvdXRlcyBmcm9tICdSb3V0ZXMnO1xuaW1wb3J0IHsgUE9SVCB9IGZyb20gJ0NvbnN0YW50cy9jb25maWdzJztcblxuY29uc3QgYXBwID0gZXhwcmVzcygpO1xuYXBwLnVzZShjb3JzKCkpO1xuYXBwLnVzZShleHByZXNzLmpzb24oKSk7XG5cbmFwcC51c2Uocm91dGVzKTtcblxuYXBwLmxpc3RlbihQT1JULCAoKSA9PiB7XG4gIGNvbnNvbGUubG9nKGBTZXJ2ZXIgcnVubmluZyBvbiBwb3J0OiAke1BPUlR9YCk7XG59KTtcbiJdLCJuYW1lcyI6WyJQQVRIX1JPT1QiLCJyZXNvbHZlIiwiX19kaXJuYW1lIiwiUEFUSF9QVUJMSUMiLCJQQVRIX1BVQkxJQ19BVkFUQVJTIiwiam9pbiIsImRvdGVudiIsImNvbmZpZyIsIlBPUlQiLCJQQVlQQUxfSUQiLCJQQVlQQUxfU0VDUkVUIiwiREFUQUJBU0VfVVJMIiwiU0VTU0lPTl9TRUNSRVQiLCJwcm9jZXNzIiwiZW52IiwiUEFZUEFMX0FQSV9VUkwiLCJrbmV4IiwiY2xpZW50IiwiY29ubmVjdGlvbiIsIkVycm9ySGFuZGxlciIsImVyciIsInJlcSIsInJlcyIsIm5leHQiLCJjdXN0b21FcnJvciIsIkVycm9yIiwibWVzc2FnZSIsInN0YXR1c0NvZGUiLCJzdGF0dXMiLCJzZW5kIiwiZXJyb3IiLCJkZWxldGVGaWxlIiwicHJvbWlzaWZ5IiwidW5saW5rIiwicmVhZEZpbGUiLCJmcyIsImhhbmRsZUVycm9yIiwiZ2V0UGF5cGFsVG9rZW4iLCJjb2RlcyIsImF1dGgiLCJCdWZmZXIiLCJmcm9tIiwidG9TdHJpbmciLCJpc1JlZnJlc2hUb2tlbiIsInJlZnJlc2hUb2tlbiIsImluaXRpYWxDb2RlIiwicGF5bG9hZCIsImdyYW50X3R5cGUiLCJyZWZyZXNoX3Rva2VuIiwiY29kZSIsImRhdGEiLCJheGlvcyIsInBvc3QiLCJxdWVyeVN0cmluZyIsInN0cmluZ2lmeSIsImhlYWRlcnMiLCJkZWZhdWx0cyIsIkF1dGhvcml6YXRpb24iLCJhY2Nlc3NfdG9rZW4iLCJleHBpcmVzX2luIiwiZGF0YVRvUmV0dXJuIiwiZ2V0UGF5cGFsVXNlckluZm8iLCJhY3RpdmVUb2tlbiIsImdldCIsInVzZXJfaWQiLCJlbWFpbHMiLCJ2YWx1ZSIsInByaW1hcnlFbWFpbCIsImZpbmQiLCJwcmltYXJ5IiwiZW1haWwiLCJ1c2VySWQiLCJyZXNwb25zZSIsImNvbnNvbGUiLCJsb2ciLCJVc2VyIiwidmFsaWRhdGUiLCJ1c2VyU2NoZW1hIiwiSm9pIiwib2JqZWN0Iiwic3RyaW5nIiwicmVxdWlyZWQiLCJ2YWxpZGF0aW9uIiwidmFsaWRhdGVBc3luYyIsInByZXNlbmNlIiwiZGV0YWlscyIsInVzZXJBdXRoIiwiYm9keSIsInRva2VucyIsImh0dHBDb2RlIiwiQkFEX1JFUVVFU1QiLCJpbmZvIiwidXNlciIsIktuZXgiLCJ3aGVyZSIsInVwZGF0ZSIsImluc2VydCIsInJvd0NvdW50IiwiSU5URVJOQUxfU0VSVkVSX0VSUk9SIiwidG9rZW4iLCJqd3QiLCJzaWduIiwicGF5cGFsVG9rZW4iLCJleHBpcmVzSW4iLCJyb3V0ZXIiLCJSb3V0ZXIiLCJyb3V0ZSIsImxpbmsiLCJTZWN1cmVkIiwiaGVhZGVyIiwicmVwbGFjZSIsInZlcmlmeSIsImFwaVJvdXRlciIsInVzZSIsIlRyYW5zYWN0aW9ucyIsInJvb3RSb3V0ZXIiLCJzZW5kU3RhdHVzIiwiaHR0cENvZGVzIiwiSU1fQV9URUFQT1QiLCJhcHAiLCJleHByZXNzIiwiY29ycyIsImpzb24iLCJyb3V0ZXMiLCJsaXN0ZW4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBR08sTUFBTUEsU0FBUyxHQUFHQyxZQUFPLENBQUNDLFNBQVMsR0FBRyxNQUFiLENBQXpCO0FBQ1AsSUFBTyxNQUFNQyxXQUFXLEdBQUdGLFlBQU8sQ0FBQ0QsU0FBUyxHQUFHLFVBQWIsQ0FBM0I7O0FBR1AsSUFBTyxNQUFNSSxtQkFBbUIsR0FBR0MsU0FBSSxDQUNuQ0YsV0FEbUMsRUFFbkMsV0FGbUMsQ0FBaEM7O0lDTFBHLE1BQU0sQ0FBQ0MsTUFBUDtJQUVBLE1BQU07SUFDSkMsRUFBQUEsSUFBSSxHQUFHLElBREg7SUFFSkMsRUFBQUEsU0FGSTtJQUdKQyxFQUFBQSxhQUhJO0lBSUpDLEVBQUFBLFlBSkk7SUFLSkMsRUFBQUEsY0FBYyxHQUFHO0lBTGIsSUFNRkMsT0FBTyxDQUFDQyxHQU5aO0FBUUEsSUFDTyxNQUFNQyxjQUFjLEdBQUcsZ0NBQXZCOztBQ1ZQLGVBQWVDLElBQUksQ0FBQztJQUNsQkMsRUFBQUEsTUFBTSxFQUFFLElBRFU7SUFFbEJDLEVBQUFBLFVBQVUsRUFBRVA7SUFGTSxDQUFELENBQW5COztJQ0hBOzs7O0FBSUEsSUFBTyxTQUFT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
