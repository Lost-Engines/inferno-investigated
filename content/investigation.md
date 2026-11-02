## From fighter jets to alien worlds

Inferno is Digital Image Design’s 1994 science-fiction combat flight game, published by Ocean. It takes us from battles over planetary surfaces into space and down through the tunnels of alien bases. There are angular spacecraft, elaborate painted cockpits, strange creatures and a soundtrack by Alien Sex Fiend.

We had already encountered pieces of Inferno while taking apart [TFX](https://lost-engines.github.io/tfx-traced/), DID’s earlier military flight simulator. TFX’s files contained Inferno cockpit artwork, and its CDs included an early cinematic preview. Opening the full game felt familiar: the archive format, model drawing commands and sound drivers all carried over.

The tunnels took us into new territory. TFX’s aircraft flew over scenery; Inferno’s craft had to navigate inside it. Working out how the game handled those interiors became one of the most absorbing parts of the project.

For the drawing machinery itself, [How TFX draws a world](https://lost-engines.github.io/tfx-traced/graphics/) follows the graphics pipeline from model programs to VGA pixels, with interactive diagrams and the changes we found in Inferno. [How TFX flies](https://lost-engines.github.io/tfx-traced/flight/) follows the aircraft physics through lift, control laws, engine failures and landings. [How TFX’s weapons work](https://lost-engines.github.io/tfx-traced/weapons/) examines the missiles and bombs, including the differences between their code and the handbook.

<figure><img class="pixel" src="../images/laboratory.png" alt="An ominous laboratory with a craft suspended over a circular platform" loading="lazy" width="320" height="200"><figcaption>A craft suspended in one of Inferno’s painted laboratories. The game combines these paintings with animated sequences and real-time 3D.</figcaption></figure>

## Which Inferno?

Before taking the engine apart, we had to sort out the copies we had collected. Several promising downloads were duplicates. Others were incomplete or damaged. Reading the release strings inside the executables gave us four working editions:

| Edition | Embedded release |
| --- | --- |
| English retail CD | 1.58 |
| German playable demo | 1.82 |
| English playable demo | 1.89 |
| Loose floppy-style installation | 1.104 |

The numbering caused some head-scratching. Read the suffixes as revisions 58, 82, 89 and 104, and the order makes sense. Dates inside the accompanying programs put 1.104 after 1.58 too. Both playable demos contain later engine builds than our retail CD.

We chose the CD as our reference. It has the original installer, the full game data and seventeen audio tracks. Comparing the other editions then gave us a way to follow changes in the engine and its files.

Some things stayed remarkably consistent. All four archives contain the same 1,691 model programs and all 51 native music resources. Even the demos carry the entire model collection.

Other differences disappeared once we understood the formats. The CD and floppy-style edition have 265 changed presentation files in common. In 212 of them, the changes are saved memory addresses or unused buffer contents. The presentation itself is the same. These files had preserved scraps of the memory they were saved from, along with the material the game needed.

## Models that carry their own behaviour

Inferno’s models are small programs. Their commands build vertices, choose which surfaces to draw, change detail with distance and respond to values supplied by the game. Animation and damage effects can be part of the model file itself.

We built an interpreter for those commands so we could see the models move. The [model viewer](../models/) exposes their controls: turn a ship around, change its animation state, then watch what its drawing program does. It is particularly satisfying to inspect machinery or creatures that are usually moving past too quickly to appreciate.

Start with [the player’s fighter](../models/#epicanim), then try a frigate or one of the Rexxon creatures. Look for the state sliders below the main view. They let us examine each stage of an animation or play the sequence through.

<figure><a href="../models/#epicship"><img src="../images/models.jpg" alt="The epicship model shown from an oblique angle in the interactive viewer" loading="lazy" width="1200" height="750"></a><figcaption>The unused epicship model, one of the 1,691 models shared by all four editions.</figcaption></figure>

The filenames can be misleading. The player’s exterior uses `epicanim`, `epicsort` and `epiccorr`; `epicship` is an unused model. We followed the mission placements, actor definitions and drawing code to group the collection by where it appears in the game. The viewer also separates friendly and enemy actors and keeps the unused material together.

## Worlds built from small pieces

Each scenery grid has 200 by 200 cells. A cell selects an assembly of model parts, with rotations and alternate versions giving the pieces different uses. The [world viewer](../maps/) follows those instructions to put each neighbourhood back together.

Click around a planet and the construction becomes easy to see. The same pieces recur across a much larger landscape. Lunar installations, orbital layers and base interiors use this system too.

The files also preserve some of the tools’ working environment. Lists of scenery parts still contain network-drive paths, including `n:\inferno\sh\space.1\astro\`. Names like these helped us connect anonymous data to the worlds it belonged to.

One recovery started with two anonymous 40,000-byte files. We already had maps named space1 and space2, so we tried the name space3. That led to six matching file identifiers: the two halves of a grid, its scenery table and supporting files. Every occupied cell resolved to an entry in the matching table. Together they assembled [space3](../maps/#space3/100/100), a layout with 6,601 occupied cells that survives in all four editions.

<figure><a href="../maps/#planet1/29/150"><img src="../images/worlds.jpg" alt="A neighbourhood of planetary scenery reconstructed from the stored grid" loading="lazy" width="1200" height="750"></a><figcaption>A planetary neighbourhood assembled from the grid and its scenery definitions.</figcaption></figure>

## A second map inside the tunnels

Behind the corridor walls is another map. The executable contains 64 corridor profiles, with 352 navigation points and 312 directed paths. Hundreds of scenery definitions refer to this shared set of shapes.

For a tunnel, the game tests whether a craft is inside a tube around its route, with spheres at the junctions. Rooms use a larger box. The visible walls and these movement boundaries are stored separately, so we had to recover both to understand how flying through a base works.

The [corridor viewer](../corridors/) puts them together. Amber lines show the routes and cyan outlines show the permitted space. Switch the scenery on and off to see how the paths fit inside the walls. There is also a point test that runs the recovered containment calculation, so we can probe the boundary without repeatedly flying into it.

Following the route-selection code turned up a bug. The routine choosing the nearest exit forgets the half-cell offset that centres scenery on the grid. For that calculation, every candidate exit is displaced by 1,024 world units on both horizontal axes. The game can consequently choose an exit other than the nearest one.

<figure><a href="../corridors/"><img src="../images/corridors.jpg" alt="Amber navigation paths surrounded by cyan tunnel containment outlines" loading="lazy" width="1200" height="750"></a><figcaption>The corridor viewer draws navigation routes in amber and movement boundaries in cyan.</figcaption></figure>

## Music with several personalities

Nik and Mrs Fiend of Alien Sex Fiend supplied the soundtrack. Alongside the recorded CD audio, the game contains seventeen pieces arranged for three kinds of sound hardware: AdLib, Roland LAPC-I and Roland SCC-1.

The differences are fun to listen to. AdLib builds its sounds with FM synthesis, while the Roland devices have their own synthesis systems and instrument sets. Even the SCC-1A and SC-55 give the same Sound Canvas sequence a noticeably different character. The [sound comparison](../sound/) lets us switch between emulator renders at the same point in the title music.

To make those renders, we ran the original drivers, captured their hardware commands and timing, then sent the results to synthesizer emulators. Along the way we found a music-selection bug: on LAPC-I, asking for **dramatic** plays **badnews**. Both slots in the lookup table point to the same piece. The dramatic arrangement is still there in the archive, and we can hear it by selecting the file directly. The AdLib and SCC-1 tables select it correctly.

Comparing drivers brought us back to TFX. Its AdLib driver forces every nonzero channel-volume request to maximum volume. Inferno removes the seven bytes responsible and keeps the requested value. The SCC-1 and LAPC-I drivers, meanwhile, are identical to TFX’s apart from their timestamp labels.

## An earlier Inferno hiding on a TFX disc

The cinematic preview on the earlier TFX CDs gave us another version of Inferno to investigate. It runs in an earlier TFX-derived engine and contains paintings, presentation scripts, music and 46 animation files.

Our first comparison with the retail Inferno archive made most of the animations look unique. Then we checked the loose files elsewhere on the CD: 24 of the preview’s animations were there too, byte for byte. Comparing the whole disc left us with 22 distinct animation files and two paintings to add from the preview.

## Checking what the game actually does

Rebuilding the game gave us a way to test our understanding. We run an original routine with recorded inputs, feed the same inputs to our C++ implementation and compare the results. A mismatch gives us somewhere to investigate, down to a particular instruction or pixel.

This works at several scales. We can check a single drawing command, follow a mission as it starts, or replay a continuous flight. Our mission-initialisation sweep covers 11,268 accepted paths and 22,536 matching frames. A separate flight comparison matches 8,192 consecutive frames. We compare the palette and internal state too, and capture hardware commands for the sound routines.

One of the strangest discoveries came from a crowded radar display. The original has room for twenty pending contacts. Adding more writes beyond the buffer and eventually overwrites the contact count itself. The radar then tries to draw thousands of contacts from the memory that follows.

Those extra blips come from unrelated parts of the game: star positions, palette buffers, camera fields and other live data, all being read as radar coordinates. To explain the picture, we have been tracing which routines last wrote those bytes. A little cockpit instrument has sent us through much of the engine.

## Keep exploring

Open [the models](../models/), pick a place in [the world viewer](../maps/), or follow [the paths inside a base](../corridors/). The [artwork selection](../artwork/) and [music comparisons](../sound/) show two other sides of the game.

Our earlier [TFX investigation](https://lost-engines.github.io/tfx-traced/) follows the engine’s military-flight branch. Both projects are part of [Lost Engines](https://lostengines.com/), where we take older games apart and rebuild them so they can keep being played.
