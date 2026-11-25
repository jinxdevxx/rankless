# Rankless – standing checklist (every development round)

Everything the player has asked for, checked again EVERY round. A failing point is fixed before anything new is built.
Add new player feedback here as a new point, so it is never forgotten.

## Must always hold (test every round)
1. **Fresh start works**: new character starts with weapon + armor and wins E-F1..F3 by just spamming SPACE (`node tools/fresh_start_test.js`).
2. **Combat = Classic**: SPACE spam strikes, parry on red "!", no ring system. Skills fire only by pressing 1/2/3/R (or tapping). AUTO FARM button turns automatic skills + ultimate on/off.
3. **Skills always respond**: pressing a skill key either casts it or shows why not ("Need N ◆", "unlocks at Lv X"). Test keys 1/2/3/R and button taps.
4. **Bag stays clean**: items worse than equipped even at +15 are marked ✖, "Salvage useless" removes ALL of them (only locked items kept) and shows Stones/Gold; useless drops are auto-salvaged after fights; few Commons in D/C.
5. **Gear is always the best**: Equip best and auto-equip compare real Power (enhance level included). A strong +8 item stays equipped over a weaker fresh drop. Sets (2/4 pieces) are counted: run `node tools/equip_best_test.js`, must be 100 % optimal. Bag cards show +/- Power, item details show "beats yours at +N".
6. **Spirit Legion matters**: spirits are ranged only, can't die, are bought/levelled/slotted with Gold (no drops) and give a clearly useful bonus + damage.
6b. **Farming always possible**: Training Tower is unlimited, floors climb gradually, pays Gold + XP, chest every 5 floors; you can always win a lower floor.
6c. **Early game is fun**: a pure SPACE-spammer without skills clears E-Rank steadily (spam bot: `node tools/bot_balance.js flame spam 60`, no floor with >6 losses in E). Midgame (D/C) is harder but never a wall.
6d. **Item window**: actions visible without scrolling on phones; salvage refunds 65% of enhance spending.
7a. **Power is honest**: if your Power ≥ Recommended, you usually win (bots: median power at first clear ≈ recommended). Bosses never one-shot a player at recommended power.
7b. **Spam works**: mashing SPACE never deals less damage than slow presses and still blocks/parries; pure spam bot (`node tools/bot_balance.js void spam 240`) reaches Rank B without walls; BREAK bar fills on bosses/elites.
7c. **Stats tab**: big numbers (Max HP, ATK, DEF, Power), stat points and talent tree v2 work (10 ranks, keystones have visible effect); talents can't be maxed quickly but every level gives a meaningful choice. RECURRING: extend/improve the tree when it feels thin.
7d. **Tower feels fun**: tower map, places change every 5 floors, modifiers, elites/bosses/chests. RECURRING: add variety when it feels monotone.
7. **Balance**: full run 3–4 hours to Rank B for a human; `node tools/bot_balance.js flame spamskill 240` 30–90 min; no floor with >10 losses in a row; nothing unwinnable at the start.
8. **Simple, not complicated**: no new menus or currencies without a reason. Simplifications stay switchable (Simple Mode in Esc menu).
8b. **Quiet updates**: update = one click + reload; afterwards only the small left note (auto-hides 10 s / on navigation); patch notes in Esc menu.
8c. **Automation**: AUTO ATTACK + AUTO FARM farm fully automatically; Arena has NEXT FIGHT after wins; Tower changes place every 5 floors.
9. **Update flow**: version bump, English patch notes, README changelog entry for every change, live-update post (German, short), devlog updated.

## Improve continuously (pick the weakest point each round)
- Combat must be more fun and creative WITHOUT being harder to play: e.g. easy skill combos, weak points that open up, boss moves you answer with a skill. Small steps, one idea per round, ask for feedback.
- Gameplay over graphics. No pure visual rounds.
- Progression decisions that are easy to understand (stats, gear, enchant, jobs).
- New content later: boss mechanics, Red Gates, Abyss Tower (kept simple).
