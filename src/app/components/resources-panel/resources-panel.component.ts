import { Component, inject, computed } from '@angular/core';
import { ResourcesService } from '../../services/resources.service';

@Component({
  selector: 'app-resources-panel',
  standalone: true,
  templateUrl: './resources-panel.component.html',
  styleUrl: './resources-panel.component.css'
})
export class ResourcesPanelComponent {
  private resourcesService = inject(ResourcesService);
  
  resources = computed(() => this.resourcesService.getAll());
}
