# Rankless

**From E-Rank to legend.** An anime-style action RPG in the browser. Clear gates floor by floor, fight actively with strikes, parries and skills, enchant your blade, hunt loot, bind the monsters you defeat and climb the ranks in the Hunter Arena. A full run to Rank B takes about 3-4 hours.

**Play:** https://jinxdevxx.github.io/rankless/ (the `/rankless/` at the end is required)

## How to play
- **SPACE / tap / STRIKE**: attack. Your own strikes charge Breaker Crystals. Strike in a steady rhythm to build **FLOW**; enemies with a gold HP bar die to one strike (**EXECUTE**).
- **Parry**: when a red **!** appears above an enemy, press SPACE in that moment to block, counter and earn a crystal. Mashing does not parry.
- **1 / 2 / 3** or **Q / W / E**: skills (cost 1, 2 or 3 crystals). Back-to-back skills build a CHAIN bonus.
- **R**: Ultimate. **Esc**: menu (save, save codes, settings, updates, main menu).

## Features
- 3 save slots, save codes for backup and moving between devices
- One hero; weapon enchantments (Flame, Storm, Void, Blood, levels 1-5) paid with Rift Diamonds
- Gates E, D, C with 10 floors each plus endless Deep Floors, elites, enraged bosses and reinforcements
- Daily Gates: Gold Vault, Training Grounds, Crystal Mine
- Loot: 7 slots, 5 rarities, random bonus stats, enhance to +15, item sets (Tidecaller, Railbreaker, Frostbound)
- Legion: bind monsters with Soul Shards and raise their stars
- Hunter Arena with rival and Rank Exams (E to B)
- Job Change at Rank C: 2 specializations per power
- Features unlock step by step; auto-equip and auto stats (both optional)
- Offline farming, sound effects and music, live patch notifications

## Changelog
Every change to the game is listed here. Newest first.

### v0.12.0 – Flow & Execute
- Flow (`FLOW` in `js/data.js`): rhythmic strikes stack up to 5 (+6% DMG and +10% crystal gain per stack); mashing or taking damage resets it. Timing uses a battle clock (`BT.clock`) unaffected by hit-stop/slow motion.
- Execute (`EXECUTE_AT` = 15%): one strike kills a weakened non-boss enemy, gold HP bar and ground ring, bonus crystal.
- Balance: `enemyHp` 330 -> 430, `enemyAtk` 40 -> 44, `xpNeed` base 130 -> 165; Gate D x2.35, Gate C x2.0; boss HP 14/15/16 -> 11.5/12/12.5. Bot runs (perfect rhythm) reach Rank B in ~50-100 min, about 2.5-3.5 h for a human.

### Tooling
- `tools/colleague_changes.sh`: reports collaborators' commits (author, time, message, changed files) once per development round; posted to the live-update chat only when there is something new.

### v0.11.0 – One Hero, Enchanted Blade
- Character creation is name only; every hero starts with the neutral `steel` skill set (`AFF.steel`).
- Weapon Enchant (`ELEMENTS`, `ENCHANT_COST`, `enchantCost()`, `syncAff()`): Flame/Storm/Void/Blood, levels 1-5, +12% Skill DMG per level, switchable; unlocks at Floor 5.
- New currency Rift Diamonds (`S.diamonds`), rewarded in `finishBattle()`.
- Bigger labelled currency chips; `costLine()` shows have/need for every upgrade; larger item details.
- Item comparisons and auto-equip now include enchantment and job (`powerWith()`).
- Toasts sit top-right on wide screens.
- Balance target: ~3-4 h to Rank B for a human (~100 min for the test bot); old saves migrate their power to a level 1 enchantment (`migrateEnchant()`).

### v0.10.0 – Smoother
- Deep Floors: endless floors after Floor 10 in every gate, boss every 5 floors (`isBossFloor()`, `nextFloor()` no longer capped).
- Combat formation: melee enemies stand at the front line, ranged enemies and healers stay back (`E_POS`, `RANGED_BACK`); eased dash and return movement.
- Arena: weaker hunter multipliers, recommended Power shown, consolation Gold/XP on defeat.
- `floorPower()` recalibrated on bot playthroughs.
- Bag: green ▲ on upgrades; item details list stat differences against the equipped item.

### v0.9.0 – Job Change
- Job Change unlocks at Rank C with two specializations per power (8 jobs in total).
- Each job adds a passive bonus and upgrades one skill; switching later costs Gold.
- Code: `SPECS`, `specOf()`, `skillDef()` and `specEnergy()` in `js/data.js`; job stats applied in `calcStats()`.

### v0.8.2 – Smooth Updates
- "Update now" reloads with fresh files so the new version really loads.
- If the server still delivers the old version, the game retries quietly instead of popping up again.
- The big update popup appears once per version; the banner stays until you update.
- New `404.html`: wrong addresses inside the site lead back to the game.

### v0.8.1 – Impact
- Hit-stop and camera punch on crits and skill hits.
- DOUBLE KILL / TRIPLE KILL / MASSACRE banners, slow-motion K.O. finisher.
- Gate bosses enrage below 50% HP and call reinforcements below 30%.

### v0.8.0 – Daily Gates & Item Sets
- Daily Gates (3 tries each per day, defeats are free).
- Item sets with 2- and 4-piece bonuses, marked in the bag and listed on the Champion screen.

### v0.7.0 – New Look
- Warm illustrated art style: dusk skies, clouds, cherry blossoms, colored characters with faces and outlines, steel katana.
- UI redesign: warm gold, rounded buttons, Bebas Neue + Nunito fonts.

### v0.6.0 – Active Combat
- Strike with SPACE / tap, parry telegraphed attacks, anti-mash rule.
- Labelled crystal bar with live hints; no more stun-locks (stun immunity).
- Rebalanced for active play (bot-tested).

### v0.5.2 – Sound On
- Procedural sound effects and music (Web Audio), switchable in the menu.

### v0.5.1 – Sharper Look
- Update notice at the very top center; UI moves down while it shows.
- Character shading pass, crystal balancing.

### v0.5.0 – Crystals & Saves
- Breaker Crystals skill system with CHAIN bonus; manual skills by default.
- Main menu with 3 save slots, Esc menu, save code export/import.
- Louder update notice with popup.

### v0.4.0 – Fresh Start
- Simple character creation, step-by-step feature unlocks, FIGHT button, next-unlock goal.
- Auto-equip and auto stats, level-gated skills, auto-continue.

### v0.3.0 – Live Patches
- In-game update notice, "What's new" window, patch notes in settings.

### v0.2.0 – Full Rebuild
- Full-screen action RPG: gates, loot, legion, arena, ranks, offline farming.

### v0.1.0 – First Prototype
- Lane-battle prototype (replaced).

## Project structure
- `index.html` – screens and the versioned loader (loads files with `?v=<version>`)
- `version.json` – current version and patch notes (drives the in-game update notice)
- `404.html` – redirects wrong addresses back to the game
- `style.css` – UI styles (theme v2 block at the end)
- `js/data.js` – game data: skills/elements, enchantments, monsters, gates, sets, daily gates, jobs, hunters, unlocks
- `js/state.js` – saves and save slots, stats, items, economy curves
- `js/art.js` – backgrounds, characters, monsters, effects
- `js/battle.js` – battle engine: strikes, parries, crystals, skills, bosses
- `js/ui.js` – menus, HUD and actions
- `js/audio.js` – sound effects and music
- `js/menu.js` – main menu (save slots) and Esc menu
- `js/main.js` – boot, main loop, offline rewards, updates
- `docs/BACKLOG.md` – open requests and roadmap
- `tools/colleague_changes.sh` – lists new commits from collaborators (anything not made by Claude) for the live-update chat
