import {symbol, symbolCircle} from "d3";
import {rebindAll, exclude} from '@d3fc/d3fc-rebind';
import xyBase from '../xyBase';
import {colors, glColor} from '../colors';

export default () => {
    const base = xyBase();
    let size = 5;
    let type = symbolCircle;
    let typePoints = null;

    const point = (data) => {
        base();
      
        const context = base.context();
        const filteredData = data.filter(base.defined());
        const projectedData = filteredData.map(valueFn());

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

        const points = typePoints ? shapePoints(projectedData, pixel) : circlePoints(projectedData, pixel);

        if (strokeColor) {
          base.draw().edges(points, fillColor, strokeWidth, strokeColor);
        } else {
          base.draw().triangles(points, fillColor);
        }
        base.draw(null);
    };

    const shapePoints = (projectedData, pixel) => {
      const trianglesPerShape = (typePoints.length - 1);
      const points = new Float32Array(projectedData.length * trianglesPerShape * 6);
      let allPointsIndex = 0;
      projectedData.forEach((datum, i) => {
        const computedSize = Math.floor(Math.sqrt(datum.size) * 0.5);

        const x = datum.x;
        const y = datum.y;

        for(let n = 0; n < typePoints.length - 1; n++) {
          const p = allPointsIndex;
          
          points[p] = x;
          points[p + 1] = y;

          points[p + 2] = x + typePoints[n][0] * computedSize * pixel.x;
          points[p + 3] = y - typePoints[n][1] * computedSize * pixel.y;

          points[p + 4] = x + typePoints[n + 1][0] * computedSize * pixel.x;
          points[p + 5] = y - typePoints[n + 1][1] * computedSize * pixel.y;

          allPointsIndex += 6;
        }
      });

      return points;
    };

    const circlePoints = (projectedData, pixel) => {
      const sizes = Array(projectedData.length);
      let allPointsSize = 0;
      projectedData.forEach((datum, i) => {
        sizes[i] = Math.floor(Math.sqrt(datum.size) * 0.65);
        allPointsSize += sizes[i];
      });

      const points = new Float32Array(allPointsSize * 2 * 6);
      let allPointsIndex = 0;
      projectedData.forEach((datum, i) => {
          const computedSize = sizes[i];
          const x = datum.x;
          const y = datum.y;

          const getX = angle => x + Math.sin(angle) * computedSize * pixel.x;
          const getY = angle => y + Math.cos(angle) * computedSize * pixel.y;

          const num = 2 * computedSize;
          for(let n = 0; n < num; n++) {
            const a1 = 2 * n * Math.PI / num;
            const a2 = 2 * (n + 1) * Math.PI / num;

            const p = allPointsIndex;
            points[p] = x;
            points[p + 1] = y;
            points[p + 2] = getX(a1);
            points[p + 3] = getY(a1);
            points[p + 4] = getX(a2);
            points[p + 5] = getY(a2);
            allPointsIndex += 6;
          }
      });

      return points;
    };

    const valueFn = () => {
      const xScale = base.xScale().copy().range([-1, 1]);
      const yScale = base.yScale().copy().range([-1, 1]);
      const sizeFn = typeof size === 'function' ? size : () => size;

      if (base.orient() === 'vertical') {
        return (d, i) => ({
          x: xScale(base.crossValue()(d, i), i),
          y: yScale(base.mainValue()(d, i), i),
          size: sizeFn(d)
        });
      } else {
        return (d, i) => ({
          y: xScale(base.crossValue()(d, i), i),
          x: yScale(base.mainValue()(d, i), i),
          size: sizeFn(d)
        });
      }
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
      const shapePath = shapeSymbol.size(5)();
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
      return points;
  }
  return [];
}
