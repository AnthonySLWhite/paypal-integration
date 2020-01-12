(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('knex'), require('dotenv'), require('path'), require('express'), require('cors'), require('querystring'), require('axios')) :
    typeof define === 'function' && define.amd ? define(['knex', 'dotenv', 'path', 'express', 'cors', 'querystring', 'axios'], factory) :
    (global = global || self, factory(global.knex, global.dotenv, global.path, global.express, global.cors, global.queryString, global.axios));
}(this, (function (knex, dotenv, path, express, cors, queryString, axios) { 'use strict';

    knex = knex && knex.hasOwnProperty('default') ? knex['default'] : knex;
    dotenv = dotenv && dotenv.hasOwnProperty('default') ? dotenv['default'] : dotenv;
    var express__default = 'default' in express ? express['default'] : express;
    cors = cors && cors.hasOwnProperty('default') ? cors['default'] : cors;
    queryString = queryString && queryString.hasOwnProperty('default') ? queryString['default'] : queryString;
    axios = axios && axios.hasOwnProperty('default') ? axios['default'] : axios;

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

    function ErrorHandler(err, req, res, next) {
      try {
        const {
          message
        } = err;
        if (!message) return res.status(500).send();
        res.status(400).send({
          error: message
        });
      } catch (error) {
        res.status(500).send({
          error: 'Unexpected server error!'
        });
      }
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
     * @property {string} user_id
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
          user_id
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

    // // import multer from 'multer';
    // import { Secured, ValidateID } from 'Middleware';
    // import { getToken } from './controller';

    const router = express.Router();
    router.route('/').get((req, res) => {
      res.send({
        link: `https://www.sandbox.paypal.com/connect?flowEntry=static&client_id=${PAYPAL_ID}&scope=openid%20email&redirect_uri=http%3A%2F%2F127.0.0.1:3000%2Fpaypal-return`
      });
    }).post(async (req, res) => {
      const {
        code
      } = req.body;
      console.log(code); // debugger;

      const data = await getPaypalToken({
        initialCode: code
      }); // console.timeLog('Request');

      if (!data) return res.status(400).send();
      const info = await getPaypalUserInfo(data.access_token);
      res.status(200).send({
        data,
        info
      });
    });

    const router$1 = express.Router(); // Own Routes

    router$1.get('/', (req, res) => {
      res.send('There is an API here!').status(200);
    }); // - Attach routes
    // Users

    router$1.use('/user', router); // Post MIDDLEWARE

    router$1.use(ErrorHandler); // MISC

    const router$2 = express.Router();
    router$2.use('/api', router$1);

    const app = express__default();
    app.use(cors());
    app.use(express__default.json());
    app.use(router$2);
    app.listen(PORT, () => {
      console.log(`Server running on port: ${PORT}`);
    });

})));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlcyI6WyIuLi9zcmMvQ29uc3RhbnRzL2NvbnN0YW50cy5qcyIsIi4uL3NyYy9Db25zdGFudHMvY29uZmlncy5qcyIsIi4uL3NyYy9pbml0L2RhdGFiYXNlLmpzIiwiLi4vc3JjL01pZGRsZXdhcmUvZXJyb3IuanMiLCIuLi9zcmMvQ29yZS91c2VyL29wZXJhdGlvbnMuanMiLCIuLi9zcmMvQ29yZS91c2VyL3JvdXRlci5qcyIsIi4uL3NyYy9Sb3V0ZXMvYXBpLmpzIiwiLi4vc3JjL1JvdXRlcy9pbmRleC5qcyIsIi4uL3NyYy9zZXJ2ZXIuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgam9pbiwgcmVzb2x2ZSB9IGZyb20gJ3BhdGgnO1xuXG4vLyBHTE9CQUxTXG5leHBvcnQgY29uc3QgUEFUSF9ST09UID0gcmVzb2x2ZShfX2Rpcm5hbWUgKyAnLy4uLycpO1xuZXhwb3J0IGNvbnN0IFBBVEhfUFVCTElDID0gcmVzb2x2ZShQQVRIX1JPT1QgKyAnL1B1YmxpYy8nKTtcblxuLy8gUEFSVElBTFNcbmV4cG9ydCBjb25zdCBQQVRIX1BVQkxJQ19BVkFUQVJTID0gam9pbihcbiAgICBQQVRIX1BVQkxJQyxcbiAgICAnL0F2YXRhcnMvJyxcbik7XG5cbmV4cG9ydCBjb25zdCBGT0xERVJTX1RPX0dFTkVSQVRFID0gW1BBVEhfUFVCTElDX0FWQVRBUlNdO1xuIiwiaW1wb3J0IGRvdGVudiBmcm9tICdkb3RlbnYnO1xuXG5kb3RlbnYuY29uZmlnKCk7XG5cbmNvbnN0IHtcbiAgUE9SVCA9IDgwODAsXG4gIFBBWVBBTF9JRCxcbiAgUEFZUEFMX1NFQ1JFVCxcbiAgREFUQUJBU0VfVVJMLFxuICBTRVNTSU9OX1NFQ1JFVCA9ICdmbWpzZGZiaGplZzc4NHQzNjc0NWdyMjMnLFxufSA9IHByb2Nlc3MuZW52O1xuXG5leHBvcnQge1xuICBQT1JULCBQQVlQQUxfSUQsIFBBWVBBTF9TRUNSRVQsIERBVEFCQVNFX1VSTCwgU0VTU0lPTl9TRUNSRVQsXG59O1xuZXhwb3J0IGNvbnN0IFBBWVBBTF9BUElfVVJMID0gJ2h0dHBzOi8vYXBpLnNhbmRib3gucGF5cGFsLmNvbSc7XG5cbmV4cG9ydCAqIGZyb20gJy4vY29uc3RhbnRzJztcbiIsImltcG9ydCBrbmV4IGZyb20gJ2tuZXgnO1xuaW1wb3J0IHsgREFUQUJBU0VfVVJMIH0gZnJvbSAnQ29uc3RhbnRzL2NvbmZpZ3MnO1xuXG5leHBvcnQgZGVmYXVsdCBrbmV4KHtcbiAgY2xpZW50OiAncGcnLFxuICBjb25uZWN0aW9uOiBEQVRBQkFTRV9VUkwsXG59KTtcbiIsImV4cG9ydCBmdW5jdGlvbiBFcnJvckhhbmRsZXIoZXJyLCByZXEsIHJlcywgbmV4dCkge1xuICB0cnkge1xuICAgIGNvbnN0IHsgbWVzc2FnZSB9ID0gZXJyO1xuICAgIGlmICghbWVzc2FnZSkgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5zZW5kKCk7XG5cbiAgICByZXMuc3RhdHVzKDQwMCkuc2VuZCh7IGVycm9yOiBtZXNzYWdlIH0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHJlcy5zdGF0dXMoNTAwKS5zZW5kKHtcbiAgICAgIGVycm9yOiAnVW5leHBlY3RlZCBzZXJ2ZXIgZXJyb3IhJyxcbiAgICB9KTtcbiAgfVxufVxuIiwiaW1wb3J0IHF1ZXJ5U3RyaW5nIGZyb20gJ3F1ZXJ5c3RyaW5nJztcbmltcG9ydCBheGlvcyBmcm9tICdheGlvcyc7XG5pbXBvcnQgeyBQQVlQQUxfSUQsIFBBWVBBTF9TRUNSRVQsIFBBWVBBTF9BUElfVVJMIH0gZnJvbSAnQ29uc3RhbnRzL2NvbmZpZ3MnO1xuXG4vKipcbiAqIEB0eXBlZGVmIHtvYmplY3R9IGdldFBheXBhbFRva2VuUmV0dXJuRGF0YVxuICogQHByb3BlcnR5IHtzdHJpbmd9IGFjY2Vzc190b2tlblxuICogQHByb3BlcnR5IHtzdHJpbmd9IFtyZWZyZXNoX3Rva2VuXVxuICogQHByb3BlcnR5IHtudW1iZXJ9IGV4cGlyZXNfaW5cbiAqL1xuLyoqXG4gKiBAcGFyYW0ge29iamVjdH0gY29kZXNcbiAqIEBwYXJhbSB7c3RyaW5nfSBbY29kZXMuaW5pdGlhbENvZGVdXG4gKiBAcGFyYW0ge3N0cmluZ30gW2NvZGVzLnJlZnJlc2hUb2tlbl1cbiAqIEByZXR1cm5zIHtQcm9taXNlPGdldFBheXBhbFRva2VuUmV0dXJuRGF0YXxudWxsPn1cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldFBheXBhbFRva2VuKGNvZGVzKSB7XG4gIGNvbnN0IGF1dGggPSBCdWZmZXIuZnJvbShgJHtQQVlQQUxfSUR9OiR7UEFZUEFMX1NFQ1JFVH1gKS50b1N0cmluZygnYmFzZTY0Jyk7XG4gIGNvbnN0IGlzUmVmcmVzaFRva2VuID0gY29kZXMucmVmcmVzaFRva2VuICYmICFjb2Rlcy5pbml0aWFsQ29kZTtcbiAgY29uc3QgcGF5bG9hZCA9IHt9O1xuICBpZiAoaXNSZWZyZXNoVG9rZW4pIHtcbiAgICBwYXlsb2FkLmdyYW50X3R5cGUgPSAncmVmcmVzaF90b2tlbic7XG4gICAgcGF5bG9hZC5yZWZyZXNoX3Rva2VuID0gY29kZXMucmVmcmVzaFRva2VuO1xuICB9IGVsc2Uge1xuICAgIHBheWxvYWQuZ3JhbnRfdHlwZSA9ICdhdXRob3JpemF0aW9uX2NvZGUnO1xuICAgIHBheWxvYWQuY29kZSA9IGNvZGVzLmluaXRpYWxDb2RlO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBjb25zdCB7IGRhdGEgfSA9IGF3YWl0IGF4aW9zLnBvc3QoXG4gICAgICBgJHtQQVlQQUxfQVBJX1VSTH0vdjEvb2F1dGgyL3Rva2VuYCxcbiAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgIHF1ZXJ5U3RyaW5nLnN0cmluZ2lmeShwYXlsb2FkKSxcbiAgICAgIHtcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgIC4uLmF4aW9zLmRlZmF1bHRzLmhlYWRlcnMsXG4gICAgICAgICAgQXV0aG9yaXphdGlvbjogYEJhc2ljICR7YXV0aH1gLFxuICAgICAgICAgICdDb250ZW50LXR5cGUnOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgKTtcblxuICAgIGNvbnN0IHsgYWNjZXNzX3Rva2VuLCByZWZyZXNoX3Rva2VuLCBleHBpcmVzX2luIH0gPSBkYXRhO1xuXG4gICAgY29uc3QgZGF0YVRvUmV0dXJuID0geyBhY2Nlc3NfdG9rZW4sIGV4cGlyZXNfaW4gfTtcblxuICAgIGlmIChyZWZyZXNoX3Rva2VuKSBkYXRhVG9SZXR1cm4ucmVmcmVzaF90b2tlbiA9IHJlZnJlc2hfdG9rZW47XG5cbiAgICByZXR1cm4gZGF0YVRvUmV0dXJuO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG4vKipcbiAqIEB0eXBlZGVmIHtvYmplY3R9IGdldFBheXBhbFVzZXJJbmZvUmV0dXJuRGF0YVxuICogQHByb3BlcnR5IHtzdHJpbmd9IHVzZXJfaWRcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBlbWFpbFxuICovXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBhY3RpdmVUb2tlblxuICogQHJldHVybnMge1Byb21pc2U8Z2V0UGF5cGFsVXNlckluZm9SZXR1cm5EYXRhfG51bGw+fVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0UGF5cGFsVXNlckluZm8oYWN0aXZlVG9rZW4pIHtcbiAgdHJ5IHtcbiAgICBjb25zdCByZXMgPSBhd2FpdCBheGlvcy5nZXQoXG4gICAgICBgJHtQQVlQQUxfQVBJX1VSTH0vdjEvaWRlbnRpdHkvb2F1dGgyL3VzZXJpbmZvP3NjaGVtYT1wYXlwYWx2MS4xYCxcbiAgICAgIHtcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgIEF1dGhvcml6YXRpb246IGBCZWFyZXIgJHthY3RpdmVUb2tlbn1gLFxuICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICk7XG4gICAgY29uc3QgeyBkYXRhIH0gPSByZXM7XG4gICAgY29uc3QgeyB1c2VyX2lkLCBlbWFpbHMgPSBbXSB9ID0gZGF0YTtcblxuICAgIGNvbnN0IHsgdmFsdWU6IHByaW1hcnlFbWFpbCB9ID0gZW1haWxzLmZpbmQoXG4gICAgICAoeyBwcmltYXJ5IH0pID0+IHByaW1hcnkgPT09IHRydWUsXG4gICAgKTtcblxuICAgIHJldHVybiB7IGVtYWlsOiBwcmltYXJ5RW1haWwsIHVzZXJfaWQgfTtcbiAgfSBjYXRjaCAoeyByZXNwb25zZSB9KSB7XG4gICAgY29uc3QgeyBkYXRhIH0gPSByZXNwb25zZTtcbiAgICBjb25zb2xlLmxvZyhkYXRhKTtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuIiwiaW1wb3J0IHsgUm91dGVyIH0gZnJvbSAnZXhwcmVzcyc7XG5cbmltcG9ydCB7IFBBWVBBTF9JRCB9IGZyb20gJ0NvbnN0YW50cy9jb25maWdzJztcblxuaW1wb3J0IHsgZ2V0UGF5cGFsVG9rZW4sIGdldFBheXBhbFVzZXJJbmZvIH0gZnJvbSAnLi9vcGVyYXRpb25zJztcbi8vIGltcG9ydCBqd3QgZnJvbSAnanNvbndlYnRva2VuJztcblxuLy8gLy8gaW1wb3J0IG11bHRlciBmcm9tICdtdWx0ZXInO1xuLy8gaW1wb3J0IHsgU2VjdXJlZCwgVmFsaWRhdGVJRCB9IGZyb20gJ01pZGRsZXdhcmUnO1xuLy8gaW1wb3J0IHsgZ2V0VG9rZW4gfSBmcm9tICcuL2NvbnRyb2xsZXInO1xuXG5jb25zdCByb3V0ZXIgPSBSb3V0ZXIoKTtcblxucm91dGVyXG4gIC5yb3V0ZSgnLycpXG4gIC5nZXQoKHJlcSwgcmVzKSA9PiB7XG4gICAgcmVzLnNlbmQoe1xuICAgICAgbGluazogYGh0dHBzOi8vd3d3LnNhbmRib3gucGF5cGFsLmNvbS9jb25uZWN0P2Zsb3dFbnRyeT1zdGF0aWMmY2xpZW50X2lkPSR7UEFZUEFMX0lEfSZzY29wZT1vcGVuaWQlMjBlbWFpbCZyZWRpcmVjdF91cmk9aHR0cCUzQSUyRiUyRjEyNy4wLjAuMTozMDAwJTJGcGF5cGFsLXJldHVybmAsXG4gICAgfSk7XG4gIH0pXG4gIC5wb3N0KGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICAgIGNvbnN0IHsgY29kZSB9ID0gcmVxLmJvZHk7XG4gICAgY29uc29sZS5sb2coY29kZSk7XG4gICAgLy8gZGVidWdnZXI7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IGdldFBheXBhbFRva2VuKHsgaW5pdGlhbENvZGU6IGNvZGUgfSk7XG4gICAgLy8gY29uc29sZS50aW1lTG9nKCdSZXF1ZXN0Jyk7XG4gICAgaWYgKCFkYXRhKSByZXR1cm4gcmVzLnN0YXR1cyg0MDApLnNlbmQoKTtcbiAgICBjb25zdCBpbmZvID0gYXdhaXQgZ2V0UGF5cGFsVXNlckluZm8oZGF0YS5hY2Nlc3NfdG9rZW4pO1xuXG4gICAgcmVzLnN0YXR1cygyMDApLnNlbmQoeyBkYXRhLCBpbmZvIH0pO1xuICB9KTtcbmV4cG9ydCBkZWZhdWx0IHJvdXRlcjtcbiIsImltcG9ydCB7IFJvdXRlciB9IGZyb20gJ2V4cHJlc3MnO1xuaW1wb3J0IHsgRXJyb3JIYW5kbGVyIH0gZnJvbSAnTWlkZGxld2FyZS9lcnJvcic7XG5pbXBvcnQgVXNlciBmcm9tICdDb3JlL3VzZXIvcm91dGVyJztcblxuY29uc3Qgcm91dGVyID0gUm91dGVyKCk7XG5cbi8vIE93biBSb3V0ZXNcbnJvdXRlci5nZXQoJy8nLCAocmVxLCByZXMpID0+IHtcbiAgcmVzLnNlbmQoJ1RoZXJlIGlzIGFuIEFQSSBoZXJlIScpLnN0YXR1cygyMDApO1xufSk7XG5cbi8vIC0gQXR0YWNoIHJvdXRlc1xuLy8gVXNlcnNcbnJvdXRlci51c2UoJy91c2VyJywgVXNlcik7XG5cbi8vIFBvc3QgTUlERExFV0FSRVxucm91dGVyLnVzZShFcnJvckhhbmRsZXIpO1xuXG4vLyBNSVNDXG5leHBvcnQgZGVmYXVsdCByb3V0ZXI7XG4iLCJpbXBvcnQgeyBSb3V0ZXIgfSBmcm9tICdleHByZXNzJztcbmNvbnN0IHJvdXRlciA9IFJvdXRlcigpO1xuXG5pbXBvcnQgQXBpUm91dGVyIGZyb20gJy4vYXBpJztcblxucm91dGVyLnVzZSgnL2FwaScsIEFwaVJvdXRlcik7XG5cbmV4cG9ydCBkZWZhdWx0IHJvdXRlcjtcbiIsImltcG9ydCBleHByZXNzIGZyb20gJ2V4cHJlc3MnO1xuaW1wb3J0IGNvcnMgZnJvbSAnY29ycyc7XG5cbmltcG9ydCByb3V0ZXMgZnJvbSAnUm91dGVzJztcbmltcG9ydCB7IFBPUlQgfSBmcm9tICdDb25zdGFudHMvY29uZmlncyc7XG5cbmNvbnN0IGFwcCA9IGV4cHJlc3MoKTtcbmFwcC51c2UoY29ycygpKTtcbmFwcC51c2UoZXhwcmVzcy5qc29uKCkpO1xuXG5hcHAudXNlKHJvdXRlcyk7XG5cbmFwcC5saXN0ZW4oUE9SVCwgKCkgPT4ge1xuICBjb25zb2xlLmxvZyhgU2VydmVyIHJ1bm5pbmcgb24gcG9ydDogJHtQT1JUfWApO1xufSk7XG4iXSwibmFtZXMiOlsiUEFUSF9ST09UIiwicmVzb2x2ZSIsIl9fZGlybmFtZSIsIlBBVEhfUFVCTElDIiwiUEFUSF9QVUJMSUNfQVZBVEFSUyIsImpvaW4iLCJkb3RlbnYiLCJjb25maWciLCJQT1JUIiwiUEFZUEFMX0lEIiwiUEFZUEFMX1NFQ1JFVCIsIkRBVEFCQVNFX1VSTCIsIlNFU1NJT05fU0VDUkVUIiwicHJvY2VzcyIsImVudiIsIlBBWVBBTF9BUElfVVJMIiwia25leCIsImNsaWVudCIsImNvbm5lY3Rpb24iLCJFcnJvckhhbmRsZXIiLCJlcnIiLCJyZXEiLCJyZXMiLCJuZXh0IiwibWVzc2FnZSIsInN0YXR1cyIsInNlbmQiLCJlcnJvciIsImdldFBheXBhbFRva2VuIiwiY29kZXMiLCJhdXRoIiwiQnVmZmVyIiwiZnJvbSIsInRvU3RyaW5nIiwiaXNSZWZyZXNoVG9rZW4iLCJyZWZyZXNoVG9rZW4iLCJpbml0aWFsQ29kZSIsInBheWxvYWQiLCJncmFudF90eXBlIiwicmVmcmVzaF90b2tlbiIsImNvZGUiLCJkYXRhIiwiYXhpb3MiLCJwb3N0IiwicXVlcnlTdHJpbmciLCJzdHJpbmdpZnkiLCJoZWFkZXJzIiwiZGVmYXVsdHMiLCJBdXRob3JpemF0aW9uIiwiYWNjZXNzX3Rva2VuIiwiZXhwaXJlc19pbiIsImRhdGFUb1JldHVybiIsImdldFBheXBhbFVzZXJJbmZvIiwiYWN0aXZlVG9rZW4iLCJnZXQiLCJ1c2VyX2lkIiwiZW1haWxzIiwidmFsdWUiLCJwcmltYXJ5RW1haWwiLCJmaW5kIiwicHJpbWFyeSIsImVtYWlsIiwicmVzcG9uc2UiLCJjb25zb2xlIiwibG9nIiwicm91dGVyIiwiUm91dGVyIiwicm91dGUiLCJsaW5rIiwiYm9keSIsImluZm8iLCJ1c2UiLCJVc2VyIiwiQXBpUm91dGVyIiwiYXBwIiwiZXhwcmVzcyIsImNvcnMiLCJqc29uIiwicm91dGVzIiwibGlzdGVuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0lBR08sTUFBTUEsU0FBUyxHQUFHQyxZQUFPLENBQUNDLFNBQVMsR0FBRyxNQUFiLENBQXpCO0FBQ1AsSUFBTyxNQUFNQyxXQUFXLEdBQUdGLFlBQU8sQ0FBQ0QsU0FBUyxHQUFHLFVBQWIsQ0FBM0I7O0FBR1AsSUFBTyxNQUFNSSxtQkFBbUIsR0FBR0MsU0FBSSxDQUNuQ0YsV0FEbUMsRUFFbkMsV0FGbUMsQ0FBaEM7O0lDTFBHLE1BQU0sQ0FBQ0MsTUFBUDtJQUVBLE1BQU07SUFDSkMsRUFBQUEsSUFBSSxHQUFHLElBREg7SUFFSkMsRUFBQUEsU0FGSTtJQUdKQyxFQUFBQSxhQUhJO0lBSUpDLEVBQUFBLFlBSkk7SUFLSkMsRUFBQUEsY0FBYyxHQUFHO0lBTGIsSUFNRkMsT0FBTyxDQUFDQyxHQU5aO0FBUUEsSUFHTyxNQUFNQyxjQUFjLEdBQUcsZ0NBQXZCOztJQ1pRQyxJQUFJLENBQUM7SUFDbEJDLEVBQUFBLE1BQU0sRUFBRSxJQURVO0lBRWxCQyxFQUFBQSxVQUFVLEVBQUVQO0lBRk0sQ0FBRCxDQUFuQjs7SUNITyxTQUFTUSxZQUFULENBQXNCQyxHQUF0QixFQUEyQkMsR0FBM0IsRUFBZ0NDLEdBQWhDLEVBQXFDQyxJQUFyQyxFQUEyQztJQUNoRCxNQUFJO0lBQ0YsVUFBTTtJQUFFQyxN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
