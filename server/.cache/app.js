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

    knex({
      client: 'pg',
      connection: DATABASE_URL
    });

    /**
     * @param {import('Utils/errors').ServerError} err
     * @param {import('express').Response} res
     */
    function ErrorHandler(err, req, res, next) {
      try {
        console.log('here');

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
        } = await User.validate({
          userId: 5,
          email: '',
          refresh_token: 'asd'
        });
        console.log({
          data,
          error
        });
        if (error) return res.status(httpCode.BAD_REQUEST).send({
          error
        }); // try {
        //   Knex('users')
        //     .insert(user)
        //     .catch(async () => {
        //       try {
        //         console.log(tokens.refresh_token);
        //         const res = await Knex('users').where({ userId }).update(user);
        //         console.log(res);
        //       } catch (error) {
        //         console.log(error);
        //       }
        //     });
        //   // console.log(test);
        // } catch (error) {
        //   console.log(error);
        //   // debugger
        //   // debugger;
        // }

        const token = jwt.sign({
          userId: info.userId,
          paypalToken: tokens.access_token
        }, SESSION_SECRET, {
          expiresIn: tokens.expires_in - 100
        });
        return res.status(200).send({
          info,
          token
        });
      } catch (error) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlcyI6WyIuLi9zcmMvQ29uc3RhbnRzL2NvbnN0YW50cy5qcyIsIi4uL3NyYy9Db25zdGFudHMvY29uZmlncy5qcyIsIi4uL3NyYy9Jbml0L2RhdGFiYXNlLmpzIiwiLi4vc3JjL01pZGRsZXdhcmUvZXJyb3IuanMiLCIuLi9zcmMvVXRpbHMvZmlsZXMuanMiLCIuLi9zcmMvVXRpbHMvZXJyb3JzLmpzIiwiLi4vc3JjL0NvcmUvdXNlci9vcGVyYXRpb25zLmpzIiwiLi4vc3JjL0NvcmUvdXNlci9tb2RlbC5qcyIsIi4uL3NyYy9Db3JlL3VzZXIvY29udHJvbGxlci5qcyIsIi4uL3NyYy9Db3JlL3VzZXIvcm91dGVyLmpzIiwiLi4vc3JjL01pZGRsZXdhcmUvYXV0aC5qcyIsIi4uL3NyYy9Db3JlL3RyYW5zYWN0aW9ucy9yb3V0ZXIuanMiLCIuLi9zcmMvUm91dGVzL2luZGV4LmpzIiwiLi4vc3JjL3NlcnZlci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBqb2luLCByZXNvbHZlIH0gZnJvbSAncGF0aCc7XG5cbi8vIEdMT0JBTFNcbmV4cG9ydCBjb25zdCBQQVRIX1JPT1QgPSByZXNvbHZlKF9fZGlybmFtZSArICcvLi4vJyk7XG5leHBvcnQgY29uc3QgUEFUSF9QVUJMSUMgPSByZXNvbHZlKFBBVEhfUk9PVCArICcvUHVibGljLycpO1xuXG4vLyBQQVJUSUFMU1xuZXhwb3J0IGNvbnN0IFBBVEhfUFVCTElDX0FWQVRBUlMgPSBqb2luKFxuICAgIFBBVEhfUFVCTElDLFxuICAgICcvQXZhdGFycy8nLFxuKTtcblxuZXhwb3J0IGNvbnN0IEZPTERFUlNfVE9fR0VORVJBVEUgPSBbUEFUSF9QVUJMSUNfQVZBVEFSU107XG4iLCJpbXBvcnQgZG90ZW52IGZyb20gJ2RvdGVudic7XG5cbmRvdGVudi5jb25maWcoKTtcblxuY29uc3Qge1xuICBQT1JUID0gODA4MCxcbiAgUEFZUEFMX0lELFxuICBQQVlQQUxfU0VDUkVULFxuICBEQVRBQkFTRV9VUkwsXG4gIFNFU1NJT05fU0VDUkVUID0gJ2ZtanNkZmJoamVnNzg0dDM2NzQ1Z3IyMycsXG59ID0gcHJvY2Vzcy5lbnY7XG5cbmV4cG9ydCB7XG4gIFBPUlQsIFBBWVBBTF9JRCwgUEFZUEFMX1NFQ1JFVCwgREFUQUJBU0VfVVJMLCBTRVNTSU9OX1NFQ1JFVCxcbn07XG5leHBvcnQgY29uc3QgUEFZUEFMX0FQSV9VUkwgPSAnaHR0cHM6Ly9hcGkuc2FuZGJveC5wYXlwYWwuY29tJztcblxuZXhwb3J0ICogZnJvbSAnLi9jb25zdGFudHMnO1xuIiwiaW1wb3J0IGtuZXggZnJvbSAna25leCc7XG5pbXBvcnQgeyBEQVRBQkFTRV9VUkwgfSBmcm9tICdDb25zdGFudHMvY29uZmlncyc7XG5cbmV4cG9ydCBkZWZhdWx0IGtuZXgoe1xuICBjbGllbnQ6ICdwZycsXG4gIGNvbm5lY3Rpb246IERBVEFCQVNFX1VSTCxcbn0pO1xuIiwiLyoqXG4gKiBAcGFyYW0ge2ltcG9ydCgnVXRpbHMvZXJyb3JzJykuU2VydmVyRXJyb3J9IGVyclxuICogQHBhcmFtIHtpbXBvcnQoJ2V4cHJlc3MnKS5SZXNwb25zZX0gcmVzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBFcnJvckhhbmRsZXIoZXJyLCByZXEsIHJlcywgbmV4dCkge1xuICB0cnkge1xuICAgIGNvbnNvbGUubG9nKCdoZXJlJyk7XG5cbiAgICBpZiAoIShlcnIgfHwge30pLmN1c3RvbUVycm9yKSB7XG4gICAgICB0aHJvdyBFcnJvcigpO1xuICAgIH1cbiAgICBjb25zdCB7IG1lc3NhZ2UsIHN0YXR1c0NvZGUgfSA9IGVycjtcbiAgICByZXR1cm4gcmVzLnN0YXR1cyhzdGF0dXNDb2RlKS5zZW5kKHsgbWVzc2FnZSB9KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICByZXMuc3RhdHVzKDUwMCkuc2VuZCh7XG4gICAgICBlcnJvcjogJ1VuZXhwZWN0ZWQgc2VydmVyIGVycm9yIScsXG4gICAgfSk7XG4gIH1cbn1cbiIsImltcG9ydCBmcywgeyB1bmxpbmsgfSBmcm9tICdmcyc7XG5pbXBvcnQgeyBwcm9taXNpZnkgfSBmcm9tICd1dGlsJztcblxuZXhwb3J0IGNvbnN0IGRlbGV0ZUZpbGUgPSBwcm9taXNpZnkodW5saW5rKTtcblxuZXhwb3J0IGNvbnN0IHJlYWRGaWxlID0gcHJvbWlzaWZ5KGZzLnJlYWRGaWxlKTtcbiIsImltcG9ydCBodHRwQ29kZSBmcm9tICdodHRwLXN0YXR1cy1jb2Rlcyc7XG4vKipcbiAqIEB0eXBlZGVmIFNlcnZlckVycm9yXG4gKiBAcHJvcGVydHkge3N0cmluZ30gbWVzc2FnZVxuICogQHByb3BlcnR5IHtudW1iZXJ9IHN0YXR1c0NvZGVcbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gW2N1c3RvbUVycm9yXVxuICovXG4vKipcbiAqIEBwYXJhbSB7b2JqZWN0fSBlcnJvclxuICogQHBhcmFtIHtzdHJpbmd9IGVycm9yLm1lc3NhZ2VcbiAqIEBwYXJhbSB7bnVtYmVyfSBlcnJvci5zdGF0dXNDb2RlXG4gKiBAcmV0dXJucyB7U2VydmVyRXJyb3J9XG4gKiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGhhbmRsZUVycm9yKGVycm9yKSB7XG4gIHJldHVybiB7XG4gICAgLi4uZXJyb3IsXG4gICAgY3VzdG9tRXJyb3I6IHRydWUsXG4gIH07XG59XG5leHBvcnQgeyBodHRwQ29kZSB9O1xuIiwiaW1wb3J0IHF1ZXJ5U3RyaW5nIGZyb20gJ3F1ZXJ5c3RyaW5nJztcbmltcG9ydCBheGlvcyBmcm9tICdheGlvcyc7XG5pbXBvcnQgeyBQQVlQQUxfSUQsIFBBWVBBTF9TRUNSRVQsIFBBWVBBTF9BUElfVVJMIH0gZnJvbSAnQ29uc3RhbnRzL2NvbmZpZ3MnO1xuXG4vKipcbiAqIEB0eXBlZGVmIHtvYmplY3R9IGdldFBheXBhbFRva2VuUmV0dXJuRGF0YVxuICogQHByb3BlcnR5IHtzdHJpbmd9IGFjY2Vzc190b2tlblxuICogQHByb3BlcnR5IHtzdHJpbmd9IFtyZWZyZXNoX3Rva2VuXVxuICogQHByb3BlcnR5IHtudW1iZXJ9IGV4cGlyZXNfaW5cbiAqL1xuLyoqXG4gKiBAcGFyYW0ge29iamVjdH0gY29kZXNcbiAqIEBwYXJhbSB7c3RyaW5nfSBbY29kZXMuaW5pdGlhbENvZGVdXG4gKiBAcGFyYW0ge3N0cmluZ30gW2NvZGVzLnJlZnJlc2hUb2tlbl1cbiAqIEByZXR1cm5zIHtQcm9taXNlPGdldFBheXBhbFRva2VuUmV0dXJuRGF0YXxudWxsPn1cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldFBheXBhbFRva2VuKGNvZGVzKSB7XG4gIGNvbnN0IGF1dGggPSBCdWZmZXIuZnJvbShgJHtQQVlQQUxfSUR9OiR7UEFZUEFMX1NFQ1JFVH1gKS50b1N0cmluZygnYmFzZTY0Jyk7XG4gIGNvbnN0IGlzUmVmcmVzaFRva2VuID0gY29kZXMucmVmcmVzaFRva2VuICYmICFjb2Rlcy5pbml0aWFsQ29kZTtcbiAgY29uc3QgcGF5bG9hZCA9IHt9O1xuICBpZiAoaXNSZWZyZXNoVG9rZW4pIHtcbiAgICBwYXlsb2FkLmdyYW50X3R5cGUgPSAncmVmcmVzaF90b2tlbic7XG4gICAgcGF5bG9hZC5yZWZyZXNoX3Rva2VuID0gY29kZXMucmVmcmVzaFRva2VuO1xuICB9IGVsc2Uge1xuICAgIHBheWxvYWQuZ3JhbnRfdHlwZSA9ICdhdXRob3JpemF0aW9uX2NvZGUnO1xuICAgIHBheWxvYWQuY29kZSA9IGNvZGVzLmluaXRpYWxDb2RlO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBjb25zdCB7IGRhdGEgfSA9IGF3YWl0IGF4aW9zLnBvc3QoXG4gICAgICBgJHtQQVlQQUxfQVBJX1VSTH0vdjEvb2F1dGgyL3Rva2VuYCxcbiAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgIHF1ZXJ5U3RyaW5nLnN0cmluZ2lmeShwYXlsb2FkKSxcbiAgICAgIHtcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgIC4uLmF4aW9zLmRlZmF1bHRzLmhlYWRlcnMsXG4gICAgICAgICAgQXV0aG9yaXphdGlvbjogYEJhc2ljICR7YXV0aH1gLFxuICAgICAgICAgICdDb250ZW50LXR5cGUnOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgKTtcblxuICAgIGNvbnN0IHsgYWNjZXNzX3Rva2VuLCByZWZyZXNoX3Rva2VuLCBleHBpcmVzX2luIH0gPSBkYXRhO1xuXG4gICAgY29uc3QgZGF0YVRvUmV0dXJuID0geyBhY2Nlc3NfdG9rZW4sIGV4cGlyZXNfaW4gfTtcblxuICAgIGlmIChyZWZyZXNoX3Rva2VuKSBkYXRhVG9SZXR1cm4ucmVmcmVzaF90b2tlbiA9IHJlZnJlc2hfdG9rZW47XG5cbiAgICByZXR1cm4gZGF0YVRvUmV0dXJuO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG4vKipcbiAqIEB0eXBlZGVmIHtvYmplY3R9IGdldFBheXBhbFVzZXJJbmZvUmV0dXJuRGF0YVxuICogQHByb3BlcnR5IHtzdHJpbmd9IHVzZXJJZFxuICogQHByb3BlcnR5IHtzdHJpbmd9IGVtYWlsXG4gKi9cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IGFjdGl2ZVRva2VuXG4gKiBAcmV0dXJucyB7UHJvbWlzZTxnZXRQYXlwYWxVc2VySW5mb1JldHVybkRhdGF8bnVsbD59XG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRQYXlwYWxVc2VySW5mbyhhY3RpdmVUb2tlbikge1xuICB0cnkge1xuICAgIGNvbnN0IHJlcyA9IGF3YWl0IGF4aW9zLmdldChcbiAgICAgIGAke1BBWVBBTF9BUElfVVJMfS92MS9pZGVudGl0eS9vYXV0aDIvdXNlcmluZm8/c2NoZW1hPXBheXBhbHYxLjFgLFxuICAgICAge1xuICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke2FjdGl2ZVRva2VufWAsXG4gICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgKTtcbiAgICBjb25zdCB7IGRhdGEgfSA9IHJlcztcbiAgICBjb25zdCB7IHVzZXJfaWQsIGVtYWlscyA9IFtdIH0gPSBkYXRhO1xuXG4gICAgY29uc3QgeyB2YWx1ZTogcHJpbWFyeUVtYWlsIH0gPSBlbWFpbHMuZmluZChcbiAgICAgICh7IHByaW1hcnkgfSkgPT4gcHJpbWFyeSA9PT0gdHJ1ZSxcbiAgICApO1xuXG4gICAgcmV0dXJuIHsgZW1haWw6IHByaW1hcnlFbWFpbCwgdXNlcklkOiB1c2VyX2lkIH07XG4gIH0gY2F0Y2ggKHsgcmVzcG9uc2UgfSkge1xuICAgIGNvbnN0IHsgZGF0YSB9ID0gcmVzcG9uc2U7XG4gICAgY29uc29sZS5sb2coZGF0YSk7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cbiIsIi8qIGVzbGludC1kaXNhYmxlIGxpbmVzLWJldHdlZW4tY2xhc3MtbWVtYmVycyAqL1xuaW1wb3J0IEpvaSBmcm9tICdAaGFwaS9qb2knO1xuXG5jb25zdCBVc2VyID0ge1xuICB1c2VySWQ6ICd1c2VySWQnLFxuICByZWZyZXNoVG9rZW46ICdyZWZyZXNoVG9rZW4nLFxuICBlbWFpbDogJ2VtYWlsJyxcblxuICAvKiogQHJldHVybnMgUHJvbWlzZTx7e2Vycm9yOiBvYmplY3QsIGRhdGE6IG9iamVjdCB9fT4gKi9cbiAgdmFsaWRhdGU6IGFzeW5jIGRhdGEgPT4gKHsgZXJyb3I6IHt9LCBkYXRhOiB7fSB9KSxcbn07XG5jb25zdCB1c2VyU2NoZW1hID0gSm9pLm9iamVjdCh7XG4gIFtVc2VyLnVzZXJJZF06IEpvaS5zdHJpbmcoKS5yZXF1aXJlZCgpLFxuICBbVXNlci5yZWZyZXNoVG9rZW5dOiBKb2kuc3RyaW5nKCkucmVxdWlyZWQoKSxcbiAgW1VzZXIuZW1haWxdOiBKb2kuc3RyaW5nKCkucmVxdWlyZWQoKSxcbn0pO1xuXG5Vc2VyLnZhbGlkYXRlID0gYXN5bmMgZGF0YSA9PiB7XG4gIGNvbnN0IHZhbGlkYXRpb24gPSB7XG4gICAgZGF0YTogbnVsbCxcbiAgICBlcnJvcjogbnVsbCxcbiAgfTtcblxuICB0cnkge1xuICAgIHZhbGlkYXRpb24uZGF0YSA9IGF3YWl0IHVzZXJTY2hlbWEudmFsaWRhdGVBc3luYyhkYXRhLCB7XG4gICAgICBwcmVzZW5jZTogJ3JlcXVpcmVkJyxcbiAgICB9KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICB2YWxpZGF0aW9uLmVycm9yID0gZXJyb3IuZGV0YWlscztcbiAgfVxuXG4gIHJldHVybiB2YWxpZGF0aW9uO1xufTtcbmV4cG9ydCB7IFVzZXIgfTtcbiIsImltcG9ydCBqd3QgZnJvbSAnanNvbndlYnRva2VuJztcblxuaW1wb3J0IEtuZXggZnJvbSAnSW5pdC9kYXRhYmFzZSc7XG5pbXBvcnQgeyBTRVNTSU9OX1NFQ1JFVCB9IGZyb20gJ0NvbnN0YW50cy9jb25maWdzJztcbmltcG9ydCB7IGhhbmRsZUVycm9yLCBodHRwQ29kZSB9IGZyb20gJ1V0aWxzJztcblxuaW1wb3J0IHsgZ2V0UGF5cGFsVG9rZW4sIGdldFBheXBhbFVzZXJJbmZvIH0gZnJvbSAnLi9vcGVyYXRpb25zJztcbmltcG9ydCB7IFVzZXIgfSBmcm9tICcuL21vZGVsJztcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHVzZXJBdXRoKHJlcSwgcmVzLCBuZXh0KSB7XG4gIHRyeSB7XG4gICAgY29uc3QgeyBjb2RlIH0gPSByZXEuYm9keTtcbiAgICAvLyBkZWJ1Z2dlcjtcbiAgICBjb25zdCB0b2tlbnMgPSBhd2FpdCBnZXRQYXlwYWxUb2tlbih7IGluaXRpYWxDb2RlOiBjb2RlIH0pO1xuICAgIC8vIGNvbnNvbGUudGltZUxvZygnUmVxdWVzdCcpO1xuICAgIGlmICghdG9rZW5zKSB7XG4gICAgICByZXR1cm4gbmV4dChcbiAgICAgICAgaGFuZGxlRXJyb3Ioe1xuICAgICAgICAgIG1lc3NhZ2U6ICdJbnZhbGlkIGNvZGUnLFxuICAgICAgICAgIHN0YXR1c0NvZGU6IGh0dHBDb2RlLkJBRF9SRVFVRVNULFxuICAgICAgICB9KSxcbiAgICAgICk7XG4gICAgfVxuICAgIGNvbnN0IGluZm8gPSBhd2FpdCBnZXRQYXlwYWxVc2VySW5mbyh0b2tlbnMuYWNjZXNzX3Rva2VuKTtcblxuICAgIGNvbnN0IHVzZXIgPSB7XG4gICAgICBbVXNlci51c2VySWRdOiBpbmZvLnVzZXJJZCxcbiAgICAgIFtVc2VyLmVtYWlsXTogaW5mby5lbWFpbCxcbiAgICAgIFtVc2VyLnJlZnJlc2hUb2tlbl06IHRva2Vucy5yZWZyZXNoX3Rva2VuLFxuICAgIH07XG5cbiAgICBjb25zdCB7IGRhdGEsIGVycm9yIH0gPSBhd2FpdCBVc2VyLnZhbGlkYXRlKHtcbiAgICAgIHVzZXJJZDogNSxcbiAgICAgIGVtYWlsOiAnJyxcbiAgICAgIHJlZnJlc2hfdG9rZW46ICdhc2QnLFxuICAgIH0pO1xuICAgIGNvbnNvbGUubG9nKHsgZGF0YSwgZXJyb3IgfSk7XG4gICAgaWYgKGVycm9yKSByZXR1cm4gcmVzLnN0YXR1cyhodHRwQ29kZS5CQURfUkVRVUVTVCkuc2VuZCh7IGVycm9yIH0pO1xuXG4gICAgLy8gdHJ5IHtcbiAgICAvLyAgIEtuZXgoJ3VzZXJzJylcbiAgICAvLyAgICAgLmluc2VydCh1c2VyKVxuICAgIC8vICAgICAuY2F0Y2goYXN5bmMgKCkgPT4ge1xuICAgIC8vICAgICAgIHRyeSB7XG4gICAgLy8gICAgICAgICBjb25zb2xlLmxvZyh0b2tlbnMucmVmcmVzaF90b2tlbik7XG5cbiAgICAvLyAgICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IEtuZXgoJ3VzZXJzJykud2hlcmUoeyB1c2VySWQgfSkudXBkYXRlKHVzZXIpO1xuICAgIC8vICAgICAgICAgY29uc29sZS5sb2cocmVzKTtcbiAgICAvLyAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgIC8vICAgICAgICAgY29uc29sZS5sb2coZXJyb3IpO1xuICAgIC8vICAgICAgIH1cbiAgICAvLyAgICAgfSk7XG4gICAgLy8gICAvLyBjb25zb2xlLmxvZyh0ZXN0KTtcbiAgICAvLyB9IGNhdGNoIChlcnJvcikge1xuICAgIC8vICAgY29uc29sZS5sb2coZXJyb3IpO1xuICAgIC8vICAgLy8gZGVidWdnZXJcblxuICAgIC8vICAgLy8gZGVidWdnZXI7XG4gICAgLy8gfVxuICAgIGNvbnN0IHRva2VuID0gand0LnNpZ24oXG4gICAgICB7IHVzZXJJZDogaW5mby51c2VySWQsIHBheXBhbFRva2VuOiB0b2tlbnMuYWNjZXNzX3Rva2VuIH0sXG4gICAgICBTRVNTSU9OX1NFQ1JFVCxcbiAgICAgIHsgZXhwaXJlc0luOiB0b2tlbnMuZXhwaXJlc19pbiAtIDEwMCB9LFxuICAgICk7XG5cbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLnNlbmQoeyBpbmZvLCB0b2tlbiB9KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICByZXR1cm4gbmV4dChcbiAgICAgIGhhbmRsZUVycm9yKHtcbiAgICAgICAgbWVzc2FnZTogJ0ludmFsaWQgcmVxdWVzdCcsXG4gICAgICAgIHN0YXR1c0NvZGU6IGh0dHBDb2RlLkJBRF9SRVFVRVNULFxuICAgICAgfSksXG4gICAgKTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgUm91dGVyIH0gZnJvbSAnZXhwcmVzcyc7XG5cbmltcG9ydCB7IFBBWVBBTF9JRCB9IGZyb20gJ0NvbnN0YW50cy9jb25maWdzJztcblxuLy8gaW1wb3J0IHsgU2VjdXJlZCwgVmFsaWRhdGVJRCB9IGZyb20gJ01pZGRsZXdhcmUnO1xuaW1wb3J0IHsgdXNlckF1dGggfSBmcm9tICcuL2NvbnRyb2xsZXInO1xuXG5jb25zdCByb3V0ZXIgPSBSb3V0ZXIoKTtcblxucm91dGVyXG4gIC5yb3V0ZSgnLycpXG4gIC5nZXQoKHJlcSwgcmVzKSA9PiB7XG4gICAgcmVzLnNlbmQoe1xuICAgICAgbGluazogYGh0dHBzOi8vd3d3LnNhbmRib3gucGF5cGFsLmNvbS9jb25uZWN0P2Zsb3dFbnRyeT1zdGF0aWMmY2xpZW50X2lkPSR7UEFZUEFMX0lEfSZzY29wZT1vcGVuaWQlMjBlbWFpbCZyZWRpcmVjdF91cmk9aHR0cCUzQSUyRiUyRjEyNy4wLjAuMTozMDAwJTJGcGF5cGFsLXJldHVybmAsXG4gICAgfSk7XG4gIH0pXG4gIC5wb3N0KHVzZXJBdXRoKTtcbmV4cG9ydCBkZWZhdWx0IHJvdXRlcjtcbiIsImltcG9ydCBqd3QgZnJvbSAnanNvbndlYnRva2VuJztcbmltcG9ydCB7IFNFU1NJT05fU0VDUkVUIH0gZnJvbSAnQ29uc3RhbnRzL2NvbmZpZ3MnO1xuXG4vKipcbiAqIEFkZHMgKioqdXNlcioqKiBhbmQgKioqdG9rZW4qKiogdG8gcmVxdWVzdCBvYmplY3RcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIFNlY3VyZWQocmVxLCByZXMsIG5leHQpIHtcbiAgdHJ5IHtcbiAgICBjb25zdCB0b2tlbiA9IHJlcS5oZWFkZXIoJ0F1dGhvcml6YXRpb24nKS5yZXBsYWNlKCdCZWFyZXIgJywgJycpO1xuXG4gICAgY29uc3QgZGF0YSA9IGp3dC52ZXJpZnkodG9rZW4sIFNFU1NJT05fU0VDUkVUKTtcblxuICAgIHJlcS51c2VyID0gZGF0YTtcbiAgICByZXEudG9rZW4gPSB0b2tlbjtcbiAgICBuZXh0KCk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHJlcy5zdGF0dXMoNDAxKS5zZW5kKHtcbiAgICAgIG1lc3NhZ2U6ICdJbnZhbGlkIHRva2VuIHByb3ZpZGVkIScsXG4gICAgfSk7XG4gIH1cbn1cbiIsImltcG9ydCB7IFJvdXRlciB9IGZyb20gJ2V4cHJlc3MnO1xuXG5pbXBvcnQgeyBQQVlQQUxfSUQgfSBmcm9tICdDb25zdGFudHMvY29uZmlncyc7XG5cbmltcG9ydCB7IFNlY3VyZWQgfSBmcm9tICdNaWRkbGV3YXJlJztcbi8vIGltcG9ydCB7IHVzZXJBdXRoIH0gZnJvbSAnLi9jb250cm9sbGVyJztcblxuY29uc3Qgcm91dGVyID0gUm91dGVyKCk7XG5cbnJvdXRlclxuICAucm91dGUoJy8nKVxuICAuZ2V0KFNlY3VyZWQsIChyZXEsIHJlcykgPT4gcmVzLnNlbmQocmVxLnVzZXIpKVxuICAucG9zdCgpO1xuZXhwb3J0IGRlZmF1bHQgcm91dGVyO1xuIiwiaW1wb3J0IHsgUm91dGVyIH0gZnJvbSAnZXhwcmVzcyc7XG5pbXBvcnQgaHR0cENvZGVzIGZyb20gXCJodHRwLXN0YXR1cy1jb2Rlc1wiO1xuXG5pbXBvcnQgeyBFcnJvckhhbmRsZXIgfSBmcm9tICdNaWRkbGV3YXJlL2Vycm9yJztcbmltcG9ydCBVc2VyIGZyb20gJ0NvcmUvdXNlci9yb3V0ZXInO1xuaW1wb3J0IFRyYW5zYWN0aW9ucyBmcm9tICdDb3JlL3RyYW5zYWN0aW9ucy9yb3V0ZXInO1xuXG4vLyBBUEkgUk9VVEVSXG5jb25zdCBhcGlSb3V0ZXIgPSBSb3V0ZXIoKTtcbmFwaVJvdXRlci51c2UoJy91c2VycycsIFVzZXIpO1xuYXBpUm91dGVyLnVzZSgnL3RyYW5zYWN0aW9ucycsIFRyYW5zYWN0aW9ucyk7XG5cbi8vIE1haW4gUm91dGVyXG5jb25zdCByb290Um91dGVyID0gUm91dGVyKCk7XG5yb290Um91dGVyLnVzZSgnL2FwaScsIGFwaVJvdXRlcik7XG5yb290Um91dGVyLmdldCgnLycsIChyZXEsIHJlcykgPT4ge1xuICByZXMuc2VuZFN0YXR1cyhodHRwQ29kZXMuSU1fQV9URUFQT1QpO1xufSk7XG5yb290Um91dGVyLnVzZShFcnJvckhhbmRsZXIpO1xuXG4vLyBNSVNDXG5leHBvcnQgZGVmYXVsdCByb290Um91dGVyO1xuIiwiaW1wb3J0IGV4cHJlc3MgZnJvbSAnZXhwcmVzcyc7XG5pbXBvcnQgY29ycyBmcm9tICdjb3JzJztcblxuaW1wb3J0IHJvdXRlcyBmcm9tICdSb3V0ZXMnO1xuaW1wb3J0IHsgUE9SVCB9IGZyb20gJ0NvbnN0YW50cy9jb25maWdzJztcblxuY29uc3QgYXBwID0gZXhwcmVzcygpO1xuYXBwLnVzZShjb3JzKCkpO1xuYXBwLnVzZShleHByZXNzLmpzb24oKSk7XG5cbmFwcC51c2Uocm91dGVzKTtcblxuYXBwLmxpc3RlbihQT1JULCAoKSA9PiB7XG4gIGNvbnNvbGUubG9nKGBTZXJ2ZXIgcnVubmluZyBvbiBwb3J0OiAke1BPUlR9YCk7XG59KTtcbiJdLCJuYW1lcyI6WyJQQVRIX1JPT1QiLCJyZXNvbHZlIiwiX19kaXJuYW1lIiwiUEFUSF9QVUJMSUMiLCJQQVRIX1BVQkxJQ19BVkFUQVJTIiwiam9pbiIsImRvdGVudiIsImNvbmZpZyIsIlBPUlQiLCJQQVlQQUxfSUQiLCJQQVlQQUxfU0VDUkVUIiwiREFUQUJBU0VfVVJMIiwiU0VTU0lPTl9TRUNSRVQiLCJwcm9jZXNzIiwiZW52IiwiUEFZUEFMX0FQSV9VUkwiLCJrbmV4IiwiY2xpZW50IiwiY29ubmVjdGlvbiIsIkVycm9ySGFuZGxlciIsImVyciIsInJlcSIsInJlcyIsIm5leHQiLCJjb25zb2xlIiwibG9nIiwiY3VzdG9tRXJyb3IiLCJFcnJvciIsIm1lc3NhZ2UiLCJzdGF0dXNDb2RlIiwic3RhdHVzIiwic2VuZCIsImVycm9yIiwiZGVsZXRlRmlsZSIsInByb21pc2lmeSIsInVubGluayIsInJlYWRGaWxlIiwiZnMiLCJoYW5kbGVFcnJvciIsImdldFBheXBhbFRva2VuIiwiY29kZXMiLCJhdXRoIiwiQnVmZmVyIiwiZnJvbSIsInRvU3RyaW5nIiwiaXNSZWZyZXNoVG9rZW4iLCJyZWZyZXNoVG9rZW4iLCJpbml0aWFsQ29kZSIsInBheWxvYWQiLCJncmFudF90eXBlIiwicmVmcmVzaF90b2tlbiIsImNvZGUiLCJkYXRhIiwiYXhpb3MiLCJwb3N0IiwicXVlcnlTdHJpbmciLCJzdHJpbmdpZnkiLCJoZWFkZXJzIiwiZGVmYXVsdHMiLCJBdXRob3JpemF0aW9uIiwiYWNjZXNzX3Rva2VuIiwiZXhwaXJlc19pbiIsImRhdGFUb1JldHVybiIsImdldFBheXBhbFVzZXJJbmZvIiwiYWN0aXZlVG9rZW4iLCJnZXQiLCJ1c2VyX2lkIiwiZW1haWxzIiwidmFsdWUiLCJwcmltYXJ5RW1haWwiLCJmaW5kIiwicHJpbWFyeSIsImVtYWlsIiwidXNlcklkIiwicmVzcG9uc2UiLCJVc2VyIiwidmFsaWRhdGUiLCJ1c2VyU2NoZW1hIiwiSm9pIiwib2JqZWN0Iiwic3RyaW5nIiwicmVxdWlyZWQiLCJ2YWxpZGF0aW9uIiwidmFsaWRhdGVBc3luYyIsInByZXNlbmNlIiwiZGV0YWlscyIsInVzZXJBdXRoIiwiYm9keSIsInRva2VucyIsImh0dHBDb2RlIiwiQkFEX1JFUVVFU1QiLCJpbmZvIiwidXNlciIsInRva2VuIiwiand0Iiwic2lnbiIsInBheXBhbFRva2VuIiwiZXhwaXJlc0luIiwicm91dGVyIiwiUm91dGVyIiwicm91dGUiLCJsaW5rIiwiU2VjdXJlZCIsImhlYWRlciIsInJlcGxhY2UiLCJ2ZXJpZnkiLCJhcGlSb3V0ZXIiLCJ1c2UiLCJUcmFuc2FjdGlvbnMiLCJyb290Um91dGVyIiwic2VuZFN0YXR1cyIsImh0dHBDb2RlcyIsIklNX0FfVEVBUE9UIiwiYXBwIiwiZXhwcmVzcyIsImNvcnMiLCJqc29uIiwicm91dGVzIiwibGlzdGVuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7OztJQUdPLE1BQU1BLFNBQVMsR0FBR0MsWUFBTyxDQUFDQyxTQUFTLEdBQUcsTUFBYixDQUF6QjtBQUNQLElBQU8sTUFBTUMsV0FBVyxHQUFHRixZQUFPLENBQUNELFNBQVMsR0FBRyxVQUFiLENBQTNCOztBQUdQLElBQU8sTUFBTUksbUJBQW1CLEdBQUdDLFNBQUksQ0FDbkNGLFdBRG1DLEVBRW5DLFdBRm1DLENBQWhDOztJQ0xQRyxNQUFNLENBQUNDLE1BQVA7SUFFQSxNQUFNO0lBQ0pDLEVBQUFBLElBQUksR0FBRyxJQURIO0lBRUpDLEVBQUFBLFNBRkk7SUFHSkMsRUFBQUEsYUFISTtJQUlKQyxFQUFBQSxZQUpJO0lBS0pDLEVBQUFBLGNBQWMsR0FBRztJQUxiLElBTUZDLE9BQU8sQ0FBQ0MsR0FOWjtBQVFBLElBR08sTUFBTUMsY0FBYyxHQUFHLGdDQUF2Qjs7SUNaUUMsSUFBSSxDQUFDO0lBQ2xCQyxFQUFBQSxNQUFNLEVBQUUsSUFEVTtJQUVsQkMsRUFBQUEsVUFBVSxFQUFFUDtJQUZNLENBQUQsQ0FBbkI7O0lDSEE7Ozs7QUFJQSxJQUFPLFNBQVNRLFlBQVQsQ0FBc0JDLEdBQXRCLEVBQTJCQyxHQUEzQixF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
