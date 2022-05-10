import { Component } from '@angular/core';
import {Data} from "../lib/basic-linechart.component";
import {DataService} from "../lib/basic-linechart.service";
import { CONFIG } from "../lib/basic-linechart.component";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Test';

  public data1:Data[]=[];
  public data2:Data[]=[];
  public data3:Data[]=[];
  public data4:Data[]=[];
  public data5:Data[]=[];
  public data6:Data[]=[];
  public data7:Data[]=[];
  public data8:Data[]=[];
  public data9:Data[]=[];
  public dataset:Data[]=[];
  public range: [number, number] = [0,0];
  public currentTime : number = 0;
  public next=1;

  constructor(data : DataService) {
    this.data1 = data.dataExample1;
    this.data2 = data.dataExample2;
    this.data3 = data.dataExample3;
    this.data4 = data.dataExample4;
    this.data5 = data.dataExample5;
    this.data6 = data.dataExample6;
    this.data7 = data.dataExample7;
    this.data8 = data.dataExample8;
    this.data9 = data.dataExample9;
    this.dataset = data.dataExample4;

  }
  public updateRange(rangeChange: [number,number]){
    this.range=rangeChange;
  }

  public updateCurrentTime(currentTimeChange: number ){
    this.currentTime=currentTimeChange;
  }

  public change(){
    this.next++;
    // @ts-ignore
    document.getElementById("datasetNumber").innerHTML = String(this.next);
    switch (this.next){
      case 1 :
        this.dataset = this.data1;
        break;
      case 2 :
        this.dataset = this.data2;
        break;
      case 3 :
        this.dataset = this.data3;
        break;
      case 4 :
        this.dataset = this.data4;
        break;
      case 5 :
        this.dataset = this.data5;
        break;
      case 6 :
        this.dataset = this.data6;
        break;
      case 7 :
        this.dataset = this.data7;
        break;
      case 8 :
        this.dataset = this.data8;
        break;
      case 9 :
        this.dataset = this.data9;
        // @ts-ignore
        document.getElementById("datasetNumber").innerHTML = String(this.next);
        this.next = 0;
        break;
    }

  }

  public rangeFun(){

  }
}
