import { rebindAll, exclude } from '@d3fc/d3fc-rebind';

import glBase from './glBase';
import colors from '../colors';
import glColor from './helper/glColor';

export default () => {
    const base = glBase();

    const line = (data, helperAPI) => {
        base(data, helperAPI);
        const context = base.context();
        const glAPI = base.glAPI();

        const scales = glAPI.applyScales(base.xScale(), base.yScale());

        context.strokeStyle = colors.black;
        context.lineWidth = 1;
        base.decorate()(context, data, 0);

        // Get triangle strip representing the projected data
        const lineWidth = parseInt(context.lineWidth);
        const strokeColor = glColor(context.strokeStyle);

        const projected = (data.constructor === Float32Array)
                ? rawFloat32Data(data) : getProjectedData(data, scales);

        if (lineWidth < 1.1) {
            // Draw straight to WebGL as line strips
            projected.batches.forEach(batch => {
                glAPI.raw(projected.points, strokeColor, context.LINE_STRIP, batch.offset, batch.count);
            });
        } else {
            // Convert to a triangle strip
            projected.batches.forEach(batch => {
                const projectedTriangles = getProjectedTriangles(projected.points, batch.offset, batch.count, scales, lineWidth);
                glAPI.raw(projectedTriangles, strokeColor, context.TRIANGLE_STRIP);
            });
        }
    };

    const rawFloat32Data = data => {
        return {
            points: data,
            batches: [{ offset: 0, count: data.length / 2 }]
        };
    };

    const getBatches = data => {
        if (data.constructor === Float32Array) {
            return [{ offset: 0, count: data.length / 2 }];
        }

        // Check the `defined` function for missing entries, and
        // break the line into segments for drawing
        const batches = [];
        let offset = 0;

        const pushBatch = (index) => {
            if (index > offset) {
                batches.push({offset, count: index - offset});
            }
            offset = index + 1;
        };

        data.forEach((d, i) => {
            if (!line.defined()(d, i)) {
                pushBatch(i);
            }
        });
        pushBatch(data.length);
        return batches;
    };

    const getProjectedData = (data, scales) => {
        const cachedProjected = base.cached();
        if (cachedProjected) {
            return cachedProjected;
        }

        const crossFn = base.crossValue();
        const mainFn = base.mainValue();
        const vertical = base.orient() === 'vertical';

        const points = new Float32Array(data.length * 2);
        let index = 0;

        if (vertical) {
            data.forEach((d, i) => {
                points[index++] = scales.xScale(crossFn(d, i), i);
                points[index++] = scales.yScale(mainFn(d, i), i);
            });
        } else {
            data.forEach((d, i) => {
                points[index++] = scales.xScale(mainFn(d, i), i);
                points[index++] = scales.yScale(crossFn(d, i), i);
            });
        }

        const batches = getBatches(data);

        const projected = {points, batches};
        base.cached(projected);
        return projected;
    };

    const getProjectedTriangles = (points, offset, count, scales, lineWidth) => {
        // Two vertices for each data point
        const pixel = scales.pixel;
        const result = new Float32Array(count * 4);

        // Split points based on normals
        let target = 0;
        const factor = 0.5 * lineWidth;

        const start = offset * 2;
        const end = start + count * 2;
        for (let index = start; index < end; index += 2) {
            const normal = getNormal(points, start, end, index, pixel);
            const normalPixels = [normal[0] * pixel.x * factor, normal[1] * pixel.y * factor];

            // Apply to the pair of points
            result[target++] = points[index] + normalPixels[0];
            result[target++] = points[index + 1] + normalPixels[1];
            result[target++] = points[index] - normalPixels[0];
            result[target++] = points[index + 1] - normalPixels[1];
        }

        return result;
    };

    const normaliseVector = (vector) => {
        const length = Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1]);
        return [vector[0] / length, vector[1] / length];
    };
    const lineNormal = (p1, p2) => normaliseVector([(p2[1] - p1[1]), -(p2[0] - p1[0])]);

    const getNormal = (points, start, end, index, pixel) => {
        let lastPoint = index > start && [points[index - 2] / pixel.x, points[index - 1] / pixel.y];
        let thisPoint = [points[index] / pixel.x, points[index + 1] / pixel.y];
        let nextPoint = index < end - 2 && [points[index + 2] / pixel.x, points[index + 3] / pixel.y];

        if (!lastPoint) {
            // Beginning of line
            return lineNormal(thisPoint, nextPoint);
        } else if (!nextPoint) {
            // End of line
            return lineNormal(lastPoint, thisPoint);
        }

        // Calculate the miter join
        const l1 = normaliseVector([thisPoint[0] - lastPoint[0], thisPoint[1] - lastPoint[1]]);
        const l2 = normaliseVector([nextPoint[0] - thisPoint[0], nextPoint[1] - thisPoint[1]]);

        const tangent = normaliseVector([l1[0] + l2[0], l1[1] + l2[1]]);
        const miter = [-tangent[1], tangent[0]];

        // Get length using dot product of the miter with one of the normals
        const normal1 = lineNormal(lastPoint, thisPoint);
        const length = 1 / (miter[0] * normal1[0] + miter[1] * normal1[1]);

        return [miter[0] * length, miter[1] * length];
    };

    rebindAll(line, base, exclude('glAPI', 'cached', 'baseValue', 'bandwidth', 'align'));
    return line;
};
