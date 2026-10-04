export const courses = [
  { id: 'software-development', name: 'Software development' },
  { id: 'business-development', name: 'Business development' },
];

// Deliberately temporary: never use this adapter as real authentication.
// Demo accounts and credentials stay in memory and reset on page reload.
export function createDemoAuth() {
  let currentUser = null;
  const accounts = new Map([['malak@example.com', {
    user: { id: 'demo-malak', displayName: 'Malak', email: 'malak@example.com', courseId: courses[0].id },
    password: 'DemoPass123!',
  }]]);
  return {
    async courses() { return courses; },
    async session() { return currentUser; },
    async register(values) {
      const email = values.email.trim().toLowerCase();
      if (accounts.has(email)) throw new Error('An account already uses this email. Try signing in.');
      if (!courses.some(course => course.id === values.courseId)) throw new Error('Choose an available course.');
      const user = { id: `demo-${accounts.size + 1}`, displayName: values.displayName.trim(), email, courseId: values.courseId };
      accounts.set(email, { user, password: values.password });
      currentUser = user;
      return user;
    },
    async login({ email, password }) {
      const account = accounts.get(email.trim().toLowerCase());
      if (!account || account.password !== password) throw new Error('Email or password is incorrect. Please try again.');
      currentUser = account.user;
      return currentUser;
    },
    async logout() { currentUser = null; },
  };
}
