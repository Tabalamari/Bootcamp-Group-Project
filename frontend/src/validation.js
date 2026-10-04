export function validateAuth(values, registering) {
  const errors = {};
  if (registering && !values.displayName.trim()) errors.displayName = 'Enter your name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = 'Enter a valid email address.';
  if (!values.password) errors.password = 'Enter your password.';
  else if (registering && values.password.length < 8) errors.password = 'Use at least 8 characters.';
  if (registering && !values.courseId) errors.courseId = 'Choose your course.';
  return errors;
}
