'use client';

/**
 * Preference Form Component
 * Form for setting and editing user preferences
 */

import { useState } from 'react';
import type { UserPreferences } from '@/types/preferences';
import { DEFAULT_PREFERENCES } from '@/types/preferences';
import { validatePreferences } from '@/lib/utils/validation';

interface PreferenceFormProps {
  initialPreferences?: UserPreferences | null;
  onSave: (preferences: UserPreferences) => void;
  onCancel?: () => void;
}

export function PreferenceForm({ initialPreferences, onSave, onCancel }: PreferenceFormProps) {
  const [formData, setFormData] = useState<UserPreferences>({
    team: initialPreferences?.team || '',
    division: initialPreferences?.division || '',
    season: initialPreferences?.season || DEFAULT_PREFERENCES.season || '2025/2026',
    homeAddress: initialPreferences?.homeAddress || '',
    prepTimeMinutes: initialPreferences?.prepTimeMinutes ?? DEFAULT_PREFERENCES.prepTimeMinutes ?? 30,
    arrivalBufferMinutes: initialPreferences?.arrivalBufferMinutes ?? DEFAULT_PREFERENCES.arrivalBufferMinutes ?? 60,
    minWakeUpTime: initialPreferences?.minWakeUpTime,
  });

  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate preferences
    const validationErrors = validatePreferences(formData);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Clear errors and save
    setErrors([]);
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold">Your Hockey Preferences</h2>

      {errors.length > 0 && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
          <ul className="list-disc pl-5 space-y-1">
            {errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label htmlFor="team" className="block text-sm font-medium mb-1">
            Team Name *
          </label>
          <input
            type="text"
            id="team"
            value={formData.team}
            onChange={(e) => setFormData({ ...formData, team: e.target.value })}
            placeholder="e.g., Jr. Kings (1)"
            className="w-full px-3 py-2 border rounded-md"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Enter your team name (e.g., "Jr. Kings 1" or "OC Hockey 2")</p>
        </div>

        <div>
          <label htmlFor="division" className="block text-sm font-medium mb-1">
            Division *
          </label>
          <input
            type="text"
            id="division"
            value={formData.division}
            onChange={(e) => setFormData({ ...formData, division: e.target.value })}
            placeholder="e.g., 14U B"
            className="w-full px-3 py-2 border rounded-md"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Enter division (e.g., "14B", "16A", "12AAA")</p>
        </div>

        <div>
          <label htmlFor="season" className="block text-sm font-medium mb-1">
            Season *
          </label>
          <input
            type="text"
            id="season"
            value={formData.season}
            onChange={(e) => setFormData({ ...formData, season: e.target.value })}
            placeholder="2025/2026"
            className="w-full px-3 py-2 border rounded-md"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Format: YYYY/YYYY</p>
        </div>

        <div>
          <label htmlFor="homeAddress" className="block text-sm font-medium mb-1">
            Home Address *
          </label>
          <input
            type="text"
            id="homeAddress"
            value={formData.homeAddress}
            onChange={(e) => setFormData({ ...formData, homeAddress: e.target.value })}
            placeholder="123 Main St, Los Angeles, CA 90001"
            className="w-full px-3 py-2 border rounded-md"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Full address for travel time calculations</p>
        </div>

        <div>
          <label htmlFor="prepTime" className="block text-sm font-medium mb-1">
            Prep Time (minutes) *
          </label>
          <input
            type="number"
            id="prepTime"
            value={formData.prepTimeMinutes}
            onChange={(e) => setFormData({ ...formData, prepTimeMinutes: parseInt(e.target.value, 10) })}
            min="0"
            max="240"
            className="w-full px-3 py-2 border rounded-md"
            required
          />
          <p className="text-xs text-gray-500 mt-1">How many minutes you need to get ready before leaving</p>
        </div>

        <div>
          <label htmlFor="arrivalBuffer" className="block text-sm font-medium mb-1">
            Arrival Buffer (minutes) *
          </label>
          <input
            type="number"
            id="arrivalBuffer"
            value={formData.arrivalBufferMinutes}
            onChange={(e) => setFormData({ ...formData, arrivalBufferMinutes: parseInt(e.target.value, 10) })}
            min="0"
            max="120"
            className="w-full px-3 py-2 border rounded-md"
            required
          />
          <p className="text-xs text-gray-500 mt-1">How many minutes before game time you want to arrive (coach requires 60 min)</p>
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Save Preferences
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
