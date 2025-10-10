"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Preferences {
  team: string
  division?: string
  season?: string
  homeAddress: string
  prepTime: number
  arrivalBuffer: number
}

interface PreferencePanelProps {
  preferences: Preferences
  onEdit?: () => void
  onClear?: () => void
}

export function PreferencePanel({ preferences, onEdit, onClear }: PreferencePanelProps) {
  return (
    <Card className="p-6 bg-white border-2 border-slate-200 shadow-md">
      {/* Preference Items */}
      <div className="space-y-4 mb-6">
        <PreferenceItem label="Team:" value={preferences.team} />
        {preferences.division && <PreferenceItem label="Division:" value={preferences.division} />}
        {preferences.season && <PreferenceItem label="Season:" value={preferences.season} />}
        <PreferenceItem label="Home Address:" value={preferences.homeAddress} />
        <PreferenceItem label="Prep Time:" value={`${preferences.prepTime} min`} />
        <PreferenceItem label="Arrival Buffer:" value={`${preferences.arrivalBuffer} min`} />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button variant="secondary" onClick={onEdit} className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-900">
          Edit
        </Button>
        <Button variant="destructive" onClick={onClear} className="flex-1 bg-red-100 hover:bg-red-200 text-red-900">
          Clear All
        </Button>
      </div>
    </Card>
  )
}

function PreferenceItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-sm text-slate-600 font-medium whitespace-nowrap">{label}</span>
      <span className="text-sm text-slate-900 font-semibold text-right">{value}</span>
    </div>
  )
}
