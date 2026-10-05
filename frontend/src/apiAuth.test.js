import test from 'node:test';
import assert from 'node:assert/strict';
import { createApiAuth } from './apiAuth.js';
const memory = () => { const values = new Map(); return {getItem: k => values.get(k),setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)}; };
test('API adapter stores token, sends bearer header, restores session and logs out', async () => {
  const calls=[]; const user={id:'one'};
  const auth=createApiAuth({storage:memory(),fetcher:async(path,options)=>{calls.push({path,options});return new Response(JSON.stringify(path.endsWith('/login')?{token:'sample',user}:path.endsWith('/me')?{user}:{message:'OK'}));}});
  assert.equal(await auth.session(),null);
  assert.deepEqual(await auth.login({email:'a@example.com',password:'example'}),user);
  assert.deepEqual(await auth.session(),user);
  assert.equal(calls[1].options.headers.Authorization,'Bearer sample');
  await auth.logout(); assert.equal(await auth.session(),null);
});
test('invalid session clears token; network errors retain token for retry',async()=>{
  const storage=memory();storage.setItem('bootcamp-connect-token','sample');
  const auth=createApiAuth({storage,fetcher:async()=>new Response(JSON.stringify({error:'Invalid session'}),{status:401})});
  assert.equal(await auth.session(),null);assert.equal(storage.getItem('bootcamp-connect-token'),undefined);
  storage.setItem('bootcamp-connect-token','sample');
  const offline=createApiAuth({storage,fetcher:async()=>{throw Error('offline')}});
  await assert.rejects(offline.session(),/reach the server/);assert.equal(storage.getItem('bootcamp-connect-token'),'sample');
});
