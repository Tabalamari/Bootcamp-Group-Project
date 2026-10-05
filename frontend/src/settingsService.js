export const settingsCourses = [{id:'software-dev',name:'Software development'}, {id:'business-dev',name:'Business development'}];
export function validateSettings(values) {
  const errors = {};
  if (!values.displayName.trim() || values.displayName.trim().length > 80) errors.displayName = 'Enter a name between 1 and 80 characters.';
  if (!settingsCourses.some(c => c.id === values.courseId)) errors.courseId = 'Choose an active course.';
  return errors;
}
export function validatePassword(values) {
  const errors = {};
  if (!values.currentPassword) errors.currentPassword = 'Enter the current sample password.';
  if (values.newPassword.length < 8 || values.newPassword.length > 128) errors.newPassword = 'Use between 8 and 128 characters.';
  else if (values.newPassword === values.currentPassword) errors.newPassword = 'Choose a different password.';
  if (values.confirmPassword !== values.newPassword || !values.confirmPassword) errors.confirmPassword = 'Passwords must match.';
  return errors;
}
export function createSettingsService() {
  const accounts = new Map();
  function account(user) {
    if (!user?.id) throw new Error('Sign in to manage account settings.');
    if (!accounts.has(user.id)) accounts.set(user.id, {displayName:user.displayName,courseId:user.courseId,password:'DemoPass123!'});
    return accounts.get(user.id);
  }
  return {
    async get(user) { const {displayName,courseId} = account(user); return {displayName,courseId}; },
    async save(user, values, fail = false) {
      const data = account(user); const errors = validateSettings(values);
      if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
      if (fail) throw new Error('Sample save failed. Your edits are kept; try again.');
      Object.assign(data, {displayName:values.displayName.trim(),courseId:values.courseId});
      return {displayName:data.displayName,courseId:data.courseId};
    },
    async password(user, values, fail = false) {
      const data = account(user); const errors = validatePassword(values);
      if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
      if (values.currentPassword !== data.password) throw new Error('The current sample password is incorrect.');
      if (fail) throw new Error('Sample password change failed. Try again.');
      data.password = values.newPassword;
    },
  };
}
export const settingsService = createSettingsService();
