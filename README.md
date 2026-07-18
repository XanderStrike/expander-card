# expander-card

Minimal, dependency-free replacement for the [lovelace-expander-card](https://github.com/MelleD/lovelace-expander-card).

The original is a Svelte 5 + Lit card with a big dependency tree (with annoying
_weekly_ dependency bump updates, come on) and a zillion config knobs. I only
ever use it as: a title, a chevron toggle, and a stack of child cards that
animate open/closed. 

So this is a single `expander-card.js` file written in plain HTML/JS/CSS with
no build step. As it should be.

I'm not really sure why, but this also animates smoother.

<details>
   <summary>Demo:</summary>

   

https://github.com/user-attachments/assets/0768b5ab-01a4-4841-a17d-280a8ee81df7


</details>

## Install

1. Copy `expander-card.js` into your HA `config/www/` folder.
2. Add a resource (Dashboard → Resources → Add, or in YAML):
   ```yaml
   resources:
     - url: /local/expander-card.js
       type: module
   ```
3. Use `type: custom:expander-card` exactly as before. Existing YAML works
   unchanged — anything other than `title` and `cards` is ignored.

## Config

Only two keys are read; everything else is hardcoded to my defaults.

| key    | type     | notes                                            |
|--------|----------|--------------------------------------------------|
| title  | string   | Header label                                     |
| cards  | list     | Child Lovelace card configs, shown when expanded |

Hardcoded behavior (matches how I used the original):
- starts collapsed, animates open/close (~350ms)
- card background kept (`clear: false`)
- child cards get transparent background/border/shadow (`clear-children: true`)

Example:

```yaml
type: custom:expander-card
title: Cryo
cards:
  - type: entities
    entities:
      - entity: sensor.glances_cryo_cpu_usage
        name: CPU
```
