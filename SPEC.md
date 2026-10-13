# SPEC: Antwerp rooftop apartment, walk-through simulation

**Status:** Step 1 (analysis), revision 2, updated with your answers. No code yet; **waiting for your approval before Step 2.**

All dimensions are estimates scaled from the photos, using known object sizes as references (door 0.90 m, hob 0.60 m, bed 1.40 m). They will become values in `src/apartment.config.js`.

**Placeholders filled in**

| Placeholder | Value |
|---|---|
| City / street | **Antwerp, Frankrijklei**, east side of the boulevard, opposite the church (lat ≈ 51.2135° N, lon ≈ 4.4105° E, Europe/Brussels) |
| Size | ≈ **53 m² net / ~60 m² gross** (your go-ahead to use my estimate), plus a ≈ **33 m²** roof terrace |
| Bedrooms | **1** (double bed, 140 × 200 assumed), through the **left** corridor door |
| Bathroom | through the **right** corridor door: built-in bath with hand shower, oak vanity, wall-hung WC |
| Landmark | the former **Onze-Lieve-Vrouw van Gratiekerk** (Frankrijklei 89), a neo-Gothic Jesuit church, now **Theater Elckerlyc**'s events venue |

---

## 0. Photo index

These are cropped from your screenshots, with the phone UI removed. The listing has 12 photos and I have 9 of them. You said you'll add the rest; I'll fold them in as they arrive.

| File | Listing | Shows |
|---|---|---|
| `01.jpg` | 10/12 | Split photo. **Left:** bedroom. **Right:** view from the bedroom window (galvanised ladder, brick parapet, city, crane). |
| `02.jpg` | Terras | Split photo. **Left:** the church (hero landmark). **Right:** dining table in front of the tall white wall. |
| `03.jpg` | ? | Living room looking at the TV corner, window and sliding door. |
| `04.jpg` | ? | Kitchen, shot from the corridor over the bar. |
| `05.jpg` | ? | From the sofa down the corridor (entrance, cactus, bar and stools, desk nook). |
| `06.jpg` | ? | Diagonal view: entrance wall, corridor mouth, pillar, kitchen, olive tree. |
| `07.jpg` | 1/12, Terras | Terrace: L-lounge corner, storage cabinet, chimney, dining table, skyline. |
| `08.jpg` | 9/12, Badkamer | Split photo. **Left:** bath with black mixer, window, plant, towel radiator, vanity. **Right:** WC ledge with decor. |
| `09.jpg` | Werkplek | Split photo. **Left:** desk with cork panel, vase, lamp, mirror. **Right:** leaning framed print and stoneware jug. |

---

## 1. Floor plan

### Conventions
- **Plan north** points up, toward the corridor's end window.
- `x` runs east (right) and `y` runs south (down), in metres. The origin is the NW inside corner of the bedroom. `h` is height above the finished floor; on the terrace it's height above the deck.
- In Three.js: `x → x`, `y → z`, `h → y`.
- Ceiling 2.60 m. Lowered headers/soffits at **2.35 m**: over the corridor mouth, and over the whole kitchen (with downlights).
- Exterior walls 0.30 m, partitions 0.10 m.
- The apartment floor is ≈ **26 m above street level** (top floor, about the 9th). I estimated this from the church photo: the eye line falls at about the height of the towers' balustrades.

### Real orientation

**Result:** plan-north points to **true east** (bearing ≈ 90°, ±20°). In the config this is `site.planNorthBearingDeg = 90`.

**How I derived it**
1. Frankrijklei runs roughly NNE–SSW (bearing ≈ 18°/198°).
2. The church (Frankrijklei 89) stands on the inner-city (west) side with its façade on the boulevard. Looking at it from across the street therefore means looking ≈ **WNW (≈ 288°)**.
3. In the photos, the church sits at plan-bearing ≈ 198° (just west of plan-south, over the south parapet near the tall wall).
4. 288° − 198° ≈ 90°, so plan bearings are rotated ≈ +90°.

| Plan direction | True direction | What is there |
|---|---|---|
| plan-south | **west** | terrace, sliding door, living-room window, the church across the boulevard |
| plan-east | **south** | lounge side of the terrace (view in `07`) |
| plan-north | **east** | corridor desk window |
| plan-west | **north** | bedroom window |

**Cross-check:** in `07` the chair shadows point plan-NW, so the sun was plan-SE, which is true SW. That means the listing photo was taken in the afternoon, which is consistent.

**Bonus:** the terrace faces west, so the low sun lands on it in the afternoon and evening. In mid-August or late April the sun sets almost exactly behind the church spires (sunset azimuth ≈ 290°). I'll default the date to **20 August**, so the "Sunset" preset and the cinematic push toward the church line up. The date stays configurable.

### ASCII plan (1 character ≈ 0.15 m wide, 1 line ≈ 0.30 m)

```

 ###########################::::::###################
 #########################+-------+ ########+WC-+####
 ###   BEDROOM 3.2x2.9  ##+DESK---+         +---+ ###
 ###                    ##        D BATH 2.3x1.8  ###
 ###     +--------+                     +---------+:#
 ###     |        |     D         #+---+|  BATHTUB|:#
 #:#     | BED    |               #|van||         |:#
 #:#     |140x200 |       CORR  +--+---++---------+##
 #:#ns   |        |     ##1.4w  |     |HOB+OV |snk|##
 #:# +--+|        |     ##      | BAR +-------|   |##
 ####+--+headbrd--+#######   ss |     |       |   |##
 #########################   ss |     |KITCHEN|cof|##
            (stair landing)     |     |       |   |##
                        ##      +-----+       +FRG+##
       #### FRONT ########        ####        |   |##
       ####       ####cac#        ####        +---+##
       ###                                     OL ###
       ###                                        ###
       ###  LIVING 6.2 x 4.6                      ###
       ###            +------------------+        ###
       ###            |     SOFA         |        ###
       ###            |                  |        ###
       ###            +-----+------------+        ###
       ###            |     | +------+            ###
       ###            |chaise |coffee|            ###
       ###            |     | +------+            ###
       ###        bsk +-----+                     ###
       ##+---------------------+        TV/sideb  ###
       ##|oak step platform    |        +------+#####
       ##+---------------------+        +------+#####
       ########                ######################
     ##########//SLIDING-DOOR//#::::::::#######+---+#
     ###screen                                 |   |~
     ###                                       |cab|~
     ###                                       |   |~
     ###   ROOF TERRACE  6.8 x 5.0             +---+~
     ###                                    +----+  ~
     ###           wc                       |    |  ~
     ###                                    |    |  ~
     ###         +-----+                    |    |  ~
     ###         |     |                    |    |  ~
     ###      rc |     |                o   |    |  ~
     ###         |TABLE|                    |    |  ~
     ###         |     | rc                 |    |  ~
     ###         |     |          +---------+    |  ~
     ###ladder   +-----+          |LOUNGE   |    |  ~
     ###                          +---------+----*  ~
     ###                                            ~
     ##~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
```

**Legend:**
- `#` wall
- `:` window
- `//` sliding door
- `D` interior door
- `~` terrace parapet (1.1 m, white boards)
- `ss` bar stools
- `OL` olive tree
- `cac` cactus
- `bsk` basket
- `ns` nightstand
- `van` vanity
- `cab` storage cabinet
- `o` round side table
- `wc` white string chair
- `rc` red folding chairs
- `*` olive tree and palm in the lounge corner

### Rooms

| Room | x range | y range | Size | Floor | Notes |
|---|---|---|---|---|---|
| Bedroom | 0.00–3.20 | 0.00–2.90 | 3.2 × 2.9 ≈ 9.3 m² | oak (assumed) | **Left** corridor door. Window in the west wall (true north) near the SW corner. |
| Corridor | 3.30–4.70 | 0.00–4.20 | 1.4 m to the bar base; **1.1 m clear** past the bar overhang | oak planks running N–S | Desk across the north end, under the window. |
| Bathroom | 4.80–7.10 | 0.00–1.80 | 2.3 × 1.8 ≈ 4.1 m² | light-grey tiles (assumed) | **Right** corridor door. Bath along the south wall, window above the bath's east end, WC with a ledge on the north wall, vanity in the SW corner. |
| Kitchen (U-shape) | 4.70–7.10 | 1.90–4.20 | 2.4 × 2.3 ≈ 5.5 m² | light-grey 60 × 60 tiles | Open to the corridor above the bar, and open to the living room between the pillar and the fridge column. |
| Living room | 0.90–7.10 | 4.20–8.80 | 6.2 × 4.6 ≈ 28.5 m² | oak planks running N–S | Front door in the north wall. Sliding door and window in the south wall. Chimney breast in the SE corner. |
| Stair landing | 0.90–3.20 | 3.10–4.00 | n/a | n/a | Outside the flat. Shown only as a dim volume behind the front door. |
| Roof terrace | 0.60–7.25 | 9.10–14.05 | 6.6 × 5.0 ≈ 33 m² | grey weathered decking, boards E–W | South and east parapets are white boards. The west side is a tall white rendered wall (~6 m). |

### Openings

| Id | Where | Position | Size (w × h) | Notes |
|---|---|---|---|---|
| Front door | living north wall, y = 4.20 | x 1.25–2.15 | 0.90 × 2.10 | Hinge on the west side, opens into the living room. |
| D-bed | corridor west wall, x = 3.30 | y 1.00–1.85 | 0.83 × 2.15 | Oak leaf in a black steel frame. Opens into the bedroom. |
| D-bath | corridor east wall, x = 4.70 | y 0.30–1.13 | 0.83 × 2.15 | Same door type. Opens into the bathroom. |
| Corridor mouth | living north wall | x 3.30–4.70 | 1.40 × 2.35 (header) | n/a |
| Kitchen opening | living north wall | x 5.10–6.50 | 1.40 × 2.35 (soffit) | n/a |
| Bar pass-through | corridor east side | y 1.90–3.80, from the counter up to 2.35 | n/a | No wall above the bar. |
| W-desk | corridor north wall | x 3.72–4.48 | 0.76 × 1.35, sill h 0.85 | White PVC tilt-turn window with a lower fixed panel. |
| W-bed | bedroom west wall | y 1.75–2.60 | 0.85 × 1.35, sill h 0.90 | White PVC. Bluestone sill. Radiator below. |
| W-bath | bathroom east wall | y 1.05–1.75 | 0.70 × 1.10, sill h 0.75 | White PVC. Deep reveal. Directly above the bath end. |
| W-living | living south wall | x 4.40–5.35 | 0.95 × 1.40, sill h 0.90 | 0.30 m deep reveal, white sill, black roller blind. |
| Sliding door | living south wall | x 1.80–4.00 | 2.20 × 2.10, sill h 0.40 | White PVC lift-and-slide. The east leaf slides and has the handle. |

---

## 2. Inventory

Format:
- Size is **W × D × H** in metres.
- Position is **(x, y)** of the centre in plan coordinates, plus **h** (bottom or centre height, as noted).
- Colours are base albedo. I sampled them from the photos and corrected for over-exposure; `05`, `06` and `08` are very bright.

### 2.1 Shared surfaces and materials

| Surface | Material | Colour | Notes | Photo |
|---|---|---|---|---|
| Walls | matte plaster/paint | `#EFEDE8` | Slightly warm white. | all |
| Ceiling | matte paint | `#F4F3F0` | n/a | 05, 06 |
| Floor (living, corridor, bedroom) | wide **light oak planks**, matte white-oiled | base `#CDB293`, planks vary `#BFA27F` to `#DCC3A4` | Planks 0.20 × 2.0–2.4 m, soft knots, very fine joints. | 03, 05, 06 |
| Kitchen floor | porcelain tiles, matte | `#B5B2AE`, joints `#9C9995` | 0.60 × 0.60. Tiles end at y = 4.20 and at the bar base. | 05, 06 |
| Skirting | white painted | `#F2F1EE` | 0.07 high × 0.012 thick. | 05, 06 |
| Interior doors | **oak veneer leaf** with vertical grain, slim **black steel frame** (~25 mm) | leaf `#BFA285`, frame `#1C1C1C` | Black lever and rose. No architrave. | 05, 06 |
| Window frames | white PVC | `#F5F5F3` | Deep plastered reveals (~0.30 m). | 01, 03, 05, 08 |
| Switches and sockets | white rocker / Belgian-type socket | `#F3F2EF` | n/a | 01, 03, 05, 06 |

### 2.2 Entrance (living room north wall, west part)

| Object | Material | Colour | Size | Position | Photo |
|---|---|---|---|---|---|
| Front door | flush painted door, white architrave (0.07) | `#ECEAE6` | 0.90 × 0.05 × 2.10 | x 1.25–2.15, y 4.20 | 05, 06 |
| Door hardware | satin stainless lever, separate cylinder rose, 3 white barrel hinges (west edge) | `#B9BBBD` | lever 0.13 | lever h 1.05 | 05, 06 |
| Peephole | chrome ring | `#8E9093` | Ø 0.02 | h 1.55 | 05, 06 |
| Wall box near door-top height (door-entry unit or alarm sensor) | white plastic with a black slot | `#F1F0EE` | 0.08 × 0.04 × 0.20 | (2.30, 4.20), h 1.95 | 05, 06 |
| Second wall box (handset or thermostat) | white plastic | `#F1F0EE` | 0.08 × 0.03 × 0.13 | (2.30, 4.20), h 1.22 | 05, 06 |
| Double rocker switch | white | `#F3F2EF` | 0.08 × 0.08 | (2.25, 4.20), h 0.95 | 06 |
| Hook rail with **6 hooks** | black powder-coated steel | `#1A1A1A` | 0.30 × 0.03 × 0.03 | x 2.45–2.75, h 1.55 | 05, 06 |
| Columnar cactus (euphorbia) | 1 main stem plus 5–6 upright arms | `#36442C` | 0.25 × 0.25 × 0.85 | on the stool | 05, 06 |
| Cactus pot | weathered unglazed terracotta cylinder | `#A88466` | Ø 0.22 × 0.22 | on the stool | 05, 06 |
| Rustic teak stool | solid teak, dished seat, splayed legs with a stretcher | `#A47A58` | 0.45 × 0.25 × 0.45 | (2.95, 4.40) | 05, 06 |
| Round straw wall hanging | raffia/palm-leaf disc with a long fringe | `#C9A574` | Ø 0.85, 0.06 deep | west wall (0.90, 5.40), centre h 1.80 | 05 |

### 2.3 Corridor and desk nook ("Werkplek")

| Object | Material | Colour | Size | Position | Photo |
|---|---|---|---|---|---|
| Wall-to-wall desk top | **knotty pine/spruce**, honey, rounded edges, visible knots and water rings | `#DDB483` | 1.40 × 0.50 × 0.03 | x 3.30–4.70, y 0.05–0.55, top h 0.75 | 05, 09 |
| Drawer unit (left support) | matte black, 3 drawers with finger-hole cut-outs (IKEA Alex-like) | `#1E1E1E` | 0.36 × 0.48 × 0.72 | x 3.30–3.66 | 05, 09 |
| Right support | black steel A-frame trestle leg | `#1A1A1A` | 0.05 × 0.45 × 0.72 | x 4.55 | 05 |
| Cork backsplash panel | cork board, leaning upright against the west wall at the desk end | `#9A7A5A` | 0.50 × 0.01 × 0.25 | on the desk at x 3.31 | 05, 09 |
| Wishbone chair | light oak/beech frame, natural paper-cord seat | frame `#D6B48A`, seat `#CDB28A` | 0.55 × 0.51 × 0.76 | (4.05, 0.75), facing north | 05, 09 |
| Rattan sunburst mirror | rattan rays, round mirror centre, hanging loop | `#C8A57E` | Ø 0.50 (mirror Ø 0.18) | north wall, x 3.55, h 1.55 | 05, 09 |
| Stoneware vase | rustic grey-brown, bulbous with a narrow neck | `#76685D` | Ø 0.20 × 0.32 | desk, x 3.55 | 05, 09 |
| Dried flowers | yarrow/tansy-like heads, beige-yellow with a few rust-red | `#C9B57A` / `#B5503A` | 0.30 tall | in the vase | 09 |
| Desk lamp | **faceted light-wood block base**, thin black stem, white linen tapered drum shade | base `#C9A27A`, shade `#F1ECE3` | Ø 0.17 × 0.32 | desk, x 3.85 | 05, 09 |
| Framed print, leaning | black frame, wide white mat, square of handmade (deckled) paper | `#141414` / `#F4F2EE` / `#E8E3DA` | 0.50 × 0.02 × 0.55 | desk, NE corner, leaning on the north wall | 05, 09 |
| Stoneware jug | rustic **grey-blue**, weathered lighter patches, one handle | `#5F6869` | Ø 0.16 × 0.20 | desk in front of the print, x 4.40 | 05, 09 |
| Ceiling light | small flush round fitting | `#F2F2F2` | Ø 0.20 | ceiling, (4.00, 0.80) | 05 |
| Double spotlight | chrome twin-spot bar | `#BFC2C4` | 0.20 | east wall above D-bath, h 2.30 | 05 |
| Smoke detector | white disc | `#F5F5F5` | Ø 0.10 | ceiling, (4.00, 3.60) | 06 |

### 2.4 Kitchen (U-shape: bar on the west, cooking run on the north, sink/coffee/tall units on the east)

| Object | Material | Colour | Size | Position | Photo |
|---|---|---|---|---|---|
| **Countertop (all runs)** | **walnut HERRINGBONE**, blocks ~0.35 × 0.07 at 45°, oiled, 40 mm | base `#7A4A32`, blocks vary `#5E3524` to `#9A6346` | 0.60 deep, h 0.92 | all runs | 04, 05, 06 |
| Bar / peninsula | walnut top overhangs **0.30 into the corridor**. White base with drawers facing east. | white `#F2F2F0` | top 0.90 × 1.90 | top x 4.40–5.30, base x 4.70–5.30, y 1.90–3.80 | 04, 05, 06 |
| Base cabinets | flat white, handleless (shadow-gap grip), satin | `#F2F2F0` | 0.60 deep, plinth 0.10 | all runs | 04, 06 |
| Built-in oven | stainless fascia, black glass door, bar handle, 2 knobs and a display | `#B8BBBE` / `#1E2226` | 0.60 × 0.60 | under the hob, facing south | 06 |
| Induction hob | black glass | `#121314` | 0.58 × 0.51 | north run, (5.70, 2.20) | 04, 06 |
| Extractor hood | brushed stainless chimney plus flat telescopic visor | `#B4B6B8` | chimney 0.24 × 0.20; visor 0.60 × 0.50 × 0.05 | visor bottom h 1.55, chimney up to the soffit | 04, 06 |
| Round sink | stainless, inset | `#A9ACAF` | Ø 0.40 | east run, (6.80, 2.30) | 04 |
| Tap | brushed stainless, tall angular arched spout, side lever | `#9EA1A4` | 0.30 tall | behind the sink | 04 |
| Wall unit with microwave | white upper cabinet; stainless microwave with black window | `#F2F2F0` / `#B8BBBE` | 0.60 × 0.35 × 0.95 | east wall, y 2.65–3.25, h 1.40–2.35 | 04 |
| Tall fridge column | white, 3 doors | `#F2F2F0` | 0.60 × 0.60 × 2.35 | (6.80, 3.90) | 04 |
| Coral palm print | thin oak frame, coral print of a yucca/dracaena | `#B08A5E` / `#E48C78` / `#5E8A6A` | 0.30 × 0.40 | east wall, (7.10, 2.25), h 1.55 | 04 |
| Capsule coffee machine | black plastic with chrome | `#1A1B1D` | 0.13 × 0.37 × 0.28 | (6.80, 3.15) | 04 |
| Capsule jar | glass with metal lid, mixed capsules, on a cork mat | capsules `#C9A35A` | Ø 0.10 × 0.20 | (6.80, 3.35) | 04 |
| Olive-wood cutting boards (×2) | 1 long paddle and 1 organic round board, leaning in the NE corner | `#B9874F` | 0.25 × 0.60 and 0.30 × 0.30 | (7.00, 2.00) | 04 |
| Lidded ceramic pot | matte sand glaze | `#D9C8B5` | Ø 0.15 × 0.13 | next to the tap | 04 |
| Terracotta bowl with 4 oranges | glazed terracotta | `#C2643A` / `#F08A2A` | Ø 0.28 × 0.07 | (6.25, 2.25) | 04, 06 |
| Olive-oil bottles (×2) | dark green glass, labels | `#2F3F25` | Ø 0.06 × 0.28 | next to the hob | 04 |
| Wicker-wrapped bottle | glass, cork, raffia wrap | `#C9A774` | Ø 0.10 × 0.28 | on the bread bin | 04, 06 |
| Roll-top bread bin | acacia | `#C08A55` | 0.40 × 0.27 × 0.22 | bar north end, (4.95, 2.20) | 04, 05, 06 |
| Small yellow dish | yellow glaze, green motif | `#F2D23C` | 0.14 × 0.10 | on the bread bin | 04, 05 |
| Bar stools (×2) | dark-stained hardwood, saddle seat, splayed legs, 2 rungs | `#5E2F1E` | 0.38 × 0.26 × 0.66 | (4.15, 2.75) and (4.15, 3.25) | 05, 06 |
| Recessed downlights | white trim | `#F5F5F5` | Ø 0.08 | soffit: 2 above the bar, 2 in the kitchen | 05, 06 |
| Pillar | plaster | wall colour | 0.40 × 0.40 × 2.60 | x 4.70–5.10, y 3.80–4.20 | 05, 06 |

### 2.5 Living room

| Object | Material | Colour | Size | Position | Photo |
|---|---|---|---|---|---|
| L-sectional sofa | **greige/taupe velvet or fine corduroy**, dark piping on the arm | `#A39189`, piping `#4A403C` | main 2.90 × 1.00; seat h 0.45, back h 0.80, arm h 0.62 | x 2.80–5.70, y 5.40–6.40, faces south | 03, 05, 06 |
| Chaise (west end) | same fabric | `#A39189` | 0.95 × 1.15 extra | x 2.80–3.75, y 6.40–7.55 | 03, 05 |
| Macramé cushion | cream cotton, fringed | `#EDE7DD` | 0.50 × 0.50 × 0.12 | west seat | 05 |
| Coffee table | 19 mm glass **rounded-triangle** top (Noguchi-style) on two interlocking curved wooden base pieces | glass tint `#DCEBEA`, wood `#B8743F` | 1.27 × 0.92 × 0.40 | (4.55, 7.15) | 03 |
| Tray with props | wooden tray; marbled pillar candle; 2 brass candlesticks with thin white tapers; small ceramic bowl | `#8A5A35` / `#E8E4DE` / `#C9A44C` / `#E9E3DA` | tray 0.40 × 0.28 | on the table | 03 |
| Sideboard | oak frame, **cane webbing** on 2 doors, thin black rod legs | `#C49464` / `#DDBB8E` / `#1A1A1A` | 1.10 × 0.40 × 0.62 | x 5.55–6.65, against the south wall | 03 |
| TV | ~32" LCD, black, plus a small black box | `#151515` | 0.78 × 0.20 × 0.52 | on the sideboard, facing north | 03 |
| Table lamp | terracotta/rose-beige ceramic column base, white linen drum shade, small dish in front | `#A87F70` / `#F1EEEA` | Ø 0.25 × 0.55 | sideboard, west end | 03 |
| Pencil portrait | graphite on cream paper, **wavy/scalloped dark wood frame** | `#4A3226` / `#EEE9E0` | 0.25 × 0.35 | south wall, x 5.55, centre h 1.75 | 03 |
| Roller blind | black fabric in a cassette, beaded chain pull | `#2B2F38` | 0.95 wide | top of W-living | 03 |
| Sill decor | small white objects | `#F1F1F1` | ~0.12 | on the window sill | 03 |
| **Oak step platform** | solid light oak, 2 tiers | top `#D4AE84`, risers `#C69872` | upper tier 0.50 deep, h 0.40; lower step 0.30 deep, h 0.20 | x 0.95–4.25, y 8.00–8.80 | 03 |
| Chimney breast | plaster (flue for the roof chimney) | wall colour | 0.45 × 0.45 × 2.60 | x 6.65–7.10, y 8.35–8.80 | 03, 07 |
| **Olive tree** (one tree) | olive in a **glossy navy/black glazed pot** on a **teak mushroom stool** | pot `#1E2433`, stool `#9B6F4E`, leaves `#7E8A6A`, trunk `#6B6253` | pot Ø 0.30 × 0.26; stool Ø 0.32 × 0.45; tree ~1.6 above the pot | **Default: next to the kitchen's fridge column, (6.75, 4.65)** (your description and `06`). Config switch `oliveTree.spot = 'eastWall'` moves it to (6.80, 7.55) to match `03`. | 03, 06 |
| Woven basket | seagrass/jute with handles | `#A47E5B` | Ø 0.40 × 0.45 | (2.35, 7.70) | 03 |

### 2.6 Bedroom

| Object | Material | Colour | Size | Position | Photo |
|---|---|---|---|---|---|
| Bed | **black headboard**, white bedding | `#2A2A2E` / `#F4F2EE` | mattress 1.40 × 2.00; headboard 1.50 wide × 1.05 tall | x 0.90–2.30, y 0.90–2.90, headboard on the south wall | 01 |
| Throw | sand/oat woven cotton with a **black tufted line motif** | `#D9C3A0` / `#1A1A1A` | 1.60 × 1.20 | lower two-thirds of the bed | 01 |
| Pillows (×3) | blush/peach washed linen | `#D3AC90` | 0.65 × 0.45 | against the headboard | 01 |
| Macramé cushion | cream, fringed | `#EDE7DD` | 0.45 × 0.45 | in front of the pillows | 01 |
| Nightstand | light wood frame, cane-webbing door | `#B88A60` / `#D9B98C` | 0.42 × 0.38 × 0.50 | (0.57, 2.70) | 01 |
| Bedside lamp | speckled grey-green ceramic gourd base, white pleated shade | `#5F6253` / `#F3F0EA` | Ø 0.20 × 0.38 | on the nightstand | 01 |
| Small brass dish | brass | `#C9A44C` | Ø 0.10 | on the nightstand | 01 |
| Wall sconce | bamboo/rattan slat half-cylinder | `#C7A27C` | 0.30 × 0.15 × 0.28 | south wall, x 2.05, h 1.85 | 01 |
| Light switch | white rocker | `#F3F2EF` | 0.08 | south wall, x 0.80, h 1.15 | 01 |
| Window | white PVC, deep reveal, **dark bluestone sill** | sill `#7F7A74` | see openings | west wall | 01 |
| Radiator | white panel radiator, valve, pipe | `#F2F2F0` | 0.70 × 0.10 × 0.60 | under the window, h 0.15 | 01 |
| Ceiling bulkhead | plastered box over the window | wall colour | ~0.25 deep | along the west wall | 01 |
| View outside | galvanised steel fixed ladder (tube stiles, rungs every 0.30, scaffold clamps) ~0.6 m outside the glass; old **red-brick parapet** with concrete coping; city beyond | `#8F959A` / `#A0533E` / `#B8BDC0` | ladder 0.45 wide | outside W-bed | 01 |

### 2.7 Bathroom

| Object | Material | Colour | Size | Position | Photo |
|---|---|---|---|---|---|
| Walls | smooth white, no visible grout (paint or microcement) | `#F1F0EE` | n/a | n/a | 08 |
| Floor | light-grey tiles, same as the kitchen (**assumed**, not visible) | `#B5B2AE` | 0.60 × 0.60 | n/a | n/a |
| Built-in bath | white acrylic tub in a **plastered/solid-surface surround** with a flat deck. The deck widens at the corner, where the plant stands. | `#F4F4F2` | 1.60 × 0.80, deck h 0.58 | x 5.50–7.10, y 1.00–1.80 | 08 |
| Bath/shower mixer | **matte black** wall-mounted bar mixer with a black hand shower and hose hanging into the bath | `#1A1A1A` | 0.30 wide | east wall under the window, h 0.75 | 08 |
| Window | white PVC, deep reveal | `#F5F5F3` | see openings | east wall above the bath end | 08 |
| Ladder towel radiator | white steel, horizontal tubes; black valve fittings below | `#F4F4F2` / `#1A1A1A` | 0.50 × 0.08 × 1.20 | south wall above the bath, x 6.35, h 1.05–2.25 | 08 |
| Bird-of-paradise plant | Strelitzia, 6–8 large paddle leaves on long stems | `#2F5A2E` | ~1.1 tall | on the bath deck in the SW corner of the bath, (5.62, 1.68) | 08 |
| Plant pot | glossy white round pot | `#F2F0F0` | Ø 0.20 × 0.17 | on the deck | 08 |
| Vanity | light oak, 2 handleless drawers, **dark grey/black top** with an integrated basin | `#D8BFA0` / `#2E2F31` | 0.60 × 0.48 × 0.85 | SW corner, x 4.85–5.45, y 1.30–1.80 | 08 |
| Mirror and tap above the vanity | round mirror, black tap (**assumed**, out of frame) | `#1A1A1A` | Ø 0.50 | south wall above the vanity | n/a |
| Wooden bucket | teak/cedar staves with a metal band | `#A8703F` | Ø 0.18 × 0.15 | on the vanity, east end | 08 |
| Wall-hung WC and pre-wall ledge | white WC; the boxed-in cistern forms a **matte off-white ledge** | `#F4F4F2` / `#E8E2D9` | ledge 0.60 × 0.20 at h 1.10 | north wall, x 6.10–6.70 | 08 |
| Reed diffuser | square glass bottle, dark amber liquid, 4–5 black reeds | `#5A1E12` / `#1A1A1A` | 0.07 × 0.07 × 0.10 (+0.30 reeds) | on the ledge | 08 |
| Seashell | small cream spiral shell | `#EDE4D6` | 0.08 | on the ledge | 08 |
| Coral/clam-shell vase | **white speckled ceramic**, fan-shaped with deep ribs | `#F1ECE6`, specks `#6A5E55` | 0.38 × 0.15 × 0.26 | on the ledge, right | 08 |
| Ceiling light | flush IP44 round light (**assumed**) | `#F5F5F5` | Ø 0.25 | ceiling centre | n/a |

### 2.8 Roof terrace (layout confirmed)

| Object | Material | Colour | Size | Position | Photo |
|---|---|---|---|---|---|
| Decking | grooved, weathered grey boards, 6 mm gaps, boards running plan E–W | `#A8A196` (silver-grey, brown/green variation) | 0.14 wide boards | whole terrace | 02, 07 |
| Parapets (south and east) | white-painted horizontal boards (~8 per height), posts every ~2 m, cap board | `#E6E4DF` | h 1.10, 0.15 thick | south y 14.05, east x 7.25 | 02, 07 |
| Tall west wall | white render, slightly weathered, 3–4 small square vents near the top | `#E6E5E1` | ~6.0 above the deck | x = 0.60 | 02 |
| Façade | white render, grey concrete coping | `#E9E8E4` / `#9C9B96` | top ~3.0 above the deck | y 8.80–9.10 | 07 |
| Chimney stack | rendered stack, concrete cap, stacked louvred vent cap | `#DADAD6` / `#4A4B48` | 0.55 × 0.55, ~1.0 above the roof | (6.90, 8.95) | 07 |
| Storage cabinet | silver-grey weathered vertical boards, 2 doors, galvanised hinges and hasp | `#B9AEA2` | 0.60 × 1.20 × 2.05 | NE corner, x 6.65–7.25, y 9.20–10.40, doors facing west | 03, 07 |
| Vertical batten screen | warm-brown hardwood battens 0.04 wide with 0.02 gaps | `#8C6A4F` | 1.20 × 0.05 × 2.20 | façade, x 0.70–1.90 | 02 |
| L-lounge | teak frame with slatted backs, off-white canvas cushions | `#9A6A43` / `#EDE7DC` | modules 0.75 × 0.75; seat h 0.40; back h 0.75 | long arm x 6.15–6.90, y 10.55–13.70; short arm x 4.65–6.15, y 12.95–13.70 | 03, 07 |
| Olive tree and fan palm | in dark pots | `#7E8A6A` / `#4E6B3A` | ~2.0 and ~1.0 tall; pots Ø 0.45 | SE corner behind the lounge | 07 |
| Round side table | teak top, black metal legs | `#9A6A43` / `#1E1E1E` | Ø 0.55 × 0.45 | (5.55, 12.20) | 03, 07 |
| Dining table | weathered teak slats (silver-grey, green tint at the joints), dark grey steel frame | `#A9A496` / `#3A3D40` | 0.90 × 1.60 × 0.75, long axis plan N–S | x 2.10–3.00, y 11.70–13.30 | 02, 07 |
| Acapulco chair | white PVC cord on a white steel frame | `#F0F0EE` | Ø 0.75 × 0.85 | (2.55, 11.15), facing south | 02, 07 |
| Folding chairs (×2) | slatted wood, weathered **red-brown** | `#8E4636` | 0.45 × 0.50 × 0.80 | (3.30, 12.60) facing west; (1.75, 12.30) facing east | 02, 07 |
| Candle bowl and jar candle | turned light wood bowl with amber wax and 3 wicks; small amber glass jar | `#B08A5E` / `#D9A46A` / `#C98A4A` | Ø 0.25 × 0.12; Ø 0.08 × 0.10 | table centre | 02, 07 |
| Decorative ladder | black powder-coated steel, 5 rungs | `#1A1A1A` | 0.40 × 1.80, leaning ~10° | west wall, y 13.30 | 02 |
| Small spiky plant | agave/yucca in a pot | `#4E6B3A` | ~0.40 | foot of the ladder | 02 |
| **Festoon string lights** | black cable, G40 warm bulbs every 0.5 m, sagging between fixings | bulbs `#FFD9A0` (2200 K) | ~16 m | inside of the south and east parapets at h ~1.0; along the west wall at h ~2.1 to the ladder | 02, 07 |

### 2.9 City view and landmarks (true compass directions)

**Hero: former Onze-Lieve-Vrouw van Gratiekerk, Frankrijklei 89 (Theater Elckerlyc)**

Neo-Gothic, designed by Bilmeyer & Van Riel. It stands across the boulevard to the **WNW**, about **80–100 m** away (plan-SSW), with its façade facing the flat.

- **Brick and stone:** dark red brick `#9A4636` with **white stone bands** `#E4DCCB`. Bands are ~0.20 m tall every ~0.9 m. Stone trim on arches, string courses and buttress set-offs.
- **Each tower, from the bottom up:**
  1. Square shaft (~6.5 m wide) with corner buttresses, an oculus with quatrefoil and paired lancets.
  2. A pierced stone balustrade at about nave-ridge height. This is roughly the terrace's eye level.
  3. A tall belfry stage with paired lancets on each face.
  4. A sloped slate skirt.
  5. An upper stage with small triple-arcaded gables.
  6. **4 corner pinnacles** (slate cones on banded brick turrets).
  7. A slender **octagonal slate spire** `#545A60`.
  - Total height ≈ 60 m.
- **Centre bay** (~9 m) between the towers:
  - pointed portal
  - a band of blind arcading
  - a large pointed tracery window
  - an **arcaded gallery of 7 small arches** under a balustrade
  - the nave gable behind
- **Body:** slate nave roof; a transept gable on the left (south side) with a rose window and lancets.

**Next to the church (from `02`)**
- **Left:** a 6-storey 1960s/70s office with white vertical concrete fins and a ground-floor billboard. I'll use a generic poster with no text.
- **Right:** a 5-storey neoclassical building in cream render with tall windows.

**Frankrijklei boulevard below**

A ~55 m wide street canyon with tree rows, traffic lanes, tram tracks and street lamps. It's only seen when you look down over the parapet, and it's procedural.

**Other directions**
- **True south** (plan-east, `07`): a long white office slab with dense vertical fins below terrace level; mixed 6–8 storey blocks in render, red brick and grey concrete; rooftop plant rooms and antennas; a distant dark dome with a lantern.
- **True east** (desk window): a white office block with a grid of windows (toward the Centraal station area).
- **True north** (bedroom window): the brick parapet and steel ladder close by; beyond them a construction crane, white offices and a ~15-storey residential tower.

**Procedural skyline:** everything else is generated (6–8 storeys, flat roofs, mixed façades). Windows light up at night.

**Optional, not in your photos:** the cathedral spire ~1.3 km to the WNW. It would be visible from a west-facing terrace in Antwerp. **Off by default.**

**Foliage:** summer (the photos show early spring).

---

## 3. Sources and uncertainties

**Confirmed by you:**
- location and church
- terrace layout
- which door is which room
- that there is one olive tree
- that I should use my size estimate

**Confident** (cross-checked across photos):
- the kitchen U-layout, with the bar and stools facing the corridor (04, 05, 06)
- the corridor and desk nook (05, 09)
- the order of things along the entrance wall (05, 06)
- the sofa facing south (03, 05)
- the order along the south wall (03)
- the bathroom fixtures and materials (08)
- the materials and colours listed above

**Medium confidence:**
- Room dimensions (±0.5 m).
- The bathroom arrangement. `08` shows the bath, window, radiator, vanity and ledge; I fitted them into 2.3 × 1.8 m in the most plausible way.
- The orientation angle (±20°).
- The church distance and height.

**Low confidence / assumed:**
- bathroom floor, mirror and ceiling light (not visible)
- the bedroom floor
- whether the cactus wall is set back ~0.2 m
- whether the oak platform runs all the way to the west wall
- what the galvanised ladder outside the bedroom belongs to

---

## 4. Open items

1. **Remaining 3 listing photos.** I'll add them to `reference/` and adjust the spec when they arrive. They aren't blocking.
2. **Approval to start Step 2** (shell + movement + collision).

---

## 5. Quality bar and process (from your brief, applies to every step)

### Compare loop
After each build step:
1. Run the app headlessly with Playwright (Chromium is pre-installed in this environment).
2. Render from a camera pose matching each reference photo.
3. Write side-by-side images to `./compare/NN.png`, with the original on the left and the render on the right.
4. Fix the biggest differences in layout, proportions, colours and lighting before moving on.

### Starting camera poses
These will be refined in the first compare pass and stored in config as `compareCameras`.

| Ref | Eye (x, y, h) | Look at (x, y, h) | Vertical FOV |
|---|---|---|---|
| 01 bedroom | (2.4, 0.4, 1.45) | (0.7, 2.9, 0.9) | 62° |
| 02L church | terrace (2.0, 13.6, 1.6) | church spires | 18° |
| 02R dining | (4.8, 12.3, 1.5) | (0.6, 12.6, 1.1) | 58° (portrait) |
| 03 living | (5.3, 4.9, 1.45) | (4.4, 8.8, 0.9) | 52° |
| 04 kitchen | (3.6, 2.9, 1.70) | (7.1, 2.8, 0.95) | 50° |
| 05 corridor | (3.9, 7.4, 1.15) | (4.0, 0.0, 1.10) | 50° |
| 06 entrance | (6.3, 6.6, 1.35) | (3.6, 4.2, 1.20) | 55° |
| 07 terrace | (1.5, 11.0, 1.55) | (7.25, 11.2, 0.9) | 55° |
| 08 bathroom | (5.1, 0.5, 1.45) | (6.9, 1.6, 0.8) | 60° |
| 09 desk | (3.95, 1.0, 1.25) | (3.6, 0.0, 0.85) | 48° |

### Lighting target
- The default look is a **sunny-afternoon listing photo**: bright and warm, with soft shadows.
- No blown-out whites and no pitch-black corners.
- The default time is **17:00 on 20 August**: sun azimuth ≈ 243° (WSW), altitude ≈ 35°. That sends warm low light through the west-facing terrace door. Sunset that day is 20:55 at azimuth ≈ 291°, behind the church.

### No placeholder boxes
- Every object gets a believable silhouette and material: bevelled edges, soft rounded cushions, visible wood grain.
- Plants use **instanced real leaves**.

### Build order (commit after each step)
1. SPEC.md → **wait for approval** ← *we are here*
2. Shell: walls, floors, ceilings, windows, doors, terrace + movement and collision
3. Lighting and time-of-day system
4. Entrance, kitchen, living room, corridor: furniture and props. Bedroom and bathroom go here too.
5. Terrace, skyline and church
6. Interactions, cinematic tour, menu, mobile controls
7. Performance pass + final side-by-side comparison screenshots

Sources consulted for the landmark:
- [allemaalcultuur.be – Elckerlyc opened in the former OLV van Gratiekerk](https://allemaalcultuur.be/elckerlyc-theater-events-officieel-geopend-in-voormalige-onze-lieve-vrouw-van-gratiekerk/)
- [VRT NWS – Theater Elckerlyc buys the adjacent church](https://www.vrt.be/vrtnws/nl/2022/10/11/theater-elckerlyc-koopt-aanpalende-onze-lieve-vrouw-van-gratieke/)
- [Onroerend Erfgoed – protection decision, Frankrijklei 89](https://besluiten.onroerenderfgoed.be/besluiten/3488/bestanden/9135)
