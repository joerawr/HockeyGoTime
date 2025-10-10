'use client';

/**
 * Preference Panel Component
 * Displays current user preferences with edit capability
 */

import { useState, useEffect, useMemo, type ReactNode } from "react";
import type { UserPreferences, MCPServerId } from "@/types/preferences";
import { DEFAULT_PREFERENCES } from "@/types/preferences";
import { PreferencesStore } from "@/lib/storage/preferences";
import { PreferenceForm } from "./PreferenceForm";

const panelContainerClasses =
  "rounded-2xl border-2 border-slate-200 bg-white/95 p-6 shadow-md backdrop-blur-sm";

export function PreferencePanel() {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const defaultMcpServer = useMemo(
    () => (DEFAULT_PREFERENCES.mcpServer as MCPServerId) || "scaha",
    []
  );
  const [selectedMcpServer, setSelectedMcpServer] =
    useState<MCPServerId>(defaultMcpServer);

  // Load preferences on mount
  useEffect(() => {
    const loadPreferences = () => {
      const savedPrefs = PreferencesStore.get();
      const mcpServer = savedPrefs?.mcpServer ?? defaultMcpServer;

      setSelectedMcpServer(mcpServer);
      setPreferences(savedPrefs);
      setIsLoading(false);

      // If no preferences, show form automatically
      const isMissingCoreInfo =
        !savedPrefs ||
        !savedPrefs.team ||
        savedPrefs.team.trim() === "" ||
        !savedPrefs.division ||
        savedPrefs.division.trim() === "" ||
        !savedPrefs.season ||
        savedPrefs.season.trim() === "" ||
        !savedPrefs.homeAddress ||
        savedPrefs.homeAddress.trim() === "";

      if (isMissingCoreInfo) {
        setIsEditing(true);
      }
    };

    loadPreferences();
  }, [defaultMcpServer]);

  const buildBlankPreferences = (mcpServer: MCPServerId): UserPreferences => ({
    mcpServer,
    team: "",
    division: "",
    season: DEFAULT_PREFERENCES.season || "2025/2026",
    homeAddress: "",
    prepTimeMinutes: DEFAULT_PREFERENCES.prepTimeMinutes ?? 30,
    arrivalBufferMinutes: DEFAULT_PREFERENCES.arrivalBufferMinutes ?? 60,
    minWakeUpTime: undefined,
  });

  const handleSave = (newPreferences: UserPreferences) => {
    const updatedPreferences: UserPreferences = {
      ...newPreferences,
      mcpServer: selectedMcpServer,
    };

    PreferencesStore.set(updatedPreferences);
    setPreferences(updatedPreferences);
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
      setSelectedMcpServer(defaultMcpServer);
      setIsEditing(true);
    }
  };

  const handleMcpServerChange = (nextServer: MCPServerId) => {
    if (nextServer === selectedMcpServer) {
      return;
    }

    setSelectedMcpServer(nextServer);

    const existing = PreferencesStore.get();
    const updatedPreferences = {
      ...(existing ?? buildBlankPreferences(nextServer)),
      mcpServer: nextServer,
    };

    PreferencesStore.set(updatedPreferences);
    setPreferences(existing ? { ...existing, mcpServer: nextServer } : buildBlankPreferences(nextServer));

    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  if (isLoading) {
    return (
      <div className={panelContainerClasses}>
        <LeagueSelector
          value={selectedMcpServer}
          onChange={handleMcpServerChange}
          disabled
        />
        <p className="mt-6 text-sm text-slate-600">Loading preferences...</p>
      </div>
    );
  }

  let content: ReactNode;

  if (isEditing) {
    content = (
      <PreferenceForm
        initialPreferences={preferences}
        selectedMcpServer={selectedMcpServer}
        onSave={handleSave}
        onCancel={preferences ? handleCancel : undefined}
      />
    );
  } else if (!preferences) {
    content = (
      <div>
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
  } else {
    content = (
      <>
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-slate-900">Team Preferences</h3>
          <p className="text-xs text-slate-500">Used for schedule, travel, and stats questions.</p>
        </div>

        <div className="space-y-4 text-sm">
          <PreferenceRow label="League Data Source:" value={formatMcpLabel(preferences.mcpServer)} />
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
      </>
    );
  }

  return (
    <div className={panelContainerClasses}>
      <LeagueSelector
        value={selectedMcpServer}
        onChange={handleMcpServerChange}
        disabled={isLoading}
      />
      <div className="mt-6">{content}</div>
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

function formatMcpLabel(server: MCPServerId): string {
  return server === "pghl" ? "PGHL MCP" : "SCAHA MCP";
}

function LeagueSelector({
  value,
  onChange,
  disabled = false,
}: {
  value: MCPServerId;
  onChange: (value: MCPServerId) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          League Data Source
        </p>
        <p className="text-sm text-slate-600">
          Choose which MCP server powers schedule lookups.
        </p>
      </div>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as MCPServerId)}
        disabled={disabled}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm transition focus-visible:border-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 sm:w-auto"
      >
        <option value="scaha">SCAHA MCP</option>
        <option value="pghl">PGHL MCP</option>
      </select>
    </div>
  );
}
