import User from '../models/User.js';
import { LEVELS, BADGES } from '../config/gamificationRules.js';
import { sendNotification } from '../utils/notificationSystem.js';

class GamificationService {
  
  async awardPoints(userId, points, reason) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      const oldLevelName = user.currentLevel;
      // CRITICAL: Ensure points are treated as math, not strings
      const numericPoints = Number(points); 

      // 1. Update balances
      user.totalPoints += numericPoints;     // Spendable wallet
      user.lifetimePoints += numericPoints;  // Permanent rank (Never decreases)
      
      // 2. Log History
      user.pointHistory.push({
        reason,
        pointsChanged: numericPoints,
        date: new Date()
      });

      // 3. Calculate Rank based on LIFETIME points
      const levelData = this.calculateLevel(user.lifetimePoints);
      const leveledUp = oldLevelName !== levelData.name;

      user.level = levelData.level;
      user.currentLevel = levelData.name;
      user.nextLevelXP = levelData.next; // From the config

      // Notify on Rank Up
      if (leveledUp) {
        await sendNotification(
          user._id, 
          `Rank Up! You are now a ${user.currentLevel}!`, 
          'success'
        );
      }

      // 4. Check Badges based on LIFETIME points
      const newBadges = this.checkBadges(user);
      if (newBadges.length > 0) {
        user.badges.push(...newBadges);
        
        // Loop through all newly earned badges (in case they earned multiple at once)
        for (const badge of newBadges) {
          await sendNotification(
            user._id, 
            `New Badge Unlocked: ${badge.name} ${badge.icon}`, 
            'success'
          );
        }
      }

      await user.save();
      
      // 5. Return the exact payload expected by the Activity Controller
      return { 
        success: true, 
        pointsAwarded: numericPoints,
        newTotal: user.totalPoints,
        leveledUp: leveledUp,
        currentLevel: user.currentLevel,
        user 
      };
    } catch (error) {
      console.error("Award Error:", error);
      return { success: false, error: error.message };
    }
  }

  async redeemPoints(userId, cost, itemName) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');
      
      const numericCost = Number(cost);

      if (user.totalPoints < numericCost) {
        throw new Error('Insufficient spendable points balance');
      }

      // Deduct only from spendable wallet
      user.totalPoints -= numericCost;

      user.pointHistory.push({
        reason: `Redeemed: ${itemName}`,
        pointsChanged: -numericCost,
        date: new Date()
      });

      // We DON'T re-calculate level here. Rank is tied to lifetimePoints.
      await user.save();
      return { success: true, newBalance: user.totalPoints };
    } catch (error) {
      console.error("Redemption Error:", error);
      throw error;
    }
  }

  /**
   * SEAMLESS LOGIC: Finds the current level and the threshold for the next one
   */
  calculateLevel(points) {
    // Sort levels high to low to find the highest threshold passed
    const sortedLevels = [...LEVELS].sort((a, b) => b.min - a.min);
    
    // Find the current level object based on lifetime points
    const currentLevelObj = sortedLevels.find(l => points >= l.min) || LEVELS[0];

    return {
      level: currentLevelObj.level,
      name: currentLevelObj.name,
      next: currentLevelObj.next // Use the 'next' value directly from config
    };
  }

  checkBadges(user) {
    const earned = [];
    BADGES.forEach(badge => {
      const alreadyHas = user.badges.some(b => b.name === badge.name);
      if (!alreadyHas && user.lifetimePoints >= badge.threshold) {
        earned.push({ 
          name: badge.name, 
          icon: badge.icon, 
          earnedDate: new Date() 
        });
      }
    });
    return earned;
  }
}

export default new GamificationService();