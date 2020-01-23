import React from 'react';
import { signIn } from 'Operations/auth';
import { parse } from 'query-string';
import { Routes } from 'Constants';

export function PaypalReturn(props) {
  const { history, location } = props;
  const { search } = location;
  const { code } = parse(search);

  signIn(code).then(res => {
    if (!res) return history.push(Routes.app);
  });

  return <h1>Success</h1>;
}
