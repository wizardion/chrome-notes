export interface INote {
  id: number;
  title: string;
  description: string;
  displayOrder: number;
  sync: boolean;
  view: boolean;
  updated: number;
  created: number;
}