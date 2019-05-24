import { rebindAll, exclude } from '@d3fc/d3fc-rebind';
import groupedBase from '../groupedBase';

export default function(series) {

    const base = groupedBase(series);

    const grouped = (data) => {
        data.forEach((seriesData, index) => {

            // create a composite scale that applies the required offset
            const isVertical = series.orient() !== 'horizontal';
            const baseScale = isVertical ? base.xScale() : base.yScale();
            const compositeScale = createCompositeScale(data, baseScale, index, baseScale.range());

            if (isVertical) {
                series.xScale(compositeScale);
                series.yScale(base.yScale());
            } else {
                series.yScale(compositeScale);
                series.xScale(base.xScale());
            }

            // if the sub-series has a bandwidth, set it
            if (series.bandwidth) {
                series.bandwidth(
                  (d, i) => base.bandwidth()(d, i) / data.length
                );
            }

            // adapt the decorate function to give each series the correct index
            series.decorate((c, d) => base.decorate()(c, d, index));
            series.draw(base.draw());
            series(seriesData);
        });

        base.draw(null);
    };

    const createCompositeScale = (data, baseScale, index, range) => {
        const compositeScale = (d, i) => {
            const offset = base.offsetScaleForDatum(data, d, i, range[1] - range[0]);

            console.log(index, offset(index), baseScale(d) +
            offset(index) +
            offset.bandwidth() / 2);

            return baseScale(d) +
              offset(index) +
              offset.bandwidth() / 2;
        };

        compositeScale.copy = () => createCompositeScale(data, baseScale.copy(), index, range);
        compositeScale.range = (...args) => {
            if (!args.length) {
                return baseScale.range();
            }
            baseScale.range(...args);
            return compositeScale;
        };

        return compositeScale;
    };

    rebindAll(grouped, series, exclude('decorate', 'xScale', 'yScale'));
    rebindAll(grouped, base, exclude('offsetScaleForDatum', 'context'));

    return grouped;
}
