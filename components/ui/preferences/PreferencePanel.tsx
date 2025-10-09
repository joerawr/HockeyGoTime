'use client';

/**
 * Preference Panel Component
 * Displays current user preferences with edit capability
 */

import { useState, useEffect } from "react";
import type { UserPreferences } from "@/types/preferences";
import { PreferencesStore } from "@/lib/storage/preferences";
import { PreferenceForm } from "./PreferenceForm";

const panelContainerClasses =
  "rounded-2xl border-2 border-slate-200 bg-white/95 p-6 shadow-md backdrop-blur-sm";

export function PreferencePanel() {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load preferences on mount
  useEffect(() => {
    const loadPreferences = () => {
      const savedPrefs = PreferencesStore.get();
      setPreferences(savedPrefs);
      setIsLoading(false);

      // If no preferences, show form automatically
      if (!savedPrefs) {
        setIsEditing(true);
      }
    };

    loadPreferences();
  }, []);

  const handleSave = (newPreferences: UserPreferences) => {
    PreferencesStore.set(newPreferences);
    setPreferences(newPreferences);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    // Only allow cancel if preferences already exist
    if (preferences) {
      setIsEditing(false);
    }
  };

  const handleClearAll = () => {
    if (confirm('Clear all preferences? This will remove your saved team, address, and settings.')) {
      PreferencesStore.clear();
      setPreferences(null);
      setIsEditing(true);
    }
  };

  if (isLoading) {
    return <SkeletonPanel message="Loading preferences..." />;
  }

  if (isEditing) {
    return (
      <div className={panelContainerClasses}>
        <PreferenceForm
          initialPreferences={preferences}
          onSave={handleSave}
          onCancel={preferences ? handleCancel : undefined}
        />
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className={panelContainerClasses}>
        <p className="text-sm text-slate-600">
          No preferences set. Click Edit to set your preferences.
        </p>
        <button
          onClick={handleEdit}
          className="mt-4 w-full rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-600"
        >
          Set Preferences
        </button>
      </div>
    );
  }

  return (
    <div className={panelContainerClasses}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900">Team Preferences</h3>
        <p className="text-xs text-slate-500">Used for schedule, travel, and stats questions.</p>
      </div>

      <div className="space-y-4 text-sm">
        <PreferenceRow label="Team:" value={preferences.team} />
        <PreferenceRow label="Division:" value={preferences.division} />
        <PreferenceRow label="Season:" value={preferences.season} />
        <PreferenceRow
          label="Home Address:"
          value={preferences.homeAddress}
          tooltip={preferences.homeAddress}
        />
        <PreferenceRow
          label="Prep Time:"
          value={`${preferences.prepTimeMinutes} min`}
        />
        <PreferenceRow
          label="Arrival Buffer:"
          value={`${preferences.arrivalBufferMinutes} min`}
        />
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={handleEdit}
          className="flex-1 rounded-xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-300"
        >
          Edit
        </button>
        <button
          onClick={handleClearAll}
          className="flex-1 rounded-xl bg-red-100 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-200"
          title="Clear all preferences (useful for families with multiple players)"
        >
          Clear All
        </button>
      </div>
    </div>
  );
}

function PreferenceRow({
  label,
  value,
  tooltip,
}: {
  label: string;
  value?: string | number | null;
  tooltip?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      <span
        className="max-w-[170px] text-sm font-semibold text-slate-900 text-right"
        title={tooltip}
      >
        {value && String(value).trim() !== "" ? value : "—"}
      </span>
    </div>
  );
}

function SkeletonPanel({ message }: { message: string }) {
  return (
    <div className={panelContainerClasses}>
      <p className="text-sm text-slate-600">{message}</p>
    </div>
  );
}
