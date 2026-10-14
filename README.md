# Revolution

A desktop and cab theme. A wheel carousel runs down the left, and beside it the selected
table's playfield video or picture, its name, its cabinet picture and the features it ships
with. Pressing a flipper key slides the wheel one card; a page jump cuts. On a tall cabinet
screen the wheel runs along the bottom instead.

![Revolution](preview.png)

Requires VPinFE 3.0 or later (`min_vpinfe` in `manifest.json`). This is the 3.0 rebuild of
Revolution, so its version is 2.0.0.

## What is here

```
manifest.json         name, version, author, min_vpinfe and the windows the theme draws
options.json          the options a person can change, with their defaults
index_playfield.html  the playfield page
style.css             the look
theme.js              the behavior
locales/en.json       the theme's own words; add <language>.json to translate them
img/                  collection_background.png, the picture the picker shows
preview.png           shown in the theme list
```

## The two JSON files

JSON cannot carry comments, so what each field does is here.

`manifest.json`

| Field | What it does |
| --- | --- |
| `name`, `version`, `author`, `description` | Shown in the theme list. `version` is the theme's own release number |
| `preview_image` | The screenshot shown in the theme list |
| `type` | `both`: the theme adapts to a desktop screen or a cabinet |
| `min_vpinfe` | The oldest VPinFE that can run the theme |
| `windows` | The pages the theme draws. Revolution draws `playfield` only, so core's backglass and score view pages are used |
| `change_log` | A string, shown as "What's new" to someone installing or updating the theme |

`options.json` declares what a person can change under the theme's settings. Revolution
declares one:

| Key | Type | Default | What it does |
| --- | --- | --- | --- |
| `startCollectionSelection` | boolean | off | Opens the collection picker when the theme starts, instead of the collection last set |

The key is the one Revolution 1.x used, so a choice made there carries over.

## The four parts of theme.js

`theme.js` has four parts, in this order, each commented:

1. **Options** - read what `options.json` declared from `vpin.themeConfig`.
2. **The wheel** - seven cards, five in view, built once and refilled on every move. A step
   slides them back into place from where their pictures were a moment ago; a page jump
   cuts. A card shows the table's wheel, a collection's picture, or the name when there is
   no picture. A list shorter than seven keeps the selection in the middle.
3. **The selection** - draw the selected table: name, manufacturer, year and type, authors,
   the cabinet picture when there is one, the features (Nfozzy, Fleep, SSF, FastFlips, LUT,
   Scorbit, FlexDMD) and the add-ons (AltSound, AltColor, PuP-Pack). A tag the table lacks is
   dimmed, so the rows read the same from table to table. In the collection picker the same
   area shows the collection's name, its table count and `img/collection_background.png`.
4. **Messages** - hand every message to core, then redraw. Only a single step slides.

## The page

| Element | What it holds |
| --- | --- |
| `#track` | The wheel's seven cards |
| `#art` | Marked `data-vpin-media="playfield"`, so core fills it with the table's playfield video or picture. The theme asks core to turn it when the cabinet screen is sideways |
| `#collection-art` | `img/collection_background.png`, shown in the picker in place of `#art` |
| `#cab`, `#name`, `#eyebrow`, `#meta` | The cabinet picture, the name, the line above it and the line below it |
| `#features`, `#addons` | The two tag rows |

The page's outermost element carries `vpinfe-upright`, so core can turn the whole page for a
cabinet screen mounted on its side. Sizes in `style.css` are in `vmin` or a share of the
panel, so the page keeps its shape on a wide screen and a tall one.

## What core does, so this theme does not

| Core handles | The theme's part |
| --- | --- |
| Keys, buttons and the remote: stepping, paging, the menu and the collection picker | Launch on `select` |
| Moving the selection and wrapping around the list | Draw the cards (`activeList().indexAfter`) |
| Choosing the table's media and its fallbacks | Mark `#art` with `data-vpin-media` |
| Audio for the selected table | Nothing |
| Preloading the neighbors | Nothing |
| Turning the page and the art for a sideways cabinet screen | `vpinfe-upright` on the stage, and one call to turn the playfield picture |
| The loading indicator while a table starts | Restyle `.vpinfe-launch-spinner` |
| Attract mode | Nothing |
| The backglass and score view pages | Nothing: Revolution ships none, so core's are used |

## Opt-outs

Revolution uses none. There is no `config.json`.
