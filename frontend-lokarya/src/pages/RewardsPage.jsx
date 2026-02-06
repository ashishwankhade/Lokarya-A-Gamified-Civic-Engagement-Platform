import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Star, Lock, Gift, 
  Award, Shield, Crown, Zap, CheckCircle, 
  ArrowRight, ShoppingBag, FileText, Loader2
} from 'lucide-react';
import api from '../api/axios';
import { toast } from 'react-toastify';

// 1. MILESTONES (Synced with your backend gamificationRules.js)
const MILESTONES = [
  { id: 1, rank: "Civic Scout", requiredPoints: 0, icon: <Shield size={24} />, color: "bg-gray-100 text-gray-600", desc: "Welcome! Start reporting to earn your first badge." },
  { id: 2, rank: "Urban Guardian", requiredPoints: 200, icon: <Star size={24} />, color: "bg-blue-100 text-blue-600", desc: "You are now a recognized protector of the city." },
  { id: 3, rank: "Impact Maker", requiredPoints: 1000, icon: <Zap size={24} />, color: "bg-emerald-100 text-emerald-600", desc: "Your actions are creating visible change in Nagpur." },
  { id: 4, rank: "City Champion", requiredPoints: 3000, icon: <Award size={24} />, color: "bg-purple-100 text-purple-600", desc: "A true leader in civic responsibility." },
  { id: 5, rank: "Lokarya Legend", requiredPoints: 5000, icon: <Crown size={24} />, color: "bg-yellow-100 text-yellow-600", desc: "Hall of Fame. The ultimate civic hero." }
];

// 2. REWARDS STORE ITEMS
const STORE_ITEMS = [
  { id: 101, name: "₹100 Amazon Voucher", cost: 500, category: "Voucher", image: "https://placehold.co/100x100/orange/white?text=Amazon" },
  { id: 102, name: "Lokarya T-Shirt", cost: 1200, category: "Merch", image: "https://placehold.co/100x100/10b981/white?text=T-Shirt" },
  { id: 103, name: "Movie Ticket (PVR)", cost: 800, category: "Entertainment", image: "https://placehold.co/100x100/purple/white?text=Cinema" },
  { id: 104, name: "Organic Food Basket", cost: 2500, category: "Health", image: "https://placehold.co/100x100/green/white?text=Food" },
];

const RewardsPage = () => {
  const [activeTab, setActiveTab] = useState('milestones');
  const [loading, setLoading] = useState(true);
  const [isRedeeming, setIsRedeeming] = useState(false);
  
  // SEAMLESS STATE: Matches your new Backend Profile response
  const [userStats, setUserStats] = useState({ 
    currentPoints: 0,   // Spendable (totalPoints)
    lifetimePoints: 0,  // Permanent (lifetimePoints)
    currentRank: "",
    nextLevelXP: 200,
    level: 1
  });

  const fetchProgress = async () => {
    try {
      const { data } = await api.get('/auth/profile');
      setUserStats({
        currentPoints: data.totalPoints || 0,
        lifetimePoints: data.lifetimePoints || 0,
        currentRank: data.currentLevel || "Civic Scout",
        nextLevelXP: data.nextLevelXP || 200,
        level: data.level || 1
      });
    } catch (err) {
      toast.error("Failed to load rewards data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProgress(); }, []);

  const handleRedeem = async (item) => {
    if (userStats.currentPoints < item.cost) {
      return toast.error("Insufficient points balance!");
    }
    if (!window.confirm(`Redeem ${item.name} for ${item.cost} points?`)) return;

    setIsRedeeming(true);
    try {
      await api.post('/gamification/redeem', { cost: item.cost, name: item.name });
      toast.success(`${item.name} unlocked!`);
      fetchProgress(); // This now seamlessly updates header points but keeps rank progress
    } catch (err) {
      toast.error(err.response?.data?.message || "Redemption failed.");
    } finally {
      setIsRedeeming(false);
    }
  };

  /**
   * SEAMLESS PROGRESS CALCULATION
   * Bar should show progress between current level and next level
   */
  const currentMilestone = MILESTONES.find(m => m.rank === userStats.currentRank) || MILESTONES[0];
  const currentLevelMin = currentMilestone.requiredPoints;
  const nextLevelMin = userStats.nextLevelXP;
  
  // Progress = (Lifetime - CurrentMin) / (NextMin - CurrentMin)
  const progressPercent = userStats.lifetimePoints >= 5000 
    ? 100 
    : Math.min(100, ((userStats.lifetimePoints - currentLevelMin) / (nextLevelMin - currentLevelMin)) * 100);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-teal-600" size={40} /></div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-12">
      
      {/* --- HEADER --- */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-800 pb-24 pt-10 px-4 rounded-b-[2.5rem] shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center text-white relative z-10 gap-6">
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
               <span className="bg-yellow-400 text-black text-xs font-bold px-2 py-0.5 rounded shadow-sm uppercase tracking-wider">Rank: {userStats.currentRank}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">Rewards & Ranks</h1>
            <p className="text-emerald-100 text-sm mt-1 max-w-md font-medium">
              Earn XP through civic action. Spend points without losing your rank.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex items-center gap-4 shadow-lg">
             <div className="text-center">
                <div className="text-2xl font-black text-yellow-300">{userStats.currentPoints}</div>
                <div className="text-[10px] uppercase font-bold text-emerald-100">Spendable</div>
             </div>
             <div className="w-px h-8 bg-white/20"></div>
             <div className="text-center">
                <div className="text-2xl font-black text-white">{userStats.lifetimePoints}</div>
                <div className="text-[10px] uppercase font-bold text-emerald-100">Lifetime XP</div>
             </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-16 relative z-20">
        
        {/* PROGRESS BAR CARD */}
        <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 mb-8">
            <div className="flex justify-between items-end mb-2">
                <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Current Progress</p>
                    <h4 className="text-lg font-bold text-gray-800">{userStats.currentRank}</h4>
                </div>
                <p className="text-xs font-bold text-teal-600">{userStats.lifetimePoints} / {userStats.nextLevelXP} XP</p>
            </div>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-50">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    className="h-full bg-gradient-to-r from-teal-500 to-emerald-400"
                />
            </div>
        </div>

        {/* TABS */}
        <div className="bg-white p-1.5 rounded-2xl shadow-lg flex mb-8 max-w-md mx-auto border border-gray-100">
          <button onClick={() => setActiveTab('milestones')} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'milestones' ? 'bg-teal-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
            <Trophy size={18} /> Ranks & Badges
          </button>
          <button onClick={() => setActiveTab('store')} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'store' ? 'bg-teal-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
            <ShoppingBag size={18} /> Store
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'milestones' && (
            <motion.div key="milestones" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
              <div className="space-y-6 relative">
                  <div className="absolute top-4 bottom-4 left-[27px] w-1 bg-gray-100 rounded-full z-0"></div>
                  {MILESTONES.map((milestone) => {
                    const isUnlocked = userStats.lifetimePoints >= milestone.requiredPoints;
                    const isCurrent = userStats.currentRank === milestone.rank;
                    return (
                       <div key={milestone.id} className={`relative z-10 flex gap-6 ${!isUnlocked ? 'opacity-50 grayscale' : ''}`}>
                          <div className={`w-14 h-14 shrink-0 rounded-full flex items-center justify-center border-4 border-white shadow-md transition-all ${isUnlocked ? milestone.color : 'bg-gray-200 text-gray-400'}`}>
                             {isUnlocked ? milestone.icon : <Lock size={20} />}
                          </div>
                          <div className={`flex-1 p-4 rounded-2xl border transition-all ${isUnlocked ? 'bg-white border-teal-100 shadow-sm' : 'bg-gray-50 border-gray-100 border-dashed'} ${isCurrent ? 'ring-2 ring-teal-500 ring-offset-2' : ''}`}>
                             <div className="flex justify-between items-start">
                                <div>
                                   <div className="flex items-center gap-2">
                                      <h3 className="font-bold text-gray-900 text-lg">{milestone.rank}</h3>
                                      {isCurrent && <span className="text-[10px] bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-bold">Current</span>}
                                   </div>
                                   <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">{milestone.requiredPoints} XP</p>
                                   <p className="text-sm text-gray-600 mt-2">{milestone.desc}</p>
                                </div>
                                {isUnlocked && <div className="bg-green-100 text-green-700 p-1.5 rounded-full"><CheckCircle size={16} /></div>}
                             </div>
                          </div>
                       </div>
                    );
                  })}
              </div>
            </motion.div>
          )}

          {activeTab === 'store' && (
            <motion.div key="store" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
               {STORE_ITEMS.map((item) => {
                 const canAfford = userStats.currentPoints >= item.cost;
                 return (
                   <div key={item.id} className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex flex-col group hover:shadow-lg transition-all duration-300">
                      <div className="relative h-40 rounded-2xl overflow-hidden mb-4 bg-gray-50">
                         <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1">{item.name}</h3>
                      <div className="flex items-center gap-1 text-yellow-500 font-black text-xl mb-4"><Zap size={18} fill="currentColor" /> {item.cost}</div>
                      <button 
                        disabled={!canAfford || isRedeeming}
                        onClick={() => handleRedeem(item)}
                        className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${canAfford ? 'bg-[#0f4c75] text-white shadow-lg hover:bg-[#0b3a5b] cursor-pointer' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                      >
                        {canAfford ? (isRedeeming ? <Loader2 className="animate-spin" size={18}/> : <>Redeem <ArrowRight size={18} /></>) : <><Lock size={16} /> Insufficient Pts</>}
                      </button>
                   </div>
                 );
               })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default RewardsPage;