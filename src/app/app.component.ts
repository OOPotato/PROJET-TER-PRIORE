import { Component } from '@angular/core';
import {colorMap, Data, DataG, CONFIG, DataBool, DataEnum, DataNumber} from 'src/lib/interfaces'
import {DataService} from "../lib/basic-linechart.service";
import {isEmpty, NEVER} from "rxjs";
import {lab, line} from "d3";


interface linechart {
  dataStyle: string;
  dataDisplay: number,
  name: string,
  config: Partial<CONFIG>,
  peakSize: number
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

  public data: DataService<[]>;



  public testDatasetB: DataBool[][];
  public testDatasetN: DataNumber[][];
  public testDatasetE: DataEnum<string[]>[][];

  public linecharts: linechart[];

  public BACK = -1;
  public NEXT = 1;


  constructor(data : DataService<number | boolean | string[]>) {
    this.data = data;

    this.testDatasetB = [];
    this.testDatasetB = data.datasetsBool;
    this.testDatasetN = [];
    this.testDatasetN = data.datasetsNumber;
    this.testDatasetE = [];
    this.testDatasetE = data.datasetsEnum;

    this.config = {
      width: 900,
      height: 80,
      domainY: [0, 0],
      speedZoom: 0.2,
      range: [0,0],
      currentTime: 0,
      scrollBar: true,
      knobCurrentTime: false,
    }

    this.colorSchemes = [];
    data.initColorSchemes(this.colorSchemes, [data.colorScheme1, data.colorScheme2]);

    this.linecharts = [];
    this.linecharts.push({
      dataStyle: "boolean",
      dataDisplay: 0,
      name: this.getAllNamesOfDataset(this.testDatasetB[0]),
      config: this.config,
      peakSize: this.config.peakSize!=null?this.config.peakSize:5
    });
    this.linecharts.push({
      dataStyle: "number",
      dataDisplay: 0,
      name: this.getAllNamesOfDataset(this.testDatasetN[0]),
      config: this.config,
      peakSize: this.config.peakSize!=null?this.config.peakSize:5
    });
    this.linecharts.push({
      dataStyle: "enumeration",
      dataDisplay: 0,
      name: this.getAllNamesOfDataset(this.testDatasetE[0]),
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

  public changeLinechart(linechart: number, value: number, style: string){
    this.linecharts[linechart].dataDisplay += value;

    switch(style){

      case "number":
        if(this.linecharts[linechart].dataDisplay == this.testDatasetN.length) this.linecharts[linechart].dataDisplay = 0;
        if(this.linecharts[linechart].dataDisplay == -1) this.linecharts[linechart].dataDisplay = this.testDatasetN.length-1;

        this.linecharts[linechart].name = this.getAllNamesOfDataset(this.testDatasetN[linechart]);
        break;

      case "boolean":
        if(this.linecharts[linechart].dataDisplay == this.testDatasetB.length) this.linecharts[linechart].dataDisplay = 0;
        if(this.linecharts[linechart].dataDisplay == -1) this.linecharts[linechart].dataDisplay = this.testDatasetB.length-1;

        this.linecharts[linechart].name = this.getAllNamesOfDataset(this.testDatasetB[linechart]);
        break;

      case "enumeration":
        if(this.linecharts[linechart].dataDisplay == this.testDatasetE.length) this.linecharts[linechart].dataDisplay = 0;
        if(this.linecharts[linechart].dataDisplay == -1) this.linecharts[linechart].dataDisplay = this.testDatasetE.length-1;

        this.linecharts[linechart].name = this.getAllNamesOfDataset(this.testDatasetE[linechart]);
        break;

    }



  }

  public getAllNamesOfDataset(datasets: DataG<any>[]): string {
    let result = "";
    if(datasets != null){
    datasets.forEach((data) => {
      result = result + data.label + ", ";
    });
  }
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
      dataStyle: "number",
      dataDisplay: 0,
      name: this.getAllNamesOfDataset(this.testDatasetN[0]),
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
    return linechart==this.linecharts.length-1;
  }

  public widthUpdate(value: number){
    this.config.width = value*10;
  }

  public heightUpdate(value: number){
    this.config.height = value*1.5;
  }

  public changeTypeOfLinechart(linechart: number, dataStyle: string){
    switch(dataStyle){

      case "number":
        this.linecharts[linechart].dataStyle = "boolean";
        this.linecharts[linechart].dataDisplay = 0;
        this.linecharts[linechart].name = this.getAllNamesOfDataset(this.testDatasetB[0]);
        this.linecharts[linechart].peakSize!=null?this.config.peakSize:5

        break;

      case "boolean":
        this.linecharts[linechart].dataStyle = "enumeration";
        this.linecharts[linechart].dataDisplay = 0;
        this.linecharts[linechart].name = this.getAllNamesOfDataset(this.testDatasetE[0]);
        this.linecharts[linechart].peakSize!=null?this.config.peakSize:5

        break;

      case "enumeration":
        this.linecharts[linechart].dataStyle = "number";
        this.linecharts[linechart].dataDisplay = 0;
        this.linecharts[linechart].name = this.getAllNamesOfDataset(this.testDatasetN[0]);
        this.linecharts[linechart].peakSize!=null?this.config.peakSize:5

        break;

    }

  }

}





























