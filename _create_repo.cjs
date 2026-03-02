const https = require('https');
const data = JSON.stringify({ name: 'beeexpress-control-panel', public: true, description: 'Bee Express Super Admin Control Panel' });

// Get token from git credential manager
const { execSync } = require('child_process');
let token = '';
try {
  const input = 'protocol=https\nhost=github.com\n\n';
  const result = execSync('git credential fill', { input, encoding: 'utf8' });
  const match = result.match(/password=(.+)/);
  if (match) token = match[1].trim();
} catch (e) {
  console.error('Could not get git credentials:', e.message);
  process.exit(1);
}

const options = {
  hostname: 'api.github.com',
  path: '/user/repos',
  method: 'POST',
  headers: {
    'Authorization': `token ${token}`,
    'Content-Type': 'application/json',
    'User-Agent': 'node',
    'Content-Length': Buffer.byteLength(data),
  },
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    const json = JSON.parse(body);
    if (json.html_url) {
      console.log('SUCCESS:', json.html_url);
    } else {
      console.log('Response:', json.message || body);
    }
  });
});
req.on('error', (e) => console.error(e));
req.write(data);
req.end();
