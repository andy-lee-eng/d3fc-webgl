import setupGL from './webgl/setup';

export default (initialValues) => {
  let context = null;
  let draw = null;

  const env = Object.assign({}, initialValues);
  const base = () => {
    if (!draw) {
      draw = setupGL(context);
      draw();
    }
  };

  Object.keys(env).forEach(key => {
      base[key] = (...args) => {
          if (!args.length) {
              return env[key];
          }
          env[key] = args[0];
          return base;
      };
  });

  base.context = (...args) => {
    if (!args.length) {
        return context;
    }
    context = args[0];
    return base;
  };
  base.draw = (...args) => {
    if (!args.length) {
        return draw;
    }
    draw = args[0];
    return base;
  };
  base.contextType = () => 'webgl';

  return base;
};
