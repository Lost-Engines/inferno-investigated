## From fighter jets to alien worlds

Inferno is Digital Image Design’s 1994 science-fiction combat flight game, published by Ocean. It takes the studio’s experience with flight simulation into a war fought across planetary surfaces, space and enclosed bases. Angular spacecraft share the screen with painted cockpits, strange creatures and an exuberantly sinister soundtrack.

We came to it through [TFX](https://lost-engines.github.io/tfx-traced/), DID’s earlier military flight simulator. That investigation had already turned up Inferno material on TFX CDs. The family resemblance was visible in the files as well as the pictures: the games share archive conventions, model drawing commands and much of their sound machinery.

That gave us a useful head start. It also gave us a question worth following: how did an engine built around aircraft and terrain become a game that lets a craft travel into an alien installation?

<figure><img class="pixel" src="../images/laboratory.png" alt="An ominous laboratory with a craft suspended over a circular platform" loading="lazy" width="320" height="200"><figcaption>One of Inferno’s original paintings. The presentation mixes this artwork with animated sequences and real-time 3D.</figcaption></figure>

## Which Inferno?

Our first job was to establish what we actually had. Old game collections contain complete editions, repacks, partial installs and damaged files, often under names that tell us little about their origin.

We compared the installed files and read the release strings from the programs themselves. Four working editions emerged: the English retail CD, two playable demos and a loose floppy-style installation. There was also an earlier cinematic preview, separate from those playable demos.

| Edition | Embedded release |
| --- | --- |
| English retail CD | 1.58 |
| German playable demo | 1.82 |
| English playable demo | 1.89 |
| Loose floppy-style installation | 1.104 |

The numbering is initially counterintuitive. The evidence points to the part after the dot being a revision counter: 104 comes after 58. Dates inside the supporting programs agree with that order. We cannot reconstruct every branch of the original development history from these packages, but the CD is clearly not the newest engine we have found.

We chose the CD as our reference because it is a complete, reproducible source with its original installer and seventeen audio tracks. Later builds remain valuable comparisons. All four intact archives contain identical copies of the 1,691 model programs and all 51 native music resources.

Even a byte difference can be misleading. Some presentation files contain saved memory addresses and unused buffer contents. Of 265 changed presentation files shared by the CD and floppy-style edition, 212 retain the same meaningful content once those fields are accounted for. Counting changed files alone would exaggerate how much had been revised.

## Models that carry their own behaviour

A model in Inferno is more than a list of triangles. Its drawing commands can choose a level of detail, test which way a surface faces, change colours, move vertices and branch on values supplied by the game. Parts of an animation can live inside the model itself.

That is why a conventional model export only tells part of the story. A ship at one moment may conceal damage effects or moving machinery that appear at another. A little motion in a handful of vertices can make something feel much less mechanical.

Our [model viewer](../models/) lets us turn those controls by hand. Start with the model named epicship, then try a frigate or one of the Rexxon creatures. Where a model accepts animation states, move the slider or play through them. The playback speed is a viewing control; it does not imply that every animation ran at that speed in the game.

<figure><a href="../models/#epicship"><img src="../images/models.jpg" alt="The epicship model shown from an oblique angle in the interactive viewer" loading="lazy" width="1200" height="750"></a><figcaption>The model viewer makes it possible to inspect forms that are usually seen in motion, at a distance or for only a few seconds.</figcaption></figure>

## Worlds built from small pieces

Inferno’s scenery is organised into 200 by 200 cell grids. A cell chooses a scenery assembly, which can in turn place several model parts. Rotations and alternate versions allow a relatively small set of authored pieces to build a much larger place.

The [world viewer](../maps/) exposes that construction. Click on a location and its neighbourhood appears in 3D. The same approach works for populated planets, lunar installations and interior layouts. Orbital layers also appear in the list, so every entry should not be read as a separate playable level.

There are traces of the authoring process too. Some files retain network-drive paths and names for scenery categories. Those scraps help connect anonymous resources to a world or a model family, although a plausible name still needs to agree with the surrounding data.

One result was the recovery of a retained world we call [space3](../maps/#space3/100/100), with 6,601 occupied cells. Matching names, grids and scenery tables established how its parts fit together. We have not established that the finished game visits it. It is an interesting surviving layout without needing to turn it into a “secret level”.

<figure><a href="../maps/#planet1/29/150"><img src="../images/worlds.jpg" alt="A neighbourhood of planetary scenery reconstructed from the stored grid" loading="lazy" width="1200" height="750"></a><figcaption>A map neighbourhood assembled for inspection. Moving actors and mission events belong to the running game and are outside this view.</figcaption></figure>

## A second map inside the tunnels

The corridors have another structure hidden behind their visible walls. The executable contains 64 profiles describing navigation points, directed paths and the space a craft is allowed to occupy. These profiles connect to hundreds of scenery definitions.

In a tunnel, permitted space follows tubes and junctions around the route. A room uses a broader box, with paths inside it to guide actors. The walls we see and the rules that keep a craft inside are therefore related, but separate.

The [corridor viewer](../corridors/) draws both together. Amber lines show routes; cyan outlines show the permitted space. Turn the scenery on to see how they fit, or test a point to ask whether the original containment calculation considers it inside. It is a useful way to understand a system that is difficult to observe while trying to fly through it.

Following that logic uncovered a small but consequential coordinate error. The routine choosing the nearest exit omits the half-cell offset used to centre scenery on the map. Its idea of the closest exit can therefore differ from the closest one in the world. The faithful reconstruction keeps that choice; the analysis records why it happens.

<figure><a href="../corridors/"><img src="../images/corridors.jpg" alt="Amber navigation paths surrounded by cyan tunnel containment outlines" loading="lazy" width="1200" height="750"></a><figcaption>The outlines are an illustration of the game’s navigation and containment rules, added by our viewer.</figcaption></figure>

## Music with several personalities

The handbook credits Nik and Mrs Fiend of Alien Sex Fiend with the soundtrack. The CD carries recorded audio, while the game data also contains seventeen pieces arranged for three kinds of sound hardware: AdLib, Roland LAPC-I and Roland SCC-1.

Those arrangements deserve to be heard on their own terms. AdLib builds its sounds with FM synthesis. The Roland devices use different synthesis systems and instrument sets. Even two Sound Canvas models playing the same sequence can give it a noticeably different character. The [sound comparison](../sound/) offers short excerpts from our emulator renders.

We ran the original music drivers to recover their hardware commands and timing. This avoided guessing how a sequence was supposed to behave from its file format alone. It also exposed a selection error: when the LAPC-I version is asked for the piece named **dramatic**, it selects **badnews** instead. The separate dramatic arrangement is present and intact. Both other synth lookup tables point to it correctly.

There is a neat connection back to TFX. Its AdLib driver forces every nonzero channel-volume request to the same maximum value. Inferno removes the short instruction sequence responsible, preserving the requested volume. Meanwhile, the SCC-1 and LAPC-I device-driver blocks match our TFX reference apart from their timestamp labels.

## An earlier Inferno hiding on a TFX disc

The cinematic preview bundled with earlier TFX CDs predates the standalone playable demos. It runs through an earlier TFX-derived engine and contains paintings, presentation programs, music and 46 animation files.

At first, a comparison against the retail Inferno archive made much of it appear unique. Looking at the rest of the disc changed the picture: 24 of those animations also survive as loose files on the retail CD. The combined collection still gains 22 distinct animation files and two paintings from the preview.

Some differences may be edits or changes in encoding rather than wholly new scenes. Either way, the preview is a useful record of the project before release. It also shows why preservation comparisons need to look beyond the largest archive file.

## Checking what the game actually does

Making a convincing viewer is one part of this work. Reconstructing the game calls for a stricter comparison. We execute original routines with recorded inputs, then compare their output with our C++ version: pixels, palettes, internal state and, where relevant, sound commands.

That approach catches things a screenshot alone cannot explain. A dense radar case, for example, overruns a contact buffer in the original program. The radar then treats nearby memory, including parts of star and palette data, as additional contacts. Reproducing that faithfully requires understanding the surrounding memory layout, rather than drawing a plausible replacement.

The full mission-initialisation sweep now covers 11,268 accepted paths and 22,536 matching frames. A separate continuous flight comparison matches 8,192 consecutive frames. Those are substantial checks, but they cover specific inputs. The radar overflow, some degenerate close-up drawing cases and continuous journeys through the frontend and campaign still need work before we can call the reconstruction pixel-perfect throughout.

The browser exhibits here are designed for exploration. The C++ project is where we pursue the original rendering and behaviour in detail. Keeping those purposes clear lets us make the collection enjoyable to browse while being honest about what has been established.

## Keep exploring

Open [the models](../models/), pick a place in [the world viewer](../maps/), or look at [the paths inside a base](../corridors/). The [artwork selection](../artwork/) and [music comparisons](../sound/) show two other sides of the game.

Our earlier [TFX investigation](https://lost-engines.github.io/tfx-traced/) follows the engine’s military-flight branch. Both projects are part of [Lost Engines](https://lostengines.com/), an effort to understand older games well enough to preserve how they work, as well as what they look like.
