# SimpleArc

Lightweight Vue 3 SVG arc / circle progress component. Animated, responsive, accessible, SSR-ready and with zero runtime dependencies (~1.6 kB gzip).

![vue-simple-arc demo: animated value, thickness, custom track, responsive width, dark mode and colors](https://raw.githubusercontent.com/Luyny/vue-simple-arc/master/docs/demo.gif)

## Installation
`npm i vue-simple-arc`

## Import
```js
import { SimpleArc } from 'vue-simple-arc';
// or: import SimpleArc from 'vue-simple-arc';
```

### TypeScript

The props type is exported:

```ts
import type { SimpleArcProps } from 'vue-simple-arc';
```

## Usage
```html
<SimpleArc
    :value="percentage"
    width="350px"
    :fullCircle="false"
    :thickness="8"
    color="#41b883"
    trackColor="#80808040"
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
| `thickness` | Number | no | `8` | Progress line thickness in px. |
| `trackThickness` | Number | no | `thickness / 5` | Background line (track) thickness in px. |
| `color` | String | no | `'#41b883'` | Color of the progress line. |
| `trackColor` | String | no | `'#80808040'` | Color of the background line. The default is visible on light and dark backgrounds. |

## Slot

The default slot is placed at the bottom center of the half arc, or at the center of the full circle. It inherits the parent's font size and color.

## Animation

Value changes animate with a CSS transition on the progress line. Customize it with CSS variables on the component or any ancestor:

| Variable | Default | Description |
|---|---|---|
| `--simple-arc-duration` | `0.4s` | Transition duration. Use `0s` to disable it. |
| `--simple-arc-easing` | `ease` | Transition timing function. |

```css
.my-gauge { --simple-arc-duration: 1s; --simple-arc-easing: cubic-bezier(.2, .8, .2, 1); }
```

The animation is turned off automatically when the user prefers reduced motion. Resizing never triggers it.

## SSR / Nuxt

The arc is fully rendered on the server, so there is no empty SVG waiting for hydration. Before the component is mounted it draws with a 200px reference width and scales it to the container: in larger containers the line looks proportionally thicker, and the height can shift by a few pixels (proportional to `thickness`) once hydration measures the real width.

## Accessibility

The root element has `role="progressbar"`, `aria-valuemin="0"`, `aria-valuemax="100"` and `aria-valuenow` (the value as a percentage). Pass `aria-label` or `aria-labelledby` to describe what is being measured.

## Changelog

See [CHANGELOG.md](https://github.com/Luyny/vue-simple-arc/blob/master/CHANGELOG.md).
