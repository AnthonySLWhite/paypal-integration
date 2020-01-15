import axios from 'axios';
import { E } from 'Constants';

export async function getPaypalUrl() {
  try {
    const res = await axios.get(E.paypal.getLink());
    const { data } = res;
    if (data) return data.link;
    return null;
  } catch (error) {
    // console.log(error);
    return null;
  }
}
