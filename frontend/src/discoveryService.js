export const samplePeople = [
  {id:'sample-amara',displayName:'Amara Lewis',courseId:'business-dev',bio:'Turning a sustainable shopping idea into a useful first product. Looking for a developer to build with.',skills:['Market research','Product strategy'],interests:['Sustainability'],goals:['Project collaboration'],status:'active'},
  {id:'sample-daniel',displayName:'Daniel Park',courseId:'software-dev',bio:'Frontend learner interested in accessible experiences. Happy to swap feedback and learn together.',skills:['React','Accessibility'],interests:['Education','Design'],goals:['Peer support'],status:'active'},
  {id:'sample-sofia',displayName:'Sofia Ahmed',courseId:'business-dev',bio:'Exploring a learning community idea and looking for a technical co-founder.',skills:['Marketing','Market research'],interests:['Education','Entrepreneurship'],goals:['Co-founder partnership'],status:'active'},
  {id:'sample-leo',displayName:'Leo Williams',courseId:'software-dev',bio:'Backend-minded builder curious about climate tech. Keen to join a small project team.',skills:['Node.js','Python'],interests:['Sustainability','Technology'],goals:['Project collaboration','Friendship'],status:'active'},
];
export const normalizeCourse = value => ({'software-development':'software-dev','business-development':'business-dev'})[value] || value;
const normalizeValue=value=>String(value||'').trim().toLowerCase();
const skillFamilies={
  frontend:['front end','frontend','web development','react','javascript','typescript','html','css','vue','angular','svelte'],
  backend:['back end','backend','server side','node js','python','express','api development','database','sql','postgresql','mongodb'],
  design:['ui design','ux design','ui ux','user interface','user experience','figma','wireframing','prototyping','interaction design','accessibility'],
  product:['market research','product strategy','business analysis','business development','business planning','entrepreneurship','strategic planning'],
  growth:['marketing','content marketing','customer relationship management','customer service','digital marketing','sales','negotiation','presentation skills'],
  finance:['accounting and bookkeeping','budgeting and forecasting','financial analysis'],
  operations:['operations management','project management','supply chain management','human resources','leadership','team management'],
  insights:['data analysis','market research','business analysis','financial analysis'],
  people:['human resources','leadership','negotiation','presentation skills','project management','team management'],
};
const hasSkillFamily=(skills=[],family)=>skills.some(skill=>{
  const value=normalizeValue(skill).replace(/[^a-z0-9]+/g,' ').trim();
  return skillFamilies[family].some(term=>value===term||value.includes(term));
});
const skillsInFamily=(skills=[],family)=>skills.filter(skill=>hasSkillFamily([skill],family));
const listSkills=(skills,fallback)=>skills.slice(0,2).join(' and ')||fallback;
function combineComplementaryReasons(reasons){
  if(reasons.length<2)return reasons;
  const supportingDetails=reasons.slice(1).map(reason=>reason.replace(/^Complementary (?:skills|strengths|business strengths):\s*/,''));
  return [`${reasons[0]} In the same project, ${supportingDetails.join(' In addition, ')}`];
}
function complementarySkillReasons(personSkills=[],viewerSkills=[]){
  const viewerFrontend=hasSkillFamily(viewerSkills,'frontend'),viewerBackend=hasSkillFamily(viewerSkills,'backend'),viewerDesign=hasSkillFamily(viewerSkills,'design');
  const personFrontend=hasSkillFamily(personSkills,'frontend'),personBackend=hasSkillFamily(personSkills,'backend'),personDesign=hasSkillFamily(personSkills,'design');
  const reasons=[];
  if(viewerFrontend&&personBackend)reasons.push('Complementary skills: your front-end skills shape what people see, while their back-end skills can power the data and features behind it. Together, you can build a more complete app.');
  else if(viewerBackend&&personFrontend)reasons.push('Complementary skills: their front-end skills shape the user experience, while your back-end skills can power the data and features behind it. Together, you can build a more complete app.');
  if(viewerFrontend&&personDesign)reasons.push('Complementary skills: their UI/UX design can guide how the app looks and feels, while your front-end skills bring that experience to life.');
  else if(viewerDesign&&personFrontend)reasons.push('Complementary skills: your UI/UX design can guide how the app looks and feels, while their front-end skills bring that experience to life.');
  if(viewerDesign&&skillsInFamily(personSkills,'product').length)reasons.push(`Complementary strengths: your ${listSkills(skillsInFamily(viewerSkills,'design'),'design and accessibility skills')} can shape a clear, usable experience; their ${listSkills(skillsInFamily(personSkills,'product'),'product and market skills')} can help ensure it solves a real customer need.`);
  else if(personDesign&&skillsInFamily(viewerSkills,'product').length)reasons.push(`Complementary strengths: your ${listSkills(skillsInFamily(viewerSkills,'product'),'product and market skills')} can identify the customer need; their ${listSkills(skillsInFamily(personSkills,'design'),'design and accessibility skills')} can shape a clear, usable experience around it.`);
  if(viewerDesign&&skillsInFamily(personSkills,'growth').length)reasons.push(`Complementary strengths: your ${listSkills(skillsInFamily(viewerSkills,'design'),'design and accessibility skills')} can make the experience clear and engaging; their ${listSkills(skillsInFamily(personSkills,'growth'),'marketing and customer skills')} can help bring the right people to it.`);
  else if(personDesign&&skillsInFamily(viewerSkills,'growth').length)reasons.push(`Complementary strengths: your ${listSkills(skillsInFamily(viewerSkills,'growth'),'marketing and customer skills')} can bring the right people to the product; their ${listSkills(skillsInFamily(personSkills,'design'),'design and accessibility skills')} can make the experience clear and engaging.`);
  if(viewerDesign&&skillsInFamily(personSkills,'insights').length)reasons.push(`Complementary strengths: your ${listSkills(skillsInFamily(viewerSkills,'design'),'design and accessibility skills')} can make information easy to use; their ${listSkills(skillsInFamily(personSkills,'insights'),'data and analysis skills')} can show which information matters.`);
  else if(personDesign&&skillsInFamily(viewerSkills,'insights').length)reasons.push(`Complementary strengths: your ${listSkills(skillsInFamily(viewerSkills,'insights'),'data and analysis skills')} can identify useful information; their ${listSkills(skillsInFamily(personSkills,'design'),'design and accessibility skills')} can make it easy to understand and use.`);

  const softwareFamilies=['frontend','backend'];
  const businessFamilies=['product','growth','insights','finance','operations','people'];
  const viewerSoftware=softwareFamilies.flatMap(family=>skillsInFamily(viewerSkills,family));
  const personSoftware=softwareFamilies.flatMap(family=>skillsInFamily(personSkills,family));
  if(viewerSoftware.length&&personSkills.length){
    const examples=listSkills(viewerSoftware,'your software skills');
    if(skillsInFamily(personSkills,'product').length)reasons.push(`Complementary strengths: their ${listSkills(skillsInFamily(personSkills,'product'),'business and product skills')} can identify a real customer need and shape the product direction; your ${examples} can turn that direction into a working product to test.`);
    else if(skillsInFamily(personSkills,'growth').length)reasons.push(`Complementary strengths: their ${listSkills(skillsInFamily(personSkills,'growth'),'customer and growth skills')} can help reach users and learn from feedback; your ${examples} can build the product and digital tools that support that growth.`);
    else if(skillsInFamily(personSkills,'finance').length)reasons.push(`Complementary strengths: their ${listSkills(skillsInFamily(personSkills,'finance'),'financial skills')} can check costs and viability; your ${examples} can build useful financial features or automate parts of the workflow.`);
    else if(skillsInFamily(personSkills,'insights').length)reasons.push(`Complementary strengths: their ${listSkills(skillsInFamily(personSkills,'insights'),'data and analysis skills')} can reveal patterns and define useful measures; your ${examples} can build the features and data flows needed to act on those insights.`);
    else if(skillsInFamily(personSkills,'operations').length||skillsInFamily(personSkills,'people').length){const operations=[...skillsInFamily(personSkills,'operations'),...skillsInFamily(personSkills,'people')];reasons.push(`Complementary strengths: their ${listSkills(operations,'operations and team skills')} can identify process or delivery needs; your ${examples} can build tools or automate steps to support the work.`);}
  }else if(personSoftware.length&&viewerSkills.length){
    const examples=listSkills(viewerSkills.filter(skill=>businessFamilies.some(family=>hasSkillFamily([skill],family))),'your business skills');
    const software=listSkills(personSoftware,'their software skills');
    if(skillsInFamily(viewerSkills,'product').length)reasons.push(`Complementary strengths: your ${examples} can identify a real customer need and shape the product direction; their ${software} can turn that direction into a working product to test.`);
    else if(skillsInFamily(viewerSkills,'growth').length)reasons.push(`Complementary strengths: your ${examples} can help reach users and learn from feedback; their ${software} can build the product and digital tools that support that growth.`);
    else if(skillsInFamily(viewerSkills,'finance').length)reasons.push(`Complementary strengths: your ${examples} can check costs and viability; their ${software} can build useful financial features or automate parts of the workflow.`);
    else if(skillsInFamily(viewerSkills,'insights').length)reasons.push(`Complementary strengths: your ${examples} can reveal patterns and define useful measures; their ${software} can build the features and data flows needed to act on those insights.`);
    else if(skillsInFamily(viewerSkills,'operations').length||skillsInFamily(viewerSkills,'people').length)reasons.push(`Complementary strengths: your ${examples} can identify process or delivery needs; their ${software} can build tools or automate steps to support the work.`);
  }
  const businessPairs=[
    ['product','growth','Product and market planning can define who the offer is for, while marketing and customer-facing work can help reach and support those people.'],
    ['product','finance','Product planning can set priorities, while financial analysis and budgeting can check costs and whether the plan is viable.'],
    ['product','operations','Business planning can set the direction, while operations and project skills can turn it into a practical delivery plan.'],
    ['product','insights','Research and analysis can uncover needs and patterns, while product and business planning can turn those findings into decisions.'],
    ['growth','finance','Marketing and sales can show which activities attract customers, while financial planning can track cost and return.'],
    ['growth','operations','Customer feedback and outreach can shape the offer, while operations skills help deliver it reliably.'],
    ['growth','insights','Customer-facing work can test the message, while data analysis can show what is working and where to improve.'],
    ['finance','operations','Financial planning can set realistic resources, while operations and supply-chain skills can use them to deliver reliably.'],
    ['finance','insights','Financial records and data analysis together can reveal performance, costs, and trends for better decisions.'],
    ['operations','insights','Operations experience identifies process needs, while data analysis can measure bottlenecks and improvements.'],
    ['people','operations','People and team-management skills can support collaboration, while operations and project skills coordinate the work and delivery.'],
  ];
  for(const [left,right,explanation] of businessPairs){
    const viewerLeft=hasSkillFamily(viewerSkills,left),viewerRight=hasSkillFamily(viewerSkills,right),personLeft=hasSkillFamily(personSkills,left),personRight=hasSkillFamily(personSkills,right);
    if((viewerLeft&&personRight)||(viewerRight&&personLeft)){
      const viewerExamples=viewerSkills.filter(skill=>hasSkillFamily([skill],left)||hasSkillFamily([skill],right));
      const personExamples=personSkills.filter(skill=>hasSkillFamily([skill],left)||hasSkillFamily([skill],right));
      reasons.push(`Complementary business strengths: your ${listSkills(viewerExamples,'business skills')} and their ${listSkills(personExamples,'business skills')} can work together. ${explanation}`);
    }
  }
  return combineComplementaryReasons([...new Set(reasons)].slice(0,2));
}
function sharedFocusReasons(personSkills=[],viewerSkills=[]){
  const focusNames={frontend:'front-end development',backend:'back-end development',design:'design and accessibility',product:'product and business planning',growth:'marketing and customer growth',finance:'financial planning',operations:'operations and delivery',insights:'data and analysis',people:'team and people development'};
  return Object.keys(focusNames).filter(family=>hasSkillFamily(personSkills,family)&&hasSkillFamily(viewerSkills,family))
    .map(family=>`Shared focus: you both bring ${focusNames[family]} skills, so you could work on that part together and combine your approaches.`).slice(0,2);
}
function matchDetails(person,viewer={}){
  const shared=key=>[...new Map((person[key]||[]).filter(value=>(viewer[key]||[]).some(item=>normalizeValue(item)===normalizeValue(value))).map(value=>[normalizeValue(value),value])).values()];
  const goals=shared('goals'),interests=shared('interests'),skills=shared('skills');
  const crossCourse=normalizeCourse(person.courseId)!==normalizeCourse(viewer.courseId);
  const collaborationGoals=goals.filter(goal=>['project collaboration','co-founder partnership'].includes(normalizeValue(goal)));
  const complementaryReasons=complementarySkillReasons(person.skills,viewer.skills);
  const sharedFocus=sharedFocusReasons(person.skills,viewer.skills);
  const reasons=[...(complementaryReasons.length?[complementaryReasons.join(' ')]:[]),...sharedFocus];
  if(goals.length)reasons.push(`Shared goal: ${goals.join(', ')}.`);
  if(crossCourse&&collaborationGoals.some(goal=>normalizeValue(goal)==='project collaboration'))reasons.push('Different courses, with a shared project-collaboration goal.');
  else if(crossCourse&&collaborationGoals.some(goal=>normalizeValue(goal)==='co-founder partnership'))reasons.push('Different courses, with a shared co-founder partnership goal.');
  if(interests.length)reasons.push(`Shared interest: ${interests.join(', ')}.`);
  if(skills.length)reasons.push(`Skills in common: ${skills.join(', ')}. You could collaborate on the same work or learn from each other.`);
  const rank=goals.length*5+interests.length*2+skills.length*2+complementaryReasons.length*7+sharedFocus.length*5+(crossCourse&&collaborationGoals.length?4:0);
  return {rank,reasons:reasons.length?reasons:['No shared criteria found yet.']};
}
export function findPeople(people, filters, viewerId, viewer=null) {
  const query=filters.query.trim().toLowerCase();
  return people.filter(p=>p.id!==viewerId && p.status==='active')
    .filter(p=>!query || [p.displayName,p.bio,...p.skills,...p.interests].join(' ').toLowerCase().includes(query))
    .filter(p=>!filters.courseId || normalizeCourse(p.courseId)===filters.courseId)
    .filter(p=>['skills','interests','goals'].every(key=>!filters[key].length || filters[key].some(value=>p[key].includes(value))))
    .sort((a,b)=>matchDetails(b,viewer||{}).rank-matchDetails(a,viewer||{}).rank||a.displayName.localeCompare(b.displayName));
}
export function fitReasons(person, viewer) {
  return matchDetails(person,viewer).reasons;
}
export const discoveryService={async list(){return structuredClone(samplePeople);}};
