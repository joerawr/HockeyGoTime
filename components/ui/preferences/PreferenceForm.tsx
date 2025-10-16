"use client";

/**
 * Preference Form Component
 * Form for setting and editing user preferences
 */

import { useEffect, useState } from "react";
import type { UserPreferences, MCPServerId } from "@/types/preferences";
import { DEFAULT_PREFERENCES } from "@/types/preferences";
import { validatePreferences } from "@/lib/utils/validation";

interface PreferenceFormProps {
  initialPreferences?: UserPreferences | null;
  selectedMcpServer: MCPServerId;
  onSave: (preferences: UserPreferences) => void;
  onCancel?: () => void;
}

export function PreferenceForm({
  initialPreferences,
  selectedMcpServer,
  onSave,
  onCancel,
}: PreferenceFormProps) {
  const [formData, setFormData] = useState<UserPreferences>({
    mcpServer:
      initialPreferences?.mcpServer ||
      selectedMcpServer ||
      (DEFAULT_PREFERENCES.mcpServer as MCPServerId) ||
      "scaha",
    team: initialPreferences?.team || "",
    division: initialPreferences?.division || "",
    season:
      initialPreferences?.season || DEFAULT_PREFERENCES.season || "2025/2026",
    homeAddress: initialPreferences?.homeAddress || "",
    prepTimeMinutes:
      initialPreferences?.prepTimeMinutes ??
      DEFAULT_PREFERENCES.prepTimeMinutes ??
      30,
    arrivalBufferMinutes:
      initialPreferences?.arrivalBufferMinutes ??
      DEFAULT_PREFERENCES.arrivalBufferMinutes ??
      60,
    minWakeUpTime: initialPreferences?.minWakeUpTime,
  });

  const [errors, setErrors] = useState<string[]>([]);

  // Keep internal form data in sync with external MCP selection
  // Also update season format when switching between leagues
  useEffect(() => {
    setFormData((prev) => {
      // Only update season if switching between different MCP servers
      if (prev.mcpServer === selectedMcpServer) {
        return { ...prev, mcpServer: selectedMcpServer };
      }

      // Determine the default season for the new MCP server
      const newSeason = selectedMcpServer === 'pghl'
        ? '2025-26 12u-19u AA'
        : '2025/26';

      return {
        ...prev,
        mcpServer: selectedMcpServer,
        season: newSeason,
      };
    });
  }, [selectedMcpServer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const nextPreferences: UserPreferences = {
      ...formData,
      mcpServer: selectedMcpServer,
    };

    // Validate preferences
    const validationErrors = validatePreferences(nextPreferences);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Clear errors and save
    setErrors([]);
    onSave(nextPreferences);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-slate-900">Your Hockey Preferences</h2>
        <p className="text-sm text-slate-500">
          Save your team info so we can answer schedule and travel questions faster.
        </p>
        <p className="text-xs text-slate-400 italic">* Required field</p>
      </div>

      {errors.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50/70 p-4 text-sm text-red-700 shadow-inner">
          <ul className="space-y-1 pl-5 text-left">
            {errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="team" className="mb-1 block text-sm font-semibold text-slate-700">
            Team Name *
          </label>
          <input
            type="text"
            id="team"
            value={formData.team}
            onChange={(e) => setFormData({ ...formData, team: e.target.value })}
            placeholder="e.g., Jr. Kings (1)"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm transition focus-visible:border-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
            required
          />
          <p className="mt-1 text-xs text-slate-500">
            Enter your team name (e.g., "Jr. Kings 1" or "OC Hockey 2")
          </p>
        </div>

        <div>
          <label htmlFor="division" className="mb-1 block text-sm font-semibold text-slate-700">
            Division *
          </label>
          <input
            type="text"
            id="division"
            value={formData.division}
            onChange={(e) => setFormData({ ...formData, division: e.target.value })}
            placeholder="e.g., 14U B"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm transition focus-visible:border-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
            required
          />
          <p className="mt-1 text-xs text-slate-500">Enter division (e.g., "14B", "16A", "12AAA")</p>
        </div>

        <div>
          <label htmlFor="season" className="mb-1 block text-sm font-semibold text-slate-700">
            Season *
          </label>
          <input
            type="text"
            id="season"
            value={formData.season}
            onChange={(e) => setFormData({ ...formData, season: e.target.value })}
            placeholder={selectedMcpServer === 'pghl' ? '2025-26 12u-19u AA' : '2025/26'}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm transition focus-visible:border-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
            required
          />
          <p className="mt-1 text-xs text-slate-500">
            {selectedMcpServer === 'pghl'
              ? 'Format: YYYY-YY [division]'
              : 'Format: YYYY/YY'}
          </p>
        </div>

        <div>
          <label htmlFor="homeAddress" className="mb-1 block text-sm font-semibold text-slate-700">
            Home Address
          </label>
          <input
            type="text"
            id="homeAddress"
            value={formData.homeAddress}
            onChange={(e) => setFormData({ ...formData, homeAddress: e.target.value })}
            placeholder="123 Main St, Los Angeles, CA 90001"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm transition focus-visible:border-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
          />
          <p className="mt-1 text-xs text-slate-500">Optional - for travel time calculations. If traveling, provide hotel name in chat.</p>
        </div>

        <div>
          <label htmlFor="prepTime" className="mb-1 block text-sm font-semibold text-slate-700">
            Prep Time (minutes) *
          </label>
          <input
            type="number"
            id="prepTime"
            value={formData.prepTimeMinutes}
            onChange={(e) =>
              setFormData({
                ...formData,
                prepTimeMinutes: Number.parseInt(e.target.value, 10),
              })
            }
            min="0"
            max="240"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm transition focus-visible:border-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
            required
          />
          <p className="mt-1 text-xs text-slate-500">
            How many minutes you need to get ready before leaving
          </p>
        </div>

        <div>
          <label htmlFor="arrivalBuffer" className="mb-1 block text-sm font-semibold text-slate-700">
            Arrival Buffer (minutes) *
          </label>
          <input
            type="number"
            id="arrivalBuffer"
            value={formData.arrivalBufferMinutes}
            onChange={(e) =>
              setFormData({
                ...formData,
                arrivalBufferMinutes: Number.parseInt(e.target.value, 10),
              })
            }
            min="0"
            max="120"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm transition focus-visible:border-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
            required
          />
          <p className="mt-1 text-xs text-slate-500">
            How many minutes before game time you want to arrive (coach requires 60 min)
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 pt-2 sm:flex-row">
        <button
          type="submit"
          className="flex-1 rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-600"
        >
          Save Preferences
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-300"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
