'use strict';

// Offline routing is the default. A deployment may later opt into catalog discovery.
async function searchUpstream() {
  return [];
}
module.exports = { searchUpstream };
