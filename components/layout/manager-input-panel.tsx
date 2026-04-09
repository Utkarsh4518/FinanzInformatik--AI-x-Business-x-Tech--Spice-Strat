"use client";

import { useEffect, useState } from "react";

import { IntakePayloadPreview } from "@/components/layout/manager-input/intake-payload-preview";
import { TeamAvailabilityEditor } from "@/components/layout/manager-input/team-availability-editor";
import { ShellPanel } from "@/components/ui/shell-panel";
import type { OrganizeProjectRequest } from "@/lib/domain/api";
import type {
  AvailabilityStatus,
  ManagerIntakePayload,
  Project,
  TargetOutputLanguage,
  TeamAvailabilityInput,
  TeamMember
} from "@/lib/domain/models";

type ManagerInputPanelProps = {
  project: Project;
  teamMembers: TeamMember[];
  isOrganizing: boolean;
  onOrganizeProject: (input: OrganizeProjectRequest) => Promise<void>;
  onRawInputChange: (value: string) => void;
};

const targetOutputLanguages: TargetOutputLanguage[] = [
  "English",
  "German",
  "Bilingual"
];

function buildInitialTeamAvailability(teamMembers: TeamMember[]): TeamAvailabilityInput[] {
  return teamMembers.map((member) => ({
    memberId: member.id,
    name: member.name,
    role: member.role,
    availabilityStatus: member.availabilityStatus,
    capacityPercent: member.capacityPercent
  }));
}

export function ManagerInputPanel({
  project,
  teamMembers,
  isOrganizing,
  onOrganizeProject,
  onRawInputChange
}: ManagerInputPanelProps) {
  const [projectName, setProjectName] = useState(project.name);
  const [rawProjectInput, setRawProjectInput] = useState(project.managerBrief);
  const [targetOutputLanguage, setTargetOutputLanguage] =
    useState<TargetOutputLanguage>("Bilingual");
  const [includeRepoContext, setIncludeRepoContext] = useState(true);
  const [editableTeam, setEditableTeam] = useState<TeamAvailabilityInput[]>(
    buildInitialTeamAvailability(teamMembers)
  );
  const [payloadPreview, setPayloadPreview] = useState<ManagerIntakePayload | null>(
    null
  );

  useEffect(() => {
    setProjectName(project.name);
    setRawProjectInput(project.managerBrief);
    setTargetOutputLanguage("Bilingual");
    setIncludeRepoContext(true);
    setEditableTeam(buildInitialTeamAvailability(teamMembers));
    setPayloadPreview(null);
  }, [project.id, project.managerBrief, project.name, teamMembers]);

  function restoreSeededIntake() {
    setProjectName(project.name);
    setRawProjectInput(project.managerBrief);
    setTargetOutputLanguage("Bilingual");
    setIncludeRepoContext(true);
    setEditableTeam(buildInitialTeamAvailability(teamMembers));
    setPayloadPreview(null);
    onRawInputChange(project.managerBrief);
  }

  function handleAvailabilityChange(
    memberId: string,
    availabilityStatus: AvailabilityStatus
  ) {
    setEditableTeam((currentTeam) =>
      currentTeam.map((member) =>
        member.memberId === memberId ? { ...member, availabilityStatus } : member
      )
    );
  }

  function handleCapacityChange(memberId: string, capacityPercent: number) {
    setEditableTeam((currentTeam) =>
      currentTeam.map((member) =>
        member.memberId === memberId ? { ...member, capacityPercent } : member
      )
    );
  }

  async function handleBuildPayload() {
    const payload: ManagerIntakePayload = {
      projectName,
      rawProjectInput,
      targetOutputLanguage,
      includeRepoContext,
      teamAvailability: editableTeam
    };

    setPayloadPreview(payload);

    await onOrganizeProject({
      projectId: project.id,
      rawInput: `Project: ${projectName}\n\n${rawProjectInput}`,
      teamContext: editableTeam,
      includeRepoContext,
      targetLanguage: targetOutputLanguage
    });
  }

  return (
    <ShellPanel
      title="Manager Input"
      description="Entry point for project notes, assumptions, and business context."
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-line bg-white p-4 shadow-panelSoft">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accentMuted">
              Intake Form
            </div>
            <button
              type="button"
              onClick={restoreSeededIntake}
              className="rounded-full border border-line bg-panelSoft px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-white"
            >
              Restore Demo Brief
            </button>
          </div>

          <div className="mt-4 space-y-4">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Project Name
              </span>
                <input
                  type="text"
                  value={projectName}
                  onChange={(event) => setProjectName(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-400"
                />
              </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Raw Project Input
              </span>
              <textarea
                value={rawProjectInput}
                onChange={(event) => {
                  setRawProjectInput(event.target.value);
                  onRawInputChange(event.target.value);
                }}
                rows={7}
                className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-slate-400"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Target Output Language
                </span>
                <select
                  value={targetOutputLanguage}
                  onChange={(event) =>
                    setTargetOutputLanguage(
                      event.target.value as TargetOutputLanguage
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-400"
                >
                  {targetOutputLanguages.map((language) => (
                    <option key={language} value={language}>
                      {language}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-center justify-between rounded-xl border border-line bg-panelSoft px-4 py-3">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Include Repo Context
                  </span>
                  <p className="mt-1 text-sm text-slate-500">
                    Add the local repo snapshot to the structured intake payload.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={includeRepoContext}
                  onChange={(event) => setIncludeRepoContext(event.target.checked)}
                  className="h-4 w-4 rounded border-line accent-accent"
                />
              </label>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-white p-4 shadow-panelSoft">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Team Availability
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Adjust status and capacity locally for the intake payload.
              </p>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {editableTeam.length} members
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {editableTeam.map((member) => (
              <TeamAvailabilityEditor
                key={member.memberId}
                member={member}
                onAvailabilityChange={handleAvailabilityChange}
                onCapacityChange={handleCapacityChange}
              />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border border-line bg-panelSoft px-4 py-3 text-sm text-slate-600">
            The organizer uses the current intake state and falls back safely if the AI route is unavailable.
          </div>
          <button
            type="button"
            onClick={() => void handleBuildPayload()}
            disabled={isOrganizing}
            className="w-full rounded-xl bg-ink px-4 py-3 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:bg-slate-300 hover:bg-slate-800"
          >
            {isOrganizing ? "Organizing intake..." : "Organize with AI"}
          </button>
        </div>

        <IntakePayloadPreview payload={payloadPreview} />
      </div>
    </ShellPanel>
  );
}
