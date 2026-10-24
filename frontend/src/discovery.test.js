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
test('discovery ranks shared collaboration goals and cross-course learners first',()=>{
  const viewer={courseId:'software-dev',goals:['Project collaboration'],interests:['Design'],skills:['React']};
  const candidates=[
    {id:'generic',displayName:'A Generic Match',status:'active',courseId:'software-dev',bio:'',goals:[],interests:['Design'],skills:['React']},
    {id:'strong',displayName:'Z Cross-track Match',status:'active',courseId:'business-dev',bio:'',goals:['Project collaboration'],interests:['Design'],skills:['Market research']},
  ];
  assert.equal(findPeople(candidates,filters,'viewer',viewer)[0].id,'strong');
});

test('fit reasons explain complementary development and design skills',()=>{
  const viewer={courseId:'software-dev',skills:['React'],goals:[],interests:[]};
  const backend=fitReasons({courseId:'software-dev',skills:['Node.js'],goals:[],interests:[]},viewer);
  const designer=fitReasons({courseId:'business-dev',skills:['UI design'],goals:[],interests:[]},viewer);
  assert.ok(backend.some(reason=>reason.includes('front-end skills')&&reason.includes('back-end skills')&&reason.includes('complete app')));
  assert.ok(designer.some(reason=>reason.includes('UI/UX design')&&reason.includes('bring that experience to life')));
});

test('fit reasons combine multiple complementary skill explanations into one point',()=>{
  const reasons=fitReasons({skills:['Node.js','Product strategy'],goals:[],interests:[]},{skills:['React','UI design'],goals:[],interests:[]});
  assert.equal(reasons.filter(reason=>reason.includes('Complementary')).length,1);
  const explanation=reasons.find(reason=>reason.includes('Complementary'));
  assert.ok(explanation.includes('your UI design'));
  assert.ok(explanation.includes('front-end skills'));
  assert.ok(explanation.includes('In the same project'));
  assert.equal((explanation.match(/Complementary/g)||[]).length,1);
});

test('fit reasons explain shared professional focus even when exact skills differ',()=>{
  const reasons=fitReasons({skills:['JavaScript'],goals:[],interests:[]},{skills:['React'],goals:[],interests:[]});
  assert.ok(reasons.some(reason=>reason.includes('Shared focus:')&&reason.includes('front-end development')));
});

test('fit reasons connect business development skills to useful product work',()=>{
  const viewer={skills:['React'],goals:[],interests:[]};
  const checks=[
    ['Market research','customer need'],
    ['Digital marketing','reach users'],
    ['Financial analysis','costs and viability'],
    ['Operations management','process or delivery needs'],
    ['Data analysis','patterns'],
  ];
  for(const [skill,contribution] of checks){
    const reasons=fitReasons({skills:[skill],goals:[],interests:[]},viewer);
    assert.ok(reasons.some(reason=>reason.includes(contribution)),`${skill} should explain how it helps a software project`);
  }
});

test('business skills in different areas explain how their work fits together',()=>{
  const reasons=fitReasons({skills:['Digital marketing'],goals:[],interests:[]},{skills:['Market research'],goals:[],interests:[]});
  assert.ok(reasons.some(reason=>reason.includes('Complementary business strengths:')&&reason.includes('reach and support')));
});
