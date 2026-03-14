'use strict';

const app = require('../server');

function normalizeRequestUrl(req) {
  try {
    const url = new URL(req.url, 'http://localhost');

    const queryPath = url.searchParams.get('__path');
    if (queryPath) {
      url.searchParams.delete('__path');
      const search = url.searchParams.toString();
      req.url = queryPath + (search ? `?${search}` : '');
      return;
    }

    const pathname = url.pathname;

    if (pathname.startsWith('/api/index.js/')) {
      const restoredPath = pathname.replace('/api/index.js', '');
      req.url = restoredPath + url.search;
      return;
    }

    if (pathname === '/api/index.js') {
      req.url = '/';
      return;
    }
  } catch (_) {
    return;
  }
}

module.exports = (req, res) => {
  normalizeRequestUrl(req);
  return app(req, res);
};
