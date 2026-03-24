Read this first when picking up where we left off.
When you finish your session, clear this file and document your own changes, bugs, and next steps.

---

Session: Mitch

### Changes
- Added new spells
  - Cantrip uses one fire to do one damage without any action cost
  - Omniscience is a payoff spell that takes one off each component and gives three actions and six cards (hard to get off)
  - Rush has no components and takes two action points to draw two cards
- actionSpell name changed to charge because it was dumb
- Made shield give two to deal with increased damage in the game
- Spells now have cost for the shop (starting spells arbitrarily cost zero)
- New card type of items (used to manipulate component deck)
  - Candle adds one wax, match adds one fire, snow adds one ice, meterorite adds one stardust
- resolveItem created to use items
- buildSpellCard helper function created, use it to make new spells
- shopPurchase added, two cases one for items one for spells

### Bugs
- players are unable to gain gold to buy items or points to learn spells
- shop items are not removed after they are puchased
- shop is not accessable and shop cards are not selectable

### Notes
- GUI errors are untouched
- Downloaded Node and I am now able to run the dev server
- New spells might be wildly unbalenced can't try them out yet feel free to tweak the numbers
- Shop may be buggy, can't test it without any way to access the shop

---
#### Next Steps
- fix GUI stuff
- Test full game loop end to end with both players (i already kinda did this and it is really quite fun) - hmu next time you want to try ts
- Missions system — completing missions to earn coins and points
- More spell types and component combinations
- Add shop to the frontend
- Hybrid components i.e. plasma that works as both fire or stardust