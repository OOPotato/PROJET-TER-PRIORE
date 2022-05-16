import { Component } from '@angular/core';
import {colorMap, Data} from "../lib/basic-linechart.component";
import {DataService} from "../lib/basic-linechart.service";
import { CONFIG } from "../lib/basic-linechart.component";
import {installAllPackages} from "@angular/cli/utilities/install-package";
import {line} from "d3";



interface linechart {
  data: Data[];
  colorScheme: colorMap;
  dataDisplay: number,
  colorDisplay: number,
  name: string,
}

const defaultColorScheme: colorMap = {
  sunny : "#d77403",
  rainy : "#0473a6",
  cloudy : "#6d8d9d",
  lineIndex: ["#ff0000", "#00ff00", "#000000"]
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {
  public config: Partial<CONFIG>;
  public range: [number, number] = [0,0];
  public currentTime : number = 0;

  public colorScheme1: colorMap;
  public colorScheme2: colorMap;

  public allDatasets: Data[][];

  public linecharts: linechart[];

  public BACK = -1;
  public NEXT = 1;

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
      lineIndex: ["#5ad95a", "#e19b0f"]
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
      dataDisplay: 5,
      colorDisplay: 0,
      name: this.getAllNamesOfDataset(this.allDatasets[5])
    });
    this.linecharts.push({
      data: this.allDatasets[8],
      colorScheme: this.colorScheme1,
      dataDisplay: 8,
      colorDisplay: 0,
      name: this.getAllNamesOfDataset(this.allDatasets[8])
    });
    this.linecharts.push({
      data: this.allDatasets[9],
      colorScheme: this.colorScheme2,
      dataDisplay: 9,
      colorDisplay: 0,
      name: this.getAllNamesOfDataset(this.allDatasets[9])
    });

  }

  public updateRange(range: [number,number]){
    this.config = {...this.config, range};
  }

  public updateCurrentTime(currentTime: number ) {
    this.config = {...this.config, currentTime};
  }

  public changeLinechart(linechart: number, value: number){

    this.linecharts[linechart].dataDisplay += value;

    if(this.linecharts[linechart].dataDisplay == this.allDatasets.length) this.linecharts[linechart].dataDisplay = 0;
    if(this.linecharts[linechart].dataDisplay == -1) this.linecharts[linechart].dataDisplay = this.allDatasets.length-1;

    this.linecharts[linechart].data = this.allDatasets[this.linecharts[linechart].dataDisplay];
    this.linecharts[linechart].name = this.getAllNamesOfDataset(this.linecharts[linechart].data);
  }

  public updateDataIndex(linechart: number, data: Data[]) {

    let dataDisplay: number = 0;
    let done: boolean = false;
    let n=0;
    let value = this.getAllNamesOfDataset(data);

    while(!done && n<this.allDatasets.length){
      if(value == this.getAllNamesOfDataset(this.allDatasets[n])){
        dataDisplay = n
        done = true;
      }
      n++
    }

    this.linecharts[linechart].dataDisplay = dataDisplay;

  }

  public updateColorIndex(linechart : number, index: number){
    this.linecharts[linechart].colorDisplay = index;
  }

  public updateColor(linechart: number, color: string){
    this.linecharts[linechart].colorScheme.sunny = color;
    console.log("clr-linechart-scheme : ", this.linecharts[linechart].colorScheme.sunny);
    let colorEdit = document.getElementById("test");
    if(colorEdit != null) colorEdit.style.backgroundColor = color;

  }

  public getAllNamesOfDataset(datasets: Data[]): string {
    let result = "";
    datasets.forEach((data) => {
      result = result + data.label + ", ";
    });

    result = result.slice(0, result.length-2)

    return result;
  }

  public showColorEdit(linechart: number){
    let colorEdit = document.getElementById("colorEdit_" + linechart);
    let label = document.getElementById("linechartLabel_" + linechart);

    let button = document.getElementById("btn-switch_" + linechart);

    if(colorEdit != null && label != null && button != null){
      if(colorEdit.style.display == "none"){
        colorEdit.style.display = "block";
        label.style.display = "none";
        button.textContent = "Show Dataset name";
      } else {
        colorEdit.style.display = "none";
        label.style.display = "block";
        button.textContent = "Edit color Scheme";
      }
    }

  }

}





























