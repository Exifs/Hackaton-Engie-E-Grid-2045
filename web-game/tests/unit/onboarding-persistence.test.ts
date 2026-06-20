import { ONBOARDING_STORAGE_KEY, OnboardingPersistence } from "../../src/onboarding/onboardingPersistence";

describe("OnboardingPersistence", () => {
  it("stores completed, skipped, and replay states", () => {
    const storage = new MemoryStorage();
    const persistence = new OnboardingPersistence(storage);

    expect(persistence.hasFinished()).toBe(false);

    persistence.markCompleted();
    expect(persistence.load()?.status).toBe("completed");
    expect(persistence.hasFinished()).toBe(true);

    persistence.markSkipped();
    expect(persistence.load()?.status).toBe("skipped");

    persistence.replay();
    expect(persistence.load()).toBeNull();
    expect(persistence.hasFinished()).toBe(false);
  });

  it("accepts legacy completed values", () => {
    const storage = new MemoryStorage();
    storage.setItem(ONBOARDING_STORAGE_KEY, "true");

    expect(new OnboardingPersistence(storage).load()?.status).toBe("completed");
  });
});

class MemoryStorage implements Pick<Storage, "getItem" | "setItem" | "removeItem"> {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}
