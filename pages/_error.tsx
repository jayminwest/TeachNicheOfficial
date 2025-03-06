import React from 'react';

interface ErrorProps {
  statusCode?: number;
}

export default function Error({ statusCode }: ErrorProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '1rem' }}>
      <h1>
        {statusCode
          ? `An error ${statusCode} occurred on the server.`
          : 'An error occurred on the client.'}
      </h1>
    </div>
  );
}

interface ErrorInitialProps {
  res?: {
    statusCode?: number;
  };
  err?: {
    statusCode?: number;
  };
}

Error.getInitialProps = ({ res, err }: ErrorInitialProps) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};
