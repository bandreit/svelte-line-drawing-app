export enum DrawMessageType {
  MOVING = "MOVING",
  END = "END",
}

type DrawMessageArg<T, K = object> = {
  type: T;
  params: K;
};

export type DrawMessage =
| DrawMessageArg<DrawMessageType.MOVING, OrderedDrawParamsMoving>
| DrawMessageArg<DrawMessageType.END>;

export interface DrawParamsMoving {
  x: number;
  y: number;
  color?: string;
}

export interface OrderedDrawParamsMoving extends DrawParamsMoving {
  timestamp: number;
}