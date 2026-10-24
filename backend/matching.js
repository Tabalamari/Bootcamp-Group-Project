function normalize(value) {
  return String(value || '').trim().toLocaleLowerCase();
}

function normalizeCourse(value) {
  return String(value || '').toLocaleLowerCase().replace(/[^a-z0-9]/g, '');
}

function sharedValues(candidateValues = [], viewerValues = []) {
  const viewer = new Set(viewerValues.map(normalize).filter(Boolean));
  return [...new Map(candidateValues
    .filter(value => viewer.has(normalize(value)))
    .map(value => [normalize(value), value])).values()];
}

const skillFamilies = {
  frontend: ['front end', 'frontend', 'web development', 'react', 'javascript', 'typescript', 'html', 'css', 'vue', 'angular', 'svelte'],
  backend: ['back end', 'backend', 'server side', 'node js', 'python', 'express', 'api development', 'database', 'sql', 'postgresql', 'mongodb'],
  design: ['ui design', 'ux design', 'ui ux', 'user interface', 'user experience', 'figma', 'wireframing', 'prototyping', 'interaction design', 'accessibility'],
  product: ['market research', 'product strategy', 'business analysis', 'business development', 'business planning', 'entrepreneurship', 'strategic planning'],
  growth: ['marketing', 'content marketing', 'customer relationship management', 'customer service', 'digital marketing', 'sales', 'negotiation', 'presentation skills'],
  finance: ['accounting and bookkeeping', 'budgeting and forecasting', 'financial analysis'],
  operations: ['operations management', 'project management', 'supply chain management', 'human resources', 'leadership', 'team management'],
  insights: ['data analysis', 'market research', 'business analysis', 'financial analysis'],
  people: ['human resources', 'leadership', 'negotiation', 'presentation skills', 'project management', 'team management'],
};

function hasSkillFamily(skills = [], family) {
  return skills.some(skill => {
    const value = normalize(skill).replace(/[^a-z0-9]+/g, ' ').trim();
    return skillFamilies[family].some(term => value === term || value.includes(term));
  });
}

function skillsInFamily(skills = [], family) {
  return skills.filter(skill => hasSkillFamily([skill], family));
}

function listSkills(skills, fallback) {
  return skills.slice(0, 2).join(' and ') || fallback;
}

function combineComplementaryReasons(reasons) {
  if (reasons.length < 2) return reasons;
  const supportingDetails = reasons.slice(1).map(reason =>
    reason.replace(/^Complementary (?:skills|strengths|business strengths):\s*/, '')
  );
  return [`${reasons[0]} In the same project, ${supportingDetails.join(' In addition, ')}`];
}

function complementarySkillReasons(candidateSkills = [], viewerSkills = []) {
  const viewerFrontend = hasSkillFamily(viewerSkills, 'frontend');
  const viewerBackend = hasSkillFamily(viewerSkills, 'backend');
  const viewerDesign = hasSkillFamily(viewerSkills, 'design');
  const candidateFrontend = hasSkillFamily(candidateSkills, 'frontend');
  const candidateBackend = hasSkillFamily(candidateSkills, 'backend');
  const candidateDesign = hasSkillFamily(candidateSkills, 'design');
  const reasons = [];

  if (viewerFrontend && candidateBackend) {
    reasons.push('Complementary skills: your front-end skills shape what people see, while their back-end skills can power the data and features behind it. Together, you can build a more complete app.');
  } else if (viewerBackend && candidateFrontend) {
    reasons.push('Complementary skills: their front-end skills shape the user experience, while your back-end skills can power the data and features behind it. Together, you can build a more complete app.');
  }

  if (viewerFrontend && candidateDesign) {
    reasons.push('Complementary skills: their UI/UX design can guide how the app looks and feels, while your front-end skills bring that experience to life.');
  } else if (viewerDesign && candidateFrontend) {
    reasons.push('Complementary skills: your UI/UX design can guide how the app looks and feels, while their front-end skills bring that experience to life.');
  }

  if (viewerDesign && skillsInFamily(candidateSkills, 'product').length) {
    reasons.push(`Complementary strengths: your ${listSkills(skillsInFamily(viewerSkills, 'design'), 'design and accessibility skills')} can shape a clear, usable experience; their ${listSkills(skillsInFamily(candidateSkills, 'product'), 'product and market skills')} can help ensure it solves a real customer need.`);
  } else if (candidateDesign && skillsInFamily(viewerSkills, 'product').length) {
    reasons.push(`Complementary strengths: your ${listSkills(skillsInFamily(viewerSkills, 'product'), 'product and market skills')} can identify the customer need; their ${listSkills(skillsInFamily(candidateSkills, 'design'), 'design and accessibility skills')} can shape a clear, usable experience around it.`);
  }
  if (viewerDesign && skillsInFamily(candidateSkills, 'growth').length) {
    reasons.push(`Complementary strengths: your ${listSkills(skillsInFamily(viewerSkills, 'design'), 'design and accessibility skills')} can make the experience clear and engaging; their ${listSkills(skillsInFamily(candidateSkills, 'growth'), 'marketing and customer skills')} can help bring the right people to it.`);
  } else if (candidateDesign && skillsInFamily(viewerSkills, 'growth').length) {
    reasons.push(`Complementary strengths: your ${listSkills(skillsInFamily(viewerSkills, 'growth'), 'marketing and customer skills')} can bring the right people to the product; their ${listSkills(skillsInFamily(candidateSkills, 'design'), 'design and accessibility skills')} can make the experience clear and engaging.`);
  }
  if (viewerDesign && skillsInFamily(candidateSkills, 'insights').length) {
    reasons.push(`Complementary strengths: your ${listSkills(skillsInFamily(viewerSkills, 'design'), 'design and accessibility skills')} can make information easy to use; their ${listSkills(skillsInFamily(candidateSkills, 'insights'), 'data and analysis skills')} can show which information matters.`);
  } else if (candidateDesign && skillsInFamily(viewerSkills, 'insights').length) {
    reasons.push(`Complementary strengths: your ${listSkills(skillsInFamily(viewerSkills, 'insights'), 'data and analysis skills')} can identify useful information; their ${listSkills(skillsInFamily(candidateSkills, 'design'), 'design and accessibility skills')} can make it easy to understand and use.`);
  }

  const softwareFamilies = ['frontend', 'backend'];
  const businessFamilies = ['product', 'growth', 'insights', 'finance', 'operations', 'people'];
  const viewerSoftware = softwareFamilies.flatMap(family => skillsInFamily(viewerSkills, family));
  const candidateSoftware = softwareFamilies.flatMap(family => skillsInFamily(candidateSkills, family));

  if (viewerSoftware.length && candidateSkills.length) {
    const examples = listSkills(viewerSoftware, 'your software skills');
    if (skillsInFamily(candidateSkills, 'product').length) {
      reasons.push(`Complementary strengths: their ${listSkills(skillsInFamily(candidateSkills, 'product'), 'business and product skills')} can identify a real customer need and shape the product direction; your ${examples} can turn that direction into a working product to test.`);
    } else if (skillsInFamily(candidateSkills, 'growth').length) {
      reasons.push(`Complementary strengths: their ${listSkills(skillsInFamily(candidateSkills, 'growth'), 'customer and growth skills')} can help reach users and learn from feedback; your ${examples} can build the product and digital tools that support that growth.`);
    } else if (skillsInFamily(candidateSkills, 'finance').length) {
      reasons.push(`Complementary strengths: their ${listSkills(skillsInFamily(candidateSkills, 'finance'), 'financial skills')} can check costs and viability; your ${examples} can build useful financial features or automate parts of the workflow.`);
    } else if (skillsInFamily(candidateSkills, 'insights').length) {
      reasons.push(`Complementary strengths: their ${listSkills(skillsInFamily(candidateSkills, 'insights'), 'data and analysis skills')} can reveal patterns and define useful measures; your ${examples} can build the features and data flows needed to act on those insights.`);
    } else if (skillsInFamily(candidateSkills, 'operations').length || skillsInFamily(candidateSkills, 'people').length) {
      const operations = [...skillsInFamily(candidateSkills, 'operations'), ...skillsInFamily(candidateSkills, 'people')];
      reasons.push(`Complementary strengths: their ${listSkills(operations, 'operations and team skills')} can identify process or delivery needs; your ${examples} can build tools or automate steps to support the work.`);
    }
  } else if (candidateSoftware.length && viewerSkills.length) {
    const examples = listSkills(viewerSkills.filter(skill => businessFamilies.some(family => hasSkillFamily([skill], family))), 'your business skills');
    const software = listSkills(candidateSoftware, 'their software skills');
    if (skillsInFamily(viewerSkills, 'product').length) {
      reasons.push(`Complementary strengths: your ${examples} can identify a real customer need and shape the product direction; their ${software} can turn that direction into a working product to test.`);
    } else if (skillsInFamily(viewerSkills, 'growth').length) {
      reasons.push(`Complementary strengths: your ${examples} can help reach users and learn from feedback; their ${software} can build the product and digital tools that support that growth.`);
    } else if (skillsInFamily(viewerSkills, 'finance').length) {
      reasons.push(`Complementary strengths: your ${examples} can check costs and viability; their ${software} can build useful financial features or automate parts of the workflow.`);
    } else if (skillsInFamily(viewerSkills, 'insights').length) {
      reasons.push(`Complementary strengths: your ${examples} can reveal patterns and define useful measures; their ${software} can build the features and data flows needed to act on those insights.`);
    } else if (skillsInFamily(viewerSkills, 'operations').length || skillsInFamily(viewerSkills, 'people').length) {
      reasons.push(`Complementary strengths: your ${examples} can identify process or delivery needs; their ${software} can build tools or automate steps to support the work.`);
    }
  }

  const businessPairs = [
    ['product', 'growth', 'Product and market planning can define who the offer is for, while marketing and customer-facing work can help reach and support those people.'],
    ['product', 'finance', 'Product planning can set priorities, while financial analysis and budgeting can check costs and whether the plan is viable.'],
    ['product', 'operations', 'Business planning can set the direction, while operations and project skills can turn it into a practical delivery plan.'],
    ['product', 'insights', 'Research and analysis can uncover needs and patterns, while product and business planning can turn those findings into decisions.'],
    ['growth', 'finance', 'Marketing and sales can show which activities attract customers, while financial planning can track cost and return.'],
    ['growth', 'operations', 'Customer feedback and outreach can shape the offer, while operations skills help deliver it reliably.'],
    ['growth', 'insights', 'Customer-facing work can test the message, while data analysis can show what is working and where to improve.'],
    ['finance', 'operations', 'Financial planning can set realistic resources, while operations and supply-chain skills can use them to deliver reliably.'],
    ['finance', 'insights', 'Financial records and data analysis together can reveal performance, costs, and trends for better decisions.'],
    ['operations', 'insights', 'Operations experience identifies process needs, while data analysis can measure bottlenecks and improvements.'],
    ['people', 'operations', 'People and team-management skills can support collaboration, while operations and project skills coordinate the work and delivery.'],
  ];
  for (const [left, right, explanation] of businessPairs) {
    const viewerLeft = hasSkillFamily(viewerSkills, left);
    const viewerRight = hasSkillFamily(viewerSkills, right);
    const candidateLeft = hasSkillFamily(candidateSkills, left);
    const candidateRight = hasSkillFamily(candidateSkills, right);
    if ((viewerLeft && candidateRight) || (viewerRight && candidateLeft)) {
      const viewerExamples = viewerSkills.filter(skill => hasSkillFamily([skill], left) || hasSkillFamily([skill], right));
      const candidateExamples = candidateSkills.filter(skill => hasSkillFamily([skill], left) || hasSkillFamily([skill], right));
      reasons.push(`Complementary business strengths: your ${listSkills(viewerExamples, 'business skills')} and their ${listSkills(candidateExamples, 'business skills')} can work together. ${explanation}`);
    }
  }

  return combineComplementaryReasons([...new Set(reasons)].slice(0, 2));
}

function sharedFocusReasons(candidateSkills = [], viewerSkills = []) {
  const focusNames = {
    frontend: 'front-end development', backend: 'back-end development', design: 'design and accessibility',
    product: 'product and business planning', growth: 'marketing and customer growth', finance: 'financial planning',
    operations: 'operations and delivery', insights: 'data and analysis', people: 'team and people development',
  };
  const reasons = [];
  for (const family of Object.keys(focusNames)) {
    if (hasSkillFamily(candidateSkills, family) && hasSkillFamily(viewerSkills, family)) {
      reasons.push(`Shared focus: you both bring ${focusNames[family]} skills, so you could work on that part together and combine your approaches.`);
    }
  }
  return reasons.slice(0, 2);
}

function calculateMatch(candidate, viewer) {
  const goals = sharedValues(candidate.goals, viewer.goals);
  const interests = sharedValues(candidate.interests, viewer.interests);
  const skills = sharedValues(candidate.skills, viewer.skills);
  const crossCourse = Boolean(normalizeCourse(candidate.courseId) && normalizeCourse(viewer.courseId) && normalizeCourse(candidate.courseId) !== normalizeCourse(viewer.courseId));
  const collaborationGoals = goals.filter(goal => ['project collaboration', 'co-founder partnership'].includes(normalize(goal)));
  const complementaryReasons = complementarySkillReasons(candidate.skills, viewer.skills);
  const sharedFocus = sharedFocusReasons(candidate.skills, viewer.skills);
  const reasons = [
    ...(complementaryReasons.length ? [complementaryReasons.join(' ')] : []),
    ...sharedFocus,
  ];

  if (goals.length) reasons.push(`Shared goal: ${goals.join(', ')}.`);
  if (crossCourse && collaborationGoals.some(goal => normalize(goal) === 'project collaboration')) {
    reasons.push('Different courses, with a shared project-collaboration goal.');
  } else if (crossCourse && collaborationGoals.some(goal => normalize(goal) === 'co-founder partnership')) {
    reasons.push('Different courses, with a shared co-founder partnership goal.');
  }
  if (interests.length) reasons.push(`Shared interest: ${interests.join(', ')}.`);
  if (skills.length) reasons.push(`Skills in common: ${skills.join(', ')}. You could collaborate on the same work or learn from each other.`);

  // This ranking is only used to order discovery results; the UI shows profile evidence, not a score.
  const rank = goals.length * 5 + interests.length * 2 + skills.length * 2 + complementaryReasons.length * 7 + sharedFocus.length * 5 + (crossCourse && collaborationGoals.length ? 4 : 0);
  return { rank, reasons: reasons.length ? reasons : ['No shared criteria found yet.'] };
}

module.exports = { calculateMatch };
