import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnInit,
  Output,
  Renderer2,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {ScaleLinear, ScaleTime} from 'd3-scale';
import {Selection} from 'd3-selection';
import * as d3 from 'd3';
import {interpolateArray} from "d3";


/**
 * Data's format for the component
 */
export interface Data {
  /*\
   * Data's name
  \*/
  label: string;

  /*\
   * Data's values [timestamp,value][]
  \*/
  values: [number,number][];

  /*\
   * Line or area color you can fill with name, hexacode or rgb code.
  \*/
  color: string;

  /*\
   * Style of line
  \*/
  style: "line" | "area" | "both" | "bool" | "enum";

  /*\
   * Interpolation of line
   * Recommanded : step for discrete values and linear for continuous values
  \*/
  interpolation: "linear" | "step";
}

export interface CONFIG {
  width: number;
  height: number;
  domainY: [number, number];
  speedZoom: number;
  range: [number,number];
  currentTime: number;
  scrollBar: boolean;
  knobCurrentTime: boolean;
  peakSize: number
  colorMap : colorMap;
}

export interface colorMap {
  sunny: string;
  rainy: string;
  cloudy: string;
  lineIndex: string[];
}

const defaultColorMap: colorMap = {
  sunny : "#d77403",
  rainy : "#0473a6",
  cloudy : "#6d8d9d",
  lineIndex: ["#ff0000"]
}

const defaultConfig: CONFIG = {
  width: 900,
  height: 80,
  domainY: [0, 0],
  speedZoom: 0.2,
  range: [0,0],
  currentTime: 1,
  scrollBar: false,
  knobCurrentTime: false,
  peakSize: 5,
  colorMap: defaultColorMap,

}

interface polygonDef {
  "name": string;
  "points": points[];
  "color": string;
}

interface points {
  "x": number;
  "y": number;
}

@Component({
  selector: 'lib-basic-linechart',
  template: `
    <div #element>
      <!--    <h2>{{ title }}</h2> TODO SUPP -->
      <svg #root [attr.width]="width" [attr.height]="height" style="vertical-align: top"></svg>
    </div>
    <div #zone><div #scroll></div></div>`,
  styles: [
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})


export class BasicLinechartComponent implements OnInit {
  private _config: CONFIG = defaultConfig;
  @Input()
  get config(): Partial<CONFIG> {return this._config;}
  set config(c: Partial<CONFIG>) {
    this._config = {...defaultConfig, ...c};

  }

  private oldColorMap: colorMap = defaultColorMap;

  get width(): number {return <number>this.config.width;}
  set width(value: number) { this.config.width = value; }

  get height(): number {return <number>this.config.height;}
  set height(value: number) { this.config.height = value; }

  get domainY(): [number, number] {return <[number, number]> this.config.domainY;}
  set domainY(value: [number, number]) { this.config.domainY = value;}

  get speedZoom(): number {return <number>this.config.speedZoom;}
  set speedZoom(value: number) { this.config.speedZoom = value; }

  get range(): [number, number] {return <[number, number]> this.config.range;}
  set range(value: [number, number]) {  this.config.range = value;  }

  get currentTime(): number {return <number>this.config.currentTime;}
  set currentTime(value: number) { this.config.currentTime = value; }

  get scrollBar(): boolean {return <boolean> this.config.scrollBar;}
  set scrollBar(value: boolean) { this.config.scrollBar = value; }

  get knobCurrentTime(): boolean {return <boolean> this.config.knobCurrentTime;}
  set knobCurrentTime(value: boolean) { this.config.knobCurrentTime = value; }

  /*\
   * Input data array that the component display
   * Default value : []
  \*/
  @Input() data: Data[] = [];

  /*\
   * ElementRef of DOM Element root
   * It's a svg with the linechart
  \*/
  @ViewChild('root') timeline!: ElementRef;

  /*\
   * ElementRef of DOM Element scroll
   * It's a div that will be the scrollbar
  \*/
  @ViewChild('scroll') scrollbar!: ElementRef;

  /*\
   * ElementRef of DOM Element zone
   * It's a div that will be the zone of scrollbar
  \*/
  @ViewChild('zone') zoneScrollbar!: ElementRef;

  /*\
   * ElementRef of DOM Element element
   * It's a div that contains all the others Dom Element
  \*/
  @ViewChild('element') compo!: ElementRef;

  /*\
   * Output rangeChange that emit range
  \*/
  @Output() rangeChange = new EventEmitter<[number,number]>();

  /*\
   * Output currentTimeChange that emit currentTime
  \*/
  @Output() currentTimeChange = new EventEmitter<number>();


  /*\
   * Title of the component
  \*/
  public title:string = 'Timeline : ';

  /*\
   * svg that contain the linechart and the axis
  \*/
  private svg: any;

  /*\
   * Width of the svg
  \*/
  private svgWidth: number = 0;

  /*\
   * Height of the svg
  \*/
  private svgHeight: number = 0;

  /*\
   * Margin of the component
  \*/
  private margin:{top:number,right:number,bottom:number,left:number} = { top: 20, right: 20, bottom: 20, left: 30 }; //marge interne au svg

  /*\
   * Scale of the X axis
  \*/
  private scaleX: ScaleTime<number,number> = d3.scaleTime();

  /*\
   * Scale of the Y axis
  \*/
  private scaleY: ScaleLinear<number,number> = d3.scaleLinear();

  /*\
   * It's the smallest timestamp of data
  \*/
  private minTime: number = 0;

  /*\
   * It's the biggest timestamp of data
  \*/
  private maxTime: number = 0;

  /*\
   * It's the difference between the smallest and the biggest Time (maxTime - minTime)
  \*/
  private lengthTime: number = 0;

  /*\
   * Array of area definition
  \*/
  private area: d3.Area<[number, number]>[] = [];

  /*\
   * Array of line definition
  \*/
  private line: d3.Line<[number, number]>[] = [];

  /*\
   * Array of line definition
  \*/
  private poly: String[] = [];
  /*\
   * Boolean for switching between top and bottoms lines
   * This is made for enum so that, everytime a new enum appears,
   * the lineBoolBottom will switch sides with Top
  \*/
  private lineSwitch: boolean = false;

  /*\
   * dataZoomed is a copy of data with the range specify
  \*/
  private dataZoomed: Data[] = [];

  /*\
   * idZoom is the number of wheel notch
  \*/
  private idZoom: number = 0;

  /*\
   * true if the CTRL Key of keyBoard is push
  \*/
  private zoomSelected: boolean = false

  /*\
   * Svg definition of enum Labels
  \*/
  private enumUTF8!: Selection<SVGGElement,unknown,null,undefined>;

  /*\
   * Svg definition of enum Labels
  \*/
  private enumLabel!: Selection<SVGGElement,unknown,null,undefined>;

  /*\
   * Svg definition of the tooltip
  \*/
  private tooltip!: Selection<SVGGElement,unknown,null,undefined>;

  /*\
   * Mode of the tooltip
  \*/
  private modeToolTips: "normal" | "inverse" = "normal";

  /*\
   * true if the currentTimeline is selected
  \*/
  private currentTimeSelected:boolean = false;

  /*\
   * true if the scrollbar is selected
  \*/
  private scrollbarSelected:boolean = false;

  /*\
   * data length before the new change
  \*/
  private lastDatalength:number = 0;

  /*\
   * Last position of the mouse
  \*/
  private lastPos: number = 0;



  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent){
    if(event.ctrlKey&&!this.zoomSelected){
      this.zoomSelected = true;
    }
  }
  @HostListener('window:keyup', ['$event'])
  handleKeyUp(){
    this.zoomSelected = false;
  }


  /*\
   * Constructor : Init renderer
   * @param renderer
  \*/
  constructor(private renderer: Renderer2) {
  }


  /*\
   * Copy data in dataZoomed, and build title
  \*/
  public ngOnInit(): void {
    this.dataZoomed = [...this.data];
    this.lastDatalength=this.dataZoomed.length;
    this.data.forEach((element,index) => {
      if(index==this.data.length-1) this.title = this.title+element.label+'.';
      else this.title = this.title+element.label + ', ';
    })
  }

  /*\
   * Initialize linechart
  \*/
  public ngAfterViewInit(): void {
    if (this.timeline != undefined) {
      let w = this.timeline.nativeElement.width.animVal.value;
      let h = this.timeline.nativeElement.height.animVal.value;
      this.svgWidth = (w - this.margin.left) - this.margin.right;
      this.svgHeight = (h - this.margin.top) - this.margin.bottom;

      console.log("svgWidth", this.svgWidth);
      console.log("svgHeight", this.svgHeight);
    }
    this.data.forEach((element,index) => this.buildStyleData(element,index));
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

  /*\
   * Update linechart on data, range or current time changes
   * @param {SimpleChanges} changes
  \*/
  public ngOnChanges(changes: SimpleChanges): void {

    // console.log("changes : ", changes);

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

      console.log("svgWidth", this.svgWidth);
      console.log("svgHeight", this.svgHeight);
    }

    if (changes['config']&&!changes['config'].firstChange&&this.data.length!=0) this.updateCurrentTime();
  }

  // public ngDoCheck(changes: SimpleChanges){
  //   if(this.config.colorMap != null) {
  //     if (this.config.colorMap != this.oldColorMap) {
  //       this.oldColorMap = this.config.colorMap;
  //       this.updateChart();
  //       console.log("Called");
  //     }
  //   }
  // }

  /*\
   * Add event listeners on the svg
  \*/
  private buildEvent(): void{ // creer une timeline avec une seul donnée
    this.svg = d3.select(this.timeline.nativeElement)
      .append('g')
      .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');
    d3.select(this.timeline.nativeElement).on("mousemove", (event: MouseEvent) => {
      if(this.currentTimeSelected) this.moveCurrentTime(event);
      else this.showInfo(event);
    })
      .on("mouseleave", () => { this.currentTimeSelected = false; this.hideInfo() })
      .on("wheel", (event: WheelEvent) => {if(this.data.length!=0)if(this.zoomSelected){this.activeZoom(event)}})
      .on("mouseup", () => this.currentTimeSelected=false)
      .on("mouseover", (event: MouseEvent) => event.preventDefault());
  }

  /*\
   * Build the style (area, line or both) and the interpolation (step or linear) of lines
   * @param {Data} element
   * @param {number} index
  \*/
  private buildStyleData(element:Data, index:number): void{

    if(element.style=="area" || element.style=="both"){
      if(element.interpolation=="step") {
        this.area[index] = d3.area()
          .x((d: number[]) => this.scaleX(d[0])) // NOTE TO SELF // d = element.values[???] // renvoie un timestamp
          .y0(this.svgHeight)
          .y1((d: number[]) => this.scaleY(d[1]))
          .curve(d3.curveStepAfter);

      }else{
        this.area[index]=d3.area()
          .x((d: number[]) => this.scaleX(d[0]))
          .y0(this.svgHeight)
          .y1((d: number[]) => this.scaleY(d[1]))
      }
    }

    if(element.style=="line" || element.style=="both"){
      if(element.interpolation=="step"){
        this.line[index]=d3.line()
          .x((d: number[]) => this.scaleX(d[0]))
          .y((d: number[]) => this.scaleY(d[1]))
          .curve(d3.curveStepAfter);
      }else{
        this.line[index]=d3.line()
          .x((d: number[]) => this.scaleX(d[0]))
          .y((d: number[]) => this.scaleY(d[1]));
      }

    }

    // this.lineBoolTop[index] = d3.line() // TODO EXPLAINATION RETURN VALUE // A SUPP
    //   .x((d: number[]) => this.scaleX(d[0]))
    // .y((d: number[]) => {
    //   console.log("d[1] = " + d[1]);
    //   console.log("this.scaleY - d[1] = " + this.scaleY(d[1]));
    //   return this.scaleY(d[1]);
    // })
    //   .curve(d3.curveStepAfter);

    if(!this.controlColor(element.color)){
      console.warn("Data with " + element.label + " label, has an unvalid color attribute (" + element.color + "). Replace with the default color (black).");
      element.color="black";
    }
  }


  private computePolyCoord(element: Data, index: number): polygonDef[] {

    let allPolygonsPath: polygonDef[]= [];
    let polygonPath: polygonDef;
    let polyId: number = 0;
    let slopeMargin = this.config.peakSize != null ? this.config.peakSize : 5;

    let i:   number = 0;
    while(i < element.values.length-1) {
      if(element.style == "bool"){
        if((element.values[i][1] == -1) && (element.values[i][0] != element.values[i+1][0])){


          if((this.scaleX(element.values[i+1][0]) - slopeMargin) - (this.scaleX(element.values[i][0]) + slopeMargin) < 0){
            slopeMargin += ((this.scaleX(element.values[i+1][0]) - slopeMargin) - (this.scaleX(element.values[i][0]) + slopeMargin))/2;

          }

          polygonPath = {
            "name": "polygon "+polyId,
            "points": [
              {"x" : this.scaleX(element.values[i][0]), "y" : this.svgHeight/2},
              {"x" : this.scaleX(element.values[i][0]) + slopeMargin, "y" : 0},
              {"x" : this.scaleX(element.values[i+1][0]) - slopeMargin, "y" : 0},
              {"x" : this.scaleX(element.values[i+1][0]), "y" : this.svgHeight/2},
              {"x" : this.scaleX(element.values[i+1][0]) - slopeMargin, "y" : this.scaleY(element.values[i][1])},
              {"x" : this.scaleX(element.values[i][0]) + slopeMargin, "y" : this.scaleY(element.values[i][1])},
            ],
            "color": this.config.colorMap?.lineIndex[index] != null ? this.config.colorMap?.lineIndex[index] : element.color,

          }

          allPolygonsPath[polyId] = polygonPath;
          polyId++;
          slopeMargin = this.config.peakSize != null ? this.config.peakSize : 5;

        }

      } else if (element.style == "enum"){
        if(element.values[i][1] != -2) {

          polygonPath = {
            "name": "polygon "+polyId,
            "points": [
              {"x" : this.scaleX(element.values[i][0]), "y" : 0},
              {"x" : this.scaleX(element.values[i+1][0]), "y" : 0},
              {"x" : this.scaleX(element.values[i+1][0]), "y" : this.svgHeight},
              {"x" : this.scaleX(element.values[i][0]), "y" : this.svgHeight},
            ],
            "color": this.selectColor(this.intToEnumTxt(element.values[i][1])),
          }

          allPolygonsPath[polyId] = polygonPath;
          polyId++;

        }
      }
      i++;
    }

    return allPolygonsPath;

  }

  /*\
   * Save information for zoom.
  \*/
  private buildZoom(): void{
    this.minTime = this.scale(this.data,"xMin");
    this.maxTime = this.scale(this.data,"xMax");
    this.lengthTime = this.maxTime - this.minTime;
    this.idZoom=0;
  }

  /*\
   * Draw the tooltips's svg
  \*/
  private drawToolTips(): void{ //creer le tooltips
    this.tooltip = this.svg.append("g")
      .attr("id", "tooltip")
      .style("display", "none");
    // Le cercle extérieur bleu clair
    this.tooltip.append("circle")
      .attr("fill", "#CCE5F6")
      .attr("r", 10);
    // Le cercle intérieur bleu foncé
    this.tooltip.append("circle")
      .attr("fill", "#3498db")
      .attr("stroke", "#fff")
      .attr("stroke-width", "1.5px")
      .attr("r", 4);
    // Le tooltip en lui-même avec sa pointe vers le bas
    // Il faut le dimensionner en fonction du contenu
    if (this.modeToolTips == "normal") {
      this.tooltip.append("polyline")
        .attr("points", "0,0 0,40 75,40  80,45  85,40  160,40  160,0 0,0")
        .style("fill", "#fafafa")
        .style("stroke","#3498db")
        .style("opacity","0.9")
        .style("stroke-width","1")
        .attr("transform", "translate(-80,-50)");
      this.dataZoomed.forEach((element) => {
        // Cet élément contiendra tout notre texte
        let text = this.tooltip.append("text")
          .style("font-size", "13px")
          .style("font-family", "Segoe UI")
          .style("color", element.color)
          .style("fill", element.color)
          .attr("transform", "translate(-80,-42)");
        // Element pour la date avec positionnement spécifique
        text.append("tspan")
          .attr("dx", "7")
          .attr("dy", "5")
          .attr("id", "tooltip-date1");
        text.append("tspan")
          .attr("dx", "-90")
          .attr("dy", "15")
          .attr("id", "tooltip-date2");
      });
    }else {
      this.tooltip.append("polyline")
        .attr("points", "0,95 , 0,55 , 75,55 , 80,50 , 85,55 , 160,55 , 160,95 0,95")
        .style("fill", "#fafafa")
        .style("stroke","#3498db")
        .style("opacity","0.9")
        .style("stroke-width","1")
        .attr("transform", "translate(-80,-50)");
      this.dataZoomed.forEach((element) => {
        // Cet élément contiendra tout notre texte
        let text = this.tooltip.append("text")
          .style("font-size", "13px")
          .style("font-family", "Segoe UI")
          .style("color", element.color)
          .style("fill", element.color)
          .attr("transform", "translate(-80,-30)");
        // Element pour la date avec positionnement spécifique
        text.append("tspan")
          .attr("dx", "7")
          .attr("dy", 50 )
          .attr("id", "tooltip-date1");
        text.append("tspan")
          .attr("dx", "-80")
          .attr("dy", "20")
          .attr("id", "tooltip-date2");
      });
    }
  }

  /*\
   * Draw horizontal and vertical axis and scale
  \*/
  private drawAxis(): void{
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
      if(element.style == "bool" || element.style == "enum"){

        if(this.discreteValue(this.data)){
          this.svg.append('g')
            .attr('class', 'yAxis')
            .call(d3.axisLeft(this.scaleY).ticks([]));

        }else {

          this.svg.append('g')
            .attr('class', 'yAxis')
            .call(d3.axisLeft(this.scaleY));
        }

      } else {

        this.svg.append('g')
          .attr('class', 'yAxis')
          .call(d3.axisLeft(this.scaleY)
            .ticks(2)
            .tickValues([this.scale(this.data,"yMin"), this.scale(this.data,"yMax")]));

      }

    });



  }

  /*\
   *  Update Axis
  \*/

  private updateAxis(): void {

    // x Axis
    this.svg.selectAll('.xAxis').call(d3.axisBottom(this.scaleX));

    // y Axis
    this.data.forEach((element,index) => {
      if (element.style == "bool" || element.style == "enum" || element.style == "area") {
        if(this.discreteValue(this.data)){
          this.svg.selectAll('.yAxis')
            .call(d3.axisLeft(this.scaleY).ticks([]));

        } else {
          this.svg.selectAll('.yAxis')
            .call(d3.axisLeft(this.scaleY));

        }

      } else {
        this.svg.selectAll('.yAxis')
          .call(d3.axisLeft(this.scaleY)
            .ticks(2)
            .tickValues([this.scale(this.data,"yMin"), this.scale(this.data,"yMax")]));
      }

    });
  }

  private selectColor(type: string): string {

    if (this.config.colorMap != null) {
      switch (type) {
        case "SUNNY" :
          return this.config.colorMap?.sunny
        case "RAINY" :
          return this.config.colorMap?.rainy
        case "CLOUDY" :
          return this.config.colorMap?.cloudy
      }
    }
    return "black";
  }


  /*\
   * Draw lines on the line chart
  \*/
  private drawLineAndPath(): void{

    this.dataZoomed.forEach(
      (element,index) => {

        if(element.style=="area" || element.style=="both"){
          this.svg.append('path')
            .datum(this.dataZoomed[index].values)
            .attr('class', 'area'+index)
            .attr('d', this.area[index])
            .attr("stroke-width", 0.1)
            .attr('opacity', 0.6)
            .style('fill', this.config.colorMap?.lineIndex[index] != null ? this.config.colorMap?.lineIndex[index] : element.color)
            .style('stroke', "black")
            .style('stroke-width', '2px');
        }
        if(element.style=="line" || element.style=="both"){
          this.svg.append('path')
            .datum(element.values)
            .attr('class', 'line'+index)
            .attr('d', this.line[index])
            .style('fill', 'none')
            .style('stroke', this.config.colorMap?.lineIndex[index] != null ? this.config.colorMap?.lineIndex[index] : element.color)
            .style('stroke-width', '2px');
        }

        if(element.style=="bool" || element.style=="enum"){

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

      }
    )
  }


  /*\
   * Build and draw labels
  \*/
  private buildLabels():void {

    // this.enumLabel = this.svg.selectAll(".label").data(this.dataZoomed);
    //
    // var gs = this.enumLabel
    //   .enter()
    //   .append("g")
    //   .attr("class", "label");
    //
    //
    // this.dataZoomed.forEach((element) => {
    //
    //   if (element.style == "enum") {
    //     let i: number = 0;
    //     let avgLetterLength: number = 10.75; // For 15px of font-size
    //
    //     for (i; i < element.values.length - 1; i++) {
    //
    //       if (this.scaleX(element.values[i + 1][0]) - this.scaleX(element.values[i][0]) >= avgLetterLength * this.intToEnum(element.values[i][1]).length) {
    //
    //         gs.append("text")
    //           .attr("class", "label")
    //           // .text(this.intToEnumTxt(element.values[i][1]))
    //           .text('&#x26C5;')
    //           .style("font-size", "15px")
    //           .attr("transform", "translate(" + (this.scaleX(element.values[i][0])+4) + "," + ((this.svgHeight / 2) + avgLetterLength/2) + ")");
    //
    //       }
    //     }
    //   }
    // });

    this.enumUTF8 = this.svg.selectAll(".utf8_label").data(this.dataZoomed);

    var utf8 = this.enumUTF8
      .enter()
      .append("g")
      .attr("class", "utf8_label");

    this.dataZoomed.forEach((element) => {

      if (element.style == "enum") {
        let i: number = 0;
        let avgLetterLength: number = 10.75; // For 15px of font-size

        for (i; i < element.values.length - 1; i++) {

          if (this.scaleX(element.values[i + 1][0]) - this.scaleX(element.values[i][0]) >= avgLetterLength * this.intToEnumTxt(element.values[i][1]).length) {

            utf8.append("text")
              .attr("class", "utf8_label")
              // .text(this.intToEnumTxt(element.values[i][1]))
              .html(this.intToEnumUTF8(element.values[i][1]))
              .style("font-size", "30px")
              .attr("transform", "translate(" + (this.scaleX(element.values[i][0])+4) + "," + ((this.svgHeight / 2) + 10) + ")");

          }
        }
      }
    });

  }

  /*\
   * Update the Labels
  \*/

  private updateLabels(): void {
      this.svg.selectAll(".label").remove();
      this.svg.selectAll(".utf8_label").remove();
    this.buildLabels();
  }


  /*\
   * Translate numerical value to enumeration text
  \*/

  private  intToEnumTxt(value: number): string{
    if(value==1) return "SUNNY";
    else if (value==2) return "RAINY";
    else if (value==3) return "CLOUDY";
    else return "UNKNOWN";

  }


  /*\
   * Translate numerical value to enumeration UTF8 image
  \*/

  private  intToEnumUTF8(value: number): string{
    if(value==1) return "☀️"; // SUNNY
    else if (value==2) return "🌧️"; // RAINY
    else if (value==3) return "☁️"; //CLOUDY
    else return "UNKNOWN";

  }


  /*\
   * Draw the vertical line which represents the current time
  \*/
  private drawLineCurrentTime(): void{
    if(this.data.length!=0){
      if(this.currentTime==0){
        this.currentTime = this.scale(this.data,"xMin");
      }
      let x:number=0;
      this.svg.append('path')
        .datum([[this.currentTime,this.height],[this.currentTime,this.scaleY(this.svgHeight)]])
        // .datum([[this.currentTime,this.height],[this.currentTime,this.scaleY(this.svgHeight)]])
        .attr('class', 'currentTimeLine')
        .attr('d', d3.line()
          .x((d: number[]) => x=this.scaleX(d[0]))
          // .y((d: number[]) => this.scaleY(d[1])))
          .y((d: number[]) => {
            // console.log("START --------------------------------");
            // console.log("this.controlDomain()[0] - " +this.controlDomain()[0]);
            // console.log("this.height] - " +this.height);
            // console.log("d[0] = " + d[0] + " | d[1] = " + d[1]);
            // console.log("this.scaleX - d[0] = " + this.scaleX(d[0]) + " | this.scaleY - d[1] = " + this.scaleY(d[1]));
            // console.log("--------------------------------------\n");
            return d[1];
          }))
        // .x((d: number[]) => 10)
        // .y((d: number[]) => 50))
        .style('fill', 'none')
        .style('stroke', 'red')
        .style('stroke-width', '3px');

      //Selector Circle
      if(this.knobCurrentTime) {
        this.svg.append('circle')
          .attr('class', 'currentTimeSelector')
          .attr('cx', x)
          .attr('cy', -13)
          .attr('r', 7)
          .attr('fill', 'red')
          .on("mousedown", () => {
            this.currentTimeSelected=true;
            this.hideInfo();
          })
      }
    }
  }

  /*\
   * Draw the scrollbar and event listener on it
  \*/
  private drawScrollbar(): void{
    if(this.scrollBar){
      this.zoneScrollbar.nativeElement.style.width = this.svgWidth+"px";
      this.zoneScrollbar.nativeElement.style.marginLeft = this.margin.left+ "px";
      this.zoneScrollbar.nativeElement.style.height = "15px";
      this.zoneScrollbar.nativeElement.style.backgroundColor = "lightgrey";
      this.zoneScrollbar.nativeElement.style.borderRadius = "10px";
      this.scrollbar.nativeElement.style.width = this.svgWidth+"px";
      this.scrollbar.nativeElement.style.height = "15px"
      this.scrollbar.nativeElement.style.backgroundColor = "grey";
      this.scrollbar.nativeElement.style.borderRadius = "10px";
      this.compo.nativeElement.style.width = this.svgWidth+this.margin.left+"px";
      // this.compo.nativeElement.style.padding = "10px 10px 10px 10px"; // TODO PADDING REMOVE BECAUSE CHART NOT IN LINE WITH OTHERS
      this.renderer.listen(this.scrollbar.nativeElement, 'mousedown', (event:MouseEvent) => this.activeScrollbar(event));
      this.renderer.listen(window, 'mouseup', () => this.desactiveScrollbar());
      this.renderer.listen(window,'mousemove', (event:MouseEvent) => this.updateRange(event));
    }
  }


  private hideScrollbar(): void {
    this.zoneScrollbar.nativeElement.remove();
    this.scrollbar.nativeElement.remove();
  }

  /*\
   * Update all the line chart (horizontal and vertical axis and scale, data, lines and range) on data changes.
  \*/
  private updateChart(): void{
    this.dataZoomed = [...this.data];
    this.data.forEach(
      (element,index) => {
        this.buildStyleData(element,index);
        // if(element.style=="area") this.svg.selectAll('.line'+index).remove(); //TODO A SUPP
        // if(element.style=="line") this.svg.selectAll('.area'+index).remove();
        // if(element.style=="bool") {
        this.svg.selectAll('.area'+index).remove();
        this.svg.selectAll('.line'+index).remove();
        this.svg.selectAll('.poly'+index).remove();
        // }
        this.title = 'Timeline : ';
        if(index==this.data.length-1) this.title = this.title+element.label+'.';
        else this.title = this.title+element.label + ', ';
      })
    this.buildZoom();
    this.scaleX.domain([this.minTime,this.maxTime]);
    this.scaleY.range([this.svgHeight, 0]);
    this.controlDomain();
    this.scaleY.domain(this.controlDomain());

    this.updateAxis();

    this.svg.selectAll('.currentTimeLine').remove();
    this.svg.selectAll('.currentTimeSelector').remove();
    this.updateLine();
    this.drawLineCurrentTime();
    this.updateScrollbar(this.minTime,this.maxTime);
    this.updateToolTips();
    this.updateLabels();
    for(let index=this.dataZoomed.length; index<this.lastDatalength; index++){
      this.svg.selectAll('.line'+index).remove();
      this.svg.selectAll('.area'+index).remove();
      this.svg.selectAll('.poly'+index).remove();
    }
    this.lastDatalength=this.dataZoomed.length;
  }

  /*\
   * Update horizontal axis, current time line, lines and scrollbar
   * @param {number} min of the new range
   * @param {number} max of the new range
  \*/
  private updateSvg(min: number, max: number){
    this.scaleX.domain([min,max]);
    this.svg.selectAll('.xAxis').call(d3.axisBottom(this.scaleX));
    this.updateLine();
    this.updateCurrentTime();
    this.updateScrollbar(min,max);
    this.updateLabels();

  }

  /*\
   * Update the display of lines
  \*/
  private updateLine(): void{

    let lineUpdate;
    let polyUpdate;
    let areaUpdate;
    this.dataZoomed.forEach((element,index) => {

      this.svg.selectAll('.area'+index).remove();
      this.svg.selectAll('.line'+index).remove();
      this.svg.selectAll('.poly'+index).remove();

      if(element.style=="area" || element.style=="both"){
        areaUpdate= this.svg.selectAll('.area'+index).data([this.dataZoomed[index].values]);
        areaUpdate
          .enter()
          .append("path")
          .attr('class', 'area'+index)
          .merge(areaUpdate)
          .attr('d', this.area[index])
          .attr("stroke-width", 0.1)
          .attr('opacity', 0.6)
          .style('fill', this.config.colorMap?.lineIndex[index] != null ? this.config.colorMap?.lineIndex[index] : element.color)
          .style('stroke', "black")
          .style('stroke-width', '2px');
      }
      if(element.style=="line" || element.style=="both"){
        lineUpdate= this.svg.selectAll('.line'+index).data([this.dataZoomed[index].values]);
        lineUpdate
          .enter()
          .append("path")
          .attr('class', 'line'+index)
          .merge(lineUpdate)
          .attr('d', this.line[index])
          .style('fill', 'none')
          .style('stroke', this.config.colorMap?.lineIndex[index] != null ? this.config.colorMap?.lineIndex[index] : element.color)
          .style('stroke-width', '2px');
      }

      if(element.style=="bool" || element.style=="enum"){

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

      }

    });
  }

  /*\
   * Update the position of the current time line
  \*/
  private updateCurrentTime(): void{
    let lineUpdate = this.svg.selectAll('.currentTimeLine').datum([[this.currentTime,this.height],[this.currentTime,this.scaleY(this.svgHeight)]])
    let x:number=0;
    lineUpdate.enter()
      .append("path")
      .attr('class', 'currentTimeLine')
      .merge(lineUpdate)
      .attr('d', d3.line()
        .x((d: number[]) => x=this.scaleX(d[0]))
        .y((d: number[]) => d[1]))
      .style('fill', 'none')
      .style('stroke', 'red')
      .style('stroke-width', '3px');
    if(this.currentTime>=this.scale(this.dataZoomed,"xMin")&&this.currentTime<=this.scale(this.dataZoomed,"xMax")){
      this.svg.selectAll('.currentTimeLine').attr('display','block');
      this.svg.selectAll('.currentTimeSelector').attr('display','block');
    }else{
      this.svg.selectAll('.currentTimeLine').attr('display','none');
      this.svg.selectAll('.currentTimeSelector').attr('display','none');
    }
    this.svg.selectAll('.currentTimeSelector').attr('cx',x);
  }

  /*\
   * Update the position of the scrollbar
   * @param {number} min of the new range
   * @param {number} max of the new range
  \*/
  private updateScrollbar(min:number, max:number): void{
    if(this.scrollBar){
      this.scrollbar.nativeElement.style.marginLeft= this.svgWidth*(min-this.minTime)/(this.lengthTime) + "px";
      this.scrollbar.nativeElement.style.width= this.svgWidth*(max-min)/(this.lengthTime) + "px";
    } else {
      this.hideScrollbar();
    }
  }

  /*\
   * Change the range, control it, update datas, update the linechart and then emit the new range.
   * @param {MouseEvent} event
  \*/
  private updateRange(event: MouseEvent): void{
    if(this.scrollbarSelected){
      event.preventDefault();
      let lengthLocalTime = this.range[1]-this.range[0];
      let lastMinLocalTime = this.scale(this.dataZoomed,"xMin");
      let pos = event.clientX-this.margin.left;
      if(this.lastPos==0){
        this.lastPos= pos;
      }
      let minLocalTime = (pos-this.lastPos)*this.lengthTime/this.svgWidth + lastMinLocalTime;
      this.range = this.controlRange(minLocalTime,lengthLocalTime);
      this.updateDataZoom(this.range[0],this.range[1]);
      this.updateSvg(this.range[0],this.range[1]);
      this.rangeChange.emit(this.range);
      this.lastPos=pos;

    }

  }

  /*\
   * Change this.dataZoomed at range changes
   * @param {number} min of the new range
   * @param {number} max of the new range
  \*/
  private updateDataZoom(min:number,max:number): void{
    this.data.forEach((element,index) => {
      this.dataZoomed[index]={
        label: element.label,
        values: element.values.filter((element: number[]) => min <= element[0] && element[0] <=  max),
        color: element.color,
        style: element.style,
        interpolation: element.interpolation
      }})
    let time: number[];
    this.data.forEach((element,index) => {
      time=[];
      element.values.forEach((element => time.push(element[0])));
      let i = d3.bisectLeft(time, min)-1;
      if(i>=0&&i<this.data[index].values.length){
        this.dataZoomed[index].values.unshift([min,(this.data[index].values[i][1])]);
      }
      this.dataZoomed[index].values.push([max,this.dataZoomed[index].values[this.dataZoomed[index].values.length-1][1]]);
    })
  }

  /*\
   * Remove and build a new tooltips
  \*/
  private updateToolTips(): void{
    this.tooltip.remove();
    this.drawToolTips();
  }

  /*\
   * Active movement of scrollbar on mousedown on it
   * @param {MouseEvent} event
  \*/
  private activeScrollbar(event: MouseEvent): void{
    if(this.idZoom!=0){
      this.scrollbarSelected=true;
      this.lastPos=event.clientX-this.margin.left;
    }
  }

  /*\
   * Desactive movement of scrollbar on mouseup or mouseleave on it
  \*/
  private desactiveScrollbar(): void{
    this.scrollbarSelected=false;
    this.lastPos=0;
  }

  /*\
   * Show the tooltips on the movement of the mouse
   * @param {MouseEvent} event
  \*/
  private showInfo(event: MouseEvent): void{

    if (this.dataZoomed[0] != undefined && this.dataZoomed.length <2) {
      var d: number=0;
      var t: number=0;
      let time: number[] = [];
      this.dataZoomed[0].values.forEach((element) => time.push(element[0]));
      let x0 = this.scaleX.invert(event.clientX - this.margin.left).getTime();
      let x = d3.bisectRight(time, x0);
      if(x>this.dataZoomed[0].values.length-1)x=this.dataZoomed[0].values.length-1;
      else if (x < 0) x = 0;
      d  = this.dataZoomed[0].values[x][1];
      t = this.dataZoomed[0].values[x][0];

      // console.log("d -- " + d);
      // console.log("t -- " + t);

      let date = new Date(t).toLocaleDateString("fr", { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' });
      d3.selectAll('#tooltip-date1')
        .text(date);
      if(this.dataZoomed[0].style != "enum") d3.selectAll('#tooltip-date2').text(this.roundDecimal(d, 2))
      else d3.selectAll('#tooltip-date2').text(this.intToEnumTxt(this.roundDecimal(d, 2)))
      this.tooltip.style("display","block");
      this.tooltip.style("opacity", 100);
      this.tooltip.attr("transform", "translate(" + this.scaleX(t) + "," + this.scaleY(d) + ")");
      // console.log("this.scaleX(t) -- " + this.scaleX(t) + " | t -- " + t);

      if (this.scaleY(d) <= 40 * this.dataZoomed.length) {
        if (this.modeToolTips != "inverse") {
          this.modeToolTips = "inverse";
          this.updateToolTips();
        }
      } else {
        if (this.modeToolTips != "normal") {
          this.modeToolTips = "normal";
          this.updateToolTips();
        }
      }
    }
  }

  /*\
   * Hide the tooltips when the mouse leave the svg
  \*/
  private hideInfo(): void{
    this.tooltip.style("display", "none");
  }

  /*\
   * Update the range (reduce or increase) of the linechart on scroll
   * @param {WheelEvent} event
  \*/
  private activeZoom(event: WheelEvent): void{
    event.preventDefault();
    let lastLengthLocalTime = this.lengthTime / Math.pow(1+this.speedZoom,this.idZoom);
    let lastMinLocalTime = this.scale(this.dataZoomed,"xMin");
    if((event.deltaY>0&&this.idZoom>0)||event.deltaY<0){
      if(event.deltaY>0&&this.idZoom>0){
        this.idZoom--;
      }else if(event.deltaY<0){
        this.idZoom++;
      }
      let pos = this.scaleX.invert(event.clientX-this.margin.left).getTime();
      let lengthLocalTime = this.lengthTime / Math.pow(1+this.speedZoom,this.idZoom);
      if(lengthLocalTime>200){
        let minLocalTime = (lastMinLocalTime-pos)*(lengthLocalTime/lastLengthLocalTime) + pos;
        this.range = this.controlRange(minLocalTime,lengthLocalTime);
        this.updateDataZoom(this.range[0],this.range[1]);
        this.updateSvg(this.range[0],this.range[1]);
        this.rangeChange.emit(this.range);

      }else{
        this.idZoom--;
      }
    }
  }

  /*\
   * Update the value of current time on the movement of the mouse
   * @param {MouseEvent} event
  \*/
  private moveCurrentTime(event: MouseEvent): void{
    event.preventDefault();
    // console.log("moveCurrentTime - clientX = " + event.clientX + " | marginleft : " + this.margin.left);
    // console.log("moveCurrentTime - invert = " + this.scaleX.invert(event.clientX-this.margin.left));
    // console.log("this.dataZoomed : ");
    // console.log(this.dataZoomed);

    let pos = this.scaleX.invert(event.clientX-this.margin.left).getTime();
    // console.log("moveCurrentTime - pos = " + pos);
    // console.log("moveCurrentTime - xMin = " + this.scale(this.dataZoomed,"xMin"));
    // console.log("moveCurrentTime - xMax = " + this.scale(this.dataZoomed,"xMax"));

    if(pos<this.scale(this.dataZoomed,"xMin")){
      this.currentTime=this.scale(this.dataZoomed,"xMin");
    }else if(pos>this.scale(this.dataZoomed,"xMax")){
      this.currentTime=this.scale(this.dataZoomed,"xMax");
    }else{
      this.currentTime=pos;
    }

    // console.log("moveCurrentTime - this.currentTime = " + this.currentTime);

    this.updateCurrentTime();
    this.currentTimeChange.emit(this.currentTime);
  }

  /*\
   * Control the range based on data's timestamp and the new range
   * @param {number} min of the new range
   * @param {number} length of the new range
   * @returns a adjusted range based on data's timestamp
  \*/
  private controlRange(min:number, length:number) : [number,number]{
    if(this.minTime>min) min=this.minTime;
    let max = min + length;
    if(this.maxTime<max){
      max=this.maxTime;
      min=max - length;
    }
    if(this.minTime>min) min=this.minTime;
    return [min,max];
  }

  /*\
   * Control the domain based on data's value type and the input domain
   * @returns a new domain auto-scaled if the input domain is equal to [0,0] or the data's value are positive integers, else return the input domain
  \*/
  private controlDomain():[number,number]{
    if((this.domainY[0]==0&&this.domainY[1]==0)||this.discreteValue(this.data)){
      return [this.scale(this.data,"yMin"),this.scale(this.data,"yMax")];
    }else{
      return this.domainY;
    }
  }

  /*\
   * Control the color based on css-colors-name and hex-color-code
   * @param {string} color
   * @returns false if the param color isn't a css-colors-name or a valid hex-color-code
  \*/
  private controlColor(color: string):boolean{
    let s = new Option().style;
    s.color = color;
    return s.color!="";
  }

  /*\
   * Control the speedZoom if it isn't between 0 and 1.
  \*/
  private controlSpeedZoom(): void{
    if(this.speedZoom<=0){
      this.speedZoom=0.1;
    }else if(this.speedZoom>1){
      this.speedZoom=1;
    }
  }

  /*\
   * Determine the minimum or maximum of the horizontal or vertical axis in data
   * @param {Data[]} data Array of Data
   * @param {"xMin" | "xMax" | "yMin" | "yMax"} s precise which scale we want
   * @returns the value that matches with the parameter s in data
  \*/
  private scale(data: Data[], s: "xMin" | "xMax" | "yMin" | "yMax"): number {
    let res: number = 0;
    data.forEach(
      (elements,index) => elements.values.forEach
      ((element,i) => {
        if((s=="yMin"&&((i==0&&index==0)||element[1]<res))||(s=="yMax"&&((i==0&&index==0)||element[1]>res))) res=element[1];
        else if((s=="xMin"&&((i==0&&index==0)||element[0]<res))||(s=="xMax"&&((i==0&&index==0)||element[0]>res))) res=element[0];
      })
    )

    return res;
  }

  /*\
   *Check type of data (positive integer or float)
   *@param {Data[]} data Array of Data
   *@returns false if there is at least one value in data that's not a positive integer
  \*/
  private discreteValue(data: Data[]): boolean{
    for(let i:number=0;i<data.length;i++){
      for(let j:number=0;j<data[i].values.length;j++){
        if(data[i].values[j][1]!=Math.round(data[i].values[j][1])) return false;
      }
    }
    return true;
  }

  /*\
   * Round a number with a precision
   * @param {number} num
   * @param {number} precision
   * @returns a num with a number of decimal (precision)
  \*/
  private roundDecimal(num : number, precision:number): number{
    let tmp: number = Math.pow(10, precision);
    return Math.round( num*tmp )/tmp;
  }
}
