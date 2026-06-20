export const ONBOARDING_STORAGE_KEY = "egrid:onboarding:v1:completed";

export type PersistedOnboardingStatus = "completed" | "skipped";

export interface PersistedOnboardingState {
  version: 1;
  status: PersistedOnboardingStatus;
  updatedAt: string;
}

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export class OnboardingPersistence {
  private readonly storage: StorageLike | undefined;
  private readonly key: string;

  constructor(storage: StorageLike | undefined = safeLocalStorage(), key = ONBOARDING_STORAGE_KEY) {
    this.storage = storage;
    this.key = key;
  }

  load(): PersistedOnboardingState | null {
    const raw = this.storage?.getItem(this.key);
    if (!raw) {
      return null;
    }
    if (raw === "true" || raw === "completed") {
      return { version: 1, status: "completed", updatedAt: "" };
    }
    if (raw === "skipped") {
      return { version: 1, status: "skipped", updatedAt: "" };
    }
    try {
      const parsed = JSON.parse(raw) as Partial<PersistedOnboardingState>;
      if (parsed.version === 1 && (parsed.status === "completed" || parsed.status === "skipped")) {
        return {
          version: 1,
          status: parsed.status,
          updatedAt: parsed.updatedAt ?? ""
        };
      }
    } catch {
      return null;
    }
    return null;
  }

  hasFinished(): boolean {
    return this.load() !== null;
  }

  markCompleted(): void {
    this.store("completed");
  }

  markSkipped(): void {
    this.store("skipped");
  }

  replay(): void {
    this.storage?.removeItem(this.key);
  }

  reset(): void {
    this.storage?.removeItem(this.key);
  }

  private store(status: PersistedOnboardingStatus): void {
    this.storage?.setItem(
      this.key,
      JSON.stringify({
        version: 1,
        status,
        updatedAt: new Date().toISOString()
      } satisfies PersistedOnboardingState)
    );
  }
}

function safeLocalStorage(): StorageLike | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}
