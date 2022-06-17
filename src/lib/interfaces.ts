/**
   * Data's format for the component
   */
 export interface DataG<T> {
    style: string;
    label: string;
    values: [number, T][];
    interpolation?: unknown; // Non requis pour tout
    color?: unknown
    colors?: unknown
  }

export interface DataEnum<T extends string[]> extends DataG<T[number]> { //interface DataEnum<T extends string[]> extends DataG<T[keyof T]> {
    style: "enumeration";
    label: string;
    // values: [number, T[number]][];
    colors: {
      [k in T[number]]: string; // Couleur de chaque valeur
    };
  }
    
export interface DataBool extends DataG<boolean> {
  style: "boolean";
  label: string;
  values: [number, boolean][];
  color: string; // La couleur de quand c'est vrai
}

  
export interface DataNumber extends DataG<number> {
  style: "number";
  label: string;
  values: [number, number][];
  color: string; // La couleur de la courbe
  interpolation: "linear" | "step";
}

export type Data<T> =
    T extends number ? DataNumber:
    T extends boolean ? DataBool :
    T extends string[] ? DataEnum<T> : never;
    
  
  export interface CONFIG {
    width: number;
    height: number;
    domainY: [number, number];
    speedZoom: number;
    range: [number,number];
    currentTime: number;
    scrollBar: boolean;
    knobCurrentTime: boolean;
    peakSize: number
  }
  
  export interface colorMap {
    sunny: string;
    rainy: string;
    cloudy: string;
    lineIndex: string[];
  }
  
  export const defaultColorMap: colorMap = {
    sunny : "#d77403",
    rainy : "#0473a6",
    cloudy : "#6d8d9d",
    lineIndex: ["#ff0000"]
  }
  
  export const defaultConfig: CONFIG = {
    width: 900,
    height: 80,
    domainY: [0, 0],
    speedZoom: 0.2,
    range: [0,0],
    currentTime: 1,
    scrollBar: false,
    knobCurrentTime: false,
    peakSize: 5,
  
  }
  
  export interface polygonDef {
    "name": string;
    "points": points[];
    "color": string;
  }
  
  export interface points {
    "x": number;
    "y": number;
  }
  