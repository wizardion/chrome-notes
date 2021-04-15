export interface INote {
  id: number;
  title: string;
  description: string;
  viewOrder: number;
  sync: boolean;
  preview: boolean;
  updated: number;
  created: number;
}