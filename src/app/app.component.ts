import { Component } from '@angular/core';
import {colorMap, Data} from "../lib/basic-linechart.component";
import {DataService} from "../lib/basic-linechart.service";
import { CONFIG } from "../lib/basic-linechart.component";
import {installAllPackages} from "@angular/cli/utilities/install-package";
import {line} from "d3";



interface linechart {
  data: Data[];
  colorScheme: colorMap;
  display: number,
  name: string,
}

const defaultColorScheme: colorMap = {
  sunny : "#d77403",
  rainy : "#0473a6",
  cloudy : "#6d8d9d",
  lineIndex: ["red"]
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {
  title = 'Test';

  public config: Partial<CONFIG>;
  public range: [number, number] = [0,0];
  public currentTime : number = 0;

  public colorScheme1: colorMap;
  public colorScheme2: colorMap;

  public allDatasets: Data[][];

  public linecharts: linechart[];

  public BACK = -1;
  public NEXT = 1;

  public blabla: Data[];

  constructor(data : DataService) {
    this.allDatasets = data.dataExemples;

    this.config = {
      width: 900,
      height: 80,
      domainY: [0, 0],
      speedZoom: 0.2,
      range: [0,0],
      currentTime: 0,
      scrollBar: false,
      knobCurrentTime: false,
    }

    this.colorScheme1 = {
      sunny : "#d70303",
      rainy : "#00abff",
      cloudy : "#0d8a5a",
      lineIndex: ["green", "#e19b0f"]
    }
    this.colorScheme2 = {
      sunny : "#d74303",
      rainy : "#0a4059",
      cloudy : "#7c7a98",
      lineIndex: ["#2883ea", "#09a811"]
    }

    this.linecharts = [];
    this.linecharts.push({
      data: this.allDatasets[5],
      colorScheme: defaultColorScheme,
      display: 5,
      name: this.getAllNamesOfDatasets(this.allDatasets[5])
    });
    this.linecharts.push({
      data: this.allDatasets[8],
      colorScheme: this.colorScheme1,
      display: 8,
      name: this.getAllNamesOfDatasets(this.allDatasets[8])
    });
    this.linecharts.push({
      data: this.allDatasets[9],
      colorScheme: this.colorScheme2,
      display: 9,
      name: this.getAllNamesOfDatasets(this.allDatasets[9])
    });

    this.blabla = data.dataExemples[0];

  }

  public updateRange(range: [number,number]){
    this.config = {...this.config, range};
  }

  public updateCurrentTime(currentTime: number ) {
    this.config = {...this.config, currentTime};
  }

  public changeLinechart(linechart: number, value: number){

    this.linecharts[linechart].display += value;

    if(this.linecharts[linechart].display == this.allDatasets.length) this.linecharts[linechart].display = 0;
    if(this.linecharts[linechart].display == -1) this.linecharts[linechart].display = this.allDatasets.length-1;

    this.linecharts[linechart].data = this.allDatasets[this.linecharts[linechart].display];
    this.linecharts[linechart].name = this.getAllNamesOfDatasets(this.linecharts[linechart].data);
  }

  public updateLinechart(linechart: number, data: Data[]) {

    let display: number = 0;
    let done: boolean = false;
    let n=0;
    let value = this.getAllNamesOfDatasets(data);

    while(!done && n<this.allDatasets.length){
      if(value == this.getAllNamesOfDatasets(this.allDatasets[n])){
        display = n
        done = true;
      }
      n++
    }

    this.linecharts[linechart].display = display;

    this.linecharts[linechart].data = this.allDatasets[this.linecharts[linechart].display];
    this.linecharts[linechart].name = this.getAllNamesOfDatasets(this.linecharts[linechart].data);

  }

  public getAllNamesOfDatasets(datasets: Data[]): string {
    let result = "";
    datasets.forEach((data) => {
      result = result + data.label + ", ";
    });

    result = result.slice(0, result.length-2)

    return result;
  }

}





























