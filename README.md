# Rankless

**From E-Rank to legend.** An anime-style action RPG in the browser: clear gates floor by floor, hunt loot, bind the monsters you defeat and climb the ranks in the Hunter Arena.

**Play:** https://jinxdevxx.github.io/rankless/

## Features (v0.2)
- **Champion**: codename, 4 Affinities (Crimson Flame, Storm, Void, Blood) with 3 skills + an Ultimate cut-in each, 5 stats to level
- **Gates**: E/D/C-rank gates with 10 floors each, waves, elites and bosses. Farm any cleared floor (Repeat / Push auto-farm)
- **Loot**: 7 equipment slots, 5 rarities (Common to Mythic), random bonus stats, enhancement +1 to +15, salvage, auto-salvage
- **Legion**: monsters drop Soul Shards. Bind them as companions and raise their stars
- **Hunter Arena**: 5 hunters per rank incl. your rival, then the Rank Exam (E → D → C → B)
- **Offline farming**, auto-save in the browser, full-screen on desktop and mobile

## Controls
`1` `2` `3` skills · `R` / `Space` Ultimate · `Esc` close menus

## Project structure
- `index.html` / `style.css`: layout and UI styling
- `js/data.js`: all game data (affinities, monsters, gates, hunters)
- `js/state.js`: save game, stats, items, economy curves
- `js/art.js`: procedural backgrounds, characters and monsters
- `js/battle.js`: battle engine
- `js/ui.js`: menus, HUD and actions
- `js/main.js`: boot and main loop
