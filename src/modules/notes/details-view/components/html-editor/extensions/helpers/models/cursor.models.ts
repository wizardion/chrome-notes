
export interface IPoint {
  top: number;
  left: number;
  height: number;
}

export interface IRect {
  top: number;
  left: number;
  right: number;
  bottom: number;
}

export interface ISelectionRange {
  cursor: IPoint;
  collapsed: boolean;
  clientRects: IRect[];
}

export enum IDirection {
  left = 0,
  right = 1,
}
