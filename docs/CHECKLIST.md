# Rankless – standing checklist (every development round)

Everything the player has asked for, checked again EVERY round. A failing point is fixed before anything new is built.
Add new player feedback here as a new point, so it is never forgotten.

## Must always hold (test every round)
1. **Fresh start works**: new character starts with weapon + armor and wins E-F1..F3 by just spamming SPACE (`node tools/fresh_start_test.js`).
2. **Combat = Classic**: SPACE spam strikes, parry on red "!", no ring system. Skills fire only by pressing 1/2/3/R (or tapping). AUTO FARM button turns automatic skills + ultimate on/off.
2b. **Readable damage**: merged numbers with source icons (no spam), damage breakdown after fights.
3. **Skills always respond**: Ki bar (0–100) visible, every skill shows its Ki cost; pressing a skill either casts it or shows why not ("Need 40 Ki", "unlocks at Lv X"). Test keys 1/2/3/R and button taps.
4. **Bag stays clean**: items worse than equipped even at +15 are marked ✖, "Salvage useless" removes ALL of them (only locked items kept) and shows Stones/Gold; useless drops are auto-salvaged after fights; few Commons in D/C.
5. **Gear is always the best**: Equip best and auto-equip compare real Power (enhance level included). A strong +8 item stays equipped over a weaker fresh drop. Sets (2/4 pieces) are counted: run `node tools/equip_best_test.js`, must be 100 % optimal. Bag cards show +/- Power, item details show "beats yours at +N".
6. **Spirit Legion matters** (slots: one-click Remove, Put in slot fills a free slot; Awakening ★ after Lv 15 keeps scaling into the Master League): spirits are ranged only, can't die, are bought/levelled/slotted with Gold (no drops) and give a clearly useful bonus + damage.
6b. **Farming always possible**: Training Tower is unlimited, floors climb gradually, pays Gold + XP, chest every 5 floors; you can always win a lower floor.
6c. **Early game is fun**: a pure SPACE-spammer without skills clears E-Rank steadily (spam bot: `node tools/bot_balance.js flame spam 60`, no floor with >6 losses in E). Midgame (D/C) is harder but never a wall.
6d. **Item window** (hover tooltip with Power/stats on desktop): actions visible without scrolling on phones; enhance shows have / cost / left after for Gold and Stones; salvage refunds 65% of enhance spending.
7a. **Power is honest**: if your Power ≥ Recommended, you usually win (bots: median power at first clear ≈ recommended). Bosses never one-shot a player at recommended power.
7b. **Spam works**: mashing SPACE never deals less damage than slow presses and still blocks/parries; pure spam bot (`node tools/bot_balance.js void spam 240`) reaches Rank B without walls; BREAK bar fills on bosses/elites.
7c. **Stats tab** (talent points never pile up unusable: Ascension branch in the Master League, Limit Break takes leftovers): free talent/stat points shown big at the top + number on the Stats button; big numbers (Max HP, ATK, DEF, Power), stat points and talent tree v2 work (10 ranks, keystones have visible effect); talents can't be maxed quickly but every level gives a meaningful choice. RECURRING: extend/improve the tree when it feels thin.
7d. **Tower feels fun**: tower map, places change every 5 floors, modifiers, elites/bosses/chests. RECURRING: add variety when it feels monotone.
7e. **No immortal / no instant death**: `node tools/bot_balance.js flame auto 700` (full AUTO: ~5–15 % deaths, some close wins), spamskill a few deaths, pure spam more; `node tools/survival_test.js` – AUTO ATTACK must take real damage, nobody is invulnerable; lifesteal capped at 20 %; one build may be best but none trivialises the game.
7. **Balance**: full run 3–4 hours to Rank B for a human; `node tools/bot_balance.js flame spamskill 240` 30–90 min; no floor with >10 losses in a row; nothing unwinnable at the start.
8. **Simple, not complicated**: no new menus or currencies without a reason. Simplifications stay switchable (Simple Mode in Esc menu).
8b. **Quiet updates**: update = one click + reload; afterwards only the small left note (auto-hides 10 s / on navigation); patch notes in Esc menu.
8d. **Background play**: with the tab hidden, fights + AUTO FARM + tower auto-climb keep progressing (simulate document.hidden in Playwright).
8c. **Automation**: AUTO ATTACK + AUTO FARM farm fully automatically; Training Tower auto-continues with a 3 s countdown and has AUTO REPEAT (farm one floor); Arena has NEXT FIGHT after wins; Training Tower has a big CHOOSE YOUR FLOOR box (-10/-1/+1/+10) and every floor in the list is clickable — check on phone too; Rank Exam locked until the rank's gate boss is cleared; Tower changes place every 5 floors.
9. **Update flow** (after push: `gh run list --repo jinxdevxx/rankless --limit 2` must show the Pages deploy as success, else re-run/push again): version bump, English patch notes, README changelog entry for every change, live-update post (German, short), devlog updated.

10. **Long game**: ranks E→S+ each with gate + arena + exam, Master League 1–99 reachable; long bot (`node tools/bot_balance.js flame spamskill 900`) shows no wall (>10 losses on a floor) in any gate; E→B ≈ 60 bot-min target.

11. **Economy**: Gold and Mana Stones both matter. A +15 Epic costs a similar number of fights in Gold AND Stones at every level; nobody sits on thousands of useless Stones while Gold blocks everything.
12. **Endgame variety**: from Master Lv 1 the Abyss Rift (run mode, boons, relics) and the Master Gate (loot level follows Master Lv) work; unlocks at Master 1/10/20/…/99 visible in the Rift card.

13. **Play time visible**: slot card, Esc menu and Champion tab show total play time; Journey records milestone times. Play time numbers for the player are REAL time at x3 (bot-min ÷ 3).

14. **Uniques worth it, not OP**: every Unique/Godforged ≥ Mythic power at same level, effects trigger in fights, drop rate gives a few per playthrough (bot log CODEX), Loot Codex shows sources/chances.

## Improve continuously (pick the weakest point each round)
- RECURRING (player wish): balancing, flow and dopamine. Every round look at the bot logs: no walls, no boredom, steady progress, regular rewards (levels, drops, chests, unlocks). Fix the weakest spot.
- Combat must be more fun and creative WITHOUT being harder to play: e.g. easy skill combos, weak points that open up, boss moves you answer with a skill. Small steps, one idea per round, ask for feedback.
- Gameplay over graphics. No pure visual rounds.
- Progression decisions that are easy to understand (stats, gear, enchant, jobs).
- New content later: boss mechanics, Red Gates, Abyss Tower (kept simple).
