export interface Resource {
  id: string;
  name: string;
  amount: number;
  capacity: number; // Infinity = unlimited (e.g., money)
  icon: string;
}

export enum ResourceType {
  SCRAP = 'scrap',
  METAL = 'metal',
  PLASTIC = 'plastic',
  COMPONENTS = 'components',
  MONEY = 'money',
}
