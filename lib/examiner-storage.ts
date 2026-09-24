const STORAGE_KEY_PROFILE = 'kuziva_examiner_profile';

export interface ExaminerProfile {
  name: string;
  signature?: string;
  institution?: string;
  department?: string;
}

export const examinerStorage = {
  getProfile(): ExaminerProfile | null {
    if (typeof window === 'undefined') return null;
    try {
      const data = localStorage.getItem(STORAGE_KEY_PROFILE);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to load examiner profile from localStorage:', error);
      return null;
    }
  },

  saveProfile(profile: ExaminerProfile) {
    localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));
  },

  updateSignature(signature: string) {
    const profile = this.getProfile() || { name: '' };
    profile.signature = signature;
    this.saveProfile(profile);
  },

  clearSignature() {
    const profile = this.getProfile();
    if (profile) {
      delete profile.signature;
      this.saveProfile(profile);
    }
  }
};
