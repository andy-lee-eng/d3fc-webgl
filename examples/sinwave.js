const numPoints = 40000;
const speed = 0.1;

const data = [];
for(let n = 0; n < numPoints; n++) {
  const x = n * 100 / numPoints;
  data.push({
    x: n * 100 / numPoints,
    y: 50 + 25 * Math.sin(x),
    dx: 0.1,
    dy: Math.random() * speed - speed / 2
  });
}

let seriesName = "Line";
const createSeries = (asWebGL) => {
  const seriesType = asWebGL ? fcWebGL[`seriesWebGL${seriesName}`] : fc[`seriesCanvas${seriesName}`];
  
  return seriesType()
      .decorate(context => {
        const styleVar = seriesName === "Line" ? "strokeStyle" : "fillStyle";
        context[styleVar] = 'rgb(150, 30, 30)';
      });
};

const createChart = (asWebGL) => fcWebGL.cartesian(d3.scaleLinear(), d3.scaleLinear())
    .yDomain([0, 100])
    .xDomain([0, 100])
    .canvasPlotArea(createSeries(asWebGL));
let chart = createChart(true);

const movePoints = () => {
  data.forEach(b => {
    b.x += b.dx;
    b.y += b.dy;

    if (b.x > 100 || b.x < 0) b.dx = -b.dx;
    if (b.y > 100 || b.y < 0) b.dy = -b.dy;
  });
}

d3.select("#seriesCanvas").on("click", () => restart(false));
d3.select("#seriesWebGL").on("click", () => restart(true));
d3.select("#seriesLine").on("click", () => restart(true, "Line"));
d3.select("#seriesBar").on("click", () => restart(true, "Bar"));
d3.select("#seriesArea").on("click", () => restart(true, "Area"));

let lastTime = 0;
const times = [];
let i = 0;

const showFPS = (t) => {
  const dt = t - lastTime;
  lastTime = t;
  times.push(dt);
  i++;
  if (times.length > 10) times.splice(0, 1);
  if (i > 10) {
    i = 0;
    const avg = times.reduce((s, t) => s + t, 0) / times.length;
    d3.select('#fps').text(`fps: ${Math.floor(1000 / avg)}`);
  }
};

const render = (t) => {
  showFPS(t);
  movePoints();

  // render
  d3.select('#content')
    .datum(data)
    .call(chart);

  if (stopRequest) {
    stopRequest();
  } else {
    requestAnimationFrame(render);
  }
}

let stopRequest = null;
const stop = () => {
  return new Promise(resolve => {
    stopRequest = () => {
      stopRequest = null;
      resolve();
    };
  });
};
const start = () => requestAnimationFrame(render);

const restart = (asWebGL, newSeriesName) => {
  stop().then(() => {
    d3.select('#content').html('');

    if (newSeriesName) seriesName = newSeriesName;
    chart = createChart(asWebGL);

    start();
  });
};

start();
