# Paranoid (Browser Remake)

A clean, modernized browser remake of the classic MS-DOS-style **Paranoid** brick breaker game.
This project is built with plain HTML, CSS, and JavaScript and runs locally by opening `index.html`.

## Overview

This MVP focuses on responsive gameplay, clear UI, smooth controls, and reliable state handling so the game remains stable across start, pause, win, lose, and restart flows.

## Features

- 🎮 **Fully playable MVP** with no external libraries
- 📱 **Responsive layout** that scales with browser width
- 🌌 **Animated dynamic background** and subtle glow/particle effects
- 🧭 **Start screen overlay** with instructions and action button
- 🧾 **HUD display** for score, lives, level, and current game state
- ⌨️ **Keyboard controls**:
  - Left Arrow / Right Arrow: move paddle
  - Space: launch ball, start game, or restart after game end
  - P: pause / resume
- 🧱 **Brick collision system** with multiple rows and brick durability
- ⚙️ **Increasing difficulty by level** (brick density/health + speed scaling)
- ✅ **State safeguards** to avoid broken gameplay flow:
  - Life decrement lock to prevent duplicate life loss in one drop event
  - Input/state transitions that prevent play from continuing after win/loss
  - Controlled restart path via `Space` or overlay button

## Project Structure

- `index.html` — app structure, HUD, canvas, overlays
- `styles.css` — responsive layout, dynamic animated visuals, UI styling
- `game.js` — game logic, update/render loop, collisions, levels, states
- `README.md` — documentation

## Run Locally

1. Clone or download this repository.
2. Open `index.html` directly in a modern browser.
3. Start playing immediately (no build step required).

## Controls Quick Reference

- **← / →**: Move paddle
- **Space**:
  - Start game from start screen
  - Launch ball when attached to paddle
  - Restart after win/loss
- **P**: Pause/Resume

## Basic Quality Checks

Before committing, run quick syntax checks:

```bash
node --check game.js
```

You can also launch and verify manual behavior:

- Start screen appears on first load
- Space launches ball only when in playable state
- Ball/paddle/wall/brick collisions work consistently
- Lives decrease once per miss event
- Game stops on win/lose and waits for restart

## Future Enhancements

- Audio effects and retro soundtrack toggle
- Power-ups (multi-ball, expand paddle, laser shot)
- Touch controls for mobile-first play
- Saveable high-score table with local storage
- Additional level patterns and boss waves

---

Built as a polished, maintainable baseline for extending classic arcade gameplay in the browser.
