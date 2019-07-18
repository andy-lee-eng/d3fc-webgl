import { rebindAll, exclude } from '@d3fc/d3fc-rebind';

import glBase from './glBase';
import colors from '../colors';
import glColor from './helper/glColor';

export default () => {
    const base = glBase();

    const area = (data, helperAPI) => {
        base(data, helperAPI);
        const context = base.context();
        const glAPI = base.glAPI();

        const scales = glAPI.applyScales(base.xScale(), base.yScale());

        context.fillStyle = colors.gray;
        context.strokeStyle = 'transparent';
        base.decorate()(context, data, 0);

        const fillColor = glColor(context.fillStyle);
        const withLines = context.strokeStyle !== 'transparent';

        const projected = getProjectedData(data, withLines, scales);

        projected.batches.area.forEach(batch => {
            glAPI.raw(projected.triangles, fillColor, context.TRIANGLE_STRIP, batch.offset, batch.count);
        });

        if (projected.lines) {
            const strokeColor = withLines ? glColor(context.strokeStyle) : null;

            projected.batches.line.forEach(batch => {
                glAPI.raw(projected.lines, strokeColor, context.LINE_STRIP, batch.offset, batch.count);
            });
        }
    };

    const getProjectedData = (data, withLines, scales) => {
        const cachedProjected = base.cached();
        if (cachedProjected && (!withLines || cachedProjected.lines)) {
            return cachedProjected;
        }

        const crossFn = base.crossValue();
        const mainFn = base.mainValue();
        const baseFn = base.baseValue();
        const vertical = base.orient() === 'vertical';

        // 2 triangles per data point, but as a triangle-strip,
        // so only 2 vertices per data point
        const dataPoints = new Float32Array(data.length * 4);
        let index = 0;

        const lines = withLines ? new Float32Array(data.length * 2) : null;
        let lineIndex = 0;
        let crossoverCount = 0;

        const areaBatches = { offset: 0, batches: [] };
        const lineBatches = { offset: 0, batches: [] };

        // "Batches" keep track of where we have to not-render points because
        // the are not "defined"
        const pushBatch = (batchSet, index) => {
            if (index > batchSet.offset) {
                batchSet.batches.push({offset: batchSet.offset, count: index - batchSet.offset});
            }
            batchSet.offset = index;
        };
        const pushBatches = () => {
            pushBatch(areaBatches, index / 2 + crossoverCount * 2);
            pushBatch(lineBatches, lineIndex / 2);
        };

        let lastPositive;
        data.forEach((d, i) => {
            if (area.defined()(d, i)) {
                let p;
                if (vertical) {
                    p = {
                        x: scales.xScale(crossFn(d, i), i),
                        y: scales.yScale(mainFn(d, i), i),
                        y0: scales.yScale(baseFn(d, i), i)
                    };
                    p.x0 = p.x;

                    p.positive = (p.y - p.y0) && (p.y - p.y0) > 0;
                } else {
                    p = {
                        x: scales.xScale(mainFn(d, i), i),
                        y: scales.yScale(crossFn(d, i), i),
                        x0: scales.xScale(baseFn(d, i), i)
                    };
                    p.y0 = p.y;

                    p.positive = (p.x - p.x0) !== 0 && (p.x - p.x0) > 0;
                }

                dataPoints[index++] = p.x;
                dataPoints[index++] = p.y;
                dataPoints[index++] = p.x0;
                dataPoints[index++] = p.y0;

                if (withLines) {
                    lines[lineIndex++] = p.x;
                    lines[lineIndex++] = p.y;
                }

                if (lastPositive !== undefined && p.positive !== undefined && p.positive !== lastPositive) {
                    // If we swapped from positive to negative (or vice versa), we need to
                    // add a cross-over points (unless one of them was not "defined")
                    crossoverCount++;
                }
                lastPositive = p.positive;
            } else {
                pushBatches();
                lastPositive = undefined;
            }
        });
        pushBatches();

        // If we have any cross-over points to add, insert them now
        const triangles = crossoverCount > 0
                ? insertCrossovers(data, dataPoints, crossoverCount)
                : dataPoints;

        const batches = {
            area: areaBatches.batches,
            line: lineBatches.batches
        };
        const projectedData = {triangles, lines, batches};
        base.cached(projectedData);
        return projectedData;
    };

    const insertCrossovers = (data, dataPoints, crossoverCount) => {
        // We need to insert two extra vertices for each crossover
        const triangles = new Float32Array(dataPoints.length + crossoverCount * 4);
        let index = 0;
        let triangleIndex = 0;

        const vertical = base.orient() === 'vertical';
        let last = null;

        data.forEach((d, i) => {
            if (area.defined()(d, i)) {
                const x = dataPoints[index++];
                const y = dataPoints[index++];
                const x0 = dataPoints[index++];
                const y0 = dataPoints[index++];

                const positive = vertical ? (y - y0) > 0 : (x - x0) > 0;
                if (last && positive !== last.positive) {
                    // Insert the extra one at the crossover
                    let r;
                    if (vertical) {
                        r = Math.abs(last.y - last.y0) / (Math.abs(y - y0) + Math.abs(last.y - last.y0));
                    } else {
                        r = Math.abs(last.x - last.x0) / (Math.abs(x - x0) + Math.abs(last.x - last.x0));
                    }
                    const midx = last.x + r * (x - last.x);
                    const midy = last.y + r * (y - last.y);

                    // Add the same point twice to skip rendering an unwanted triangle
                    triangles[triangleIndex++] = midx;
                    triangles[triangleIndex++] = midy;
                    triangles[triangleIndex++] = midx;
                    triangles[triangleIndex++] = midy;
                }

                last = {positive, x, y, x0, y0};

                triangles[triangleIndex++] = x;
                triangles[triangleIndex++] = y;
                triangles[triangleIndex++] = x0;
                triangles[triangleIndex++] = y0;
            } else {
                last = null;
            }
        });

        return triangles;
    };

    rebindAll(area, base, exclude('glAPI', 'cached', 'bandwidth', 'align'));
    return area;
};
