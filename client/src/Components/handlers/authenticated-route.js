import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { Routes } from 'Constants';
import { connect } from 'react-redux';

/** @param {import('react-router-dom').RouteProps} props  */
function AuthenticatedRoute(props) {
  const { isAuthenticated, ...parsedProps } = props;

  if (isAuthenticated) return <Route {...parsedProps} />;
  return <Redirect to={Routes.index} />;
}

/** @param {import('Store').StoreState} store */
function mapStateToProps(store) {
  const { session } = store;
  const { isAuthenticated } = session;

  return {
    isAuthenticated,
  };
}
export default connect(mapStateToProps)(AuthenticatedRoute);
