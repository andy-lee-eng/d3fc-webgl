const data = {
  lines: [
    [
      {x: 10, y: 40},
      {x: 40, y: 55},
      {x: 60, y: 32},
      {x: 90, y: 75}
    ],
    [
      {x: 10, y: 60},
      {x: 40, y: 72},
      {x: 60, y: 41},
      {x: 90, y: 28},
    ]
  ],
  areas: [
    [
      {x: 5, y: 30, b: 0},
      {x: 30, y: 22, b: 0},
      {x: 70, y: 28, b: 0},
      {x: 95, y: 18, b: 0},
    ],
    [
      {x: 5, y: 40, b: 30},
      {x: 30, y: 47, b: 22},
      {x: 70, y: 33, b: 28},
      {x: 95, y: 31, b: 18},
    ]
  ],
  bars: [
    [
      {x: 15, y: 50},
      {x: 35, y: 30},
      {x: 65, y: 70},
      {x: 85, y: 35},
    ],
    [
      {x: 15, y: 25},
      {x: 35, y: 55},
      {x: 65, y: 40},
      {x: 85, y: 45},
    ]
  ]
};

const orient = "vertical";

const line = fcWebgl.seriesWebglLine()
  .orient(orient)
  .decorate((context, d) => {
    context.strokeWidth = 2;
    context.strokeStyle = d == data.lines[0] ? "rgb(80, 200, 200)" : "rgb(200, 80, 200)";
  });
const lines = fcWebgl.seriesWebglRepeat()
  .orient('horizontal')
  .series(line);

const area = fcWebgl.seriesWebglArea()
  .orient(orient)
  .baseValue(d => d.b)
  .decorate((context, d) => {
    context.strokeWidth = 2;
    context.strokeStyle = d == data.areas[0] ? "rgb(80, 200, 80)" : "rgb(200, 200, 80)";
    context.fillStyle = d == data.areas[0] ? "rgba(80, 200, 80, 0.3)" : "rgba(200, 200, 80, 0.3)";
  });
const areas = fcWebgl.seriesWebglRepeat()
  .orient('horizontal')
  .series(area);

const bars = fc.autoBandwidth(fcWebgl.seriesWebglGrouped(fcWebgl.seriesWebglBar()))
  .orient(orient)
  .decorate((context, d) => {
    context.fillStyle = d == data.bars[0] ? "rgba(200, 80, 80, 0.5)" : "rgba(80, 80, 200, 0.5)"
  });

const multi = fcWebgl.seriesWebglMulti()
  .series([areas, lines, bars])
  .mapping((data, index, series) => {
    switch(series[index]) {
      case lines:
        return data.lines;
      case areas:
        return data.areas;
      case bars:
          return data.bars;
      }
  });

const chart = fcWebgl.cartesian(d3.scaleLinear(), d3.scaleLinear())
  .yDomain([0, 100])
  .xDomain([0, 100])
  .canvasPlotArea(multi);

// render
d3.select('#content')
  .datum(data)
  .call(chart);
