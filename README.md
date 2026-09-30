# SimpleArc

Lightweight Vue 3 SVG arc / circle progress component. Responsive, accessible and with zero runtime dependencies (~1.5 kB gzip).

![vue-simple-arc demo: animated value, thickness, responsive width, dark mode and colors](https://raw.githubusercontent.com/Luyny/vue-simple-arc/master/docs/demo.gif)

## Installation
`npm i vue-simple-arc`

## Import
```js
import { SimpleArc } from 'vue-simple-arc';
// or: import SimpleArc from 'vue-simple-arc';
```

> `SimpleArcComponent` is still exported as an alias of `SimpleArc` for backward compatibility.

## Usage
```html
<SimpleArc
    :value="percentage"
    width="350px"
    :fullCircle="false"
    :thickness="8"
    color="#41b883"
    secondColor="#80808040"
    aria-label="Sales goal"
>
    <strong>{{ Math.round(percentage * 100) }}%</strong>
</SimpleArc>
```

## Props

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `value` | Number | yes | — | Progress between `0` and `1`. Values outside this range are clamped; `NaN` is treated as `0`. |
| `width` | String | no | `'100%'` | Any CSS width. The arc redraws when the container is resized. |
| `fullCircle` | Boolean | no | `false` | Draws a full circle instead of a half arc. |
| `thickness` | Number | no | `8` | Line thickness in px. The background line is `thickness / 5`. |
| `color` | String | no | `'#41b883'` | Color of the progress line. |
| `secondColor` | String | no | `'#80808040'` | Color of the background line. The default is visible on light and dark backgrounds. |

## Slot

The default slot is placed at the bottom center of the half arc, or at the center of the full circle. It inherits the parent's font size and color.

## Accessibility

The root element has `role="progressbar"`, `aria-valuemin="0"`, `aria-valuemax="100"` and `aria-valuenow` (the value as a percentage). Pass `aria-label` or `aria-labelledby` to describe what is being measured.
