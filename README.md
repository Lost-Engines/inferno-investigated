# Inferno Investigated

[Explore Inferno Investigated](https://lost-engines.github.io/inferno-investigated/)

A guided look inside Digital Image Design’s 1994 space combat game, with interactive models, world maps, corridor paths and findings from the Lost Engines investigation.

Part of the [Lost Engines Project](https://lostengines.com/). See also [TFX Traced](https://lost-engines.github.io/tfx-traced/).

## Working on the site

With Node.js 22 or newer:

```sh
npm ci
npm run build
npm run check
npm run preview
```

The site builds from the selected display snapshot in `public/`. It does not require the game or the research repository. GitHub Actions builds and checks pull requests, and publishes `dist/` to GitHub Pages on pushes to `master`.

See [MAINTAINING.md](MAINTAINING.md) for snapshot updates and publication checks, and [RIGHTS.md](RIGHTS.md) for credits and scope.
