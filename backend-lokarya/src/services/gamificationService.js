import User from '../models/User.js';
import { LEVELS, BADGES } from '../config/gamificationRules.js';
import { sendNotification } from '../utils/notificationSystem.js';

class GamificationService {
  
  async awardPoints(userId, points, reason) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      const oldLevelName = user.currentLevel;

      // 1. Update balances
      user.totalPoints += points;     // Spendable wallet
      user.lifetimePoints += points;  // Permanent rank (Never decreases)
      
      // 2. Log History
      user.pointHistory.push({
        reason,
        pointsChanged: points,
        date: new Date()
      });

      // 3. Calculate Rank based on LIFETIME points
      const levelData = this.calculateLevel(user.lifetimePoints);
      user.level = levelData.level;
      user.currentLevel = levelData.name;
      user.nextLevelXP = levelData.next; // The threshold for the next rank

      // Notify on Rank Up
      if (oldLevelName !== user.currentLevel) {
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
        await sendNotification(
          user._id, 
          `New Badge Unlocked: ${newBadges[0].name} ${newBadges[0].icon}`, 
          'success'
        );
      }

      await user.save();
      return { success: true, user };
    } catch (error) {
      console.error("Award Error:", error);
      return { success: false, error: error.message };
    }
  }

  async redeemPoints(userId, cost, itemName) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');
      
      if (user.totalPoints < cost) {
        throw new Error('Insufficient spendable points balance');
      }

      // Deduct only from spendable wallet
      user.totalPoints -= cost;

      user.pointHistory.push({
        reason: `Redeemed: ${itemName}`,
        pointsChanged: -cost,
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
    // Sort levels high to low
    const sortedLevels = [...LEVELS].sort((a, b) => b.min - a.min);
    
    // Find the current level object
    const currentLevelObj = sortedLevels.find(l => points >= l.min) || LEVELS[0];
    
    // Find the next level object to get the next threshold
    const nextLevelObj = LEVELS.find(l => l.level === currentLevelObj.level + 1);

    return {
      level: currentLevelObj.level,
      name: currentLevelObj.name,
      // If there is no next level (max reached), use a high number or current min
      next: nextLevelObj ? nextLevelObj.min : currentLevelObj.min 
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