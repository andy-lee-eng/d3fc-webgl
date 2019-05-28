import {symbol, symbolCircle} from "d3-shape";
import {rebindAll, exclude} from '@d3fc/d3fc-rebind';
import xyBase from '../xyBase';
import {colors, glColor} from '../colors';

import {circles, shapes} from 'd3fc-webgl-proc';

export default () => {
    const base = xyBase();
    let size = 5;
    let type = symbolCircle;
    let typePoints = null;

    const point = (data) => {
        base();

        const context = base.context();
        const filteredData = data.filter(base.defined());

        const xRange = base.xScale().range();
        const yRange = base.yScale().range();
        const pixel = {
            x: Math.abs(2 / (xRange[1] - xRange[0])),
            y: Math.abs(2 / (yRange[1] - yRange[0]))
        };

        context.fillStyle = colors.darkGray;
        context.strokeStyle = 'transparent';
        context.strokeWidth = 1;
        base.decorate()(context, data, 0);
        const fillColor = glColor(context.fillStyle);
        const strokeColor = context.strokeStyle != 'transparent' ? glColor(context.strokeStyle) : null;
        const strokeWidth = parseInt(context.strokeWidth);

        const drawPoints = points => {
          if (strokeColor) {
            base.draw().edges(points, fillColor, strokeWidth, strokeColor);
          } else {
            base.draw().triangles(points, fillColor);
          }
        };

        if (typePoints) {
          shapePointsWA(filteredData, pixel, drawPoints);
        } else {
          circlePointsWA(filteredData, pixel, drawPoints);
        }

        base.draw(null);
    };

    const shapePointsWA = (filteredData, pixel, drawPoints) => {
      const projectedData = getProjectedData(filteredData, false);

      shapes()
        .pixelX(pixel.x)
        .pixelY(pixel.y)
        .shape(typePoints)
        .callback(drawPoints)
        (projectedData.data);
    };

    const circlePointsWA = (filteredData, pixel, drawPoints) => {
      const projectedData = getProjectedData(filteredData, true);

      circles()
        .pixelX(pixel.x)
        .pixelY(pixel.y)
        .callback(drawPoints)
        (projectedData.data,  projectedData.segmentCount);
    };

    const getProjectedData = (data, includeSegmentCount = false) => {
      const xScale = base.xScale().copy().range([-1, 1]);
      const yScale = base.yScale().copy().range([-1, 1]);
      const sizeFn = typeof size === 'function' ? size : () => size;

      const dataPerPoint = includeSegmentCount ? 4 : 3;
      const result = new Float32Array(data.length * dataPerPoint);
      let allSegments = 0;
      let index = 0;
      const vertical = base.orient() === 'vertical';

      data.forEach(d => {
        if (vertical) {
          result[index++] = xScale(base.crossValue()(d, i), i);
          result[index++] = yScale(base.mainValue()(d, i), i);
        } else {
          result[index++] = yScale(base.mainValue()(d, i), i);
          result[index++] = xScale(base.crossValue()(d, i), i);
        }

        const size = Math.floor(Math.sqrt(sizeFn(d)) * 0.65);
        result[index++] = size;
        if (includeSegmentCount) {
          const segments = size * 2;
          result[index++] = segments;
          allSegments += segments;
        }
      });

      return {
        data: result,
        segmentCount: allSegments
      };
    };

    point.size = (...args) => {
      if (!args.length) {
          return size;
      }
      size = args[0];
      return point;
    };

    point.type = (...args) => {
      if (!args.length) {
          return type;
      }
      type = args[0];
      if (type == symbolCircle) {
        typePoints = null;
      } else {
        typePoints = shapeToPoints(type);
      }
      return point;
    };

    rebindAll(point, base, exclude('baseValue', 'bandwidth', 'align'));
    return point;
};

function shapeToPoints(d3Shape) {
  if (d3Shape) {
      const shapeSymbol = symbol().type(d3Shape);
      const shapePath = shapeSymbol.size(3)();
      const points = shapePath
          .substring(1, shapePath.length - 1)
          .split("L")
          .map(p => p.split(",").map(c => parseFloat(c)));

      if (points.length === 1) {
          // Square
          const l = -points[0][0];
          points.push([l, -l]);
          points.push([l, l]);
          points.push([-l, l]);
      }

      points.push(points[0]);
      return points.reduce((acc, val) => acc.concat(val), []);
  }
  return [];
}
