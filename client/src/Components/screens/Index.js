import React, { Component } from 'react';
import { getPaypalUrl } from 'Operations/paypal';

export default class Index extends Component {
  state = {
    link: '',
  };

  componentDidMount = async () => {
    const link = await getPaypalUrl();
    if (!link) return;
    this.setState({ link });
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
