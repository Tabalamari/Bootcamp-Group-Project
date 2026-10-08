import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemoAuth, courses } from './demoAuth.js';
import { validateAuth } from './validation.js';

test('registration requires name, email, password and course', () => {
  assert.deepEqual(Object.keys(validateAuth({ displayName: ' ', email: 'bad', password: 'short', courseId: '' }, true)), ['displayName', 'email', 'password', 'courseId']);
});
test('demo registration, duplicate detection, login and logout', async () => {
  const auth = createDemoAuth();
  const values = { displayName: 'Test Learner', email: ' LEARNER@example.com ', password: 'Example123!', courseId: courses[1].id };
  const user = await auth.register(values);
  assert.equal(user.email, 'learner@example.com');
  assert.equal(user.courseId, courses[1].id);
  assert.equal('password' in user, false);
  await assert.rejects(auth.register(values), /already/);
  await auth.logout();
  assert.equal(await auth.session(), null);
  await assert.rejects(auth.login({ email: values.email, password: 'wrong' }), /incorrect/);
  assert.deepEqual(await auth.login(values), user);
});
test('demo rejects unknown courses and resets in a new instance', async () => {
  const auth = createDemoAuth();
  await assert.rejects(auth.register({ displayName: 'Test', email: 'test@example.com', password: 'Example123!', courseId: 'unknown' }), /available course/);
  assert.equal(await createDemoAuth().session(), null);
});
