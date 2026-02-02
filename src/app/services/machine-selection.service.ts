import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class MachineSelectionService {
  private selectedMachineId = signal<string | null>(null);

  selectMachine(machineId: string): void {
    this.selectedMachineId.set(machineId);
  }

  getSelectedMachineId(): string | null {
    return this.selectedMachineId();
  }

  clearSelection(): void {
    this.selectedMachineId.set(null);
  }
}
