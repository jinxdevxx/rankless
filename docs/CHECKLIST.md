# Rankless – standing checklist (every development round)

Everything the player has asked for, checked again EVERY round. A failing point is fixed before anything new is built.
Add new player feedback here as a new point, so it is never forgotten.

## Must always hold (test every round)
1. **Fresh start works**: new character starts with weapon + armor and wins E-F1..F3 by just spamming SPACE (`node tools/fresh_start_test.js`).
2. **Combat = Classic**: SPACE spam strikes, parry on red "!", no ring system. Skills fire only by pressing 1/2/3/R (or tapping). AUTO FARM button turns automatic skills + ultimate on/off.
3. **Skills always respond**: pressing a skill key either casts it or shows why not ("Need N ◆", "unlocks at Lv X"). Test keys 1/2/3/R and button taps.
4. **Bag stays clean**: items worse than equipped even at +15 are marked ✖ and "Salvage useless" removes them all (locked items kept).
5. **Gear is always the best**: Equip best and auto-equip compare real Power (enhance level included). A strong +8 item stays equipped over a weaker fresh drop. Sets (2/4 pieces) are counted: run `node tools/equip_best_test.js`, must be 100 % optimal. Bag cards show +/- Power, item details show "beats yours at +N".
6. **Legion matters**: companions grow with the hero, survive on D/C floors and do noticeable damage.
7. **Balance**: full run 3–4 hours to Rank B for a human; classic bot 60–110 min; no floor with >10 losses in a row; nothing unwinnable at the start.
8. **Simple, not complicated**: no new menus or currencies without a reason. Simplifications stay switchable (Simple Mode in Esc menu).
9. **Update flow**: version bump, English patch notes, README changelog entry for every change, live-update post (German, short), devlog updated.

## Improve continuously (pick the weakest point each round)
- Combat must be more fun and creative WITHOUT being harder to play: e.g. easy skill combos, weak points that open up, boss moves you answer with a skill. Small steps, one idea per round, ask for feedback.
- Gameplay over graphics. No pure visual rounds.
- Progression decisions that are easy to understand (stats, gear, enchant, jobs).
- New content later: boss mechanics, Red Gates, Abyss Tower (kept simple).
