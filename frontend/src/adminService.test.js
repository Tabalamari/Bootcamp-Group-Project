import test from 'node:test';
import assert from 'node:assert/strict';
import { createAdminService } from './adminService.js';
const actor = { role: 'admin' };
test('admin sample operations reject learner access and return independent copies', async () => {
  const service = createAdminService();
  await assert.rejects(service.load({ role: 'learner' }));
  await assert.rejects(service.save({}, 'courses', { name: 'New' }));
  await assert.rejects(service.setActive({}, 'courses', 'software-dev', false));
  await assert.rejects(service.updateUser({}, 'sample-amara', { status: 'suspended' }));
  const copy = await service.load(actor); copy.courses[0].name = 'Changed';
  assert.equal((await service.load(actor)).courses[0].name, 'Software development');
});
test('names normalize, duplicates fail, failures retain records, and inactive references survive', async () => {
  const service = createAdminService();
  await service.save(actor, 'categories', { name: '  Product   design ' });
  const category = (await service.load(actor)).categories.at(-1);
  assert.equal(category.name, 'Product design');
  await assert.rejects(service.save(actor, 'categories', { name: 'PRODUCT design' }));
  await assert.rejects(service.save(actor, 'skills', { name: ' ' }));
  await service.save(actor, 'skills', { name: 'Prototyping', categoryId: category.id });
  await service.setActive(actor, 'categories', category.id, false);
  await assert.rejects(service.save(actor, 'skills', { name: 'New skill', categoryId: category.id }));
  const skill = (await service.load(actor)).skills.at(-1);
  await service.save(actor, 'skills', { ...skill, name: 'Rapid prototyping' });
  assert.equal((await service.load(actor)).skills.at(-1).categoryId, category.id);
  await assert.rejects(service.save(actor, 'courses', { name: 'Test' }, true));
  assert.equal((await service.load(actor)).courses.length, 2);
});
test('user changes retain inactive existing courses and reject new inactive assignments', async () => {
  const service = createAdminService();
  await service.setActive(actor, 'courses', 'business-dev', false);
  await service.updateUser(actor, 'sample-amara', { courseId: 'business-dev', status: 'suspended' });
  await assert.rejects(service.updateUser(actor, 'sample-daniel', { courseId: 'business-dev', status: 'active' }));
  await service.updateUser(actor, 'sample-amara', { courseId: 'software-dev', status: 'active' });
  const user = (await service.load(actor)).users.find(u => u.id === 'sample-amara');
  assert.equal(user.status, 'active'); assert.equal(user.courseId, 'software-dev');
  assert.equal('messages' in user, false);
});
