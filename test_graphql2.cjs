const https = require('https');

const data = JSON.stringify({
  query: `query {
    listProcesos {
      items {
        id
        nombre
      }
    }
  }`
});

const options = {
  hostname: 'oufcxu7fx5g63pwbene72grzbm.appsync-api.us-east-1.amazonaws.com',
  port: 443,
  path: '/graphql',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'da2-4kv3pcl7vbdwdez7wqhnavkpxi',
    'Content-Length': data.length
  }
};

const req = https.request(options, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    console.log("GraphQL Response:", body);
  });
});

req.write(data);
req.end();
