
"use strict";
import "@babel/polyfill";
import "./../style/visual.less";
import powerbi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import DataView = powerbi.DataView;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;

import { VisualSettings } from "./settings";
import * as d3 from "d3";

export interface TestItem {
    Country: string;
    Amount: number;
}

export class Visual implements IVisual {
    private target: HTMLElement;
    private updateCount: number;
    private settings: VisualSettings;
    private textNode: Text;
    
    private svg: d3.Selection<SVGElement>;
    private g: d3.Selection<SVGElement>;
    private margin = { top: 20, right: 20, bottom: 200, left: 70 };

    private width: number;
    private height: number;
    private categories= [];

    
    constructor(options: VisualConstructorOptions) {
        console.log('Visual constructor', options);
        this.target = options.element;
        this.updateCount = 60;

        // this.svg = d3.select(options.element).append('svg');
        this.g = this.svg.append('g');

        
        if (typeof document !== "undefined") {
            const new_p: HTMLElement = document.createElement("p");
            new_p.appendChild(document.createTextNode("Update count:"));
            const new_em: HTMLElement = document.createElement("em");
            this.textNode = document.createTextNode(this.updateCount.toString());
            new_em.appendChild(this.textNode);
            new_p.appendChild(new_em);
            this.target.appendChild(new_p);
        }

        
        this.svg = d3.selectAll(".svg").append("svg").attr("width", this.width).attr("height", this.height).attr("class", "svg");
    }

    public update(options: VisualUpdateOptions) {
        this.settings = Visual.parseSettings(options && options.dataViews && options.dataViews[0]);
        console.log('Visual update', options);
        if (typeof this.textNode !== "undefined") {
            this.textNode.textContent = (this.updateCount++).toString();
        }

        let taskArray = [
            {
              task: "conceptualize",
              type: "development",
              startTime: "2013-1-28", //year/month/day
              endTime: "2013-2-1",
              details: "This actually didn't take any conceptualization"
          },
          
          {
              task: "sketch",
              type: "development",
              startTime: "2013-2-1",
              endTime: "2013-2-6",
              details: "No sketching either, really"
          },
          
          {
              task: "color profiles",
              type: "development",
              startTime: "2013-2-6",
              endTime: "2013-2-9"
          },
          
          {
              task: "HTML",
              type: "coding",
              startTime: "2013-2-2",
              endTime: "2013-2-6",
              details: "all three lines of it"
          },
          
          {
              task: "write the JS",
              type: "coding",
              startTime: "2013-2-6",
              endTime: "2013-2-9"
          },
          
          {
              task: "advertise",
              type: "promotion",
              startTime: "2013-2-9",
              endTime: "2013-2-12",
              details: "This counts, right?"
          },
          
          {
              task: "spam links",
              type: "promotion",
              startTime: "2013-2-12",
              endTime: "2013-2-14"
          },
          {
              task: "eat",
              type: "celebration",
              startTime: "2013-2-8",
              endTime: "2013-2-13",
              details: "All the things"
          },
          
          {
              task: "crying",
              type: "celebration",
              startTime: "2013-2-13",
              endTime: "2013-2-16"
          },
          
          ];

        let dateFormat = d3.time.format("%Y-%m-%d");

        let timeScale = d3.time.scale()
        .domain([d3.min(taskArray, function(d) {return dateFormat.parse(d.startTime);}),
                 d3.max(taskArray, function(d) {return dateFormat.parse(d.endTime);})])
        .range([0,this.width-150]);

        // let this.categories = new Array();

        for (let i = 0; i < taskArray.length; i++){
            this.categories.push(taskArray[i].type);
        }

        let catsUnfiltered = this.categories; //for vert labels

        this.categories = checkUnique(this.categories);


        makeGant(taskArray, this.width, this.height);

        let title = this.svg.append("text")
                    .text("Gantt Chart Process")
                    .attr("x", this.width/2)
                    .attr("y", 25)
                    .attr("text-anchor", "middle")
                    .attr("font-size", 18)
                    .attr("fill", "#009FFC");

        let _this = this;

            // get height and width from viewport
            _this.svg.attr({
                height: options.viewport.height,
                width: options.viewport.width
            });
            let gHeight = options.viewport.height
                - _this.margin.top
                - _this.margin.bottom;
            let gWidth = options.viewport.width
                - _this.margin.right
                - _this.margin.left;
            _this.g.attr({
                height: gHeight,
                width: gWidth
            });
            _this.g.attr('transform',
                `translate(${ _this.margin.left}, ${ _this.margin.top})`);

            // convert data format
            let dat = Visual.converter(options);

            // setup d3 scale
            let xScale = d3.scale.ordinal()
                .domain(dat.map( (d)=> { return d.Country; }))
                .rangeRoundBands([0, gWidth], 0.1);
            let yMax =
                d3.max(dat,  (d)=> { return d.Amount + 10 });
            let yScale = d3.scale.linear()
                .domain([0, yMax])
                .range([gHeight, 0]);

            // remove existing axis and bar
            _this.svg.selectAll('.axis').remove();
            _this.svg.selectAll('.bar').remove();

            // draw x axis
            let xAxis = d3.svg.axis()
                .scale(xScale)
                .orient('bottom');
            _this.g
                .append('g')
                .attr('class', 'x axis')
                .style('fill', 'black')
                .attr('transform', `translate(0, ${(gHeight - 1)})`)
                .call(xAxis)
                .selectAll('text') // rotate text
                .style('text-anchor', 'end')
                .attr('dx', '-.8em')
                .attr('dy', '-.6em')
                .attr('transform', 'rotate(-90)');

            // draw y axis
            let yAxis = d3.svg.axis()
                .scale(yScale)
                .orient('left');
            _this.g
                .append('g')
                .attr('class', 'y axis')
                .style('fill', 'black')
                .call(yAxis);

            // draw bar
            let shapes = _this.g
                .append('g')
                .selectAll('.bar')
                .data(dat);

            shapes.enter()
                .append('rect')
                .attr('class', 'bar')
                .attr('fill', 'yellow')
                .attr('stroke', 'black')
                .attr('x', (d) => {
                    return xScale(d.Country);
                })
                .attr('width', xScale.rangeBand())
                .attr('y', (d)=> {
                    return yScale(d.Amount);
                })
                .attr('height',(d) => {
                    return gHeight - yScale(d.Amount);
                });

            shapes
                .exit()
                .remove();
    }

    private static parseSettings(dataView: DataView): VisualSettings {
        return VisualSettings.parse(dataView) as VisualSettings;
    }

    public static converter(options: VisualUpdateOptions): TestItem[] {
        // let rows = options.dataViews[0].table.rows;
        let dummyData = {
            "rows": [
                [
                  "Germany",
                  "19.3"
                ],
                [
                  "France",
                  "128"
                ],
                [
                  "United States",
                  "11.1"
                ],
                [
                  "Japan",
                  "1.37"
                ],
                [
                  "Italy",
                  "0.87"
                ],
                [
                  "Spain",
                  "0.78"
                ],
                [
                  "Britain",
                  "0.55"
                ],
                [
                  "Portugal",
                  "0.52"
                ],
                [
                  "Ireland",
                  "0.34"
                ]
              ]
        }
        console.log("Dummy Data", dummyData);
        
        let resultData: TestItem[] = [];
        //convert from ['x', y] to [{"x":x, "y": y}]
        for (let i = 0;i < dummyData.rows.length;i++) {
            let row = dummyData.rows[i];
            resultData.push({
                Country: row[0].toString(),
                Amount: +row[1]
            });
        }
        return resultData;
    }

    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
        return VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
    }


    public makeGant(tasks, pageWidth, pageHeight) {

        var barHeight = 20;
        var gap = barHeight + 4;
        var topPadding = 75;
        var sidePadding = 75;
        
        var colorScale = d3.scale.linear()
            .domain([0, this.categories.length])
            .range(["#00B9FA", "#F95002"])
            .interpolate(d3.interpolateHcl);
        
        makeGrid(sidePadding, topPadding, pageWidth, pageHeight);
        drawRects(tasks, gap, topPadding, sidePadding, barHeight, colorScale, pageWidth, pageHeight);
        vertLabels(gap, topPadding, sidePadding, barHeight, colorScale);
        
    }
        
        
    public drawRects(theArray, theGap, theTopPad, theSidePad, theBarHeight, theColorScale, w, h) {
        
        var bigRects = this.svg.append("g")
            .selectAll("rect")
           .data(theArray)
           .enter()
           .append("rect")
           .attr("x", 0)
           .attr("y", function(d, i){
              return i*theGap + theTopPad - 2;
          })
           .attr("width", function(d){
              return w-theSidePad/2;
           })
           .attr("height", theGap)
           .attr("stroke", "none")
           .attr("fill", function(d){
            for (var i = 0; i < this.categories.length; i++){
                if (d.type == this.categories[i]){
                  return d3.rgb(theColorScale(i));
                }
            }
           })
           .attr("opacity", 0.2);
        
        
        var rectangles = this.svg.append('g')
             .selectAll("rect")
             .data(theArray)
             .enter();
        
        
        var innerRects = rectangles.append("rect")
            .attr("rx", 3)
            .attr("ry", 3)
            .attr("x", function(d){
            return timeScale(dateFormat.parse(d.startTime)) + theSidePad;
            })
            .attr("y", function(d, i){
            return i*theGap + theTopPad;
            })
            .attr("width", function(d){
            return (timeScale(dateFormat.parse(d.endTime))-timeScale(dateFormat.parse(d.startTime)));
            })
            .attr("height", theBarHeight)
            .attr("stroke", "none")
            .attr("fill", function(d){
            for (var i = 0; i < this.categories.length; i++){
                if (d.type == this.categories[i]){
                return d3.rgb(theColorScale(i));
                }
            }
            })
           
        var rectText = rectangles.append("text")
            .text(function(d){
            return d.task;
            })
            .attr("x", function(d){
            return (timeScale(dateFormat.parse(d.endTime))-timeScale(dateFormat.parse(d.startTime)))/2 + timeScale(dateFormat.parse(d.startTime)) + theSidePad;
            })
            .attr("y", function(d, i){
                return i*theGap + 14+ theTopPad;
            })
            .attr("font-size", 11)
            .attr("text-anchor", "middle")
            .attr("text-height", theBarHeight)
            .attr("fill", "#fff");
        
        
        rectText.on('mouseover', function(e) {
         // console.log(this.x.animVal.getItem(this));
                       var tag = "";
        
            if (d3.select(this).data()[0].details != undefined){
            tag = "Task: " + d3.select(this).data()[0].task + "<br/>" + 
                "Type: " + d3.select(this).data()[0].type + "<br/>" + 
                "Starts: " + d3.select(this).data()[0].startTime + "<br/>" + 
                "Ends: " + d3.select(this).data()[0].endTime + "<br/>" + 
                "Details: " + d3.select(this).data()[0].details;
            } else {
            tag = "Task: " + d3.select(this).data()[0].task + "<br/>" + 
                "Type: " + d3.select(this).data()[0].type + "<br/>" + 
                "Starts: " + d3.select(this).data()[0].startTime + "<br/>" + 
                "Ends: " + d3.select(this).data()[0].endTime;
            }
            var output = document.getElementById("tag");

            var x = this.x.animVal.getItem(this) + "px";
            var y = this.y.animVal.getItem(this) + 25 + "px";

            output.innerHTML = tag;
            output.style.top = y;
            output.style.left = x;
            output.style.display = "block";
        }).on('mouseout', function() {
            var output = document.getElementById("tag");
            output.style.display = "none";
                });
        
        
        innerRects.on('mouseover', function(e) {
         //console.log(this);
                 var tag = "";
        
            if (d3.select(this).data()[0].details != undefined){
            tag = "Task: " + d3.select(this).data()[0].task + "<br/>" + 
                "Type: " + d3.select(this).data()[0].type + "<br/>" + 
                "Starts: " + d3.select(this).data()[0].startTime + "<br/>" + 
                "Ends: " + d3.select(this).data()[0].endTime + "<br/>" + 
                "Details: " + d3.select(this).data()[0].details;
            } else {
            tag = "Task: " + d3.select(this).data()[0].task + "<br/>" + 
                "Type: " + d3.select(this).data()[0].type + "<br/>" + 
                "Starts: " + d3.select(this).data()[0].startTime + "<br/>" + 
                "Ends: " + d3.select(this).data()[0].endTime;
            }
            var output = document.getElementById("tag");

            var x = (this.x.animVal.value + this.width.animVal.value/2) + "px";
            var y = this.y.animVal.value + 25 + "px";

            output.innerHTML = tag;
            output.style.top = y;
            output.style.left = x;
            output.style.display = "block";
        }).on('mouseout', function() {
            var output = document.getElementById("tag");
            output.style.display = "none";
        
         });
        
    }

    public checkUnique(arr) {
        var hash = {}, result = [];
        for ( var i = 0, l = arr.length; i < l; ++i ) {
            if ( !hash.hasOwnProperty(arr[i]) ) { //it works with objects! in FF, at least
                hash[ arr[i] ] = true;
                result.push(arr[i]);
            }
        }
        return result;
    }

    public getCounts(arr) {
        var i = arr.length, // var to loop over
            obj = {}; // obj to store results
        while (i) obj[arr[--i]] = (obj[arr[i]] || 0) + 1; // count occurrences
        return obj;
    }

    public getCount(word, arr) {
        return this.getCounts(arr)[word] || 0;
    }

    public vertLabels(theGap, theTopPad, theSidePad, theBarHeight, theColorScale){
        var numOccurances = new Array();
        var prevGap = 0;
      
        for (var i = 0; i < this.categories.length; i++){
          numOccurances[i] = [this.categories[i], getCount(this.categories[i], catsUnfiltered)];
        }
      
        var axisText = this.svg.append("g") //without doing this, impossible to put grid lines behind text
         .selectAll("text")
         .data(numOccurances)
         .enter()
         .append("text")
         .text(function(d){
          return d[0];
         })
         .attr("x", 10)
         .attr("y", function(d, i){
          if (i > 0){
              for (var j = 0; j < i; j++){
                prevGap += numOccurances[i-1][1];
               // console.log(prevGap);
                return d[1]*theGap/2 + prevGap*theGap + theTopPad;
              }
          } else{
          return d[1]*theGap/2 + theTopPad;
          }
         })
         .attr("font-size", 11)
         .attr("text-anchor", "start")
         .attr("text-height", 14)
         .attr("fill", function(d){
          for (var i = 0; i < this.categories.length; i++){
              if (d[0] == this.categories[i]){
              //  console.log("true!");
                return d3.rgb(theColorScale(i)).darker();
              }
          }
         });
      
    }

    
    public makeGrid(theSidePad, theTopPad, w, h){

    var xAxis = d3.svg.axis()
        .scale(timeScale)
        .orient('bottom')
        .ticks(d3.time.days, 1)
        .tickSize(-h+theTopPad+20, 0, 0)
        .tickFormat(d3.time.format('%d %b'));
    
    var grid = svg.append('g')
        .attr('class', 'grid')
        .attr('transform', 'translate(' +theSidePad + ', ' + (h - 50) + ')')
        .call(xAxis)
        .selectAll("text")  
                .style("text-anchor", "middle")
                .attr("fill", "#000")
                .attr("stroke", "none")
                .attr("font-size", 10)
                .attr("dy", "1em");
    }

    innerRects.on('mouseover', function(e) {
        //console.log(this);
            var tag = "";
    
            if (d3.select(this).data()[0].details != undefined){
                tag = "Task: " + d3.select(this).data()[0].task + "<br/>" + 
                    "Type: " + d3.select(this).data()[0].type + "<br/>" + 
                    "Starts: " + d3.select(this).data()[0].startTime + "<br/>" + 
                    "Ends: " + d3.select(this).data()[0].endTime + "<br/>" + 
                    "Details: " + d3.select(this).data()[0].details;
            } else {
                tag = "Task: " + d3.select(this).data()[0].task + "<br/>" + 
                    "Type: " + d3.select(this).data()[0].type + "<br/>" + 
                    "Starts: " + d3.select(this).data()[0].startTime + "<br/>" + 
                    "Ends: " + d3.select(this).data()[0].endTime;
            }
            var output = document.getElementById("tag");
    
            var x = (this.x.animVal.value + this.width.animVal.value/2) + "px";
            var y = this.y.animVal.value + 25 + "px";
    
            output.innerHTML = tag;
            output.style.top = y;
            output.style.left = x;
            output.style.display = "block";
            }).on('mouseout', function() {
            var output = document.getElementById("tag");
            output.style.display = "none";
    
    });
    
    
    
    }

}