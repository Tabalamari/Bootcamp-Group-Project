import test from 'node:test';
import assert from 'node:assert/strict';
import { createProfileService, validatePhoto, validateProfile } from './profileService.js';

test('profiles isolate users and unsaved edits, and retain saved fields', async () => {
  const service = createProfileService();
  const a = { id: 'a', displayName: 'A', courseId: 'software-development' };
  const b = { id: 'b', displayName: 'B', courseId: 'business-development' };
  const draft = await service.get(a);
  draft.bio = 'Building learning tools'; draft.skills.push('React');
  assert.equal((await service.get(a)).bio, '');
  await service.save(a, draft);
  assert.equal((await service.get(a)).bio, draft.bio);
  assert.equal((await service.get(b)).bio, '');
  await assert.rejects(service.save(a, { ...draft, displayName: ' ' }), /name/);
  assert.ok(validateProfile({ ...draft, skills: ['invented'] }).skills);
});
test('photo validation rejects wrong formats and oversized files', () => {
  assert.equal(validatePhoto({type:'image/png', size:5*1024*1024}), '');
  assert.match(validatePhoto({type:'image/svg+xml', size:100}), /JPG/);
  assert.match(validatePhoto({type:'image/jpeg', size:5*1024*1024+1}), /5 MB/);
});
