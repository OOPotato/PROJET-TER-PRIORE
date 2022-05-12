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

  constructor(data : DataService) {
    this.allDatasets = data.dataExemples;

    this.colorScheme1 = {
      sunny : "#d70303",
      rainy : "#00abff",
      cloudy : "#0d8a5a",
      lineIndex: ["green"]
    }
    this.colorScheme2 = {
      sunny : "#d74303",
      rainy : "#0a4059",
      cloudy : "#7c7a98",
      lineIndex: ["blue"]
    }

    this.linecharts = [];
    this.linecharts.push({
      data: this.allDatasets[7],
      colorScheme: defaultColorScheme,
      display: 7
    });

    this.linecharts.push({
      data: this.allDatasets[8],
      colorScheme: this.colorScheme1,
      display: 8
    });

    this.linecharts.push({
      data: this.allDatasets[9],
      colorScheme: this.colorScheme2,
      display: 9
    });


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
  }

}





























