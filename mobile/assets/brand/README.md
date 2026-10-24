# Spotter approved identity

`spotter-approved-board.png` is the user-approved original concept 01: a single
cyan lifter beneath a barbell, paired with the white Spotter wordmark.
`spotter-approved-prompt.txt` records its built-in image generation prompt.

`../../scripts/generate-brand-assets.cjs` packages the upper primary lockup into
transparent PNGs, keeping the selected geometry and normalizing the flat colors
to cyan `#00F0FF`, white `#FFFFFF`, and near-black `#09090B`.
The light version is monochrome, matching the selected board's light application.

Generated files live in `../images/spotter/`. Render in-app logos through the shared
`SpotterLogo` component; do not stretch, crop, recolor, or add a background to the
transparent lockups. Native app icons use an opaque square background so the OS
can apply its own mask. Android adaptive foregrounds have extra safe-area padding.
