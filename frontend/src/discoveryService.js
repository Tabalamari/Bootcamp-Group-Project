export const samplePeople = [
  {id:'sample-amara',displayName:'Amara Lewis',courseId:'business-dev',bio:'Turning a sustainable shopping idea into a useful first product. Looking for a developer to build with.',skills:['Market research','Product strategy'],interests:['Sustainability'],goals:['Project collaboration'],status:'active'},
  {id:'sample-daniel',displayName:'Daniel Park',courseId:'software-dev',bio:'Frontend learner interested in accessible experiences. Happy to swap feedback and learn together.',skills:['React','Accessibility'],interests:['Education','Design'],goals:['Peer support'],status:'active'},
  {id:'sample-sofia',displayName:'Sofia Ahmed',courseId:'business-dev',bio:'Exploring a learning community idea and looking for a technical co-founder.',skills:['Marketing','Market research'],interests:['Education','Entrepreneurship'],goals:['Co-founder partnership'],status:'active'},
  {id:'sample-leo',displayName:'Leo Williams',courseId:'software-dev',bio:'Backend-minded builder curious about climate tech. Keen to join a small project team.',skills:['Node.js','Python'],interests:['Sustainability','Technology'],goals:['Project collaboration','Friendship'],status:'active'},
];
export const normalizeCourse = value => ({'software-development':'software-dev','business-development':'business-dev'})[value] || value;
export function findPeople(people, filters, viewerId) {
  const query=filters.query.trim().toLowerCase();
  return people.filter(p=>p.id!==viewerId && p.status==='active')
    .filter(p=>!query || [p.displayName,p.bio,...p.skills,...p.interests].join(' ').toLowerCase().includes(query))
    .filter(p=>!filters.courseId || normalizeCourse(p.courseId)===filters.courseId)
    .filter(p=>['skills','interests','goals'].every(key=>!filters[key].length || filters[key].some(value=>p[key].includes(value))));
}
export function fitReasons(person, viewer) {
  const reasons=[];
  for(const [key,label] of [['interests','Shared interest'],['skills','Skill in common'],['goals','Shared goal']]) {
    const shared=person[key].filter(value=>(viewer[key]||[]).includes(value));
    if(shared.length)reasons.push(`${label}: ${shared.join(', ')}.`);
  }
  if(normalizeCourse(person.courseId)!==normalizeCourse(viewer.courseId) && person.goals.includes('Project collaboration') && viewer.goals?.includes('Project collaboration')) reasons.push('Different courses, with a shared interest in project collaboration.');
  return reasons.length?reasons:['No shared criteria found yet.'];
}
export const discoveryService={async list(){return structuredClone(samplePeople);}};
