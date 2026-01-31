import { Injectable, signal } from '@angular/core';
import { Resource } from '../models/resource.model';
import { INITIAL_RESOURCES } from '../config/resources.config';

@Injectable({
  providedIn: 'root'
})
export class ResourcesService {
  private resources = signal<Resource[]>(this.initializeResources());

  private initializeResources(): Resource[] {
    return INITIAL_RESOURCES.map(r => ({ ...r }));
  }

  getAll(): Resource[] {
    return this.resources();
  }

  getAmount(resourceId: string): number {
    const resource = this.resources().find(r => r.id === resourceId);
    return resource ? resource.amount : 0;
  }

  add(resourceId: string, amount: number): void {
    if (amount <= 0) return;

    this.resources.update(resources => {
      const resource = resources.find(r => r.id === resourceId);
      if (resource) {
        resource.amount += amount;
      }
      return [...resources];
    });
  }

  subtract(resourceId: string, amount: number): boolean {
    if (amount <= 0) return false;

    const resource = this.resources().find(r => r.id === resourceId);
    if (!resource || resource.amount < amount) {
      return false;
    }

    this.resources.update(resources => {
      const res = resources.find(r => r.id === resourceId);
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
    return this.resources().map(r => ({ ...r }));
  }

  setState(resources: Resource[]): void {
    this.resources.set(resources.map(r => ({ ...r })));
  }
}
