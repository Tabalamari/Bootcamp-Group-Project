import test from 'node:test';
import assert from 'node:assert/strict';
import {samplePeople,findPeople,fitReasons} from './discoveryService.js';
const filters={query:'',courseId:'',skills:[],interests:[],goals:[]};
test('discovery combines OR within groups and AND across groups',()=>{
  assert.equal(findPeople(samplePeople,{...filters,skills:['React','Python']},'me').length,2);
  assert.equal(findPeople(samplePeople,{...filters,skills:['React','Python'],interests:['Sustainability']},'me')[0].id,'sample-leo');
  assert.equal(findPeople(samplePeople,{...filters,query:'MARKET',courseId:'business-dev'},'me').length,2);
});
test('discovery excludes self and suspended people and handles empty results',()=>{
  assert.equal(findPeople(samplePeople,filters,'sample-amara').length,3);
  assert.equal(findPeople(samplePeople.map(p=>({...p,status:'suspended'})),filters,'me').length,0);
  assert.equal(findPeople(samplePeople,{...filters,query:'no such person'},'me').length,0);
});
test('fit reasons reflect actual profile intersections without invented scores',()=>{
  assert.deepEqual(fitReasons(samplePeople[0],{courseId:'software-dev',skills:[],goals:[],interests:[]}),['No shared criteria found yet.']);
  const reasons=fitReasons(samplePeople[0],{courseId:'software-development',goals:['Project collaboration'],interests:['Sustainability'],skills:[]});
  assert.ok(reasons.includes('Shared interest: Sustainability.'));
  assert.ok(reasons.some(r=>r.startsWith('Different courses')));
});
