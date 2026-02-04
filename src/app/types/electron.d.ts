export interface ElectronApi {
  ping: () => string;
  saveGame: (data: string) => Promise<{ success: boolean; error?: string }>;
  loadGame: () => Promise<{ success: boolean; data?: string; error?: string }>;
  hasSave: () => Promise<{ success: boolean; exists: boolean }>;
  clearSave: () => Promise<{ success: boolean; error?: string }>;
  getSavePath: () => Promise<{ success: boolean; path: string }>;
}

declare global {
  interface Window {
    electronApi?: ElectronApi;
  }
}
