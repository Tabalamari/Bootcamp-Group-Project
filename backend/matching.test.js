const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateMatch } = require('./matching');

test('ranks a cross-course shared project goal above weaker profile overlap', () => {
  const viewer = { courseId: 'software-dev', goals: ['Project collaboration'], interests: ['Design'], skills: ['React'] };
  const strong = { courseId: 'business-dev', goals: ['Project collaboration'], interests: ['Design'], skills: ['Market research'] };
  const weaker = { courseId: 'software-dev', goals: [], interests: ['Design'], skills: ['React'] };
  const strongMatch = calculateMatch(strong, viewer);
  const weakMatch = calculateMatch(weaker, viewer);

  assert.ok(strongMatch.rank > weakMatch.rank);
  assert.ok(strongMatch.reasons.includes('Shared goal: Project collaboration.'));
  assert.ok(strongMatch.reasons.some(reason => reason.startsWith('Different courses')));
});

test('matching is case-insensitive and gives no relevance to unrelated profiles', () => {
  const result = calculateMatch(
    { courseId: 'business-dev', goals: ['project collaboration'], interests: ['DESIGN'], skills: [] },
    { courseId: 'software-dev', goals: ['Project Collaboration'], interests: ['Design'], skills: [] }
  );

  assert.equal(result.rank, 11);
  assert.deepEqual(result.reasons, [
    'Shared goal: project collaboration.',
    'Different courses, with a shared project-collaboration goal.',
    'Shared interest: DESIGN.'
  ]);
  assert.deepEqual(calculateMatch({ courseId: 'business-dev' }, { courseId: 'software-dev' }).reasons, ['No shared criteria found yet.']);
});

test('explains front-end and back-end skills as complementary parts of building an app', () => {
  const result = calculateMatch(
    { skills: ['Node.js', 'Python'] },
    { skills: ['React', 'JavaScript'] }
  );

  assert.ok(result.rank >= 7);
  assert.ok(result.reasons.some(reason => reason.includes('your front-end skills') && reason.includes('their back-end skills')));
});

test('explains UI design and front-end implementation as complementary', () => {
  const result = calculateMatch(
    { skills: ['UI design', 'Figma'] },
    { skills: ['React'] }
  );

  assert.ok(result.reasons.some(reason => reason.includes('UI/UX design') && reason.includes('bring that experience to life')));
});

test('combines multiple complementary skill explanations into one point', () => {
  const result = calculateMatch(
    { skills: ['Node.js', 'Product strategy'] },
    { skills: ['React', 'UI design'] }
  );

  assert.equal(result.reasons.filter(reason => reason.includes('Complementary')).length, 1);
  const explanation = result.reasons.find(reason => reason.includes('Complementary'));
  assert.ok(explanation.includes('your UI design'));
  assert.ok(explanation.includes('front-end skills'));
  assert.ok(explanation.includes('In the same project'));
  assert.equal((explanation.match(/Complementary/g) || []).length, 1);
});

test('explains shared skills as a basis for working or learning together', () => {
  const result = calculateMatch(
    { skills: ['React'] },
    { skills: ['React'] }
  );

  assert.ok(result.reasons.some(reason => reason.includes('Skills in common: React') && reason.includes('collaborate')));
});

test('explains different skills in the same field as a shared collaboration focus', () => {
  const result = calculateMatch(
    { skills: ['JavaScript'] },
    { skills: ['React'] }
  );

  assert.ok(result.reasons.some(reason => reason.includes('Shared focus:') && reason.includes('front-end development')));
});

test('connects business skills to practical software project contributions', () => {
  const viewer = { skills: ['React'] };
  const examples = [
    ['Market research', 'customer need'],
    ['Marketing', 'reach users'],
    ['Customer service', 'feedback'],
    ['Accounting and bookkeeping', 'costs and viability'],
    ['Budgeting and forecasting', 'costs and viability'],
    ['Financial analysis', 'costs and viability'],
    ['Operations management', 'process or delivery needs'],
    ['Project management', 'process or delivery needs'],
    ['Supply chain management', 'process or delivery needs'],
    ['Data analysis', 'patterns'],
    ['Human resources', 'process or delivery needs'],
    ['Leadership', 'process or delivery needs'],
    ['Team management', 'process or delivery needs'],
    ['Negotiation', 'reach users'],
    ['Presentation skills', 'reach users'],
    ['Sales', 'reach users'],
    ['Content marketing', 'reach users'],
    ['Digital marketing', 'reach users'],
    ['Customer relationship management', 'reach users'],
    ['Product strategy', 'customer need'],
    ['Business analysis', 'customer need'],
    ['Business development', 'customer need'],
    ['Business planning', 'customer need'],
    ['Entrepreneurship', 'customer need'],
    ['Strategic planning', 'customer need'],
  ];

  for (const [businessSkill, usefulContribution] of examples) {
    const result = calculateMatch({ skills: [businessSkill] }, viewer);
    assert.ok(result.reasons.some(reason => reason.includes('Complementary strengths:') && reason.includes(usefulContribution)), `${businessSkill} should explain a useful contribution to a software project`);
  }
});

test('business profiles can explain complementary planning, marketing, finance, operations, and insight skills', () => {
  const cases = [
    [['Market research'], ['Digital marketing'], 'reach and support'],
    [['Business planning'], ['Financial analysis'], 'check costs'],
    [['Operations management'], ['Budgeting and forecasting'], 'set realistic resources'],
    [['Data analysis'], ['Product strategy'], 'turn those findings into decisions'],
  ];
  for (const [viewerSkills, candidateSkills, explanation] of cases) {
    const result = calculateMatch({ skills: candidateSkills }, { skills: viewerSkills });
    assert.ok(result.reasons.some(reason => reason.includes(explanation)), `${viewerSkills[0]} and ${candidateSkills[0]} should have a useful explanation`);
  }
});
