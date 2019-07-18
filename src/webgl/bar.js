import { rebindAll, exclude } from '@d3fc/d3fc-rebind';

import glBase from './glBase';
import colors from '../colors';
import glColor from './helper/glColor';
import alignOffset from '../alignOffset';

export default () => {
    const base = glBase();

    const bar = (data, helperAPI) => {
        base(data, helperAPI);
        const context = base.context();
        const glAPI = base.glAPI();

        const scales = glAPI.applyScales(base.xScale(), base.yScale());

        context.fillStyle = colors.darkGray;
        context.strokeStyle = 'transparent';
        base.decorate()(context, data, 0);

        const fillColor = glColor(context.fillStyle);
        const withLines = context.strokeStyle !== 'transparent';

        const filteredData = data.filter(base.defined());
        const projected = getProjectedData(filteredData, withLines, scales);

        glAPI.raw(projected.triangles, fillColor, context.TRIANGLES);

        if (projected.lines) {
            const strokeColor = withLines ? glColor(context.strokeStyle) : null;
            glAPI.raw(projected.lines, strokeColor, context.LINES);
        }
    };

    const getProjectedData = (data, withLines, scales) => {
        const pixel = scales.pixel;
        const cachedProjected = base.cached();
        if (cachedProjected && cachedProjected.pixel.x === pixel.x && (!withLines || cachedProjected.lines)) {
            return cachedProjected;
        }

        const crossFn = base.crossValue();
        const mainFn = base.mainValue();
        const baseFn = base.baseValue();
        const vertical = base.orient() === 'vertical';

        // 2 triangles per bar, with 3 x/y vertices per triangle
        const triangles = new Float32Array(data.length * 12);
        let triangleIndex = 0;

        const insertTriangle = (x1, y1, x2, y2, x3, y3) => {
            triangles[triangleIndex++] = x1;
            triangles[triangleIndex++] = y1;
            triangles[triangleIndex++] = x2;
            triangles[triangleIndex++] = y2;
            triangles[triangleIndex++] = x3;
            triangles[triangleIndex++] = y3;
        };

        // 3 lines per bar, with 2 x/y vertices per line
        const lines = withLines ? new Float32Array(data.length * 12) : null;
        let lineIndex = 0;

        const insertLine = (x1, y1, x2, y2) => {
            lines[lineIndex++] = x1;
            lines[lineIndex++] = y1;
            lines[lineIndex++] = x2;
            lines[lineIndex++] = y2;
        };

        const insertBar = (x1, y1, x2, y2, x3, y3, x4, y4) => {
            insertTriangle(x1, y1, x2, y2, x3, y3);
            insertTriangle(x3, y3, x4, y4, x1, y1);

            if (withLines) {
                insertLine(x1, y1, x2, y2);
                insertLine(x2, y2, x3, y3);
                insertLine(x3, y3, x4, y4);
            }
        };

        data.forEach((d, i) => {
            const width = bar.bandwidth()(d, i);
            const offset = alignOffset(bar.align(), width) - width / 2;

            if (vertical) {
                const y = scales.yScale(mainFn(d, i), i);
                const y0 = scales.yScale(baseFn(d, i), i);
                const xl = scales.xScale(crossFn(d, i), i) + offset * pixel.x;
                const xr = xl + width * pixel.x;

                insertBar(
                    xl, y0,
                    xl, y,
                    xr, y,
                    xr, y0
                );
            } else {
                const x = scales.xScale(mainFn(d, i), i);
                const x0 = scales.xScale(baseFn(d, i), i);
                const yu = scales.yScale(crossFn(d, i), i) + offset * pixel.y;
                const yd = yu + width * pixel.y;

                insertBar(
                    x0, yu,
                    x, yu,
                    x, yd,
                    x0, yd
                );
            }
        });

        const projectedData = {triangles, lines, pixel};
        base.cached(projectedData);
        return projectedData;
    };

    rebindAll(bar, base, exclude('glAPI', 'cached'));
    return bar;
};
