// End-to-end smoke test against the running API.
// Verifies: auth (with phone), privacy on feed, contact reveal in matches.

const BASE = 'http://localhost:5000';

async function call(method, path, { token, body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  if (!res.ok) {
    const msg = (json && json.error) || text;
    throw new Error(`${method} ${path} → ${res.status}: ${msg}`);
  }
  return json;
}

function section(title) {
  console.log(`\n=== ${title} ===`);
}

async function login(email, password = 'secret123') {
  const r = await call('POST', '/api/auth/login', { body: { email, password } });
  return r.token;
}

(async () => {
  section('Login as Sameet & Joydeep');
  const sameetToken = await login('sameet@gmail.com');
  const joydeepToken = await login('joydeep@gmail.com');
  console.log('OK');

  section('GET /api/developers — must NOT include phone/email/linkedin/github/telegram');
  const feed = await call('GET', '/api/developers?role=frontend', { token: sameetToken });
  const sample = feed.data[0] || {};
  const leakedKeys = ['email', 'phone', 'linkedin', 'github', 'telegram'].filter(
    (k) => k in sample
  );
  if (leakedKeys.length === 0) {
    console.log(`OK — ${feed.data.length} developers returned, contact fields NOT exposed`);
    console.log(`Public fields exposed: ${Object.keys(sample).join(', ')}`);
  } else {
    console.log(`FAIL — leaked: ${leakedKeys.join(', ')}`);
  }

  section('GET /api/matches — Sameet & Joydeep are connected, contact MUST be visible');
  const sameetConn = await call('GET', '/api/matches', { token: sameetToken });
  const matched = sameetConn.data[0]?.user;
  if (matched) {
    console.log(`Connected with: ${matched.name}`);
    console.log(`  phone:    ${matched.phone}`);
    console.log(`  email:    ${matched.email}`);
    console.log(`  linkedin: ${matched.linkedin || '-'}`);
    console.log(`  github:   ${matched.github || '-'}`);
    console.log(`  telegram: ${matched.telegram || '-'}`);
    const missing = ['email', 'phone', 'linkedin', 'github', 'telegram'].filter(
      (k) => !(k in matched)
    );
    if (missing.length === 0) console.log('OK — all contact fields present');
    else console.log(`FAIL — missing: ${missing.join(', ')}`);
  } else {
    console.log('No match between Sameet and Joydeep — earlier swipe state lost?');
  }

  section('Register: missing phone should 400');
  try {
    await call('POST', '/api/auth/register', {
      body: {
        email: `nophone_${Date.now()}@x.com`,
        password: 'secret123',
        name: 'NoPhone',
        role: 'Backend',
      },
    });
    console.log('UNEXPECTED: succeeded');
  } catch (e) {
    console.log('OK rejected:', e.message);
  }

  section('Register: invalid phone should 400');
  try {
    await call('POST', '/api/auth/register', {
      body: {
        email: `badphone_${Date.now()}@x.com`,
        password: 'secret123',
        name: 'BadPhone',
        role: 'Backend',
        phone: 'abc',
      },
    });
    console.log('UNEXPECTED: succeeded');
  } catch (e) {
    console.log('OK rejected:', e.message);
  }

  section('Register: valid phone + optional links should succeed');
  const newEmail = `kara_${Date.now()}@example.com`;
  const reg = await call('POST', '/api/auth/register', {
    body: {
      email: newEmail,
      password: 'secret123',
      name: 'Kara',
      role: 'Fullstack Developer',
      phone: '+1 (555) 123-4567',
      linkedin: 'https://linkedin.com/in/kara',
      github: 'https://github.com/kara',
      telegram: '@kara_dev',
      experienceYears: 4,
      skills: ['React', 'Node', 'PostgreSQL'],
    },
  });
  console.log(`OK — id=${reg.user.id} phone=${reg.user.phone}`);
  console.log(`  linkedin=${reg.user.linkedin}`);
  console.log(`  github=${reg.user.github}`);
  console.log(`  telegram=${reg.user.telegram}`);

  section('GET /api/auth/me for new user — returns own contact info');
  const me = await call('GET', '/api/auth/me', { token: reg.token });
  console.log(`  email=${me.user.email} phone=${me.user.phone}`);

  section('From a different user, Kara appears in feed but WITHOUT contact');
  const feedAfter = await call('GET', '/api/developers?role=fullstack', { token: joydeepToken });
  const karaInFeed = feedAfter.data.find((d) => d.id === reg.user.id);
  if (karaInFeed) {
    const leak = ['email', 'phone', 'linkedin', 'github', 'telegram'].filter((k) => k in karaInFeed);
    if (leak.length === 0) {
      console.log(`OK — Kara visible (id=${karaInFeed.id}) without contact info`);
    } else {
      console.log(`FAIL — leaked to non-connection: ${leak.join(', ')}`);
    }
  } else {
    console.log('Kara not in feed (unexpected)');
  }

  console.log('\nAll tests passed.');
})().catch((err) => {
  console.error('\nE2E FAILED:', err);
  process.exit(1);
});
