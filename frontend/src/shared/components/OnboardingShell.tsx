'use client';

import { ReactNode } from 'react';
import { Container } from '@/shared/components/Container';
import { cn } from '@/shared/utils/cn';

type Tab = {
  id: string;
  label: string;
  description?: string;
};

type OnboardingShellProps = {
  tabs: Tab[];
  currentId: string;
  onSelectTab: (id: string) => void;
  isLast: boolean;
  onBottomAction: () => void | Promise<void>;
  isSaving?: boolean;
  children?: ReactNode;
};

export function OnboardingShell({
  tabs,
  currentId,
  onSelectTab,
  isLast,
  onBottomAction,
  isSaving,
  children,
}: OnboardingShellProps) {
  return (
    <div>
      <Container className="border-b border-slate-200 bg-white/90 py-4 shadow-sm">
        <div className="overflow-x-auto">
          <div className="inline-flex gap-2 rounded-3xl border border-slate-200 bg-slate-50 p-2">
            {tabs.map((tab) => {
              const isActive = tab.id === currentId;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => void onSelectTab(tab.id)}
                  className={cn(
                    'rounded-2xl px-4 py-3 text-left text-sm font-semibold transition',
                    isActive ? 'bg-slate-950 text-white' : 'text-slate-700 hover:bg-white'
                  )}
                >
                  <span>{tab.label}</span>
                  {tab.description && (
                    <span className="mt-1 block text-xs leading-5 text-slate-500">
                      {tab.description}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </Container>

      <div>{children}</div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 py-4 backdrop-blur">
        <Container className="flex justify-end">
          <button
            type="button"
            onClick={() => void onBottomAction()}
            disabled={isSaving}
            className={cn(
              'inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-medium transition',
              'focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2',
              isSaving && 'cursor-not-allowed opacity-50',
              isLast ? 'bg-slate-950 text-white hover:bg-slate-800' : 'border border-slate-300 bg-white text-slate-950 hover:bg-slate-50'
            )}
          >
            {isLast ? (isSaving ? 'Finishing...' : 'Finish') : 'Next'}
          </button>
        </Container>
      </div>
    </div>
  );
}
