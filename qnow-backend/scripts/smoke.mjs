// End-to-end smoke test against a running API.
// Usage: npm run start:dev  (in another terminal), then:
//   SMOKE_EMAIL=you@example.com SMOKE_PASSWORD=... npm run smoke
// It signs in against Neon Auth (NEON_AUTH_BASE_URL from .env) to get a token for the API.
// Alternatively pass a token directly with SMOKE_TOKEN.
// Creates its own data under a throwaway project and deletes it at the end.
import 'dotenv/config';

const BASE = process.env.API_URL ?? 'http://localhost:3000/api';
let passed = 0;
let failed = 0;

/** Signs in with email/password on Neon Auth and returns the JWT our API expects. */
async function getToken() {
  if (process.env.SMOKE_TOKEN) return process.env.SMOKE_TOKEN;
  const base = process.env.NEON_AUTH_BASE_URL?.replace(/\/$/, '');
  const { SMOKE_EMAIL: email, SMOKE_PASSWORD: password } = process.env;
  if (!base || !email || !password) {
    throw new Error('Set SMOKE_EMAIL and SMOKE_PASSWORD (or SMOKE_TOKEN); the API needs a signed-in user.');
  }
  const origin = process.env.FRONTEND_URL ?? 'http://localhost:5173';
  const signIn = await fetch(`${base}/sign-in/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin },
    body: JSON.stringify({ email, password }),
  });
  if (!signIn.ok) throw new Error(`Neon Auth sign-in failed (${signIn.status}): ${await signIn.text()}`);
  const cookie = signIn.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');
  const session = await fetch(`${base}/get-session`, { headers: { Cookie: cookie, Origin: origin } });
  const jwt = session.headers.get('set-auth-jwt');
  if (jwt) return jwt;
  const res = await fetch(`${base}/token`, { headers: { Cookie: cookie, Origin: origin } });
  const data = await res.json().catch(() => ({}));
  if (!data.token) throw new Error('Signed in, but Neon Auth returned no token.');
  return data.token;
}

const TOKEN = await getToken();

async function api(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}

function check(name, condition, detail = '') {
  if (condition) {
    passed++;
    console.log(`  ✔ ${name}`);
  } else {
    failed++;
    console.log(`  ✘ ${name} ${detail}`);
  }
}

const stamp = Date.now();
let project, person;

try {
  console.log('\nProjects');
  project = await api('POST', '/projects', { name: `Smoke ${stamp}` });
  check('create project', project.id && project.status === 'active');
  const projects = await api('GET', '/projects');
  check('list projects includes it', projects.some((p) => p.id === project.id));

  console.log('\nAuth');
  const me = await api('GET', '/me');
  check('token accepted, /me returns the user', !!me.id, JSON.stringify(me));
  const anon = await fetch(`${BASE}/projects`);
  check('requests without a token are rejected', anon.status === 401, `got ${anon.status}`);

  console.log('\nPeople & teams');
  person = await api('POST', '/people', { name: 'Smoke Person', email: `smoke-${stamp}@qnow.dev`, role: 'QA' });
  check('create person', !!person.id);
  const team = await api('POST', '/teams', { projectId: project.id, name: 'Core' });
  await api('POST', `/teams/${team.id}/members/${person.id}`);
  const teamFull = await api('GET', `/teams/${team.id}`);
  check('add team member', teamFull.members.length === 1);

  console.log('\nEvents');
  const future = new Date(Date.now() + 86_400_000).toISOString();
  const event = await api('POST', '/events', { projectId: project.id, title: 'Planning', date: future });
  check('event starts as scheduled', event.status === 'scheduled');
  const agenda = await api('GET', `/events?projectId=${project.id}&status=scheduled`);
  check('event appears in agenda', agenda.some((e) => e.id === event.id));
  const completed = await api('PATCH', `/events/${event.id}`, { status: 'completed' });
  check('event can be completed', completed.status === 'completed');
  await api('POST', `/events/${event.id}/participants/${person.id}`);

  console.log('\nDecisions & tags');
  const decision = await api('POST', '/decisions', {
    eventId: event.id,
    text: 'Use Prisma 7',
    tags: ['Backend', ' backend ', `smoke-${stamp}`],
  });
  check('tags are normalized and deduplicated', decision.tags.length === 2, JSON.stringify(decision.tags.map((t) => t.tag.name)));
  const byTag = await api('GET', `/decisions?tag=smoke-${stamp}`);
  check('filter decisions by tag', byTag.length === 1 && byTag[0].id === decision.id);
  const retagged = await api('PATCH', `/decisions/${decision.id}`, { tags: ['backend'] });
  check('replace decision tags', retagged.tags.length === 1);

  console.log('\nTasks');
  const mk = (text, priority, eventId) => api('POST', '/tasks', { projectId: project.id, text, priority, eventId });
  await mk('low', 'low');
  await mk('high-1', 'high', event.id);
  await mk('medium', 'medium');
  await mk('high-2', 'high');
  const tasks = await api('GET', `/tasks?projectId=${project.id}`);
  const order = tasks.map((t) => t.text).join(',');
  check('ordered by priority, then oldest first', order === 'high-1,high-2,medium,low', order);
  check('task without event allowed', tasks.some((t) => t.text === 'medium' && t.eventId === null));
  const done = await api('PATCH', `/tasks/${tasks[0].id}`, { status: 'done' });
  check('update task status', done.status === 'done');

  console.log('\nEvent detail');
  const detail = await api('GET', `/events/${event.id}`);
  check('includes decisions', detail.decisions.length === 1);
  check('includes tasks', detail.tasks.length === 1);
  check('includes participants', detail.participants.length === 1);

  console.log('\nLast active project');
  const ordered = await api('GET', '/projects');
  check('project with latest activity comes first', ordered[0].id === project.id);
} catch (err) {
  failed++;
  console.log(`\n  ✘ ${err.message}`);
} finally {
  console.log('\nCleanup');
  if (project) {
    await api('DELETE', `/projects/${project.id}`).catch(() => {});
    const gone = await api('GET', `/tasks?projectId=${project.id}`).catch(() => null);
    check('project delete cascades to events/tasks', Array.isArray(gone) && gone.length === 0);
  }
  if (person) await api('DELETE', `/people/${person.id}`).catch(() => {});
  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed ? 1 : 0);
}
