// 1. POINT VALUES
export const POINTS = {
  REPORT_ISSUE: 20,       // Reporting a complaint
  ISSUE_RESOLVED: 50,     // Complaint gets resolved
  MISSION_JOIN: 30,       // Joining a volunteering mission
  PROFILE_COMPLETE: 50    // Filling out profile
};

// 2. LEVEL SYSTEM (5 Levels)
export const LEVELS = [
  { level: 1, name: 'Civic Scout', min: 0, next: 200 },
  { level: 2, name: 'Urban Guardian', min: 200, next: 1000 },
  { level: 3, name: 'Impact Maker', min: 1000, next: 3000 },
  { level: 4, name: 'City Champion', min: 3000, next: 5000 },
  { level: 5, name: 'Lokarya Legend', min: 5000, next: 10000 }
];

// 3. BADGES
export const BADGES = [
  { name: 'First Step', threshold: 20, icon: '🌱', desc: 'Reported 1st issue' },
  { name: 'Active Citizen', threshold: 200, icon: '🔥', desc: 'Earned 200 XP' },
  { name: 'Change Maker', threshold: 1000, icon: '⭐', desc: 'Earned 1000 XP' },
  { name: 'Hero', threshold: 5000, icon: '👑', desc: 'Earned 5000 XP' }
];