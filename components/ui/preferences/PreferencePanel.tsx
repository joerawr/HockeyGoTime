'use client';

/**
 * Preference Panel Component
 * Displays current user preferences with edit capability
 */

import { useState, useEffect } from 'react';
import type { UserPreferences } from '@/types/preferences';
import { PreferencesStore } from '@/lib/storage/preferences';
import { PreferenceForm } from './PreferenceForm';

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
    return (
      <div className="p-4 border rounded-lg">
        <p className="text-sm text-gray-500">Loading preferences...</p>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="p-4 border rounded-lg">
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
      <div className="p-4 border rounded-lg">
        <p className="text-sm text-gray-500">No preferences set. Click Edit to set your preferences.</p>
        <button
          onClick={handleEdit}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Set Preferences
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Your Preferences</h3>
        <div className="flex gap-2">
          <button
            onClick={handleEdit}
            className="px-3 py-1 text-sm bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Edit
          </button>
          <button
            onClick={handleClearAll}
            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200"
            title="Clear all preferences (useful for families with multiple players)"
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Team:</span>
          <span className="font-medium">{preferences.team}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Division:</span>
          <span className="font-medium">{preferences.division}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Season:</span>
          <span className="font-medium">{preferences.season}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Home Address:</span>
          <span className="font-medium text-right max-w-[200px] truncate" title={preferences.homeAddress}>
            {preferences.homeAddress}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Prep Time:</span>
          <span className="font-medium">{preferences.prepTimeMinutes} min</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Arrival Buffer:</span>
          <span className="font-medium">{preferences.arrivalBufferMinutes} min</span>
        </div>
      </div>
    </div>
  );
}
