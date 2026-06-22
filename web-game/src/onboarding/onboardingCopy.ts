import { t } from "../i18n";

function onboardingCopy(key: string): { title: string; body: string; objective: string; consequence?: string } {
  const base = `onboarding.${key}`;
  const consequence = t(`${base}.consequence`);
  return {
    title: t(`${base}.title`),
    body: t(`${base}.body`),
    objective: t(`${base}.objective`),
    consequence: consequence === `${base}.consequence` ? undefined : consequence
  };
}

export const ONBOARDING_COPY = {
  mission: onboardingCopy("mission"),
  resources: onboardingCopy("resources"),
  university: onboardingCopy("university"),
  coolingOverlay: onboardingCopy("coolingOverlay"),
  starterEnergy: onboardingCopy("starterEnergy"),
  coolingBuild: onboardingCopy("coolingBuild"),
  datacenter: onboardingCopy("datacenter"),
  research: onboardingCopy("research"),
  energyResearch: onboardingCopy("energyResearch"),
  networkOverlay: onboardingCopy("networkOverlay"),
  complete: onboardingCopy("complete")
} as const;
