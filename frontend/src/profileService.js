export const profileOptions = {
  skills: [
    'React', 'JavaScript', 'UI design', 'Accessibility', 'Node.js', 'Python', 'Market research', 'Marketing', 'Product strategy',
    'Accounting and bookkeeping', 'Budgeting and forecasting', 'Business analysis', 'Business development', 'Business planning',
    'Content marketing', 'Customer relationship management', 'Customer service', 'Data analysis', 'Digital marketing',
    'Entrepreneurship', 'Financial analysis', 'Human resources', 'Leadership', 'Negotiation', 'Operations management',
    'Presentation skills', 'Project management', 'Sales', 'Strategic planning', 'Supply chain management', 'Team management',
  ],
  interests: ['Education', 'Design', 'Sustainability', 'Technology', 'Entrepreneurship'],
  goals: ['Project collaboration', 'Co-founder partnership', 'Peer support', 'Friendship'],
};

export function validateProfile(profile) {
  const errors = {};
  if (!profile.displayName.trim()) errors.displayName = 'Enter your name.';
  else if (profile.displayName.length > 80) errors.displayName = 'Use 80 characters or fewer.';
  if (profile.bio.length > 500) errors.bio = 'Keep your bio to 500 characters.';
  for (const key of Object.keys(profileOptions)) {
    if (!Array.isArray(profile[key]) || profile[key].some(value => !profileOptions[key].includes(value))) errors[key] = 'Choose from the available options.';
  }
  return errors;
}

export function validatePhoto(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return 'Choose a JPG, PNG or WebP image.';
  if (file.size > 5 * 1024 * 1024) return 'Choose a photo no larger than 5 MB.';
  return '';
}

export function createProfileService() {
  const profiles = new Map();
  return {
    async get(user) {
      if (!profiles.has(user.id)) profiles.set(user.id, {
        displayName: user.displayName, courseId: user.courseId, bio: '', photo: '',
        skills: [], interests: [], goals: [],
      });
      return structuredClone(profiles.get(user.id));
    },
    async save(user, profile) {
      const errors = validateProfile(profile);
      if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
      const saved = { ...structuredClone(profile), displayName: profile.displayName.trim(), bio: profile.bio.trim(), courseId: user.courseId };
      profiles.set(user.id, saved);
      return structuredClone(saved);
    },
  };
}
// Local-only demo adapter. See PROFILE_HANDOFF.md before adding real persistence.
export const profileService = createProfileService();
