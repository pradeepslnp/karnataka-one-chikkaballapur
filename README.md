# karnataka-one-chikkaballapur

Website for KARNATAKA ONE, an online & citizen services centre on District Hospital Road, Chikkaballapur.

It is a static site: upload the folder to any web host (GitHub Pages, Netlify, cPanel…) and open `index.html`. No build step is needed to run it.

## Editing shop details

Everything the owner usually changes lives in **`assets/js/config.js`**:

- `SHOP` — name, address, landmark, timings, phone, WhatsApp number, map location.
  `hours` drives the live "Open now / Closed" badge (India time).
- `SERVICES` — each service card, its icon and its "Documents to bring" list.
  `featured: true` makes a card larger on wide screens.

## How it's built

| Path | What it is |
|---|---|
| `index.html` | Page structure and icons |
| `assets/css/tokens.css` | Colours, type, spacing, shadows, motion timings |
| `assets/css/base.css` | Reset, buttons, header, mobile menu, action bar, cursor |
| `assets/css/sections.css` | Hero, services, how it works, location, enquiry, footer |
| `assets/js/main.js` | Fills the page from `config.js`; checklist, enquiry form (WhatsApp), navigation |
| `assets/js/hero.js` | Floating document sheets (CSS 3D), pointer and scroll response |
| `assets/js/sheet-art.js` | Draws the sheet artwork |
| `assets/js/scene3d.js` | WebGL version of the hero (built from `src/scene3d.js`) |
| `assets/js/pointer.js` | Custom cursor, magnetic buttons, card tilt |
| `assets/js/motion.js` | GSAP / ScrollTrigger reveals, Lenis smooth scroll |
| `assets/vendor/`, `assets/fonts/` | Self-hosted GSAP, ScrollTrigger, Lenis and the Archivo font |

Effects are layered so the site stays fast for everyone:

- **Every device:** full content and functionality, CSS 3D hero.
- **Motion allowed:** GSAP entrance and scroll animations.
- **Mouse/trackpad:** custom cursor, magnetic buttons, card tilt, smooth scrolling.
- **Capable desktop GPU:** WebGL hero (Three.js), loaded lazily after the page is idle.
- **Reduced motion:** no animation libraries are downloaded at all.

## Rebuilding the WebGL hero or updating libraries

Only needed if you change `src/scene3d.js` or want newer library versions:

```sh
npm install
npm run build    # rebuilds assets/js/scene3d.js
npm run vendor   # recopies GSAP, Lenis and the font into assets/
npm run serve    # local preview at http://localhost:5173
```
