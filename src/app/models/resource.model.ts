export interface Resource {
  id: string;
  name: string;
  amount: number;
  icon: string;
}

export enum ResourceType {
  SCRAP = 'scrap',
  METAL = 'metal',
  PLASTIC = 'plastic',
  COMPONENTS = 'components',
  MONEY = 'money',
}
