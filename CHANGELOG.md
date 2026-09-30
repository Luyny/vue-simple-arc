# Changelog

## 0.3.0 - 2026-09-30

### Added
- Server-side rendering draws the full arc in the HTML instead of an empty SVG.
- Smooth CSS transition when `value` changes (including from and back to `0`), configurable with the `--simple-arc-duration` and `--simple-arc-easing` CSS variables and disabled when the user prefers reduced motion.
- `trackThickness` prop (default `thickness / 5`).
- `trackColor` prop.
- Exported `SimpleArcProps` type.

### Changed
- The SVG is rendered declaratively from the template. It no longer has a `height` attribute: its height comes from the `viewBox` aspect ratio.
- Resizing redraws in the same frame instead of the next animation frame.

### Fixed
- A hidden container (width `0`) keeps the last valid size instead of breaking the arc.
- The full circle is drawn as two half arcs, so it no longer disappears in very small containers.

### Deprecated
- `secondColor`: use `trackColor`. It still works and logs a warning once in development.

## 0.2.0 - 2026-09-30

### Added
- `SimpleArc` named and default export. `SimpleArcComponent` stays as an alias.
- Accessibility: `role="progressbar"`, `aria-valuemin`, `aria-valuemax` and `aria-valuenow` on the root element.
- TypeScript declarations.

### Changed
- Published as a compiled build (ES and CJS) with zero runtime dependencies; `vue` is now a peer dependency (`^3.3.0`).
- The root element uses the `simple-arc` class instead of a fixed `id="container"`, so several instances on the same page no longer repeat ids.
- Default `secondColor` changed from `#00000033` to `#80808040`, visible on light and dark backgrounds.

### Fixed
- `value` is clamped to `0..1` and `NaN` is treated as `0`.
- At `0`, the progress line is no longer drawn as a dot.
- The arc is drawn on mount, without waiting for the first debounced resize (50 ms).
