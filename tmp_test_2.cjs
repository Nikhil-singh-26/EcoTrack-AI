const axios = require('axios');
const baseURL = 'https://foo.com/api';
const api = axios.create({ baseURL });
const uri = api.getUri({ url: 'energy' });
console.log('Result:', uri);
if (uri === 'https://foo.com/api/energy') {
  console.log('MATCH WITH SLASH');
} else if (uri === 'https://foo.com/apienergy') {
  console.log('CONCATENATED WITHOUT SLASH');
} else {
  console.log('SOMETHING ELSE');
}
