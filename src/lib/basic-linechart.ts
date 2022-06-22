import { ElementRef, EventEmitter, Injectable, OnInit, Renderer2 } from "@angular/core";
import {DataG, CONFIG, defaultConfig,colorMap, defaultColorMap, polygonDef, points} from './interfaces'
import {ScaleLinear, ScaleTime} from 'd3-scale';
import {Selection} from 'd3-selection';
import * as d3 from 'd3';

export class BasicLinechart<T> {

    protected _config: CONFIG = defaultConfig;

    get config(): Partial<CONFIG> {return this._config;}
    set config(c: Partial<CONFIG>) {
      this._config = {...defaultConfig, ...c};

    }

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

    /*
     * Input data array that the component display
     * Default value : []
     */
    data: /*Data*/DataG<T>[] = [];

    /*
     * ElementRef of DOM Element root
     * It's a svg with the linechart
     */
    timeline!: ElementRef;


    /*
     * ElementRef of DOM Element scroll
     * It's a div that will be the scrollbar
     */
    scrollbar!: ElementRef;

    /*
     * ElementRef of DOM Element zone
     * It's a div that will be the zone of scrollbar
     */
    zoneScrollbar!: ElementRef;

    /*
     * ElementRef of DOM Element element
     * It's a div that contains all the others Dom Element
     */
    compo!: ElementRef;

    /*
     * Output rangeChange that emit range
     */
    rangeChange = new EventEmitter<[number,number]>();

    /*
     * Output currentTimeChange that emit currentTime
     */
    currentTimeChange = new EventEmitter<number>();


    /*
     * Title of the component
     */
    public title:string = 'Timeline : ';

    /*
     * svg that contain the linechart and the axis
     */
    protected svg: any;

    /*
     * Width of the svg
     */
    protected svgWidth: number = 0;

    /*
     * Height of the svg
     */
    protected svgHeight: number = 0;

    /*
     * Margin of the component
     */
    protected margin:{top:number,right:number,bottom:number,left:number} = { top: 20, right: 20, bottom: 20, left: 30 }; //marge interne au svg

    /*
     * Scale of the X axis
     */
    protected scaleX: ScaleTime<number,number> = d3.scaleTime();

    /*
     * Scale of the Y axis
     */
    protected scaleY: ScaleLinear<number,number> = d3.scaleLinear();

    /*
     * It's the smallest timestamp of data
     */
    protected minTime: number = 0;

    /*
     * It's the biggest timestamp of data
     */
    protected maxTime: number = 0;

    /*
     * It's the difference between the smallest and the biggest Time (maxTime - minTime)
     */
    protected lengthTime: number = 0;

    /*
     * Array of area definition
     */
    private area: d3.Area<[number, number]>[] = [];

    /*
     * Array of line definition
     */
    protected line: d3.Line<[number, number]>[] = [];

    /*
     * Array of line definition
     */
    private poly: String[] = [];
    /*
     * Boolean for switching between top and bottoms lines
     * This is made for enum so that, everytime a new enum appears,
     * the lineBoolBottom will switch sides with Top
     */
    private lineSwitch: boolean = false;

    /*
     * dataZoomed is a copy of data with the range specify
     */
    public dataZoomed: typeof this.data = []; // Data<T>[] = [];

    /*
     * idZoom is the number of wheel notch
     */
    protected idZoom: number = 0;

    /*
     * true if the CTRL Key of keyBoard is push
     */
    protected zoomSelected: boolean = false

    /*
     * Svg definition of enum Labels
     */
    protected enumUTF8!: Selection<SVGGElement,unknown,null,undefined>;

    /*
     * Svg definition of enum Labels
     */
    private enumLabel!: Selection<SVGGElement,unknown,null,undefined>;

    /*
     * Svg definition of the tooltip
     */
    protected tooltip!: Selection<SVGGElement,unknown,null,undefined>;

    /*
     * Mode of the tooltip
     */
    protected modeToolTips: "normal" | "inverse" = "normal";

    /*
     * true if the currentTimeline is selected
     */
    private currentTimeSelected:boolean = false;

    /*
     * true if the scrollbar is selected
     */
    private scrollbarSelected:boolean = false;

    /*
     * data length before the new change
     */
    protected lastDatalength:number = 0;

    /*
     * Last position of the mouse
     */
    private lastPos: number = 0;

    handleKeyDown(event: KeyboardEvent){
      if(event.ctrlKey&&!this.zoomSelected){
        this.zoomSelected = true;
      }
    }

    handleKeyUp(){
      this.zoomSelected = false;
    }

    constructor(private renderer: Renderer2) {
    }

/*
     * Add event listeners on the svg
     */
    protected buildEvent(): void{ // creer une timeline avec une seul donnée
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

      /*
       * Build the style (area, line or both) and the interpolation (step or linear) of lines
       * @param {Data} element
       * @param {number} index
       */
      protected buildStyleData(element: DataG<T>, index:number): void {

        if (element.style == "number") {
          if (element.interpolation == "step") {
            this.line[index] = d3.line()
              .x((d: number[]) => this.scaleX(d[0]))
              .y((d: number[]) => this.scaleY(d[1]))
              .curve(d3.curveStepAfter);
          } else {
            this.line[index] = d3.line()
              .x((d: number[]) => this.scaleX(d[0]))
              .y((d: number[]) => this.scaleY(d[1]));
          }

          if (!this.controlColor(element.color as string)) { // Projection
            console.warn("Data with " + element.label + " label, has an unvalid color attribute (" + element.color + "). Replace with the default color (black).");
            element.color = "black";
          }
        }
      }


      protected computePolyCoord(element: DataG<T>, index: number): polygonDef[] {
        console.log("Undefined (computePolyCoord) - basic-linechart class called ..");

        return [];
      }

      /*
       * Save information for zoom.
       * XXX Attention ici que se passe-t-il si on zoom sur des boolean ou des énumérables ?
       */
      protected buildZoom(): void {
        this.minTime = this.scale(this.data,"xMin");
        this.maxTime = this.scale(this.data,"xMax");
        this.lengthTime = this.maxTime - this.minTime;
        this.idZoom=0;
      }

      /*
       * Draw the tooltips's svg
       */
      protected drawToolTips(): void{ //creer le tooltips
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
            if('color' in element && typeof element.color === "string") {
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
            }
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
            if('color' in element && element.color === "string") {
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
                .attr("dy", 50)
                .attr("id", "tooltip-date1");
              text.append("tspan")
                .attr("dx", "-80")
                .attr("dy", "20")
                .attr("id", "tooltip-date2");
            }
          });
        }
      }

      /*
       * Draw horizontal and vertical axis and scale
       */
      protected drawAxis(): void{
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
          if(element.style == "boolean" || element.style == "enumeration"){

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

      /*
       *  Update Axis
       */

      private updateAxis(): void {

        // x Axis
        this.svg.selectAll('.xAxis').call(d3.axisBottom(this.scaleX));

        // y Axis
        this.data.forEach((element,index) => {
          if (element.style == "boolean" || element.style == "enumeration") {
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


      /*
       * Draw lines on the line chart
       */
      protected drawLineAndPath(): void{
        console.log("Undefined (drawLineAndPath) - basic-linechart class called ..");
      }


      /*
       * Build and draw labels
       */
      protected buildLabels():void {

      }

      /*
       * Update the Labels
       */

      protected updateLabels(): void {
          this.svg.selectAll(".label").remove();
          this.svg.selectAll(".utf8_label").remove();
        this.buildLabels();
      }

      /*
       * Draw the vertical line which represents the current time
       */
      protected drawLineCurrentTime(): void{

        if(this.data.length!=0){
          if(this.currentTime==0){
            this.currentTime = this.scale(this.data,"xMin");
          }
          let x:number=0;
          this.svg.append('path')
            .datum([[this.currentTime,this.height],[this.currentTime,this.scaleY(this.svgHeight)]])
            .attr('class', 'currentTimeLine')
            .attr('d', d3.line()
              .x((d: number[]) => x=this.scaleX(d[0]))
              .y((d: number[]) => {
                return d[1];
              }))
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

      /*
       * Draw the scrollbar and event listener on it
       */
      protected drawScrollbar(): void{
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
          // this.compo.nativeElement.style.padding = "10px 10px 10px 10px"; // PADDING REMOVE BECAUSE CHART NOT IN LINE WITH OTHERS
          this.renderer.listen(this.scrollbar.nativeElement, 'mousedown', (event:MouseEvent) => this.activeScrollbar(event));
          this.renderer.listen(window, 'mouseup', () => this.desactiveScrollbar());
          this.renderer.listen(window,'mousemove', (event:MouseEvent) => this.updateRange(event));
        }
      }


      private hideScrollbar(): void {
        this.zoneScrollbar.nativeElement.remove();
        this.scrollbar.nativeElement.remove();
      }

      /*
       * Update all the line chart (horizontal and vertical axis and scale, data, lines and range) on data changes.
       */
      protected updateChart(): void{
        this.dataZoomed = [...this.data];
        this.data.forEach(
          (element,index) => {
            this.buildStyleData(element,index);
            this.svg.selectAll('.line'+index).remove();
            this.svg.selectAll('.poly'+index).remove();
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
          this.svg.selectAll('.poly'+index).remove();
        }
        this.lastDatalength=this.dataZoomed.length;
      }

      /*
       * Update horizontal axis, current time line, lines and scrollbar
       * @param {number} min of the new range
       * @param {number} max of the new range
       */
      protected updateSvg(min: number, max: number){
        this.scaleX.domain([min,max]);
        this.svg.selectAll('.xAxis').call(d3.axisBottom(this.scaleX));
        this.updateLine();
        this.updateCurrentTime();
        this.updateScrollbar(min,max);
        this.updateLabels();

      }

      /*
       * Update the display of lines
       */
      protected updateLine(): void{
        console.log("Undefined (updateLine) - basic-linechart class called ..");
      }

      /*
       * Update the position of the current time line
       */
      protected updateCurrentTime(): void{
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

      /*
       * Update the position of the scrollbar
       * @param {number} min of the new range
       * @param {number} max of the new range
       */
      private updateScrollbar(min:number, max:number): void{
        if(this.scrollBar){
          this.scrollbar.nativeElement.style.marginLeft= this.svgWidth*(min-this.minTime)/(this.lengthTime) + "px";
          this.scrollbar.nativeElement.style.width= this.svgWidth*(max-min)/(this.lengthTime) + "px";
        } else {
          this.hideScrollbar();
        }
      }

      /*
       * Change the range, control it, update datas, update the linechart and then emit the new range.
       * @param {MouseEvent} event
       */
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

      /*
       * Change this.dataZoomed at range changes
       * @param {number} min of the new range
       * @param {number} max of the new range
       */
      protected updateDataZoom(min:number,max:number): void{
        console.log("Undefined (updateDataZoom) - basic-linechart class called ..");
      }

      /*
       * Remove and build a new tooltips
       */
      protected updateToolTips(): void{
        this.tooltip.remove();
        this.drawToolTips();
      }

      /*
       * Active movement of scrollbar on mousedown on it
       * @param {MouseEvent} event
       */
      private activeScrollbar(event: MouseEvent): void{
        if(this.idZoom!=0){
          this.scrollbarSelected=true;
          this.lastPos=event.clientX-this.margin.left;
        }
      }

      /*
       * Desactive movement of scrollbar on mouseup or mouseleave on it
       */
      private desactiveScrollbar(): void{
        this.scrollbarSelected=false;
        this.lastPos=0;
      }

      /*
       * Show the tooltips on the movement of the mouse
       * @param {MouseEvent} event
       */
      private showInfo(event: MouseEvent): void{
      }

      /*
       * Hide the tooltips when the mouse leave the svg
       */
      private hideInfo(): void{
        this.tooltip.style("display", "none");
      }

      /*
       * Update the range (reduce or increase) of the linechart on scroll
       * @param {WheelEvent} event
       */
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

      /*
       * Update the value of current time on the movement of the mouse
       * @param {MouseEvent} event
       */
      private moveCurrentTime(event: MouseEvent): void{
        event.preventDefault();
        let pos = this.scaleX.invert(event.clientX-this.margin.left).getTime();
        if(pos<this.scale(this.dataZoomed,"xMin")){
          this.currentTime=this.scale(this.dataZoomed,"xMin");
        }else if(pos>this.scale(this.dataZoomed,"xMax")){
          this.currentTime=this.scale(this.dataZoomed,"xMax");
        }else{
          this.currentTime=pos;
        }

        this.updateCurrentTime();
        this.currentTimeChange.emit(this.currentTime);
      }

      /*
       * Control the range based on data's timestamp and the new range
       * @param {number} min of the new range
       * @param {number} length of the new range
       * @returns a adjusted range based on data's timestamp
       */
      protected controlRange(min:number, length:number) : [number,number]{
        if(this.minTime>min) min=this.minTime;
        let max = min + length;
        if(this.maxTime<max){
          max=this.maxTime;
          min=max - length;
        }
        if(this.minTime>min) min=this.minTime;
        return [min,max];
      }

      /*
       * Control the domain based on data's value type and the input domain
       * @returns a new domain auto-scaled if the input domain is equal to [0,0] or the data's value are positive integers, else return the input domain
       */
      protected controlDomain():[number,number]{
        if((this.domainY[0]==0&&this.domainY[1]==0)||this.discreteValue(this.data)){
          return [this.scale(this.data,"yMin"),this.scale(this.data,"yMax")];
        }else{
          return this.domainY;
        }
      }

      /*
       * Control the color based on css-colors-name and hex-color-code
       * @param {string} color
       * @returns false if the param color isn't a css-colors-name or a valid hex-color-code
       */
      private controlColor(color: string):boolean{
        let s = new Option().style;
        s.color = color;
        return s.color!="";
      }

      /*
       * Control the speedZoom if it isn't between 0 and 1.
       */
      protected controlSpeedZoom(): void{
        if(this.speedZoom<=0){
          this.speedZoom=0.1;
        }else if(this.speedZoom>1){
          this.speedZoom=1;
        }
      }

      /*
       * Determine the minimum or maximum of the horizontal or vertical axis in data
       * @param {Data[]} data Array of Data
       * @param {"xMin" | "xMax" | "yMin" | "yMax"} s precise which scale we want
       * @returns the value that matches with the parameter s in data
       */
      protected scale(data: DataG<T>[], s: "xMin" | "xMax" | "yMin" | "yMax"): number {
        console.log("Undefined (scale) - basic-linechart class called ..");
        return 0;
      }

      /*
       *Check type of data (positive integer or float)
       *@param {Data[]} data Array of Data
       *@returns false if there is at least one value in data that's not a positive integer
       *  XXX C'est quoi cette méthode, usage ??? Il me semble que c'est pour des donner des valeurs discrètes pour construire l'axe Y, car il a besoin de cet type de valeur quand il s'agit d'énumération et booléens

       */
      protected discreteValue(data: DataG<T>[]): boolean{
        console.log("Undefined (discreteValue) - basic-linechart class called ..");
        return true;
      }

      /*
       * Round a number with a roundDecimalprecision
       * @param {number} num
       * @param {number} precision
       * @returns a num with a number of decimal (precision)
       */
      protected roundDecimal(num : number, precision:number): number{
        let tmp: number = Math.pow(10, precision);
        return Math.round( num*tmp )/tmp;
      }


}