import test from 'node:test';
import assert from 'node:assert/strict';
import { createMessageService } from './messageService.js';

test('conversations reuse recipients and isolate accounts, drafts and histories', async () => {
  const service = createMessageService();
  service.open('one', 'sample-amara'); service.open('one', 'sample-amara');
  service.open('one', 'sample-daniel');
  service.saveDraft('one', 'sample-amara', 'Hello Amara');
  service.saveDraft('one', 'sample-daniel', 'Hello Daniel');
  await service.send('one', 'sample-amara', 'Hello Amara');
  assert.equal(service.list('one').length, 2);
  assert.equal(service.list('one')[0].messages[0].text, 'Hello Amara');
  assert.equal(service.draft('one', 'sample-amara'), '');
  assert.equal(service.draft('one', 'sample-daniel'), 'Hello Daniel');
  assert.deepEqual(service.list('two'), []);
  const copy = service.list('one'); copy[0].messages[0].text = 'Changed';
  assert.equal(service.list('one')[0].messages[0].text, 'Hello Amara');
  assert.throws(() => service.open('sample-amara', 'sample-amara'));
  assert.throws(() => service.open('one', 'unknown'));
});
test('failed sends preserve drafts, retry sends once, and blank or oversized messages fail', async () => {
  const service = createMessageService(); service.open('one', 'sample-amara');
  service.saveDraft('one', 'sample-amara', 'Try again');
  await assert.rejects(service.send('one', 'sample-amara', 'Try again', true));
  assert.equal(service.draft('one', 'sample-amara'), 'Try again');
  assert.equal(service.list('one')[0].messages.length, 0);
  await service.send('one', 'sample-amara', 'Try again');
  assert.equal(service.list('one')[0].messages.length, 1);
  await assert.rejects(service.send('one', 'sample-amara', '   '));
  await assert.rejects(service.send('one', 'sample-amara', 'a'.repeat(2001)));
});
test('incoming messages update subscribers and unread clears only for the opened conversation', () => {
  const service = createMessageService(); let updates = 0;
  const unsubscribe = service.subscribe(() => updates++);
  service.simulateIncoming('one'); service.simulateIncoming('one', 'sample-daniel');
  service.read('one', 'sample-amara');
  assert.equal(service.list('one').find(c => c.person.id === 'sample-amara').unread, 0);
  assert.equal(service.list('one').find(c => c.person.id === 'sample-daniel').unread, 1);
  assert.ok(updates > 0); unsubscribe();
  const previous = updates; service.simulateIncoming('one'); assert.equal(updates, previous);
});
