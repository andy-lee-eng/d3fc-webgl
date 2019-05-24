import {rebindAll} from '@d3fc/d3fc-rebind';
import xyBase from '../xyBase';
import {colors, glColor} from '../colors';
import alignOffset from '../alignOffset';

export default () => {
    const base = xyBase();

    const bar = (data) => {
        base();
      
        const context = base.context();
        const filteredData = data.filter(base.defined());

        const xRange = base.xScale().range();
        const yRange = base.yScale().range();
        const pixel = {
            x: Math.abs(2 / (xRange[1] - xRange[0])),
            y: Math.abs(2 / (yRange[1] - yRange[0]))
        };

        const projectedData = filteredData.map(valueFn(pixel));

        context.fillStyle = colors.darkGray;
        context.strokeStyle = 'transparent';
        context.strokeWidth = 1;
        base.decorate()(context, data, 0);
        const fillColor = glColor(context.fillStyle);
        const strokeColor = context.strokeStyle != 'transparent' ? glColor(context.strokeStyle) : null;
        const strokeWidth = parseInt(context.strokeWidth);

        const vertices = Array(projectedData.length * 12);
        const lines = [];
        const transposer = base.getTransposer();

        projectedData.forEach((datum, i) => {
            const {x0, x1, y0, y1} = datum;

            const p = i * 12;
            vertices[p] = x0;
            vertices[p + 1] = y0;
            vertices[p + 2] = x1;
            vertices[p + 3] = y0;
            vertices[p + 4] = x0;
            vertices[p + 5] = y1;
            vertices[p + 6] = x0;
            vertices[p + 7] = y1;
            vertices[p + 8] = x1;
            vertices[p + 9] = y0;
            vertices[p + 10] = x1;
            vertices[p + 11] = y1;

            if (strokeColor) {
                if (base.orient() === 'vertical') {
                    lines.push([
                        x0, y0,
                        x0, y1,
                        x1, y1,
                        x1, y0,
                    ]);
                } else {
                    lines.push([
                        x0, y0,
                        x1, y0,
                        x1, y1,
                        x0, y1,
                    ]);
                }
            }
        });

        base.draw().triangles(vertices, fillColor);
        lines.forEach(line => {
            base.draw().line(line, [strokeWidth * pixel.x, strokeWidth * pixel.y], strokeColor);
        });
        base.draw(null);
    };

    const valueFn = (pixel) => {
        const xScale = base.xScale().copy().range([-1, 1]);
        const yScale = base.yScale().copy().range([-1, 1]);
  
        if (base.orient() === 'vertical') {
            return (d, i) => {
                const width = base.bandwidth()(d, i) * pixel.x;
                const offset = alignOffset(base.align(), width);
                const x = xScale(base.crossValue()(d, i), i);
                const y0 = yScale(base.baseValue()(d, i), i);
                const y1 = yScale(base.mainValue()(d, i), i);

                return {
                    x0: x - offset,
                    x1: x - offset + width,
                    y0,
                    y1
                };
            };
        } else {
            return (d, i) => {
                const height = base.bandwidth()(d, i) * pixel.y;
                const offset = alignOffset(base.align(), height);
                const x0 = yScale(base.baseValue()(d, i), i);
                const x1 = yScale(base.mainValue()(d, i), i);
                const y = xScale(base.crossValue()(d, i), i);

                return {
                    x0,
                    x1,
                    y0: y - offset,
                    y1: y - offset + height
                };
            };
        }
    };
  
    rebindAll(bar, base);
    return bar;
};
