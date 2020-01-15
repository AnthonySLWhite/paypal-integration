import axios from 'axios';
import { E } from 'Constants';
import { authentication } from 'Actions/session';

export async function signIn(code) {
  try {
    const res = await axios.post(E.auth.signIn(), {
      code,
    });
    const { data } = res;
    const { user, token } = data;
    authentication({
      token,
      user,
    });
    return true;
  } catch (error) {
    return false;
  }
}
