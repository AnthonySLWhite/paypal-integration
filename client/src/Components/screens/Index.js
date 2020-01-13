import React, { Component } from 'react';
import axios from 'axios';
import { API_ENDPOINT } from 'Constants/configs';

export default class Index extends Component {
  state = {
    link: '',
  };

  componentDidMount = async () => {
    try {
      const res = await axios.get(`${API_ENDPOINT}/users`);
      console.log(res.data);
      const { link } = res.data;
      this.setState({ link });
    } catch (error) {
      console.log(error);
    }
  };

  render() {
    const { link } = this.state;
    return (
      <div className="bg-blue-300 h-screen flex flex-col justify-center items-center">
        <a
          className="bg-blue-500 text-white px-16 py-4 hover:bg-blue-400"
          href={link}
        >
          Login with PayPal
        </a>
      </div>
    );
  }
}
