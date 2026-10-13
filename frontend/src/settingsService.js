export const settingsCourses = [{id:'software-dev',name:'Software development'}, {id:'business-dev',name:'Business development'}];
export function validateSettings(values, courses = settingsCourses) {
  const errors = {};
  if (!values.displayName.trim() || values.displayName.trim().length > 80) errors.displayName = 'Enter a name between 1 and 80 characters.';
  if (!courses.some(c => c.id === values.courseId)) errors.courseId = 'Choose an active course.';
  return errors;
}
export function validatePassword(values) {
  const errors = {};
  if (!values.currentPassword) errors.currentPassword = 'Enter your current password.';
  if (values.newPassword.length < 8 || values.newPassword.length > 128) errors.newPassword = 'Use between 8 and 128 characters.';
  else if (values.newPassword === values.currentPassword) errors.newPassword = 'Choose a different password.';
  if (values.confirmPassword !== values.newPassword || !values.confirmPassword) errors.confirmPassword = 'Passwords must match.';
  return errors;
}
export function validateEmailChange(values, currentEmail = '') {
  const errors = {};
  const email = values.newEmail.trim().toLowerCase();
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.newEmail = 'Enter a valid email address.';
  else if (email === currentEmail.trim().toLowerCase()) errors.newEmail = 'Enter a different email address.';
  if (!values.currentPassword) errors.currentPassword = 'Enter your current password.';
  return errors;
}
export function createSettingsService(courses = settingsCourses) {
  const accounts = new Map();
  function account(user) {
    if (!user?.id) throw new Error('Sign in to manage account settings.');
    if (!accounts.has(user.id)) accounts.set(user.id, {displayName:user.displayName,courseId:user.courseId,email:user.email || '',password:'DemoPass123!'});
    return accounts.get(user.id);
  }
  return {
    async get(user) { const {displayName,courseId,email} = account(user); return {displayName,courseId,email}; },
    async save(user, values, fail = false) {
      const data = account(user); const errors = validateSettings(values, courses);
      if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
      if (fail) throw new Error('Sample save failed. Your edits are kept; try again.');
      Object.assign(data, {displayName:values.displayName.trim(),courseId:values.courseId});
      return {displayName:data.displayName,courseId:data.courseId,email:data.email};
    },
    async password(user, values, fail = false) {
      const data = account(user); const errors = validatePassword(values);
      if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
      if (values.currentPassword !== data.password) throw new Error('The current sample password is incorrect.');
      if (fail) throw new Error('Sample password change failed. Try again.');
      data.password = values.newPassword;
    },
    async email(user, values, fail = false) {
      const data = account(user);
      const errors = validateEmailChange(values, data.email);
      if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
      if (values.currentPassword !== data.password) throw new Error('The current sample password is incorrect.');
      if ([...accounts.entries()].some(([id, other]) => id !== user.id && other.email === values.newEmail.trim().toLowerCase())) {
        throw new Error('That email address is already in use.');
      }
      if (fail) throw new Error('Sample email change failed. Try again.');
      data.email = values.newEmail.trim().toLowerCase();
      return { email: data.email };
    },
  };
}
export const settingsService = createSettingsService();
