import {rebindAll, exclude} from '@d3fc/d3fc-rebind';
import xyBase from '../xyBase';
import {colors, glColor} from '../colors';

export default () => {
    const base = xyBase();

    const area = (data) => {
        base();
      
        const context = base.context();
        const filteredData = data.filter(base.defined());
        const projectedData = filteredData.map(base.valueFn());

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

        const vertices = [];
        const linePoints = [];

        projectedData.forEach((datum, i) => {
            const points = [
                    datum.x, datum.y0,
                    datum.x, datum.y
              ];

            vertices.push(...base.transposer(points));

            if (i < projectedData.length - 1) {
              const next = projectedData[i + 1];
              const dh = datum.y - datum.y0;
              const nh = next.y - next.y0;
              if ((nh < 0) !== (dh < 0)) {
                // Insert a mid-point at the cross-over
                const dx = next.x - datum.x;
                const x = datum.x + (dx * Math.abs(dh)) / (Math.abs(dh) + Math.abs(nh));
                const extra = [
                      x, datum.y0,
                      x, datum.y0,
                  ];
                vertices.push(...base.transposer(extra));
              }
            }

            if (strokeColor) {
              linePoints.push(datum.x, datum.y);
            }
        });

        base.draw().triangleStrip(vertices, fillColor);
        if (strokeColor) {
          base.draw().line(base.transposer(linePoints), [strokeWidth * pixel.x, strokeWidth * pixel.y], strokeColor);
        }
        base.draw(null);
    };

    rebindAll(area, base, exclude('bandwidth', 'align'));
    return area;
};
