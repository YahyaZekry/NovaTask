"use client";

import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export function ConnectionStatusIndicator() {
  const { isOnline, isOffline, effectiveType, recheckConnection } = useOnlineStatus({
    showToast: false
  });

  if (isOnline) {
    return (
      <div className="flex items-center gap-2 text-green-400 text-xs micro-interaction" role="status" aria-live="polite">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" aria-hidden="true"></div>
        <span>Online</span>
        {effectiveType && (
          <span className="text-white/60">({effectiveType})</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-red-400 text-xs micro-interaction" role="status" aria-live="polite">
      <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" aria-hidden="true"></div>
      <span>Offline</span>
      <button
        onClick={recheckConnection}
        className="text-white/60 hover:text-white underline button-hover-enhanced focus-enhanced keyboard-enhanced micro-interaction"
        title="Retry connection"
        aria-label="Retry connection"
      >
        Retry
      </button>
    </div>
  );
}