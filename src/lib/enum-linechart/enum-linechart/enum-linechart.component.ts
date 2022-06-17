import { Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, Renderer2, SimpleChanges, ViewChild} from '@angular/core';
import {CONFIG, defaultConfig,colorMap, defaultColorMap, polygonDef, points, DataEnum} from 'src/lib/interfaces'
import * as d3 from 'd3';
import { BasicLinechart } from 'src/lib/basic-linechart';

@Component({
  selector: 'enum-linechart',
  templateUrl: './enum-linechart.component.html',
  styleUrls: ['./enum-linechart.component.css']
})
export class EnumLinechartComponent<T extends string[]> extends BasicLinechart<T[number]> implements OnInit {

  override _config: CONFIG = defaultConfig;
  /*
   * Input data array that the component display
   * Default value : []
   */

  @Input()
  override get config(): Partial<CONFIG> {return this._config;}
  override set config(c: Partial<CONFIG>) {
    this._config = {...defaultConfig, ...c};

  }

/*
    * Input data array that the component display
    * Default value : []
   */
  @Input() override data: DataEnum<T>[] = [];

  /*
    * ElementRef of DOM Element root
    * It's a svg with the linechart
   */
  @ViewChild('root') override timeline!: ElementRef;

  /*
    * ElementRef of DOM Element scroll
    * It's a div that will be the scrollbar
   */
  @ViewChild('scroll') override scrollbar!: ElementRef;

  /*
    * ElementRef of DOM Element zone
    * It's a div that will be the zone of scrollbar
   */
  @ViewChild('zone') override zoneScrollbar!: ElementRef;

  /*
    * ElementRef of DOM Element element
    * It's a div that contains all the others Dom Element
   */
  @ViewChild('element') override compo!: ElementRef;

  /*
    * Output rangeChange that emit range
   */
  @Output() override rangeChange = new EventEmitter<[number,number]>();

  /*
    * Output currentTimeChange that emit currentTime
   */
  @Output() override currentTimeChange = new EventEmitter<number>();

  /*
    * dataZoomed is a copy of data with the range specify
   */
  override dataZoomed: typeof this.data = []; // Data<T>[] = [];

  @HostListener('window:keydown', ['$event'])
  override handleKeyDown(event: KeyboardEvent){
    if(event.ctrlKey&&!this.zoomSelected){
      this.zoomSelected = true;
    }
  }
  @HostListener('window:keyup', ['$event'])
  override handleKeyUp(){
    this.zoomSelected = false;
  }

  constructor(renderer: Renderer2) {
    super(renderer);
  }

  ngOnInit(): void {
    this.dataZoomed = [...this.data];
    this.lastDatalength=this.dataZoomed.length;
    this.data.forEach((element,index) => {
      if(index==this.data.length-1) this.title = this.title+element.label+'.';
      else this.title = this.title+element.label + ', ';
    })

  }

  public ngAfterViewInit(): void {
    if (this.timeline != undefined) {
      let w = this.timeline.nativeElement.width.animVal.value;
      let h = this.timeline.nativeElement.height.animVal.value;
      this.svgWidth = (w - this.margin.left) - this.margin.right;
      this.svgHeight = (h - this.margin.top) - this.margin.bottom;
    }
    this.data.forEach((element, index) => this.buildStyleData(element,index));
    this.controlSpeedZoom();
    this.buildZoom();
    this.buildEvent();
    this.drawToolTips();
    this.drawAxis();
    this.drawLineAndPath();
    this.drawLineCurrentTime();
    this.buildLabels();
    this.drawScrollbar();
  }

  public ngOnChanges(changes: SimpleChanges): void {

    if (changes['data']&&!changes['data'].firstChange) this.updateChart();
    if ((changes['data']&&!changes['data'].firstChange&&this.range[0]!=0&&this.range[1]!=0)||(changes['config']&&!changes['config'].firstChange)&&changes['']) {
      this.idZoom=Math.round(Math.log(this.lengthTime/(this.range[1]-this.range[0]))/Math.log(1+this.speedZoom));
      this.range=this.controlRange(this.range[0],this.range[1]-this.range[0]);
      if(this.data.length!=0){
        this.updateDataZoom(this.range[0],this.range[1]);
        this.updateSvg(this.range[0],this.range[1]);
        this.updateLabels();
      }
    }

    if (this.timeline != undefined) {
      let w = this.timeline.nativeElement.width.animVal.value;
      let h = this.timeline.nativeElement.height.animVal.value;
      this.svgWidth = (w - this.margin.left) - this.margin.right;
      this.svgHeight = (h - this.margin.top) - this.margin.bottom;
    }

    if (changes['config']&&!changes['config'].firstChange&&this.data.length!=0) this.updateCurrentTime();
  }

  override discreteValue(dataB: DataEnum<T>[]): boolean{
    return true;
  }

  override scale(data: DataEnum<T>[], s: "xMin" | "xMax" | "yMin" | "yMax"): number {
      let res: number = 0;
      data.forEach(
        (elements,index) => elements.values.forEach(
          (element,i) => {
          if(s=="yMin"){ res = 0;}
          else if (s=="yMax"){ res = this.svgHeight-20;} //TODO TO FIX
          if((s=="xMin"&&((i==0&&index==0)||element[0]<res))||(s=="xMax"&&((i==0&&index==0)||element[0]>res))){ res=element[0];}
        })
      );

      return res;
    }

  override updateDataZoom(min:number,max:number): void{
    this.data.forEach((element,index) => {
      this.dataZoomed[index] = {
        ...element,
        values: element.values.filter( ([t]) => min <= t && t <=  max )
      }
    });

    let time: number[];
    this.data.forEach((element,index) => {
      time=[];
      element.values.forEach((element => time.push(element[0])));
      let i = d3.bisectLeft(time, min)-1;
      if (i>=0&&i<this.data[index].values.length) {
        const item = this.data[index].values[i][1];
        this.dataZoomed[index].values.unshift([min, item]);
      }
      this.dataZoomed[index].values.push([max,this.dataZoomed[index].values[this.dataZoomed[index].values.length-1][1]]);
    })
  }

  override computePolyCoord(element: DataEnum<T>, index: number): polygonDef[] {

    let allPolygonsPath: polygonDef[]= [];
    let polygonPath: polygonDef;
    let polyId: number = 0;
    let slopeMargin = this.config.peakSize != null ? this.config.peakSize : 5;

    let i:   number = 0;
    while(i < element.values.length-1) {
          polygonPath = {
            name: "polygon "+polyId,
            points: [
              {x : this.scaleX(element.values[i][0]), y : 0},
              {x : this.scaleX(element.values[i+1][0]), y : 0},
              {x : this.scaleX(element.values[i+1][0]), y : this.svgHeight},
              {x : this.scaleX(element.values[i][0]), y : this.svgHeight},
            ],
            color: (element.colors as {[k: string]: string})[ element.values[i][1] as string ]
          }

          allPolygonsPath[polyId] = polygonPath;
          polyId++;
      i++;
    }

    return allPolygonsPath;

  }

  override drawLineAndPath(): void{

    this.dataZoomed.forEach(
      (element,index) => {

        this.svg.selectAll('.poly'+index).data([this.dataZoomed[index].values])
          .data(this.computePolyCoord(element, index))
          .enter().append("polygon")
          .attr('class', 'poly'+index)
          .attr("points", (d: polygonDef) => {
            return d.points.map((d: points) => {
              return [d.x,d.y].join(",");
            }).join(" ");
          })
          .style("fill", (d:polygonDef) => d.color)
          .style("fill-opacity", 0.6)
          .style("stroke", "black")
          .style("strokeWidth", "10px");

      }
    )
  }

  override updateLine(): void{

    let polyUpdate;
    this.dataZoomed.forEach((element,index) => {

      this.svg.selectAll('.line'+index).remove();
      this.svg.selectAll('.poly'+index).remove();

        polyUpdate= this.svg.selectAll('.poly'+index).data([this.dataZoomed[index].values]);
        polyUpdate
          .data(this.computePolyCoord(element, index))
          .enter()
          .append("polygon")
          .attr('class', 'poly'+index)
          .merge(polyUpdate)
          .attr("points", (d: polygonDef) => {
            return d.points.map((d: points) => {
              return [d.x,d.y].join(",");
            }).join(" ");
          })
          .style("fill", (d:polygonDef) => d.color)
          .style("fill-opacity", 0.6)
          .style("stroke", "black")
          .style("strokeWidth", "10px");

    });
  }

  override buildLabels():void {

    this.enumUTF8 = this.svg.selectAll(".utf8_label").data(this.dataZoomed);

    var utf8 = this.enumUTF8
      .enter()
      .append("g")
      .attr("class", "utf8_label");

    this.dataZoomed.forEach((element) => {

      if (element.style == "enumeration") {
        let i: number = 0;
        let avgImgLength: number = 40; // For 15px of font-size

        for (i; i < element.values.length - 1; i++) {

          if (this.scaleX(element.values[i + 1][0]) - this.scaleX(element.values[i][0]) >= avgImgLength) {

            utf8.append("text")
              .attr("class", "utf8_label")
              .html(this.EnumToEnumUTF8(element.values[i][1]))
              .style("font-size", "30px")
              .attr("transform", "translate(" + (this.scaleX(element.values[i][0])+4) + "," + ((this.svgHeight / 2) + 10) + ")");

          }
        }
      }
    });

  }


      /*
       * Translate numerical value to enumeration UTF8 image
       */

      private EnumToEnumUTF8(value: string): string{
         if(value=="SUNNY"){ return "☀️";} // SUNNY
         else if (value=="RAINY") return "🌧️"; // RAINY
         else if (value=="CLOUDY") return "☁️"; //CLOUDY
         else return value;

       }

}
