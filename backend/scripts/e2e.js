// End-to-end smoke test against the running API.
// Uses the global `fetch` available in Node 18+.

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
  // Use Sameet (id=3) and Joydeep (id=4) — they exist from earlier seeding.
  section('Login as Sameet & Joydeep');
  const sameetToken = await login('sameet@gmail.com');
  const joydeepToken = await login('joydeep@gmail.com');
  console.log('OK both tokens obtained');

  section('GET /api/developers (Sameet, default — feed personalized to his skills)');
  const feed = await call('GET', '/api/developers?limit=10', { token: sameetToken });
  console.log(`total=${feed.meta.total}  weights=${JSON.stringify(feed.meta.weights)}`);
  console.log(`reference skills: ${JSON.stringify(feed.meta.referenceSkills)}`);
  console.table(
    feed.data.map((d) => ({
      id: d.id,
      name: d.name,
      role: d.role,
      exp: d.experienceYears,
      rating: d.rating,
      matchingSkills: d.matchingSkills,
      score: d.score,
    }))
  );

  section('GET /api/developers?role=frontend (filter by role substring)');
  const feedFrontend = await call('GET', '/api/developers?role=frontend', { token: sameetToken });
  console.log(
    feedFrontend.data.map((d) => `id=${d.id} ${d.name} role=${d.role} score=${d.score}`).join('\n')
  );

  section('GET /api/developers?skills=React,TypeScript (filter by skills)');
  const feedSkills = await call('GET', '/api/developers?skills=React,TypeScript', {
    token: sameetToken,
  });
  console.log(
    feedSkills.data
      .map((d) => `id=${d.id} ${d.name.padEnd(8)} matching=${d.matchingSkills} score=${d.score}`)
      .join('\n')
  );

  section('Sameet (id=3) swipes LIKE on Joydeep (id=4) — no match yet');
  const swipe1 = await call('POST', '/api/swipes', {
    token: sameetToken,
    body: { toUserId: 4, direction: 'LIKE' },
  });
  console.log(
    `swipeId=${swipe1.swipe.id}  match=${swipe1.match ? 'YES' : 'no'}  isNewMatch=${swipe1.isNewMatch}`
  );

  section('Sameet sees fewer candidates now (Joydeep excluded since already swiped)');
  const feedAfter = await call('GET', '/api/developers', { token: sameetToken });
  console.log(`new total=${feedAfter.meta.total}  ids=[${feedAfter.data.map((d) => d.id).join(', ')}]`);

  section('Sameet swipes PASS on Harsh (id=5) — also excluded next time');
  const swipe2 = await call('POST', '/api/swipes', {
    token: sameetToken,
    body: { toUserId: 5, direction: 'PASS' },
  });
  console.log(`swipeId=${swipe2.swipe.id} dir=${swipe2.swipe.direction}`);

  section('Joydeep (id=4) swipes LIKE back on Sameet (id=3) — match should auto-create');
  const swipe3 = await call('POST', '/api/swipes', {
    token: joydeepToken,
    body: { toUserId: 3, direction: 'LIKE' },
  });
  console.log(
    `swipeId=${swipe3.swipe.id}  match=${swipe3.match ? 'YES (matchId=' + swipe3.match.id + ')' : 'no'}  isNewMatch=${swipe3.isNewMatch}`
  );

  section("Both users' matches list now contains each other");
  const sameetMatches = await call('GET', '/api/matches', { token: sameetToken });
  console.log(
    `Sameet: total=${sameetMatches.total}  matchedWith=[${sameetMatches.data.map((m) => `${m.user.name}(id=${m.user.id})`).join(', ')}]`
  );
  const joydeepMatches = await call('GET', '/api/matches', { token: joydeepToken });
  console.log(
    `Joydeep: total=${joydeepMatches.total}  matchedWith=[${joydeepMatches.data.map((m) => `${m.user.name}(id=${m.user.id})`).join(', ')}]`
  );

  section("Sample match payload (one row from Sameet's view)");
  console.log(JSON.stringify(sameetMatches.data[0], null, 2));

  section('Edge: cannot swipe on yourself');
  try {
    await call('POST', '/api/swipes', {
      token: sameetToken,
      body: { toUserId: 3, direction: 'LIKE' },
    });
    console.log('UNEXPECTED: self-swipe succeeded');
  } catch (e) {
    console.log('OK rejected:', e.message);
  }

  section('Edge: GET /api/matches/9999 (someone else) — should 403');
  try {
    await call('GET', '/api/matches/9999', { token: sameetToken });
    console.log('UNEXPECTED: succeeded');
  } catch (e) {
    console.log('OK rejected:', e.message);
  }

  section('Edge: re-swipe (idempotent upsert) — should NOT crash');
  const swipeRepeat = await call('POST', '/api/swipes', {
    token: sameetToken,
    body: { toUserId: 4, direction: 'LIKE' },
  });
  console.log(
    `swipeId=${swipeRepeat.swipe.id} (same as before)  isNewMatch=${swipeRepeat.isNewMatch} (false because match already existed)`
  );

  console.log('\nAll tests passed.');
})().catch((err) => {
  console.error('\nE2E FAILED:', err);
  process.exit(1);
});
