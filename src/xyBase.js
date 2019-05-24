import { scaleIdentity } from 'd3-scale';
import functor from './functor';
import defined from './defined';
import createBase from './base';

export default () => {

    let baseValue = () => 0;
    let crossValue = d => d.x;
    let mainValue = d => d.y;
    let align = 'center';
    let bandwidth = () => 5;
    let orient = 'vertical';

    const base = createBase({
        decorate: () => {},
        defined: (d, i) => defined(baseValue, crossValue, mainValue)(d, i),
        xScale: scaleIdentity(),
        yScale: scaleIdentity()
    });

    base.getTransposer = () => {
        if (base.orient() !== 'vertical') {
            return points => {
                const transposed = new points.constructor(points.length);
                for(let n = 0; n < points.length; n += 2) {
                    transposed[n] = points[n + 1];
                    transposed[n + 1] = points[n];
                }
                console.log(transposed);
                return transposed;
            };
        }
        return points => points;
    };

    base.transposer = (points) => {
        return base.getTransposer()(points);
    };

    base.valueFn = () => {
        const xScale = base.xScale().copy().range([-1, 1]);
        const yScale = base.yScale().copy().range([-1, 1]);
    
        return (d, i) => {
            if (orient === 'vertical') {
                const y = yScale(mainValue(d, i), i);
                const y0 = yScale(baseValue(d, i), i);
                const x = xScale(crossValue(d, i), i);
                return {
                    d,
                    x,
                    y,
                    y0
                };
            } else {
                const y = xScale(mainValue(d, i), i);
                const y0 = xScale(baseValue(d, i), i);
                const x = yScale(crossValue(d, i), i);
                return {
                    d,
                    x,
                    y,
                    y0
                };
            }
        };
    };

    base.baseValue = (...args) => {
        if (!args.length) {
            return baseValue;
        }
        baseValue = functor(args[0]);
        return base;
    };
    base.crossValue = (...args) => {
        if (!args.length) {
            return crossValue;
        }
        crossValue = functor(args[0]);
        return base;
    };
    base.mainValue = (...args) => {
        if (!args.length) {
            return mainValue;
        }
        mainValue = functor(args[0]);
        return base;
    };
    base.bandwidth = (...args) => {
        if (!args.length) {
            return bandwidth;
        }
        bandwidth = functor(args[0]);
        return base;
    };
    base.align = (...args) => {
        if (!args.length) {
            return align;
        }
        align = args[0];
        return base;
    };
    base.orient = (...args) => {
        if (!args.length) {
            return orient;
        }
        orient = args[0];
        return base;
    };

    return base;
};
