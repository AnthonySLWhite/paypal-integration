import axios from 'axios';
import { store } from 'Store';
import { logout } from 'Operations/auth';

const localhostDelay = 500;
const useDelay = false;

axios.interceptors.request.use(
  reqConfig => {
    const { token } = store.getState().session;

    const newConfig = reqConfig;

    if (token) newConfig.headers.Authorization = `Bearer ${token}`;

    if (useDelay) {
      return new Promise(resolve => setTimeout(() => resolve(reqConfig), localhostDelay));
    }

    return newConfig;
  },
  err => Promise.reject(err),
);

axios.interceptors.response.use(
  response => response,
  error => {
    const { response } = error;
    const { status, data } = response || {};
    const { errors = [] } = data || {};
    const [err] = errors || [];
    const { errorCode } = err || {};
    const shouldLogout = !response || status === 401 || status === 500 || errorCode === 4;
    if (shouldLogout) {
      logout();
    }
    return Promise.reject(error);
  },
);
