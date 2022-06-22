import {Injectable} from '@angular/core';
import {colorMap, DataG, DataBool, DataEnum, DataNumber} from 'src/lib/interfaces'
import {rgb} from "d3";


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

const defaultColorScheme: colorMap = {
  sunny : "#d77403",
  rainy : "#0473a6",
  cloudy : "#6d8d9d",
  lineIndex: ["#ff0000", "#00ff00", "#000000"]
}

@Injectable({
  providedIn: 'root'
})

/**
 * Service that give 6 example of dataset and function to parse DATA and Data from string.
 */
export class DataService<T> {

  /**
   * str is an example of data's string
   */
  public str: string = `
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

  "2016-07-25 15:47:19,423";"Temperature_Cuisine";"25.7"
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
  "2016-07-25 16:34:50,177";"Temperature_Salon";"26.16"
  "2016-07-25 16:39:50,128";"Temperature_Salon";"26.15"
  "2016-07-25 16:44:50,065";"Temperature_Salon";"26.12"


  "2016-07-25 15:47:24,459";"Temperature_Chambre";"21.34"
  "2016-07-25 22:47:24,459";"Temperature_Chambre";"21.38"
  "2016-07-25 22:55:24,459";"Temperature_Chambre";"21.36"
  "2016-07-26 07:29:24,459";"Temperature_Chambre";"21.34"
  "2016-07-26 20:59:24,459";"Temperature_Chambre";"21.32"
  "2016-07-27 06:21:24,459";"Temperature_Chambre";"21.28"
  "2016-07-27 13:00:24,459";"Temperature_Chambre";"21.22"
  "2016-07-28 06:32:24,459";"Temperature_Chambre";"21.05"
  "2016-07-28 14:15:24,459";"Temperature_Chambre";"21.34"
  "2016-07-29 06:06:24,459";"Temperature_Chambre";"21.56"
  "2016-07-29 19:36:24,459";"Temperature_Chambre";"21.3"


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
  "2016-07-25 16:44:50,065";"PC3";"OFF"

  "2016-07-25 15:47:19,423";"Enum_1";"SUNNY"
  "2016-07-25 15:48:20,279";"Enum_1";"CLOUDY"
  "2016-07-25 15:50:00,776";"Enum_1";"RAINY"
  "2016-07-25 15:55:00,275";"Enum_1";"CLOUDY"
  "2016-07-25 16:10:00,202";"Enum_1";"CLOUDY"
  "2016-07-25 16:15:00,197";"Enum_1";"SUNNY"
  "2016-07-25 16:24:50,493";"Enum_1";"SUNNY"
  "2016-07-25 16:29:50,204";"Enum_1";"SUNNY"
  "2016-07-25 16:34:50,177";"Enum_1";"CLOUDY"
  "2016-07-25 16:39:50,128";"Enum_1";"RAINY"
  "2016-07-25 16:44:50,065";"Enum_1";"RAINY"

  "2016-07-25 15:47:24,459";"Enum_2";"CLOUDY"
  "2016-07-25 22:47:24,459";"Enum_2";"CLOUDY"
  "2016-07-25 22:55:24,459";"Enum_2";"CLOUDY"
  "2016-07-26 07:29:24,459";"Enum_2";"SUNNY"
  "2016-07-26 20:59:24,459";"Enum_2";"CLOUDY"
  "2016-07-27 06:21:24,459";"Enum_2";"RAINY"
  "2016-07-27 13:00:24,459";"Enum_2";"RAINY"
  "2016-07-28 06:32:24,459";"Enum_2";"CLOUDY"
  "2016-07-28 14:15:24,459";"Enum_2";"SUNNY"
  "2016-07-29 06:06:24,459";"Enum_2";"SUNNY"
  "2016-07-29 19:36:24,459";"Enum_2";"SUNNY"

  "2016-07-25 15:47:24,459";"Enum_3";"PLOP"
  "2016-07-25 22:47:24,459";"Enum_3";"CLOUDY"
  "2016-07-25 22:55:24,459";"Enum_3";"CLOUDY"
  "2016-07-26 07:29:24,459";"Enum_3";"PLOP"
  "2016-07-26 20:59:24,459";"Enum_3";"PLOP"
  "2016-07-27 06:21:24,459";"Enum_3";"RAINY"
  "2016-07-27 13:00:24,459";"Enum_3";"RAINY"
  "2016-07-28 06:32:24,459";"Enum_3";"PLOP"
  "2016-07-28 14:15:24,459";"Enum_3";"PLOP"
  "2016-07-29 06:06:24,459";"Enum_3";"SUNNY"
  "2016-07-29 19:36:24,459";"Enum_3";"SUNNY"
  `;


  public datasetsNumber: DataNumber[][] = [];
  public datasetsBool: DataBool[][] = [];
  public datasetsEnum: DataEnum<[string]>[][] = [];

  public dataTestBool: DataBool[] = [];

  public colorScheme1: colorMap;
  public colorScheme2: colorMap;

  public nbOfData: number;

  /**
   * Constructor
   * Launch generateExample with parameters this.str to fill all Dataset
   */
  constructor() {
    this.nbOfData = this.countNumberOfData(this.str);
    for (let i = 0; i < this.nbOfData; i++) {
    }
    this.generateExample(this.str);


    this.colorScheme1 = {
      sunny : "#d70303",
      rainy : "#00abff",
      cloudy : "#0d8a5a",
      lineIndex: ["#5ad95a", "#e19b0f"]
    }
    this.colorScheme2 = {
      sunny : "#d74303",
      rainy : "#0a4059",
      cloudy : "#7c7a98",
      lineIndex: ["#2883ea", "#09a811"]
    }

  }

  public generateNumberData<T>(str:string, label:string, color:string,interpolation: "step"|"linear", f: (s:string)=>(number | boolean | string)): DataNumber{
    let d: DATA<(number | boolean | string)>[] = this.parse<(number | boolean | string)>(str,label, f);
    let v: [number,any][] = [];
    d.forEach(element =>v.push([element.timestamp,element.value]));

    return {
      label: label,
      values: v,
      style: "number",
      color: this.randomColor(100),
      interpolation: interpolation
    };

  }

  public generateBoolData<T>(str:string, label:string, color:string, f: (s:string)=>(number | boolean | string)): DataBool{
    let d: DATA<(number | boolean | string)>[] = this.parse<(number | boolean | string)>(str,label, f);
    let v: [number,any][] = [];
    d.forEach(element =>v.push([element.timestamp,element.value]));

    return {
      label: label,
      values: v,
      style: "boolean",
      color: this.randomColor(100) + "70"
    };

  }

  public generateEnumData<T>(str:string, label:string, color:string, f: (s:string)=>(number | boolean | string)): DataEnum<string[]>{
    let d: DATA<(number | boolean | string)>[] = this.parse<(number | boolean | string)>(str,label, f);
    let v: [number,any][] = [];
    d.forEach(element =>v.push([element.timestamp,element.value]));

    let datatest: DataEnum<["CLOUDY", "SUNNY", "RAINY", "PLOP"]> =  {
      label: label,
      values: v,
      style: "enumeration",
      colors: {
        "CLOUDY": this.randomColor(100),
        "SUNNY": this.randomColor(100),
        "RAINY": this.randomColor(100),
        "PLOP": this.randomColor(100),
      },
      labels: {
        "CLOUDY": "☁️",
        "SUNNY": "☀️",
        "RAINY": "🌧️",
        "PLOP": "PLOP",
      }
    };


    // let enums = this.getEnums(this.str, label);

    // enums.forEach(e => {
    //   datatest.colors[e] = this.randomColor(100);
    // });

    return datatest;
  }


  /**
   * Generate all dataset
   * @param str
   */
  private generateExample(str:string){
    let d2: DATA<boolean>[] = this.parse<boolean>(str,"PC5", this.parseBool);
    let v2: [number,boolean][] = [];
    d2.forEach(element =>v2.push([element.timestamp,element.value]));
    let x:boolean = false;
    v2.forEach(element=> {
        element[1]=x;
        x=this.getRandomBoolean();
      }
    );
    let da2: DataBool = {
      label: "PC4",
      values: v2,
      color: "blue",
      style: "boolean",
    }


    this.datasetsBool.push([]);
    this.datasetsBool[0].push(this.generateBoolData(str,"PC6","#048ba8", this.parseBool));
    this.datasetsBool.push([]);
    this.datasetsBool[1].push(this.generateBoolData(str,"PC6","#124568", this.parseBool));
    this.datasetsBool.push([]);
    this.datasetsBool[2].push(this.generateBoolData(str,"PC3","green", this.parseBool));
    this.datasetsBool.push([]);
    this.datasetsBool[3].push(this.generateBoolData(str,"PC5", "pink", this.parseBool));
    this.datasetsBool.push([]);
    this.datasetsBool[4].push(this.generateBoolData(str,"PC5", "#29fad4", this.parseBool));
    this.datasetsBool[4].push(this.generateBoolData(str,"PC6","#048ba8", this.parseBool));
    this.datasetsBool.push([]);
    this.datasetsBool[5].push(this.generateBoolData(str,"PC5", "#29fad4", this.parseBool));
    this.datasetsBool[5].push(this.generateBoolData(str,"PC6","#048ba8", this.parseBool));
    this.datasetsBool[5].push(this.generateBoolData(str,"PC3","#1160ff", this.parseBool));
    this.datasetsBool.push([]);
    this.datasetsBool[6].push(da2);

    this.datasetsNumber.push([]);
    this.datasetsNumber[0].push(this.generateNumberData(str,"Temperature_Salon", "purple", "linear", parseFloat));
    this.datasetsNumber.push([]);
    this.datasetsNumber[1].push(this.generateNumberData(str,"Temperature_Cuisine", "gold", "step", parseFloat));
    this.datasetsNumber.push([]);
    this.datasetsNumber[2].push(this.generateNumberData(str,"Temperature_Chambre", "#ff5e21", "linear", parseFloat));
    this.datasetsNumber.push([]);
    this.datasetsNumber[3].push(this.generateNumberData(str,"Temperature_Salon", "purple",  "linear", parseFloat));
    this.datasetsNumber[3].push(this.generateNumberData(str,"Temperature_Cuisine", "gold", "step", parseFloat));

    this.datasetsEnum.push([]);
    this.datasetsEnum[0].push(this.generateEnumData(str,"Enum_1", "red", this.parseEnum));
    this.datasetsEnum.push([]);
    this.datasetsEnum[1].push(this.generateEnumData(str,"Enum_2", "#6a13ce", this.parseEnum));
    this.datasetsEnum.push([]);
    this.datasetsEnum[2].push(this.generateEnumData(str,"Enum_3", "#6a13ce", this.parseEnum));

  }

  /**
   * Get +1 or -1 on the param x
   * @param x
   * @returns x+1 or x-1 (random)
   */
  private getRandomBoolean(){
    let x = Math.round(Math.random());
    return x == 1;
  }

  /**
   * Transform string in number
   * @param s
   * @returns 1 if s=='ON', -1 if s=='OFF' else 1
   */
  public parseBool(s: string):boolean {
    if(s=='ON') return true;
    else if (s=='OFF') return false;

    return false;
  }

  public parseEnum(s: string):string {
    return s;
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

  private countNumberOfData(str: string): number {

    let test: string[][] = str.trim().split("\n").map(s => s.trim()).filter(s => s!=="")
      .map( s => s.split(";").map( s => s.slice(1, -1) ) );

    let test2: string[] = [];

    test.forEach((element: string[]) => {
      test2.push(element[1]);

    });

    return new Set(test2).size;
  }

  public getEnums(str: string, enum_label: string): string[] {
    let test: string[][] = str.trim().split("\n").map(s => s.trim()).filter(s => s!=="")
      .map( s => s.split(";").map( s => s.slice(1, -1) ) );


    let test2: string[] = [];

    test.forEach((element: string[]) => {

      if(element[1] === enum_label){
        test2.push(element[2]);

      }

    });

    let test3 =new Set(test2);


    let tuple : string[] = [];
    test3.forEach((key, value) => {
      tuple.push(key);
    });

    return tuple;
  }

  public initColorSchemes(csToModify: colorMap[], readyColorScheme: colorMap[]){
    let n=0;

    while(n<this.datasetsNumber.length) {
      csToModify[n] = readyColorScheme[n] != null ? readyColorScheme[n] : this.randomColorScheme();
      n++;
    }

    while(n<this.datasetsBool.length) {
      csToModify[n] = readyColorScheme[n] != null ? readyColorScheme[n] : this.randomColorScheme();
      n++;
    }

    while(n<this.datasetsEnum.length) {
      csToModify[n] = readyColorScheme[n] != null ? readyColorScheme[n] : this.randomColorScheme();
      n++;
    }
  }

  public randomColorScheme(): colorMap {
    this.randomHueOfColor("blue", 100);
    return {
      sunny: this.randomHueOfColor("orange", 100),
      rainy: this.randomHueOfColor("blue", 100),
      cloudy: this.randomHueOfColor("grey", 100),
      lineIndex: [this.randomColor(100), this.randomColor(100)]
    }
  }

  public randomColor(brightness :number){
    function randomChannel(brightness:number){
      var r = 255-brightness;
      var n = 0|((Math.random() * r) + brightness);
      var s = n.toString(16);
      return (s.length==1) ? '0'+s : s;
    }
    return '#' + randomChannel(brightness) + randomChannel(brightness) + randomChannel(brightness);
  }

  public randomHueOfColor(hue: string, brightness: number): string{
    function valueToHex(v:number): string{
      let hex = v.toString(16);
      return hex.length == 1 ? '0'+hex : hex;
    }

    if(hue == "blue"){
      let r:number = 0;
      let g:number = Math.floor(Math.random() * 255);
      let b:number = 255;
      return '#' + valueToHex(r) + valueToHex(g) +valueToHex(b);

    } else if (hue == "orange") {
      let r:number = 255;
      let g:number = Math.floor(Math.random() * 255);
      let b:number = 0;
      return '#' + valueToHex(r) + valueToHex(g) +valueToHex(b);

    } else if ((hue == "grey") || (hue == "gray")) {
      let b:number = Math.floor((Math.random() * (255 -120 +1)+120));
      let r:number = Math.floor(0.7*b);
      let g:number = Math.floor(0.8*b);
      return '#' + valueToHex(r) + valueToHex(g) +valueToHex(b);

    }

    return this.randomColor(brightness);
  }

}
