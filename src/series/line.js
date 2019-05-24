import {rebindAll, exclude} from '@d3fc/d3fc-rebind';
import xyBase from '../xyBase';
import {colors, glColor} from '../colors';

export default () => {
    const base = xyBase();

    const line = (data) => {
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

        context.strokeStyle = colors.darkGray;
        context.strokeWidth = 1;
        base.decorate()(context, data, 0);
        const strokeColor = context.strokeStyle != 'transparent' ? glColor(context.strokeStyle) : null;
        const strokeWidth = parseInt(context.strokeWidth);

        const vertices = new Float32Array(projectedData.length * 2);

        projectedData.forEach((datum, i) => {
            const p = i * 2;
            vertices[p] = datum.x;
            vertices[p + 1] = datum.y;
        });

        base.draw().line(vertices, [strokeWidth * pixel.x, strokeWidth * pixel.y], strokeColor);
        base.draw(null);
    };

    const valueFn = () => {
        const xScale = base.xScale().copy().range([-1, 1]);
        const yScale = base.yScale().copy().range([-1, 1]);

        if (base.orient() === 'vertical') {
            return (d, i) => ({
                x: xScale(base.crossValue()(d, i), i),
                y: yScale(base.mainValue()(d, i), i)
            });
        } else {
            return (d, i) => ({
                y: xScale(base.crossValue()(d, i), i),
                x: yScale(base.mainValue()(d, i), i)
            });
        }
    };

    rebindAll(line, base, exclude('baseValue', 'bandwidth', 'align'));
    return line;
};
