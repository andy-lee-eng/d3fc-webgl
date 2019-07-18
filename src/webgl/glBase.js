import { rebindAll } from '@d3fc/d3fc-rebind';

import helper from './helper/api';
import xyBase from '../xyBase';

export default () => {
    const base = xyBase();

    let context = null;
    let cacheEnabled = false;

    let glAPI = null;
    let cached = null;

    const glBase = (data, helperAPI) => {
        base();
        glAPI = helperAPI || helper(context);
    };

    glBase.context = (...args) => {
        if (!args.length) {
            return context;
        }
        context = args[0];
        return glBase;
    };

    glBase.cacheEnabled = (...args) => {
        if (!args.length) {
            return cacheEnabled;
        }
        cacheEnabled = args[0];
        cached = null;
        return glBase;
    };

    glBase.cached = (...args) => {
        if (!args.length) {
            return cached;
        }
        cached = cacheEnabled ? args[0] : null;
        return glBase;
    };

    glBase.glAPI = () => glAPI;

    rebindAll(glBase, base);
    return glBase;
};
