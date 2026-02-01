import { Injectable, signal } from '@angular/core';
import { Resource } from '../models/resource.model';
import { INITIAL_RESOURCES } from '../config/resources.config';

@Injectable({
  providedIn: 'root',
})
export class ResourcesService {
  private resources = signal<Resource[]>(this.initializeResources());

  private initializeResources(): Resource[] {
    return INITIAL_RESOURCES.map((r) => ({ ...r }));
  }

  getAll(): Resource[] {
    return this.resources();
  }

  getAmount(resourceId: string): number {
    const resource = this.resources().find((r) => r.id === resourceId);
    return resource ? resource.amount : 0;
  }

  add(resourceId: string, amount: number): void {
    if (amount <= 0) return;

    this.resources.update((resources) => {
      const resource = resources.find((r) => r.id === resourceId);
      if (resource) {
        // Check if capacity is limited (not Infinity)
        if (isFinite(resource.capacity)) {
          const availableSpace = resource.capacity - resource.amount;
          const amountToAdd = Math.min(amount, availableSpace);
          resource.amount += amountToAdd;
        } else {
          // Unlimited capacity (Infinity)
          resource.amount += amount;
        }
      }
      return [...resources];
    });
  }

  getCapacity(resourceId: string): number {
    const resource = this.resources().find((r) => r.id === resourceId);
    return resource?.capacity ?? Infinity;
  }

  isFull(resourceId: string): boolean {
    const resource = this.resources().find((r) => r.id === resourceId);
    if (!resource) return false;
    if (!isFinite(resource.capacity)) return false; // Infinity = never full
    return resource.amount >= resource.capacity;
  }

  getFillRatio(resourceId: string): number {
    const resource = this.resources().find((r) => r.id === resourceId);
    if (!resource) return 0;
    if (!isFinite(resource.capacity)) return 0; // Infinity = no ratio
    if (resource.capacity === 0) return 1;
    return resource.amount / resource.capacity;
  }

  getAvailableSpace(resourceId: string): number {
    const resource = this.resources().find((r) => r.id === resourceId);
    if (!resource) return 0;
    if (!isFinite(resource.capacity)) return Infinity;
    return Math.max(0, resource.capacity - resource.amount);
  }

  subtract(resourceId: string, amount: number): boolean {
    if (amount <= 0) return false;

    const resource = this.resources().find((r) => r.id === resourceId);
    if (!resource || resource.amount < amount) {
      return false;
    }

    this.resources.update((resources) => {
      const res = resources.find((r) => r.id === resourceId);
      if (res) {
        res.amount -= amount;
      }
      return [...resources];
    });

    return true;
  }

  hasEnough(resourceId: string, amount: number): boolean {
    return this.getAmount(resourceId) >= amount;
  }

  getState(): Resource[] {
    return this.resources().map((r) => ({ ...r }));
  }

  setState(resources: Resource[]): void {
    this.resources.set(resources.map((r) => ({ ...r })));
  }
}
