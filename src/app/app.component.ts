import { Component } from '@angular/core';
import {colorMap, Data} from "../lib/basic-linechart.component";
import {DataService} from "../lib/basic-linechart.service";
import { CONFIG } from "../lib/basic-linechart.component";
import {isEmpty, NEVER} from "rxjs";
import {lab, line} from "d3";



interface linechart {
  data: Data[];
  dataDisplay: number,
  colorDisplay: number,
  name: string,
  config: Partial<CONFIG>,
  peakSize: number
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

  public colorSchemes: colorMap[];

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


    this.colorSchemes = [];
    data.initColorSchemes(this.colorSchemes, [data.colorScheme1, data.colorScheme2]);

    this.linecharts = [];
    this.linecharts.push({
      data: this.allDatasets[5],
      dataDisplay: 5,
      colorDisplay: 0,
      name: this.getAllNamesOfDataset(this.allDatasets[5]),
      config: this.config,
      peakSize: this.config.peakSize!=null?this.config.peakSize:5
    });
    this.linecharts.push({
      data: this.allDatasets[8],
      dataDisplay: 8,
      colorDisplay: 0,
      name: this.getAllNamesOfDataset(this.allDatasets[8]),
      config: this.config,
      peakSize: this.config.peakSize!=null?this.config.peakSize:5
    });
    this.linecharts.push({
      data: this.allDatasets[9],
      dataDisplay: 9,
      colorDisplay: 0,
      name: this.getAllNamesOfDataset(this.allDatasets[9]),
      config: this.config,
      peakSize: this.config.peakSize!=null?this.config.peakSize:5
    })

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
    // this.linecharts[linechart].colorScheme.sunny = color;
    // console.log("clr-linechart-scheme : ", this.linecharts[linechart].colorScheme.sunny);
    // let colorEdit = document.getElementById("test");
    // if(colorEdit != null) colorEdit.style.backgroundColor = color;
    // console.log("Called");

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
    let colorEdit = document.getElementById("color-edit_" + linechart);
    let peakEdit = document.getElementById("peak-edit_" + linechart);
    let label = document.getElementById("linechart-label_" + linechart);

    let button_color = document.getElementById("btn-switch_" + linechart);
    let button_peak = document.getElementById("btn-show-peak_" + linechart);

    if(peakEdit != null && colorEdit != null  && label != null && button_peak != null && button_color != null){
      if(colorEdit.style.display == "none"){
        if(peakEdit.style.display != "none"){
          peakEdit.style.display = "none";
          button_peak.textContent = "Edit boolean peak";
        }
        colorEdit.style.display = "block";
        label.style.display = "none";
        button_color.textContent = "Show Dataset name";
      } else {
        colorEdit.style.display = "none";
        label.style.display = "block";
        button_color.textContent = "Edit color Scheme";
      }
    } else {
      console.log(colorEdit, label, button_peak);
    }

  }

  public showPeakEdit(linechart: number){
    let colorEdit = document.getElementById("color-edit_" + linechart);
    let peakEdit = document.getElementById("peak-edit_" + linechart);
    let label = document.getElementById("linechart-label_" + linechart);

    let button_color = document.getElementById("btn-switch_" + linechart);
    let button_peak = document.getElementById("btn-show-peak_" + linechart);

    if(peakEdit != null && colorEdit != null  && label != null && button_peak != null && button_color != null){
      if(peakEdit.style.display == "none"){
        if(colorEdit.style.display != "none"){
          colorEdit.style.display = "none";
          button_color.textContent = "Edit color Scheme";
        }
        peakEdit.style.display = "block";
        label.style.display = "block";
        button_peak.textContent = "Hide peak edit";
      } else {
        peakEdit.style.display = "none";
        label.style.display = "block";
        button_peak.textContent = "Edit boolean peak";
      }
    } else {
      console.log(peakEdit, label, button_peak);
    }

  }

  public addLinechart(){
    this.linecharts.push({
      data: this.allDatasets[0],
      dataDisplay: 0,
      colorDisplay: 0,
      name: this.getAllNamesOfDataset(this.allDatasets[0]),
      config: this.config,
      peakSize: this.config.peakSize!=null?this.config.peakSize:5
    })

  }

  public deleteLinechart(linechart: number){
    this.linecharts.splice(linechart, 1)
  }

  public showKnob(linechart: number): boolean{
    return linechart==0;
  }

  public showScrollBar(linechart: number): boolean{
    // console.log(linechart==this.linecharts.length-1);
    return linechart==this.linecharts.length-1;
  }

  public checkPeakEdit(linechart: number, value: number){
    console.log("Start ------- ", value);
    let i =0;
    this.linecharts.forEach((element) => {
      console.log("linechart : ", i);
      console.log(element.peakSize);
      i++;
    });

  }

  public widthUpdate(value: number){
    this.config.width = value*10;
  }

  public heightUpdate(value: number){
    this.config.height = value*1.5;
  }

}





























