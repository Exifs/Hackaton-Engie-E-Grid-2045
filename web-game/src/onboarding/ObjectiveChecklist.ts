import type { OnboardingStep } from "./types";
import { escapeHtml } from "./html";

export function renderObjectiveChecklist(step: OnboardingStep, complete: boolean): string {
  const items = step.checklist?.length ? step.checklist : [step.objective];
  return `
    <ul class="onboarding-checklist" aria-label="Objectif courant">
      ${items
        .map(
          (item) => `
            <li class="${complete ? "is-complete" : ""}">
              <span aria-hidden="true">${complete ? "OK" : ""}</span>
              <strong>${escapeHtml(item)}</strong>
            </li>
          `
        )
        .join("")}
    </ul>
  `;
}
