import {rebindAll} from '@d3fc/d3fc-rebind';
import multiBase from '../multiBase';

export default () => {

    const base = multiBase();

    const multi = (data) => {
        base();
        const context = base.context();
        const mapping = base.mapping();
        const series = base.series();
        const xScale = base.xScale();
        const yScale = base.yScale();

        series.forEach((dataSeries, index) => {
            const seriesData = mapping(data, index, series);
            dataSeries.context(context)
                .xScale(xScale)
                .yScale(yScale);

            let adaptedDecorate;
            if (dataSeries.decorate) {
                adaptedDecorate = dataSeries.decorate();
                dataSeries.decorate((c, d, i) => {
                    base.decorate()(c, data, index);
                    adaptedDecorate(c, d, i);
                });
            } else {
                base.decorate()(context, data, index);
            }

            dataSeries.draw(base.draw());
            dataSeries(seriesData);

            if (adaptedDecorate) {
                dataSeries.decorate(adaptedDecorate);
            }
        });

        base.draw(null);
    };

    rebindAll(multi, base);

    return multi;
};
