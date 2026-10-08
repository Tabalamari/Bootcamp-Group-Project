import { samplePeople } from './discoveryService.js';
import { profileOptions } from './profileService.js';

export const managedLists = ['categories', 'skills', 'interests', 'courses'];
const normalize = name => name.trim().replace(/\s+/g, ' ');
export function createAdminService() {
  let sequence = 0;
  const data = {
    categories: [{ id: 'technical', name: 'Technical', active: true }, { id: 'business', name: 'Business', active: true }],
    skills: profileOptions.skills.map((name, i) => ({ id: `skill-${i}`, name, active: true, categoryId: i < 6 ? 'technical' : 'business' })),
    interests: profileOptions.interests.map((name, i) => ({ id: `interest-${i}`, name, active: true, categoryId: '' })),
    courses: [{ id: 'software-dev', name: 'Software development', active: true }, { id: 'business-dev', name: 'Business development', active: true }],
    users: structuredClone(samplePeople),
  };
  function authorize(actor) { if (actor?.role !== 'admin') throw new Error('Administrator access required.'); }
  function list(kind) { if (!managedLists.includes(kind)) throw new Error('Unknown managed list.'); return data[kind]; }
  return {
    async load(actor) { authorize(actor); return structuredClone(data); },
    async save(actor, kind, input, fail = false) {
      authorize(actor);
      const records = list(kind);
      const name = normalize(input.name || '');
      if (!name || name.length > 80) throw new Error('Enter a name between 1 and 80 characters.');
      if (records.some(record => record.id !== input.id && record.name.toLowerCase() === name.toLowerCase())) throw new Error('This name already exists in this list.');
      const existing = input.id ? records.find(record => record.id === input.id) : null;
      if (input.id && !existing) throw new Error('This record is unavailable.');
      const categoryId = ['skills', 'interests'].includes(kind) ? input.categoryId || '' : '';
      if (categoryId && categoryId !== existing?.categoryId && !data.categories.some(c => c.id === categoryId && c.active)) throw new Error('Choose an active category.');
      if (fail) throw new Error('Sample save failure. Your changes are kept; try again.');
      if (existing) Object.assign(existing, { name, categoryId });
      else records.push({ id: `admin-${++sequence}`, name, categoryId, active: true });
    },
    async setActive(actor, kind, id, active) {
      authorize(actor);
      const record = list(kind).find(item => item.id === id);
      if (!record) throw new Error('This record is unavailable.');
      record.active = active;
    },
    async updateUser(actor, id, changes, fail = false) {
      authorize(actor);
      const user = data.users.find(person => person.id === id);
      if (!user) throw new Error('This user is unavailable.');
      if (!['active', 'suspended'].includes(changes.status)) throw new Error('Choose a valid account status.');
      if (changes.courseId !== user.courseId && !data.courses.some(c => c.id === changes.courseId && c.active)) throw new Error('Choose an active course.');
      if (fail) throw new Error('Sample save failure. Your changes are kept; try again.');
      Object.assign(user, { courseId: changes.courseId, status: changes.status });
    },
  };
}
export const adminService = createAdminService();
