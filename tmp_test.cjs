const axios = require('axios');
const baseURL = 'https://foo.com/api';
const api = axios.create({ baseURL });

const test = (url) => {
  const uri = api.getUri({ url });
  console.log(`URL: "${url}" -> URI: "${uri}"`);
};

test('/api/energy');
test('api/energy');
test('/energy');
test('energy');
test('https://bar.com/other');
