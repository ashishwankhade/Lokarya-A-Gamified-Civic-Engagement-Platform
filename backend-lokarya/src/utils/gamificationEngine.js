import User from '../models/User.js';

// RULES CONFIGURATION
const BADGE_RULES = [
  { name: 'Community Starter', threshold: 100, icon: '🌱' },
  { name: 'Active Citizen', threshold: 500, icon: '🔥' },
  { name: 'Change Maker', threshold: 1000, icon: '⭐' },
  { name: 'Lokarya Legend', threshold: 5000, icon: '👑' }
];

const LEVEL_RULES = [
  { name: 'Beginner', min: 0 },
  { name: 'Volunteer', min: 200 },
  { name: 'Leader', min: 1000 },
  { name: 'Ambassador', min: 3000 }
];

/**
 * Adds points to a user and checks for new badges/levels.
 * @param {String} userId - The user to reward
 * @param {Number} points - Amount of points to add
 * @param {String} reason - Description for the history log
 */
export const awardPoints = async (userId, points, reason) => {
  try {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    // 1. Add Points
    user.totalPoints += points;

    // 2. Add to History
    user.pointHistory.push({
      reason: reason,
      pointsChanged: points
    });

    // 3. Check for New Badges
    const newBadges = [];
    BADGE_RULES.forEach(badge => {
      // Check if they crossed threshold AND don't have the badge yet
      const hasBadge = user.badges.some(b => b.name === badge.name);
      if (user.totalPoints >= badge.threshold && !hasBadge) {
        user.badges.push({
          name: badge.name,
          icon: badge.icon,
        });
        newBadges.push(badge.name);
      }
    });

    // 4. Update Level
    // Check levels in reverse (highest first) to find the match
    const sortedLevels = [...LEVEL_RULES].reverse();
    const currentLevel = sortedLevels.find(level => user.totalPoints >= level.min);
    
    if (currentLevel && user.currentLevel !== currentLevel.name) {
      user.currentLevel = currentLevel.name;
    }

    await user.save();

    return { 
      success: true, 
      newPoints: user.totalPoints, 
      newBadges: newBadges, 
      currentLevel: user.currentLevel 
    };

  } catch (error) {
    console.error("Gamification Error:", error);
    return { success: false, error: error.message };
  }
};