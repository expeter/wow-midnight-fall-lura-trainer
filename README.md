# L'ura Trainer

A browser-based movement trainer for practicing the L'ura encounter from a
top-down, player-focused 3D view.

The trainer covers the Intermission, a three-cycle Phase 2 sequence, two
sectors of Phase 3, and the four-quarter Phase 4 finale. You can practice the
complete transition chain or enter any phase directly.

The detailed [feature inventory, request convention, historical bug register,
and screenshot index](docs/README.md) document how the simulator evolved.

## What you can practice

- Six Intermission Starsplinter and boss-beam sets
- Crystal carrier drop, avoidance, and recovery timing
- Phase 2 cross-beam positioning, timed orb charges and returns, and center explosions
- Center pulls, personal-circle spreads, and crystal recovery
- Phase 3 outward flight, trio landing soaks, split-room positioning, light
  zones, dark-pool draining, runic lattices, ordered rune matching, and Dark
  Archangel crystal protection
- Phase 4 knock-up, protected raid-stack movement, sequential Starsplinters,
  Heaven & Hell sectors, and incoming fragments
- Test, Easy, Normal, and Hard difficulty settings; Test mode records mistakes
  without stopping the run
- Configurable 20-player raid plans, including names, classes, crystal
  assignments, start slots, separate Phase 2 soak/spread positions, and a
  Phase 3 initial-sector plan that rotates into the next sector
- Shareable raid-plan codes and locally saved settings
- Optional health reactions, main-ability casts, music, and adjustable HUD
- Per-phase results and a shareable full-run achievement card; Test mode also
  offers a clearly marked final-screen preview

## Controls

The defaults are:

| Action | Control |
| --- | --- |
| Move | `W` / `A` / `S` / `D` |
| Jump | `Space` |
| Drop crystal | `E` |
| Pause or resume | `P` |
| Health potion | `Q` |
| Shield | `R` |
| Main ability | `F` |
| Look without changing facing | Left mouse drag |
| Change view and player facing | Right mouse drag |
| Zoom | Mouse wheel |

Keyboard controls can be rebound from the setup screen. Camera position,
keybindings, raid plans, music preferences, and HUD placement are saved in the
browser.

## Run locally

Requires a current Node.js installation (the deployment workflow uses Node 22).

```bash
npm install
npm run dev
```

Vite will print the local URL to open in a browser.

## Test and build

Run the unit and component tests:

```bash
npm test
```

Run the browser tests:

```bash
npx playwright install chromium
npm run test:e2e
```

Create a production build:

```bash
npm run build
```

The generated site is written to `dist/`.

## Deploy with GitHub Pages

The repository includes a GitHub Actions workflow that tests, builds, and
deploys the site whenever `main` is pushed.

For a public GitHub repository:

1. Open **Settings → Pages** in the repository.
2. Set **Source** to **GitHub Actions**.
3. Push the `main` branch.
4. Follow the **Test and deploy to GitHub Pages** workflow in the Actions tab.

## Support and contact

Created by **Pestivator**, proud gnome.

- BattleTag: `pestivator#2515`
- Twitch: [twitch.tv/pestivator](https://www.twitch.tv/pestivator)
- Solana: `E684K1q1gzodtZK3xgdBXfTeRQbWWhSu8kVbzZNiw9Cz`

If the trainer helps your raid, the Solana address is available as a
“buy me a coffee” option. Please verify the complete address before sending
anything.

## License and attribution

The source code is released under the [MIT License](LICENSE).

Bundled background music is subject to the Pixabay Content License rather than
the MIT License. Track credits, provenance, and license details are documented
in [sounds/pixabay/README.md](sounds/pixabay/README.md).

This is an unofficial fan-made practice tool and is not affiliated with or
endorsed by Blizzard Entertainment. World of Warcraft and related names are
trademarks of Blizzard Entertainment.
