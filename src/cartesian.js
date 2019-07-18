import {select} from 'd3-selection';
import {chartCartesian} from '@d3fc/d3fc-chart';
import {rebindAll} from '@d3fc/d3fc-rebind';

export default (xScale, yScale) => {
  const base = chartCartesian(xScale, yScale);
  const chart = (selection) => {
    const result = base(selection);

    selection.select('d3fc-canvas.plot-area')
      .on('draw', (d, i, nodes) => {
            const canvas = select(nodes[i])
                .select('canvas')
                .node();
            const series = base.canvasPlotArea();

            series.context(canvas.getContext('webgl'))
                .xScale(xScale)
                .yScale(yScale);
            series(d);
      });

    return result;
  }
  rebindAll(chart, base);
  return chart;
};
