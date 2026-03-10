// cron/autoCloseCron.js
// ─────────────────────────────────────────────────────────────────────────────
// Runs every 30 minutes.
// 1. Auto-closes resolved complaints with no citizen rating after 72 hours
// 2. Marks SLA as breached for complaints past their slaDeadline
//
// Setup in server.js:
//   import './cron/autoCloseCron.js';
// ─────────────────────────────────────────────────────────────────────────────

import cron from 'node-cron';
import Complaint from '../models/Complaint.js';
import gamificationService from '../services/gamificationService.js';
import { POINTS } from '../config/gamificationRules.js';

// Every 30 minutes
cron.schedule('*/30 * * * *', async () => {
  const now = new Date();

  // ── 1. Auto-close resolved complaints with no rating after 72hrs ────────────
  const seventyTwoHoursAgo = new Date(now - 72 * 60 * 60 * 1000);

  const toAutoClose = await Complaint.find({
    status:         'resolved',
    citizenRating:  null,
    updatedAt:      { $lt: seventyTwoHoursAgo },
  });

  for (const complaint of toAutoClose) {
    complaint.status      = 'closed';
    complaint.autoClosedAt = now;
    complaint.timeline.push({
      status:  'closed',
      message: 'Auto-closed after 72 hours — no citizen response received.',
    });
    await complaint.save();

    // Still award XP to citizen since it was resolved
    await gamificationService.awardPoints(
      complaint.user,
      POINTS.ISSUE_RESOLVED,
      `Complaint auto-closed: ${complaint.category}`
    );

    console.log(`[CRON] Auto-closed complaint ${complaint.ticketId}`);
  }

  // ── 2. Mark SLA breached ────────────────────────────────────────────────────
  const slaBreach = await Complaint.find({
    status:      { $in: ['pending', 'under_review'] },
    slaDeadline: { $lt: now },
    slaBreached: false,
  });

  for (const complaint of slaBreach) {
    complaint.slaBreached = true;
    complaint.timeline.push({
      status:  complaint.status,
      message: 'SLA deadline breached — complaint flagged for escalation.',
    });
    await complaint.save();
    console.log(`[CRON] SLA breached: ${complaint.ticketId}`);
  }
});

console.log('[CRON] Auto-close and SLA watcher started.');
