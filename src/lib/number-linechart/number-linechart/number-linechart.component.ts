import { Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, Renderer2, SimpleChanges, ViewChild} from '@angular/core';
import {CONFIG, defaultConfig,colorMap, defaultColorMap, polygonDef, points, DataNumber} from 'src/lib/interfaces'
import * as d3 from 'd3';
import { BasicLinechart } from 'src/lib/basic-linechart';

@Component({
  selector: 'number-linechart',
  templateUrl: './number-linechart.component.html',
  styleUrls: ['./number-linechart.component.css']
})

export class NumberLinechartComponent extends BasicLinechart<number> implements OnInit {

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
  @Input() override data: DataNumber[] = [];

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

  override discreteValue(data: DataNumber[]): boolean{
    for(let i:number=0;i<data.length;i++){
      for(let j:number=0;j<data[i].values.length;j++){
        if(data[i].values[j][1]!=Math.round(data[i].values[j][1])) return false;
      }
    }
    return true;
  }

  override scale(data: DataNumber[], s: "xMin" | "xMax" | "yMin" | "yMax"): number {
    let res: number = 0;
    data.forEach(
      (elements,index) => elements.values.forEach(
        (element,i) => {
        if((s=="yMin"&&((i==0&&index==0)||element[1]<res))||(s=="yMax"&&((i==0&&index==0)||element[1]>res))) res=element[1];
        else if((s=="xMin"&&((i==0&&index==0)||element[0]<res))||(s=="xMax"&&((i==0&&index==0)||element[0]>res))) res=element[0];
      })
    )

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

  override drawLineAndPath(): void{

    this.dataZoomed.forEach(
      (element,index) => {

        this.svg.append('path')
          .datum(element.values)
          .attr('class', 'line'+index)
          .attr('d', this.line[index])
          .style('fill', 'none')
          .style('stroke', element.color)
          .style('stroke-width', '2px');

      }
    )
  }

  override updateLine(): void{

    let lineUpdate;
    this.dataZoomed.forEach((element,index) => {

      this.svg.selectAll('.line'+index).remove();
      this.svg.selectAll('.poly'+index).remove();

      if(element.style=="number"){
        lineUpdate= this.svg.selectAll('.line'+index).data([this.dataZoomed[index].values]);
        lineUpdate
          .enter()
          .append("path")
          .attr('class', 'line'+index)
          .merge(lineUpdate)
          .attr('d', this.line[index])
          .style('fill', 'none')
          .style('stroke', element.color)
          .style('stroke-width', '2px');
      }


    });
  }

  override drawAxis(): void{
    this.scaleX.range([0, this.svgWidth]);
    this.scaleX.domain([this.minTime,this.maxTime]);
    this.scaleY = d3.scaleLinear();
    this.scaleY.range([this.svgHeight, 0]);
    this.scaleY.domain(this.controlDomain());


    // Configure the X Axis
    this.svg.append('g')
      .attr('transform', 'translate(0,' + this.svgHeight + ')')
      .attr('class', 'xAxis')
      .call(d3.axisBottom(this.scaleX));



    // Configure the Y Axis
    this.data.forEach((element,index) => {
      this.svg.append('g')
          .attr('class', 'yAxis')
          .call(d3.axisLeft(this.scaleY)
            .ticks(2)
            .tickValues([this.scale(this.data,"yMin"), this.scale(this.data,"yMax")]));

    });

  }

}
