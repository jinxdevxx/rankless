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

### v0.18.2 – Living Monsters
- monsterDetails(): per-style glowing veins, spikes, cores, bubbles, chains, cracks; flare on windup/cast; coloured ground glow under monsters.

### v0.18.1 – Longer Road
- enemyHp base 800 → 1050, enemyAtk base 44 → 50. Bots: spamskill E→B 43 min, B ~85 min, A ~220 min; pure spam E→B ~200 min.

### v0.18.0 – Road to S+
- RANKS extended to E D C B A S SS(S+) M(Master) with rankLabel(); gates B (Abyssal Rift, baseLv 36), A (Tempest Spire, 48), S (Sunken Sun, 60), SS (Eclipse Throne, 72) with 20 new enemy types (new palettes on existing styles), elites and bosses; hunters + exams for B/A/S/SS; S+ exam = Master Trial.
- Master League (mode arena with BT.master): masterFoe(lv) generator, Lv 1–99, rewards, ladder UI, NEXT button.
- Sets Abyssborn / Tempest / Solar Crown / Eclipse; towerGate() uses all gates.
- XP curve: base 165 → 280, growth after Lv 30 1.21 → 1.085; gate mults B 1.3, A 1.15, S/SS 1.0; REC_MULT for new gates.
- Long bot runs (spamskill): E→B ~30 min, B→A ~20 min, A ~170 min; S still being tuned.

### v0.17.3 – Stronger Talents
- TALENT_W front-loads talent ranks (x2 for ranks 1–3, x0.6 for 8–10); Sharp Blade 4 %/rank, Tough 5 %/rank; talentNext() shows real stat and power gain.
- Tower mobs: theme palette, size variance, MOB_AFFIXES with aura + name tag + reward bonus; towerMod() uses an integer hash.

### v0.17.2 – Keep Climbing
- Tower auto-continue also when AUTO FARM / AUTO ATTACK is on (towerAuto), 3 s countdown on the next-floor button and in the auto bar (autoCountdown); loss steps one floor down.

### v0.17.1 – Know Your Wallet
- Item enhance row uses haveNeed() chips: have / cost, 'left after' or 'missing', green/red.

### v0.17.0 – Ki
- Breaker Crystals replaced by Ki (KI_UNIT = 20, shown 0–100): animated Ki bar with markers every 20, skill buttons show Ki cost, feedback 'Need X Ki', texts/tutorials/jobs/keystone renamed.

### v0.16.2 – Deeper Climb
- Talent tree v2 (data.js TALENTS): 4 stat talents × 10 ranks + 2 keystones per branch (req 0/5/10/15/20/30 points). Keystones: berserk, exec, second, thorns, treasure, crystal (BT.keys). New stat dr (Bulwark, max 40 %).
- Talent points: level − 2 + floor(tower best / 10) + 2 × rank index.
- Training Tower: TOWER_MODS (Golden, Giants, Swarm, Frenzy, Spirit Surge) on normal floors, tower map with the next 5 floors, mod shown in battle title and banner.
- Sheets reset scroll when switching tabs. BREAK 22 → 18 hits (elites 12 → 10), Matriarch HP 5 → 4.2.

### v0.16.1 – Smooth Flow
- Update flow: no popup when an update is found (slim banner with Update button only); after updating a small self-hiding note (10 s, or on any navigation) replaces the big modal; patch notes button in the Esc menu and on the save screen (openPatchNotes).
- Training Tower: 8 themed places (TOWER_THEMES, scenery variants via THEMES.base), monsters mixed from all reachable gates, elite every 5th floor, boss (60 % HP) every 10th with double chest, floor banner.
- AUTO ATTACK button (setting autoAttack) presses strike every 0.3 s; combine with AUTO FARM for full auto.
- Arena: NEXT FIGHT button after a win (nextArenaFight).
- REC_MULT E 1.2 / D 1.5 / C 1.0.

### v0.16.0 – Fair Fights
- Mashing fixed: presses during the strike cooldown are queued (doStrike), mashing keeps Flow, and mashing during a red "!" parries too (doParry mash: 1.0x counter, short stun, half energy; timed press = PERFECT parry 1.4x).
- Enemy damage only scales with the square root of the gate multiplier (ATK_EASE_EXP .5); gate HP mults D 1.8→2.1... final: D 2.1, C 1.6; enemyHp base 430 → 800; hero HP 130+17/VIT → 170+24/VIT.
- Bosses HP: Warden 11.5 → 8.5, Conductor 10 → 7, Matriarch 7.5 → 5. Healer heal capped at 5 % of target max HP.
- BREAK mechanic (BREAK in data.js): 22 hits (12 for elites, skills count 3) → BROKEN for 4 s, x2 damage, boss bar shows the break meter.
- SKILL_SCALE .5 / HIT_SCALE 1.35 for hero damage.
- recPower(): recommended power = floorPower × REC_MULT per gate (E 1.25, D 1.9, C 1.05), calibrated from bot first clears; arena too.
- Training Tower (mode 'tower', TOWER in data.js) replaces Gold Rush / Training: endless floors, gold + XP, first clear x1.5, chest every 5th floor; daily XP gate renamed XP Shrine.
- Stats tab (sheetStats) with big numbers, stat points and talent tree (TALENTS: Might / Guard / Fortune, 4 talents × 5 ranks, tier gate 5 points, free reset). New stats defP and petP.
- Bot (tools/bot_balance.js) has policies good / spamskill / spam and buys talents + climbs the tower when stuck. Results: with skills 29–55 min to Rank B, pure spam without skills ~129 min, no walls.

### v0.15.1 – No More Junk
- Drops that are junk (isJunk: never beat the equipped item even at +15) are auto-salvaged in storeItem (setting autoJunk, default on); result screen shows the salvage income.
- isJunk no longer spares set pieces (consistent with the item window; equipBest handles sets).
- Big salvage button with Stones/Gold preview.
- COMMON_UPGRADE: Common rolls become Rare with 60 % (D) / 85 % (C) chance.
- Frost Matriarch HP 8.5 → 7.5, ATK 1.9 → 1.8. Bot 53–83 min to Rank B.

### v0.15.0 – Spirit Legion
- Legion reworked into the Spirit Legion: 5 magic spirits (PETS in data.js), bought with Gold, levelled with Gold (max Lv 15), ranged bolts only, untargetable, passive bonus per spirit. Slots: 1 free, slot 2 = 5,000, slot 3 = 25,000 Gold. Soul shard drops removed; old bound monsters refunded as Gold (migratePets).
- New repeatable farm modes in the Gates tab: Gold Rush (RUSH_GOLD) and Training (TRAIN_XP), 2 waves at 85 % of your best floor's strength, no loot.
- Balance: E-Rank enemies softened (E_EASE per floor), D mult 2.35 → 2.6, C mult 2.0 → 2.35, spirit level costs grow faster. Bot (tools/bot_balance.js): skilled 60–64 min to Rank B; pure spammer without skills clears E in ~38 min.
- Item window compact: actions at the top, stats and comparison side by side, enhance costs in one row.
- Salvage returns 65 % of enhance spending (enhanceSpent, SALVAGE_REFUND).
- Defeat tips point to Training / Gold Rush / skills / AUTO FARM / spirits. Max 2 toasts visible on phones.

### v0.14.4 – True Best
- bestLoadout(): set-aware search over bag + worn gear. Starts from current gear, each set forced in (2/4 pieces) and set pairs (2+2), then improves on TOTAL power with single and two-slot swaps.
- New tools/equip_best_test.js compares with a brute force over every combination: 150/150 optimal; ~0.15 s with a full bag.
- isJunk() keeps set pieces while a set bonus is possible (pieces in 2+ slots).

### v0.14.3 – Clean Bag
- isJunk(): bag items that lose to the equipped item even at +15 (and are not locked) get a ✖ mark.
- Bag banner with "Salvage useless (N)" button salvages all of them at once.

### v0.14.2 – Best Gear
- Bag cards show Power gain/loss vs the equipped item (powerGain, enhance level included).
- Item detail: upgrade potential (beatsAtPlus): better now / beats yours at +N / never better.
- Equip best rewritten (equipBest): per-slot real Power gain, up to 3 passes for set bonuses, toast shows Power before → after. Auto-equip on drop uses the same rule.
- Skill presses give feedback when they can't fire (crystals missing, level lock); numpad 1–3 supported; no key-repeat casts.
- New docs/CHECKLIST.md: standing list of every player requirement, checked each development round.

### v0.14.1 – Back to Classic
- Ring (Timing) combat disabled on player request; code kept dormant (`timingMode()` returns false). Combat style option removed from the menu.
- Saves migrate once to classic combat with auto skills OFF (flag combatV3).
- Battle button renamed AUTO FARM (toggles automatic skills + ultimate), always visible, with on/off toast.
- Hint shows which skill key is ready (1/2/3, R for ultimate).
- Kept: legion scaling with hero, starter gear fix. Classic bot runs: 52–90 min to Rank B.

### v0.14.0 – Timing Combat
- New default combat style: shrinking ring on the front enemy; press on the gold circle (GOOD / PERFECT). Pressing with no ring or too early = stumble (0.5 s, mashing extends it). Perfect hits build FLOW and give extra crystal energy.
- Parry only in the last 0.38 s before an enemy hit.
- No hero auto-attacks and no auto skills in Timing combat; hero damage x1.8, damage taken x0.62 to compensate.
- Legion companions scale with hero stats (HP 55 %, ATK 32 % of hero, x stars) instead of a much slower level curve.
- Bug fix: starter weapon/armor were salvaged by Simple Mode, so new characters had no gear; now equipped directly, broken saves are repaired on load.
- Defeat screen explains mashing; victory shows PERFECT count.
- Setting: Combat style Timing / Classic (Esc menu).
- Bot runs (timing-aware bot, 60–75 % accuracy): 57–103 min to Rank B.

### v0.13.0 – Simple Mode
- New setting Simple Mode (default on, toggle in Esc menu): enhancing never fails, Common gear auto-salvaged, Legion auto party + auto star-up, CHAIN counter hidden in fights.
- Turning it off restores full manual control (old enhance rates, manual party, manual star-up).
- Backup of the pre-simplification state: branch `backup/pre-simplify-v0.12.5`.
- Bot runs to Rank B with Simple Mode: 96–99 min.

### v0.12.5 – Final Blow
- Death animation: knockback, white flash, dissolve into rising rift motes.
- Balance: D boss (Conductor) HP 12→10, ATK 2.2→2.0; C boss (Frost Matriarch) HP 12.5→8.5, ATK 2.3→1.9. Bot runs to Rank B: 79–98 min (was 118–162 min).

### v0.12.4 – Elemental Hits
- Hero hits have element-specific effects: steel sparks, flame embers, storm arcs, void implosion, blood splash.
- Manual STRIKEs burst bigger than auto attacks.

### v0.12.3 – Ready Check
- Home screen "ready" chips: free stat points, new gear, affordable enchant, Daily Gates left. One tap jumps there.
- Phone: compact top bar, so all three currencies fit.

### v0.12.2 – Read the Strike
- Enemies wind up before attacking you: they lean back and glow red (clear parry cue).
- Monster eyes flare during the wind-up and blink now and then.

### v0.12.1 – Reward Moments
- Result screen: count-up rewards, animated XP bar with level-up flash (`rewardAnim()` in `js/ui.js`).
- Legendary/Mythic loot halo (`.icard.epicglow`).
- Top-bar currency layout scoped to `.curs` so reward chips stay on one line.

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
