# d3fc-webgl

A collection of components for rendering data series to canvas using WebGL, including points, line, bar, and area.

These can be used to replace the standard d3fc components for rendering to SVG or Canvas.
[d3fc series components](https://d3fc.io/api/series-api.html)


<table>
<tr>
  <td><a href="#line"><img src="screenshots/line.png"/></a></td>
  <td><a href="#area"><img src="screenshots/area.png"/></a></td>
  <td><a href="#point"><img src="screenshots/point.png"/></a></td>
  <td><a href="#bar"><img src="screenshots/bar.png"/></a></td>
</tr>
<tr>
  <td><a href="#multi"><img src="screenshots/multi.png"/></a></td>
  <td><a href="#grouped"><img src="screenshots/grouped.png"/></a></td>
  <td><a href="#stacked"><img src="screenshots/stacked.png"/></a></td>
  <td><a href="#repeat"><img src="screenshots/repeat.png"/></a></td>
</tr>
</table>

[Main d3fc package](https://github.com/d3fc/d3fc)

## Installing

```bash
npm install d3fc-webgl
```

## API Reference

* [General API](#general-api)
 * [Canvas Rendering](#canvas-rendering)
 * [Cartesian Chart](#cartesian-chart)
 * [Decorate Pattern](#decorate-pattern)
 * [Orientation](#orientation)
 * [Multi Series](#multi-series)
 * [Auto Bandwidth](#auto-bandwidth)
* [Line](#line)
* [Point](#point)
* [Area](#area)
* [Bar](#bar)
* [Multi](#multi)
* [Repeat](#repeat)
* [Grouped](#grouped)
* [Stacked](#stacked)

This packages contains a number of D3 components that render various standard series types. They all share a common API, with the typical configuration requiring x and y scales together with a number of value accessors. There are SVG and Canvas versions of each series type, sharing the same configuration properties.

### General API

#### Canvas rendering

The `seriesWebGLLine` component has an API that is identical to the `seriesCanvasLine` counterpart, except that it requires a canvas context that was initialised for `webgl`.

```javascript
const data = [
    {x: 0, y: 0},
    {x: 10, y: 5},
    {x: 20, y: 0}
];

const ctx = canvas.getContext('webgl');

const line = fcWebGL.seriesWebGLLine()
    .crossValue(d => d.x)
    .mainValue(d => d.y)
    .xScale(xScale)
    .yScale(yScale)
    .context(ctx);

line(data);
```

Like the original canvas component, the WebGL components are invoked directly with the supplied data. This causes the component to render itself to the canvas.

#### Cartesian Chart

The WebGL series components can be rendered on their own, or be supplied as the series to a `cartesianChart` component. However, since we need to initialise the canvas for `webgl`, we can't use the original d3fc `cartesianChart` directly. Instead, we offer a new component that overrides the `draw` event of `cartesianChart` to draw to WebGL:

```javascript
const chart = fcWebGL.cartesian(d3.scaleLinear(), d3.scaleLinear())
  .yDomain([0, 100])
  .xDomain([0, 100])
  .canvasPlotArea(fc.seriesWebGLLine());
```

#### Decorate Pattern

The WebGL component implement the same decorate pattern as their Canvas counterparts, but since they're not actually doing 2d canvas rendering, it is more limited. You can still set fill and stroke styles as below:

```javascript

const line = fcWebGL.seriesWebGLBar()
  .decorate((context, d) => {
    context.strokeWidth = 2;
    context.strokeStyle = 'red';
    context.fillStyle = 'blue';
  });
```

For further details, consult the [Decorate Pattern documentation](https://d3fc.io/introduction/decorate-pattern.html).

#### Orientation

Most of the series renderers support both horizontal and vertical render orientations as specified by the `orient` property. In order to make it easy to change the orientation of a series, and to avoid redundant and repeated property names, a change in orientation is achieved by transposing the x and y scales.

The following example shows a simple bar series rendered in its default vertical orientation:

```javascript
const data = [4, 6, 8, 6, 0, 10];

const xScale = d3.scaleLinear()
    .domain([0, data.length])
    .range([0, width]);

const yScale = d3.scaleLinear()
    .domain([0, 10])
    .range([height, 0]);

const ctx = canvas.getContext('webgl');

const barSeries = fcWebGL.seriesWebGLBar()
    .xScale(xScale)
    .yScale(yScale)
    .crossValue((_, i) => i)
    .mainValue((d) => d)
    .context(ctx);

barSeries(data);
```

By setting its `orient` property to `horizontal`, the x and y scales are transposed. As a result, the domain for both the x and y scale have to be switched. The following shows the changes required:

```javascript
const xScale = d3.scaleLinear()
    .domain([0, 10])           // domain changed
    .range([0, width]);

const yScale = d3.scaleLinear()
    .domain([0, data.length])  // domain changed
    .range([height, 0]);

const barSeries = fcWebGL.seriesWebGLBar()
    .xScale(xScale)
    .yScale(yScale)
    .orient('horizontal')      // orient property updated
    .crossValue((_, i) => i)
    .mainValue((d) => d)
    .context(ctx);

barSeries(data);

```

This is part of the motivation behind naming the accessors `mainValue` and `crossValue`, rather than an orientation specific `xValue` / `yValue`.

#### Multi series

One series type that is worthy of note is the multi series. This component provides a convenient way to render multiple series, that share scales, to the same SVG or canvas.

The multi series renderers expose a `series` property which accepts an array of series renderers, together with the standard  `xScale` and `yScale` properties. The following example shows how a multi series can be used to render both a line and bar series:

```javascript
// a couple of series - value accessor configuration omitted for clarity
const barSeries = fcWebGL.seriesWebGLBar();
const lineSeries = fcWebGL.seriesWebGLLine();

const multiSeries = fcWebGL.seriesWebGLMulti()
    .xScale(xScale)
    .yScale(yScale)
    .context(ctx)
    .series([barSeries, lineSeries]);

multiSeries(data)
```

Notice that you do not have to set the `xScale`, `yScale` and `context` properties on each series - they are propagated down from the multi series.

The multi series allows you to combine a range of different series types. If instead you have multiple data series that you want to render using the same series type, e.g. a chart containing multiple lines, the [repeat series](#repeat) is an easier way to achieve this.

Note that you cannot mix WebGL and standard Canvas series types in the same multi series.

#### Auto bandwidth

The bar series has a notion of 'width'. It exposes a `bandwidth` property where you can supply the width as a value (in the screen coordinate system).

Rather than specify a bandwidth directly, you can adapt a series with the `fc.autoBandwidth` component, which will either obtain the bandwidth directly from the scale, or compute it based on the distribution of data.

When used with a `bandScale`, the scale is responsible for computing the width of each band. The `fc.autoBandwidth` component invokes the `bandwidth` function on the scale and uses the returned value to set the `bandwidth` on the series.

```javascript
var xScale = d3.scaleBand()
    .domain(data.map(d => d.x))
    .rangeRound([0, width]);

var bar = fc.autoBandwidth(fcWebGL.seriesWebGLBar())
    .align('left')
    .crossValue(function(d) { return d.x; })
    .mainValue(function(d) { return d.y; });
```

Notice in the above example that the `align` property of the bar is set to `left`, which reflects the band scale coordinate system.

**NOTE:** The d3 point scale is a special cased band scale that has a zero bandwidth. As a result, if you use the `fc.autoBandwidth` component in conjunction with a point scale, the series will also have a bandwidth of zero!

When used in conjunction with a linear scale, the `fc.autoBandwidth` component computes the bar width based on the smallest distance between consecutive datapoints:

```javascript
var xScale = d3.scaleLinear()
    .domain([0, 10])
    .range([0, width]);

var bar = fc.autoBandwidth(fcWebGL.seriesWebGLBar())
    .crossValue(function(d) { return d.x; })
    .mainValue(function(d) { return d.y; })
    .widthFraction(0.5);
```

The `fc.autoBandwidth` component, when adapting a series, adds a `widthFraction` property which determines the fraction of this distance that is used to set the bandwidth.

When using a multi, or repeat series, the `fc.autoBandwidth` component should be used to adapt the bar series directly, rather than adapting the multi or repeat series.

```javascript
var bar = fcWebGL.seriesWebGLBar()

var line = fcWebGL.seriesWebGLLine();

var multi = fcWebGL.seriesWebGLMulti()
    .xScale(xScale)
    .yScale(yScale)
    .series([fc.autoBandwidth(bar), line]);
```

### Line

![](screenshots/line.png)

<a name="seriesWebGLLine" href="#seriesWebGLLine">#</a> fcWebGL.**seriesWebGLLine**()

Constructs a new line renderer.

#### Properties

<a name="seriesLine_crossValue" href="#seriesLine_crossValue">#</a> *seriesLine*.**crossValue**(*accessorFunc*)  
<a name="seriesLine_mainValue" href="#seriesLine_mainValue">#</a> *seriesLine*.**mainValue**(*accessorFunc*)

If *accessorFunc* is specified, sets the accessor to the specified function and returns this series. If *accessorFunc* is not specified, returns the current accessor. The `accessorFunc(datum, index)` function is called on each item of the data, returning the relevant value for the given accessor. The respective scale is applied to the value returned by the accessor before rendering.

<a name="seriesLine_xScale" href="#seriesLine_xScale">#</a> *seriesLine*.**xScale**(*scale*)  
<a name="seriesLine_yScale" href="#seriesLine_yScale">#</a> *seriesLine*.**yScale**(*scale*)

If *scale* is specified, sets the scale and returns this series. If *scale* is not specified, returns the current scale.

<a name="seriesLine_orient" href="#seriesLine_orient">#</a> *seriesLine*.**orient**(*orientation*)  

If *orientation* is specified, sets the orientation and returns this series. If *orientation* is not specified, returns the current orientation. The orientation value should be either `horizontal` (default) or `vertical`.

<a name="seriesCanvasLine_context" href="#seriesCanvasLine_context">#</a> *seriesCanvasLine*.**context**(*ctx*)

If *ctx* is specified, sets the canvas context and returns this series. If *ctx* is not specified, returns the current context.

### Point

![](screenshots/point.png)

<a name="seriesWebGLPoint" href="#seriesWebGLPoint">#</a> fcWebGL.**seriesWebGLPoint**()

Constructs a new point series renderer.

#### Properties

<a name="seriesPoint_crossValue" href="#seriesPoint_crossValue">#</a> *seriesPoint*.**crossValue**(*accessorFunc*)  
<a name="seriesPoint_mainValue" href="#seriesPoint_mainValue">#</a> *seriesPoint*.**mainValue**(*accessorFunc*)

If *accessorFunc* is specified, sets the accessor to the specified function and returns this series. If *accessorFunc* is not specified, returns the current accessor. The `accessorFunc(datum, index)` function is called on each item of the data, returning the relevant value for the given accessor. The respective scale is applied to the value returned by the accessor before rendering.

<a name="seriesPoint_xScale" href="#seriesPoint_xScale">#</a> *seriesPoint*.**xScale**(*scale*)  
<a name="seriesPoint_yScale" href="#seriesPoint_yScale">#</a> *seriesPoint*.**yScale**(*scale*)

If *scale* is specified, sets the scale and returns this series. If *scale* is not specified, returns the current scale.

<a name="seriesPoint_orient" href="#seriesPoint_orient">#</a> *seriesPoint*.**orient**(*orientation*)  

If *orientation* is specified, sets the orientation and returns this series. If *orientation* is not specified, returns the current orientation. The orientation value should be either `horizontal` (default) or `vertical`.

<a name="seriesPoint_type" href="#seriesPoint_type">#</a> *seriesPoint*.**type**(*type*)

If *type* is specified, sets the symbol type to the specified function or symbol type and returns this point series renderer. If *type* is not specified, returns the current symbol type accessor.

This property is rebound from [symbol.type](https://github.com/d3/d3-shape#symbol_type).

<a name="seriesPoint_size" href="#seriesPoint_size">#</a> *seriesPoint*.**size**(*size*)

If *size* is specified, sets the area to the specified function or number and returns this point series renderer. If *size* is not specified, returns the current size accessor.

This property is rebound from [symbol.size](https://github.com/d3/d3-shape#symbol_size).

<a name="seriesCanvasPoint_context" href="#seriesCanvasPoint_context">#</a> *seriesCanvasPoint*.**context**(*ctx*)

If *ctx* is specified, sets the canvas context and returns this series. If *ctx* is not specified, returns the current context.

### Area

![](screenshots/area.png)

<a name="seriesWebGLArea" href="#seriesWebGLArea">#</a> fc.**seriesWebGLArea**()

Constructs a new area series renderer.

#### Properties

<a name="seriesArea_crossValue" href="#seriesArea_crossValue">#</a> *seriesArea*.**crossValue**(*accessorFunc*)  
<a name="seriesArea_mainValue" href="#seriesArea_mainValue">#</a> *seriesArea*.**mainValue**(*accessorFunc*)
<a name="seriesArea_baseValue" href="#seriesArea_baseValue">#</a> *seriesArea*.**baseValue**(*accessorFunc*)  

If *accessorFunc* is specified, sets the accessor to the specified function and returns this series. If *accessorFunc* is not specified, returns the current accessor. The `accessorFunc(datum, index)` function is called on each item of the data, returning the relevant value for the given accessor. The respective scale is applied to the value returned by the accessor before rendering.

<a name="seriesArea_orient" href="#seriesArea_orient">#</a> *seriesArea*.**orient**(*orientation*)

If *orientation* is specified, sets the orientation and returns this series. If *orientation* is not specified, returns the current orientation. The orientation value should be either `horizontal` (default) or `vertical`.

<a name="seriesArea_xScale" href="#seriesArea_xScale">#</a> *seriesArea*.**xScale**(*scale*)  
<a name="seriesArea_yScale" href="#seriesArea_yScale">#</a> *seriesArea*.**yScale**(*scale*)

If *scale* is specified, sets the scale and returns this series. If *scale* is not specified, returns the current scale.

<a name="seriesCanvasArea_context" href="#seriesCanvasArea_context">#</a> *seriesCanvasArea*.**context**(*ctx*)

If *ctx* is specified, sets the canvas context and returns this series. If *ctx* is not specified, returns the current context.

### Bar

![](screenshots/bar.png)

<a name="seriesWebGLBar" href="#seriesWebGLBar">#</a> fcWebGL.**seriesWebGLBar**()

Constructs a new bar series renderer.

#### Properties

<a name="seriesBar_crossValue" href="#seriesBar_crossValue">#</a> *seriesBar*.**crossValue**(*accessorFunc*)  
<a name="seriesBar_mainValue" href="#seriesBar_mainValue">#</a> *seriesBar*.**mainValue**(*accessorFunc*)  
<a name="seriesBar_baseValue" href="#seriesBar_baseValue">#</a> *seriesBar*.**baseValue**(*accessorFunc*)  

If *accessorFunc* is specified, sets the accessor to the specified function and returns this series. If *accessorFunc* is not specified, returns the current accessor. The `accessorFunc(datum, index)` function is called on each item of the data, returning the relevant value for the given accessor. The respective scale is applied to the value returned by the accessor before rendering.

<a name="seriesBar_orient" href="#seriesBar_orient">#</a> *seriesBar*.**orient**(*orientation*)

If *orientation* is specified, sets the orientation and returns this series. If *orientation* is not specified, returns the current orientation. The orientation value should be either `horizontal` (default) or `vertical`.

<a name="seriesBar_xScale" href="#seriesBar_xScale">#</a> *seriesBar*.**xScale**(*scale*)  
<a name="seriesBar_yScale" href="#seriesBar_yScale">#</a> *seriesBar*.**yScale**(*scale*)

If *scale* is specified, sets the scale and returns this series. If *scale* is not specified, returns the current scale.

<a name="seriesBar_bandwidth" href="#seriesBar_bandwidth">#</a> *seriesBar*.**bandwidth**(*bandwidthFunc*)

If *bandwidthFunc* is specified, sets the bandwidth function and returns this series. If *bandwidthFunc* is not specified, returns the current bandwidth function.

<a name="seriesCanvasArea_context" href="#seriesCanvasArea_context">#</a> *seriesCanvasArea*.**context**(*ctx*)

If *ctx* is specified, sets the canvas context and returns this series. If *ctx* is not specified, returns the current context.

### Multi

![](screenshots/multi.png)

<a name="seriesWebGLMulti" href="#seriesWebGLMulti">#</a> fcWebGL.**seriesWebGLMulti**()

Constructs a new multi series renderer.

#### Properties

<a name="seriesMulti_series" href="#seriesMulti_series">#</a> *seriesMulti*.**series**(*seriesArray*)  

If *seriesArray* is specified, sets the array of series that this multi series should render and returns this series. If *seriesArray* is not specified, returns the current array of series.

<a name="seriesMulti_xScale" href="#seriesMulti_xScale">#</a> *seriesMulti*.**xScale**(*scale*)  
<a name="seriesMulti_yScale" href="#seriesMulti_yScale">#</a> *seriesMulti*.**yScale**(*scale*)

If *scale* is specified, sets the scale and returns this series. If *scale* is not specified, returns the current scale.

<a name="seriesMulti_mapping" href="#seriesMulti_mapping">#</a> *seriesMulti*.**mapping**(*mappingFunc*)

If *mappingFunc* is specified, sets the mapping function to the specified function, and returns this series. If *mappingFunc* is not specified, returns the current mapping function.

When rendering the multi-series, the mapping function is invoked once for each of the series supplied via the *series* property. The purpose of the mapping function is to return the data supplied to each of these series. The default mapping is the identity function, `(d) => d`, which results in each series being supplied with the same data as the multi-series component.

The mapping function is invoked with the data bound to the multi-series, (*data*), the index of the current series (*index*) and the array of series (*series*). A common pattern for the mapping function is to switch on the series type. For example, a multi-series could be used to render a line series together with an upper bound, indicated by a line annotation. In this case, the following would be a suitable mapping function:

```javascript
const multi = fcWebGL.seriesWebGLMulti()
    .series([line, annotation)
    .mapping((data, index, series) => {
      switch(series[index]) {
        case line:
          return data.line;
        case annotation:
          return data.upperBound;
      }
    });
```

<a name="seriesMulti_decorate" href="#seriesMulti_decorate">#</a> *seriesMulti*.**decorate**(*decorateFunc*)

If *decorateFunc* is specified, sets the decorator function to the specified function, and returns this series. If *decorateFunc* is not specified, returns the current decorator function.

The decorate function is invoked for each of the associated series.

<a name="seriesMulti_context" href="#seriesMulti_context">#</a> *seriesMulti*.**context**(*ctx*)

If *ctx* is specified, sets the canvas context and returns this series. If *ctx* is not specified, returns the current context.

### Repeat

![](screenshots/repeat.png)

<a name="seriesWebGLRepeat" href="#seriesWebGLRepeat">#</a> fcWebGL.**seriesWebGLRepeat**()

Constructs a new repeat series renderer.

The repeat series is very similar in function to the multi series, both are designed to render multiple series from the same bound data. The repeat series uses the same series type for each data series, e.g. multiple lines series, or multiple area series.

The repeat series expects the data to be presented as an array of arrays. The following example demonstrates how it can be used to render multiple line series:

```javascript
const data = [
  [1, 3, 4],
  [4, 5, 6]
];

const line = fcWebGL.seriesWebGLLine();

const repeatSeries = fcWebGL.seriesWebGLRepeat()
    .xScale(xScale)
    .yScale(yScale)
    .context(ctx)
    .series(line);

repeatSeries(data);
```

The repeat series also exposes an *orient* property which determines the 'orientation' of the series within the bound data. In the above example, setting orient to *horizontal* would result in the data being rendered as two series of three points (rather than three series of two points).

#### Properties

<a name="seriesRepeat_series" href="#seriesRepeat_series">#</a> *seriesRepeat*.**series**(*series*)  

If *series* is specified, sets the series that this repeat series should render and returns this series. If *series* is not specified, returns the current series.

<a name="seriesRepeat_orient" href="#seriesRepeat_orient">#</a> *seriesRepeat*.**orient**(*orientation*)  

If *orientation* is specified, sets the orientation and returns this series. If *orientation* is not specified, returns the current orientation. The orientation value should be either `vertical` (default) or `horizontal`.

<a name="seriesRepeat_xScale" href="#seriesRepeat_xScale">#</a> *seriesRepeat*.**xScale**(*scale*)  
<a name="seriesRepeat_yScale" href="#seriesRepeat_yScale">#</a> *seriesRepeat*.**yScale**(*scale*)  
<a name="seriesRepeat_decorate" href="#seriesRepeat_decorate">#</a> *seriesRepeat*.**decorate**(*decorateFunc*)  
<a name="seriesRepeat_context" href="#seriesRepeat_context">#</a> *seriesRepeat*.**context**(*ctx*)

Please refer to the multi series for the documentation of these properties.

### Grouped

![](screenshots/grouped.png)

<a name="seriesWebGLGrouped" href="#seriesWebGLGrouped">#</a> fcWebGL.**seriesWebGLGrouped**(*adaptedSeries*)

Constructs a new grouped series by adapting the given series. This allows the rendering of grouped bars.

The grouped series is responsible for applying a suitable offset, along the cross-axis, to create clustered groups of bars. The grouped series rebinds all of the properties of the adapted series.

The following example shows the construction of a grouped bar series, where the scales and value accessors are configured:

```javascript
var groupedBar = fcWebGL.seriesWebGLGrouped(fcWebGL.seriesWebGLBar())
    .xScale(x)
    .yScale(y)
    .crossValue(d => d[0])
    .mainValue(d => d[1]);
```

Rendering a grouped series requires a nested array of data, the default format expected by the grouped series expects each object in the array to have a `values` property with the nested data, however, this can be configured by the `values` accessor.

```javascript
[
  {
    "key": "Under 5 Years",
    "values": [
      { "x": "AL", "y": 310 },
      { "x": "AK", "y": 52 },
      { "x": "AZ", "y": 515 }
    ]
  },
  {
    "key": "5 to 13 Years",
    "values": [
      { "x": "AL", "y": 552 },
      { "x": "AK", "y": 85 },
      { "x": "AZ", "y": 828 }
    ]
  }
]
```

The `fc.group` component from the [d3fc-group](https://github.com/d3fc/d3fc/tree/master/packages/d3fc-group#d3fc-group) package gives an easy way to construct this data from CSV / TSV.

With the data in the correct format, the series is rendered just like the other series types:

```javascript
groupedWebGLBar(series);
```

#### Properties

<a name="grouped_bandwidth" href="#grouped_bandwidth">#</a> *grouped*.**bandwidth**(*bandwidthFunc*)  

If *bandwidthFunc* is specified, sets the bandwidth function and returns this series. If *bandwidthFunc* is not specified, returns the current bandwidth function.

<a name="grouped_subPadding" href="#grouped_subPadding">#</a> *grouped*.**subPadding**(*padding*)  

If *padding* is specified, sets the sub-padding to the specified value which must be in the range [0, 1]. If *padding* is not specified, returns the current sub-padding. The sub-padding value determines the padding between the bars within each group.

### Stacked

![](screenshots/stacked.png)

There is not an explicit series type for rendering stacked charts, it is a straightforward task to render stacked series with the existing components. This section illustrates this with a few examples.

The following code demonstrates how to render a stacked bar series to an SVG. Note that the axis configuration is omitted for clarity:

```javascript
var barSeries = fc.seriesWebGLBar()
    .xScale(x)
    .yScale(y)
    .crossValue(d => d.data.State)
    .mainValue(d => d[1])
    .baseValue(d => d[0])
    .context(ctx);

series.forEach(function(s, i) {
    barSeries
        .decorate(function(ctx) {
            ctx.fillStyle = color(i);
        })(s);
});
```

The [d3 stack](https://github.com/d3/d3-shape/blob/master/README.md#stack) component is used to stack the data obtained from the d3 CSV parser. The decorate pattern is used to set the color for each bar series.
