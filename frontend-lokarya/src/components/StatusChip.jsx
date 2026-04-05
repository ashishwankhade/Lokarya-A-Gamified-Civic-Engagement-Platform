/**
 * StatusChip.jsx
 * Shared status pill used by MissionManager, NGOOverview, and any future component.
 * Extracted to avoid duplication and definition drift.
 *
 * Path: src/components/StatusChip.jsx
 */

import React from 'react';
import { Clock, CheckCircle2, XCircle, Zap } from 'lucide-react';

const STATUS_META = {
  open:             { label: 'Open',            bg: '#ecfdf5', c: '#059669', Icon: CheckCircle2 },
  draft:            { label: 'Pending Approval', bg: '#fef3c7', c: '#92400e', Icon: Clock        },
  pending_approval: { label: 'Pending Approval', bg: '#fef3c7', c: '#92400e', Icon: Clock        },
  ongoing:          { label: 'Ongoing',          bg: '#eff6ff', c: '#2563eb', Icon: Zap           },
  ended:            { label: 'Ended',            bg: '#f1f5f9', c: '#475569', Icon: Clock         },
  completed:        { label: 'Completed',        bg: '#f5f3ff', c: '#7c3aed', Icon: CheckCircle2  },
  rejected:         { label: 'Rejected',         bg: '#fee2e2', c: '#b91c1c', Icon: XCircle       },
};

/**
 * @param {{ status: string, adminStatus: string }} props
 */
const StatusChip = ({ status, adminStatus }) => {
  const key = adminStatus === 'rejected'         ? 'rejected'
    : (adminStatus === 'pending_approval'
       || status === 'draft')                    ? 'pending_approval'
    : status;

  const m = STATUS_META[key] || STATUS_META.open;

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: m.bg, color: m.c, borderRadius: 999,
      padding: '4px 12px', fontSize: 11, fontWeight: 800,
      letterSpacing: '0.05em',
    }}>
      <m.Icon size={11} /> {m.label}
    </span>
  );
};

export default StatusChip;
