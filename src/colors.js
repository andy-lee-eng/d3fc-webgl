import {color} from 'd3-color';

const red = '#c60';
const green = '#6c0';
const black = '#000';
const gray = '#ddd';
const darkGray = '#999';

export const colors = {
    red,
    green,
    black,
    gray,
    darkGray
};

const toGl = v => v / 255;
export const glColor = value => {
    const c = color(value);
    return [toGl(c.r), toGl(c.g), toGl(c.b), Math.sqrt(c.opacity)];
};

