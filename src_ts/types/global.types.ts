export declare type GenericObject<T = any> = {
  [key: string]: T;
};
export declare type AnyObject = GenericObject;
export declare type Callback = (...args: any) => void;
