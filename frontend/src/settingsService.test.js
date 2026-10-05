import test from 'node:test';
import assert from 'node:assert/strict';
import { createSettingsService, validateSettings, validatePassword } from './settingsService.js';
const user={id:'one',displayName:'Malak',courseId:'software-dev'};
test('account edits validate, isolate users and preserve saved state on failure',async()=>{
  const service=createSettingsService();
  assert.ok(validateSettings({displayName:' ',courseId:'unknown'}).displayName);
  await assert.rejects(service.save(user,{displayName:'Malak',courseId:'inactive'}));
  await service.save(user,{displayName:' Malak Updated ',courseId:'business-dev'});
  await assert.rejects(service.save(user,{displayName:'Unsuccessful',courseId:'software-dev'},true));
  assert.deepEqual(await service.get(user),{displayName:'Malak Updated',courseId:'business-dev'});
  assert.equal((await service.get({...user,id:'two'})).displayName,'Malak');
  assert.equal((await createSettingsService().get(user)).displayName,'Malak');
});
test('password changes require current password, confirmation and valid new password',async()=>{
  const service=createSettingsService();
  const values={currentPassword:'DemoPass123!',newPassword:'NewSample456!',confirmPassword:'NewSample456!'};
  assert.ok(validatePassword({...values,confirmPassword:'different'}).confirmPassword);
  assert.ok(validatePassword({...values,newPassword:'short'}).newPassword);
  await assert.rejects(service.password(user,{...values,currentPassword:'wrong'}));
  await assert.rejects(service.password(user,values,true));
  await service.password(user,values);
  await assert.rejects(service.password(user,values));
  await service.password(user,{currentPassword:'NewSample456!',newPassword:'AnotherSample789!',confirmPassword:'AnotherSample789!'});
  assert.equal('password' in await service.get(user),false);
});
