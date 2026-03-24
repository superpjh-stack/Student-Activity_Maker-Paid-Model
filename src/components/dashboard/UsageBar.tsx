'use client';

import { useState } from 'react';
import type { UsageStats } from '@/types/subscription';
import UsageBanner from '@/components/upsell/UsageBanner';
import UpgradeModal from '@/components/upsell/UpgradeModal';
import type { Plan } from '@/types/subscription';

interface UsageBarProps {
  usage: UsageStats;
}

export default function UsageBar({ usage }: UsageBarProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const seteokRatio = usage.seteokLimit ? usage.seteokUsed / usage.seteokLimit : 0;

  const resetDate = new Date(usage.resetDate);
  const resetLabel = `${resetDate.getMonth() + 1}월 ${resetDate.getDate()}일`;

  return (
    <>
      <div className="glass-card rounded-2xl p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold text-purple-900">이번 달 사용량</h2>
          <span className="text-xs text-purple-300">{resetLabel} 리셋</span>
        </div>

        {/* 세특 */}
        <div className="mb-3">
          <div className="mb-1 flex justify-between text-xs text-purple-500">
            <span>세특</span>
            <span>
              {usage.seteokLimit === null
                ? `${usage.seteokUsed}회 (무제한)`
                : `${usage.seteokUsed} / ${usage.seteokLimit}회`}
            </span>
          </div>
          {usage.seteokLimit !== null && (
            <div className="h-2 overflow-hidden rounded-full bg-purple-100">
              <div
                className={`h-full rounded-full transition-all ${
                  seteokRatio >= 0.9 ? 'bg-red-400' : seteokRatio >= 0.7 ? 'bg-yellow-400' : 'bg-green-400'
                }`}
                style={{ width: `${Math.min(seteokRatio * 100, 100)}%` }}
              />
            </div>
          )}
        </div>

        {/* 탐구보고서 */}
        <div className="mb-4">
          <div className="mb-1 flex justify-between text-xs text-purple-500">
            <span>탐구보고서</span>
            <span>
              {usage.reportLimit === null
                ? `${usage.reportUsed}회 (무제한)`
                : `${usage.reportUsed} / ${usage.reportLimit}회`}
            </span>
          </div>
          {usage.reportLimit !== null && (
            <div className="h-2 overflow-hidden rounded-full bg-purple-100">
              <div
                className={`h-full rounded-full transition-all ${
                  usage.reportUsed / usage.reportLimit >= 0.9 ? 'bg-red-400'
                  : usage.reportUsed / usage.reportLimit >= 0.7 ? 'bg-yellow-400'
                  : 'bg-green-400'
                }`}
                style={{ width: `${Math.min((usage.reportUsed / (usage.reportLimit || 1)) * 100, 100)}%` }}
              />
            </div>
          )}
        </div>

        {/* 70% 이상 업셀 배너 */}
        {usage.seteokLimit !== null && (
          <UsageBanner
            used={usage.seteokUsed}
            limit={usage.seteokLimit}
            type="seteok"
            onUpgrade={() => setModalOpen(true)}
          />
        )}
      </div>

      <UpgradeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        currentPlan={usage.plan}
        trigger="limit_exceeded"
      />
    </>
  );
}
