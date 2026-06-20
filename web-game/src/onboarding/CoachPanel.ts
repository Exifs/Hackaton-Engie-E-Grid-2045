import { escapeHtml } from "./html";
import { renderObjectiveChecklist } from "./ObjectiveChecklist";
import type { OnboardingViewModel } from "./types";

export function renderCoachPanel(view: OnboardingViewModel): string {
  const previousDisabled = view.stepIndex <= 0 ? "disabled" : "";
  const titleId = `onboarding-title-${escapeHtml(view.step.id)}`;
  return `
    <section class="onboarding-coach" role="dialog" aria-modal="false" aria-labelledby="${titleId}" aria-live="polite">
      <div class="onboarding-coach-head">
        <span>${view.stepIndex + 1}/${view.totalSteps}</span>
        <strong id="${titleId}">${escapeHtml(view.step.title)}</strong>
      </div>
      <p>${escapeHtml(view.step.body)}</p>
      ${renderObjectiveChecklist(view.step, view.currentComplete)}
      <div class="onboarding-actions">
        <button type="button" data-onboarding-action="previous" ${previousDisabled}>Precedent</button>
        <button type="button" data-onboarding-action="next">Suivant</button>
        <button type="button" data-onboarding-action="skip">Passer</button>
      </div>
    </section>
  `;
}
