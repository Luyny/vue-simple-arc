# Changelog

## 0.3.0

### Added
- Server-side rendering draws the full arc in the HTML instead of an empty SVG.
- Smooth CSS transition when `value` changes (including from and back to `0`), configurable with the `--simple-arc-duration` and `--simple-arc-easing` CSS variables and disabled when the user prefers reduced motion.
- `trackThickness` prop (default `thickness / 5`).
- `trackColor` prop.
- Exported `SimpleArcProps` type.

### Changed
- The SVG is rendered declaratively from the template and sized by its `viewBox`.
- A hidden container (width `0`) keeps the last valid size instead of breaking the arc.
- The full circle is drawn as two half arcs, so it no longer disappears in very small containers.

### Deprecated
- `secondColor`: use `trackColor`. It still works and logs a warning once.

## 0.2.0

- `value` is clamped to `0..1` and `NaN` is treated as `0`.
- Accessibility attributes (`role="progressbar"`, `aria-value*`).
- Fixed track visibility in dark mode.
