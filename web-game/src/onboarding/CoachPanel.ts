import { t } from "../i18n";
import { escapeHtml } from "./html";
import { renderObjectiveChecklist } from "./ObjectiveChecklist";
import type { OnboardingViewModel } from "./types";

export function renderCoachPanel(view: OnboardingViewModel): string {
  const previousDisabled = view.stepIndex <= 0 ? "disabled" : "";
  const titleId = `onboarding-title-${escapeHtml(view.step.id)}`;
  const isConsequence = view.mode === "consequence";
  const panelBody = isConsequence ? view.step.consequence ?? view.step.body : view.step.body;
  const modeLabel = isConsequence ? t("onboarding.ui.consequence") : t("onboarding.ui.briefing");
  const nextLabel = isConsequence ? t("onboarding.ui.understood") : t("onboarding.ui.next");
  return `
    <section class="onboarding-coach" role="dialog" aria-modal="false" aria-labelledby="${titleId}" aria-live="polite">
      <div class="onboarding-coach-identity">
        <div class="onboarding-coach-avatar" aria-hidden="true"></div>
        <div>
          <span class="onboarding-coach-role">${escapeHtml(t("onboarding.ui.role"))}</span>
          <strong>${escapeHtml(t("onboarding.ui.command"))}</strong>
        </div>
      </div>
      <div class="onboarding-coach-head">
        <span>${view.stepIndex + 1}/${view.totalSteps}</span>
        <em>${modeLabel}</em>
        <strong id="${titleId}">${escapeHtml(view.step.title)}</strong>
      </div>
      <p>${escapeHtml(panelBody)}</p>
      ${renderObjectiveChecklist(view.step, view.currentComplete)}
      <div class="onboarding-actions">
        <button type="button" data-onboarding-action="previous" ${previousDisabled}>${escapeHtml(t("onboarding.ui.previous"))}</button>
        <button type="button" data-onboarding-action="next">${nextLabel}</button>
        <button type="button" data-onboarding-action="skip">${escapeHtml(t("onboarding.ui.skip"))}</button>
      </div>
    </section>
  `;
}
