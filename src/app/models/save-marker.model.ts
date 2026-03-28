/**
 * Minimal interface used by services that need to flag a save without
 * depending directly on SaveService (avoids circular DI).
 */
export type SaveMarker = {
  markDirty(): void;
};
