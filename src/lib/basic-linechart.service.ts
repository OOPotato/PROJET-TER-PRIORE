import { Injectable } from '@angular/core';
import { Data } from './basic-linechart.component';

/**
 * DATA's format when we extract data from a string 
 */
interface DATA<T>{

  /**
   * Timestamp
   */
  timestamp: number;
  
  /**
   * Value
   */
  value: T;
  
  /**
   * Label of sensor in data 
   */
  sensorId: string;
}

@Injectable({
  providedIn: 'root'
})

/**
 * Service that give 6 example of dataset and function to parse DATA and Data from string.
 */
export class DataService {
  
  /**
   * str is an example of data's string
   */
  private str: string = `  
  "2016-07-25 15:47:24,459";"PC6";"OFF"
  "2016-07-25 19:47:24,459";"PC6";"ON"
  "2016-07-26 05:47:24,459";"PC6";"OFF"
  "2016-07-26 06:47:24,459";"PC6";"ON"
  "2016-07-26 06:59:24,459";"PC6";"OFF"
  "2016-07-26 18:21:24,459";"PC6";"ON"
  "2016-07-27 11:00:24,459";"PC6";"OFF"
  "2016-07-28 08:32:24,459";"PC6";"ON"
  "2016-07-28 18:15:24,459";"PC6";"OFF"
  "2016-07-29 09:06:24,459";"PC6";"ON"
  "2016-07-29 19:36:24,459";"PC6";"OFF"
  "2016-07-25 15:47:24,459";"PC5";"OFF"
  "2016-07-25 22:47:24,459";"PC5";"ON"
  "2016-07-25 22:55:24,459";"PC5";"OFF"
  "2016-07-26 07:29:24,459";"PC5";"ON"
  "2016-07-26 20:59:24,459";"PC5";"OFF"
  "2016-07-27 06:21:24,459";"PC5";"ON"
  "2016-07-27 13:00:24,459";"PC5";"OFF"
  "2016-07-28 06:32:24,459";"PC5";"ON"
  "2016-07-28 14:15:24,459";"PC5";"OFF"
  "2016-07-29 06:06:24,459";"PC5";"ON"
  "2016-07-29 19:36:24,459";"PC5";"OFF"
  "2016-07-25 15:47:19,423";"Temperature_Cuisine";"26.7"
  "2016-07-25 15:48:20,279";"Temperature_Cuisine";"26.740000000000002"
  "2016-07-25 15:50:00,776";"Temperature_Cuisine";"26.76"
  "2016-07-25 15:55:00,275";"Temperature_Cuisine";"26.72"
  "2016-07-25 16:10:00,202";"Temperature_Cuisine";"26.68"
  "2016-07-25 16:15:00,197";"Temperature_Cuisine";"26.64"
  "2016-07-25 16:24:50,493";"Temperature_Cuisine";"26.560000000000002"
  "2016-07-25 16:29:50,204";"Temperature_Cuisine";"26.5"
  "2016-07-25 16:34:50,177";"Temperature_Cuisine";"26.46"
  "2016-07-25 16:39:50,128";"Temperature_Cuisine";"26.5"
  "2016-07-25 16:44:50,065";"Temperature_Cuisine";"26.52"
  "2016-07-25 15:47:19,423";"Temperature_Salon";"26.34"
  "2016-07-25 15:48:05,264";"Temperature_Salon";"26.38"
  "2016-07-25 15:53:05,275";"Temperature_Salon";"26.36"
  "2016-07-25 15:58:05,252";"Temperature_Salon";"26.34"
  "2016-07-25 16:08:05,234";"Temperature_Salon";"26.32"
  "2016-07-25 16:13:05,237";"Temperature_Salon";"26.28"
  "2016-07-25 16:23:05,172";"Temperature_Salon";"26.22"
  "2016-07-25 16:28:05,244";"Temperature_Salon";"26.16"
  "2016-07-25 16:29:55,490";"Temperature_Salon";"26.14"
  "2016-07-25 15:47:19,423";"PC3";"ON"
  "2016-07-25 15:48:20,279";"PC3";"OFF"
  "2016-07-25 15:50:00,776";"PC3";"ON"
  "2016-07-25 15:55:00,275";"PC3";"OFF"
  "2016-07-25 16:10:00,202";"PC3";"ON"
  "2016-07-25 16:15:00,197";"PC3";"OFF"
  "2016-07-25 16:24:50,493";"PC3";"ON"
  "2016-07-25 16:29:50,204";"PC3";"OFF"
  "2016-07-25 16:34:50,177";"PC3";"ON"
  "2016-07-25 16:39:50,128";"PC3";"OFF"
  "2016-07-25 16:44:50,065";"PC3";"ON"
  `;

  
  /**
   * Dataset 1
   */
  public dataExample1: Data[] = []; 
  
  /**
   * Dataset 2
   */
  public dataExample2: Data[] = [];
  
  /**
   * Dataset 3
   */
  public dataExample3: Data[] = [];
  
  /**
   * Dataset 4
   */
  public dataExample4: Data[] = [];
  
  /**
   * Dataset 5
   */
  public dataExample5: Data[] = [];
  
  /**
   * Dataset 6
   */
  public dataExample6: Data[] = [];

  /**
   * Constructor
   * Launch generateExample with parameters this.str to fill all Dataset
   */
  constructor() {
    this.generateExample(this.str);
  }

  /**
   * Parse of str to obtain DATA[]
   * @param str 
   * @param sensorId 
   * @param f 
   * @returns DATA[]
   */
  private parse<T>(str: string, sensorId: string, f: (s: string) => T): DATA<T>[] {
    /**
     * Const to parse DATA
     */
    const L: DATA < T > [] = str.trim().split("\n").map(s => s.trim()).filter(s => s!=="")

                 .map( s => s.split(";").map( s => s.slice(1, -1) ) )

                 .filter( tab => tab[1] === sensorId )

                 .map( ([t, id, v]) => ({

                     timestamp: (new Date((t.replace(",", "."))).getTime()),

                     value: f(v),

                     sensorId: id

                 }));
    return L;

  }

  /**
   * Parse of str to obtain Data[]
   * @param str 
   * @param label 
   * @param color 
   * @param style 
   * @param interpolation 
   * @param f 
   * @returns Data[]
   */
  public generateData(str:string, label:string, color:string, style: "both"|"line"|"area",interpolation: "step"|"linear", f: (s:string)=>number):Data{
    let d: DATA<number>[] = this.parse<number>(str,label, f);
    let v: [number,number][] = [];
    d.forEach(element =>v.push([element.timestamp,element.value]));
    let da: Data = {
      label: label,
      values: v,
      color: color,
      style: style,
      interpolation: interpolation
    }
    return da;
  }

  /**
   * Transform string in number
   * @param s 
   * @returns 1 if s=='ON', 0 if s=='OFF' else -1
   */
  public parseBool(s: string):number {
    if(s=='ON') return 1;
    else if (s=='OFF') return 0;
    else return -1;
  }

  /**
   * Generate all dataset
   * @param str 
   */
  private generateExample(str:string){
    let d2: DATA<number>[] = this.parse<number>(str,"PC5", this.parseBool);
    let v2: [number,number][] = [];
    d2.forEach(element =>v2.push([element.timestamp,element.value]));
    let x:number = 0;
    v2.forEach(element=> {
      element[1]=x;
      x=this.getRandomInt(x);
    }
      );
    let da2: Data = {
      label: "PC4",
      values: v2,
      color: "purple",
      style: "line",
      interpolation: "linear"
    }
    
    this.dataExample2.push(this.generateData(str,"PC6","#124568","both", "step",this.parseBool));
    this.dataExample1.push(da2);
    this.dataExample4.push(this.generateData(str,"Temperature_Salon", "purple", "line", "linear", parseFloat));
    this.dataExample3.push(this.generateData(str,"PC5", "pink", "line", "step", this.parseBool));
    this.dataExample3.push(this.generateData(str,"PC6","#124568","both", "step",this.parseBool));
    this.dataExample5.push(this.generateData(str,"Temperature_Cuisine", "gold", "line", "step", parseFloat));
    this.dataExample6.push(this.generateData(str,"PC3","green","both", "step",this.parseBool));
  }

  /**
   * Get +1 or -1 on the param x
   * @param x 
   * @returns x+1 or x-1 (random)
   */
  private getRandomInt(x:number){
    let alea: number;
    if(x==0){
      return 1;
    }else{
      alea=Math.round(Math.random());
      if(alea==0){
        return x-1;
      }else{
        return x+1;
      }
    }
  }
}
