# Maintaining the public overview

Builds copy only `public/` and explicitly generated pages to `dist/`. Never deploy the research tree. In particular, installs, media, original archives, executables, ROMs and full audio collections must remain outside this repository.

`npm run import` optionally refreshes the allowlisted display data from the adjacent `inferno-reverse/analysis`. It strips source paths, mission scripts and scenery bytecode that the exhibits do not need. Review the diff and `content/data-provenance.json`, then run the build, checks and browser checks. The import is never run by CI.

Public-facing viewer adapters belong in `src/` or in the explicit transformations in the import script. Captions must distinguish an inspection view from an original game frame. Do not describe the C++ reconstruction as complete while the rendering and continuous-session checks remain open.

Illustration and short audition sources are recorded in `content/exhibits.json`. These are individual selections, not directory imports. Keep the rights notice with them. New audio should remain a short excerpt.

The static check rejects original game-file extensions, download controls, local research paths, em dashes, missing local links and unexpected large files. Browser checks exercise model selection and animation, map movement and corridor selection at desktop and mobile widths. GitHub Pages serves the artifact built from this repository alone.
