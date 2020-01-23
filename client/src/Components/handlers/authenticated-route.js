import React from 'react';
import { store } from 'Store';
import { Route, Redirect } from 'react-router-dom';
import { Routes } from 'Constants';

/** @param {import('react-router-dom').RouteProps} props  */
export default function AuthenticatedRoute(props) {
  const { session } = store.getState();
  const { isAuthenticated } = session;
  if (isAuthenticated) return <Route {...props} />;
  return <Redirect to={Routes.index} />;
}
