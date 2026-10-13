# SPEC: Antwerp rooftop apartment, walk-through simulation

**Status:** Step 1 (analysis only). No code has been written. Every number below is an estimate from the photos and is meant to be corrected.

**Placeholders filled in**

| Placeholder | Value |
|---|---|
| City | **Antwerp** (lat 51.22° N, lon 4.40° E) |
| Size | ≈ **53 m² net / ~60 m² gross** (estimate from the plan), plus a ≈ **33 m²** roof terrace |
| Bedrooms | **1**, with a double bed (I assumed 140 × 200; could be 160) |
| Bathroom | **no photo**, so it's a placeholder until you describe it |

---

## 0. Photo index

`./reference` was empty, so I cropped the phone screenshots you attached (black bars removed) and saved them as `reference/01.jpg … 07.jpg`. You mentioned 12 listing photos; I received 7.

| File | Listing # | Shows |
|---|---|---|
| `01.jpg` | 10/12 | Split photo. **Left:** bedroom (bed, rattan nightstand, sconce, window, radiator). **Right:** view out of a window: galvanised steel ladder in front of a red-brick parapet, city and a crane beyond. |
| `02.jpg` | ? | Split photo. **Left:** the neo-Gothic church (hero landmark). **Right:** terrace dining table in front of the tall white wall, with ladder, festoon lights and slat screen. |
| `03.jpg` | ? | Living room looking at the TV corner, window and sliding door (sofa back, coffee table, oak step platform). |
| `04.jpg` | ? | Kitchen close-up, shot from the corridor over the bar (herringbone walnut, hob, sink, coffee machine, microwave, fridge column). |
| `05.jpg` | ? | From the sofa looking down the corridor (front door, hooks, cactus, bar and stools, desk nook). |
| `06.jpg` | ? | Diagonal view: entrance wall, corridor mouth, pillar, kitchen (oven, hob, hood), tall olive tree. |
| `07.jpg` | 1/12 | Roof terrace: L-lounge in the far corner, storage cabinet and chimney, dining table, city skyline. |

---

## 1. Floor plan

### Conventions (these will become `src/apartment.config.js`)
- **Plan north** points up, toward the window at the end of the corridor. Its **real compass bearing is unknown** (see the questions at the end).
- `x` runs east (right) and `y` runs south (down), in metres. The origin is the **north-west inside corner of the bedroom**. Heights `h` are measured from the finished floor; on the terrace, `h` is measured from the deck.
- In Three.js: `x → x`, `y → z`, `h → y`.
- Ceiling 2.60 m. Two **lowered headers/soffits at 2.35 m**: over the corridor mouth, and over the whole kitchen (with recessed downlights).
- Exterior walls 0.30 m, partitions 0.10 m.

### ASCII plan (1 character ≈ 0.15 m wide, 1 line ≈ 0.30 m)

```

 ###########################::::::###################
 #########################+-------+##################
 ###   BEDROOM 3.2x2.9  ##+DESK---+#              ###
 ###                    ##           BATHROOM     ###
 ###     +--------+               D  2.3x1.8 (?)  ###
 ###     |        |     D                         ###
 #:#     | BED    |               ##              ###
 #:#     |140x200 |       CORR  +-----+-------+---+##
 #:#ns   |        |     ##1.4w  |     |HOB+OV |snk|##
 #:# +--+|        |     ##      | BAR +-------|   |##
 ####+--+headbrd--+#######   ss |     |       |   |##
 #########################   ss |     |KITCHEN|cof|##
            (stair landing)     |     |       |   |##
                        ##      +-----+       +FRG+##
       #### FRONT ########        ####        |   |##
       ####       ####cac#        ####        +---+##
       ###                                     OL1###
       ###                                        ###
       ###  LIVING 6.2 x 4.6                      ###
       ###            +------------------+        ###
       ###            |     SOFA         |        ###
       ###            |                  |        ###
       ###            +-----+------------+        ###
       ###            |     | +------+            ###
       ###            |chaise |coffee|            ###
       ###            |     | +------+            ###
       ###        bsk +-----+                  OL2###
       ##+---------------------+        TV/sideb  ###
       ##|oak step platform    |        +------+#####
       ##+---------------------+        +------+#####
       ########                ######################
     ##########//SLIDING-DOOR//#::::::::#######+---+#
     ###screen                                 |   |~
     ###                                       |cab|~
     ###                                       |   |~
     ###   ROOF TERRACE  6.6 x 5.0             +---+~
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
- `OL1` / `OL2` olive trees
- `cac` cactus
- `bsk` basket
- `ns` nightstand
- `cab` storage cabinet
- `o` round side table
- `wc` white string chair
- `rc` red folding chairs
- `*` olive tree and palm in the lounge corner

### Rooms

| Room | x range | y range | Size | Floor | Notes |
|---|---|---|---|---|---|
| Bedroom | 0.00–3.20 | 0.00–2.90 | 3.2 × 2.9 ≈ 9.3 m² | oak (assumed, not visible) | Door from corridor (west side). Window in the west wall near the SW corner. |
| Corridor | 3.30–4.70 | 0.00–4.20 | 1.4 m to the bar base; **1.1 m clear** past the bar overhang | oak planks running N–S | Desk across the north end, under a window. Door left = bedroom, door right = bathroom. |
| Bathroom | 4.80–7.10 | 0.00–1.80 | 2.3 × 1.8 ≈ 4.1 m² | ? | **No photo**, so contents are invented. |
| Kitchen (U-shape) | 4.70–7.10 | 1.90–4.20 | 2.4 × 2.3 ≈ 5.5 m² | light-grey 60 × 60 tiles | Open to the corridor above the bar, and open to the living room between the pillar and the fridge column. |
| Living room | 0.90–7.10 | 4.20–8.80 | 6.2 × 4.6 ≈ 28.5 m² | oak planks running N–S | Front door in the north wall. Sliding door and window in the south wall. Chimney breast in the SE corner. |
| Stair landing | 0.90–3.20 | 3.10–4.00 | n/a | n/a | Outside the flat. Shown only as a dim volume behind the front door. |
| Roof terrace | 0.60–7.25 | 9.10–14.05 | 6.6 × 5.0 ≈ 33 m² | grey weathered decking, boards E–W | South and east parapets are white boards. The west side is a tall white rendered wall (~6 m). |

### Openings

| Id | Where | Position | Size (w × h) | Notes |
|---|---|---|---|---|
| Front door | living north wall, y = 4.20 | x 1.25–2.15 | 0.90 × 2.10 | Hinge on the west side, opens into the living room. |
| D-bed | corridor west wall, x = 3.30 | y 1.00–1.85 | 0.83 × 2.15 | Oak leaf in a black steel frame. Opens into the bedroom. |
| D-bath | corridor east wall, x = 4.70 | y 0.60–1.45 | 0.83 × 2.15 | Same door type. |
| Corridor mouth | living north wall | x 3.30–4.70 | 1.40 × 2.35 (header) | Header beam above. |
| Kitchen opening | living north wall | x 5.10–6.50 | 1.40 × 2.35 (soffit) | Pillar on the west, fridge column on the east. |
| Bar pass-through | corridor east side | y 1.90–3.80, from the counter up to 2.35 | n/a | No wall above the bar. |
| W-desk | corridor north wall | x 3.72–4.48 | 0.76 × 1.35, sill h 0.85 | White PVC tilt-turn window with a lower fixed panel. |
| W-bed | bedroom west wall | y 1.75–2.60 | 0.85 × 1.35, sill h 0.90 | White PVC tilt-turn. Bluestone sill. Radiator below. |
| W-living | living south wall | x 4.40–5.35 | 0.95 × 1.40, sill h 0.90 | 0.30 m deep reveal, white sill, black roller blind. |
| Sliding door | living south wall | x 1.80–4.00 | 2.20 × 2.10, sill h 0.40 | White PVC lift-and-slide. The **east** leaf slides and has the handle. |

---

## 2. Inventory

Format:
- Size is **W × D × H** in metres.
- Position is **(x, y)** of the centre in plan coordinates, plus **h** (bottom or centre height, as noted).
- Colours are base albedo, estimated by sampling the photos and correcting for their over-exposure.

### 2.1 Shared surfaces and materials

| Surface | Material | Colour | Notes | Photo |
|---|---|---|---|---|
| Walls | matte plaster/paint | `#EFEDE8` | Slightly warm white. | all |
| Ceiling | matte paint | `#F4F3F0` | n/a | 05, 06 |
| Floor (living, corridor, bedroom?) | wide **light oak planks**, matte white-oiled | base `#CDB293`, planks vary `#BFA27F` to `#DCC3A4` | Planks 0.20 × 2.0–2.4 m with soft knots and very fine joints. | 03, 05, 06 |
| Kitchen floor | large porcelain tiles, matte | `#B5B2AE`, joints `#9C9995` | 0.60 × 0.60. Tiles end at the kitchen opening line (y = 4.20) and at the bar base (x = 5.30). | 05, 06 |
| Skirting | white painted MDF | `#F2F1EE` | 0.07 high × 0.012 thick. | 05, 06 |
| Interior doors | **oak veneer leaf** with vertical grain, in a slim **black steel frame** (~25 mm) | leaf `#BFA285`, frame `#1C1C1C` | Black lever and rose, black hinges. No architrave. | 05, 06 |
| Window frames | white PVC | `#F5F5F3` | Deep reveals (~0.30 m), plastered white. | 01, 03, 05 |
| Light switches and sockets | white plastic rocker / Belgian-type socket | `#F3F2EF` | n/a | 01, 03, 05, 06 |

### 2.2 Entrance (living room north wall, west part)

| Object | Material | Colour | Size | Position | Photo |
|---|---|---|---|---|---|
| Front door | flush painted door, white architrave (0.07) | `#ECEAE6` | 0.90 × 0.05 × 2.10 | x 1.25–2.15, y 4.20 | 05, 06 |
| Door hardware | satin stainless lever, separate cylinder rose, 3 white barrel hinges (west edge) | `#B9BBBD` | lever 0.13 | lever h 1.05 (east side) | 05, 06 |
| Peephole | chrome ring | `#8E9093` | Ø 0.02 | h 1.55, door centre | 05, 06 |
| Wall box near door-top height (intercom / door-entry unit?) | white plastic with a black slot | `#F1F0EE` | 0.08 × 0.04 × 0.20 | (2.30, 4.20), h 1.95 | 05, 06 |
| Second wall box (handset or thermostat?) | white plastic | `#F1F0EE` | 0.08 × 0.03 × 0.13 | (2.30, 4.20), h 1.22 | 05, 06 |
| Double rocker light switch | white | `#F3F2EF` | 0.08 × 0.08 | (2.25, 4.20), h 0.95 | 06 |
| Hook rail | black powder-coated steel. **I count 6 hooks** (you wrote 5). | `#1A1A1A` | 0.30 × 0.03 × 0.03 | x 2.45–2.75, h 1.55 | 05, 06 |
| Columnar cactus (euphorbia) | 1 main stem plus 5–6 upright arms | `#36442C` | 0.25 × 0.25 × 0.85 | on the stool | 05, 06 |
| Cactus pot | weathered unglazed terracotta cylinder | `#A88466` | Ø 0.22 × 0.22 | on the stool | 05, 06 |
| Rustic teak stool | solid teak, slightly dished seat, splayed legs with a stretcher | `#A47A58` | 0.45 × 0.25 × 0.45 | (2.95, 4.40) | 05, 06 |
| Round straw wall hanging | raffia/palm-leaf disc with a long fringe | `#C9A574` | Ø 0.85, 0.06 deep | west wall x = 0.90, y 5.40, centre h 1.80 | 05 |

### 2.3 Corridor and desk nook

| Object | Material | Colour | Size | Position | Photo |
|---|---|---|---|---|---|
| Wall-to-wall desk top | solid light oak, 30 mm | `#D6B68D` | 1.40 × 0.50 × 0.03 | x 3.30–4.70, y 0.05–0.55, top h 0.75 | 05 |
| Desk cabinet (left support) | matte black lacquer, handleless | `#1E1E1E` | 0.50 × 0.48 × 0.72 | x 3.30–3.80 | 05 |
| Right support | black steel A-frame trestle leg | `#1A1A1A` | 0.05 × 0.45 × 0.72 | x 4.55 | 05 |
| Wishbone chair | light oak or beech frame, natural paper-cord seat | frame `#D6B48A`, seat `#CDB28A` | 0.55 × 0.51 × 0.76 | (4.05, 0.75), facing north | 05 |
| Rattan sunburst mirror | rattan rays, round mirror centre | `#C8A57E` | Ø 0.45 (mirror Ø 0.15) | north wall, x 3.55, h 1.50 | 05, 06 |
| Dark ceramic vase | matte dark-brown stoneware, bulbous with a narrow neck | `#4E3B2E` | Ø 0.20 × 0.32 | desk, x 3.55 | 05 |
| Dried branches | thin twigs with beige seed heads | `#C8B79A` | 0.35 tall | in the vase | 05 |
| Small table lamp | wooden base, cream linen cone shade | base `#A57B55`, shade `#EFE8DC` | Ø 0.15 × 0.28 | desk, x 3.82 | 05 |
| Framed print, leaning | thin black frame, white mat, light print | `#1A1A1A` / `#F2F0EB` | 0.30 × 0.02 × 0.38 | desk, x 4.45, leaning on the wall | 05 |
| Small ceramic pot | dark green-grey glaze | `#3F4A3C` | Ø 0.08 × 0.09 | in front of the print | 05 |
| Black board/frame, leaning | black, probably a frame back | `#1E1E1E` | 0.30 × 0.40 | desk, far left | 05 |
| Ceiling light | small flush round fitting | `#F2F2F2` | Ø 0.20 | ceiling, (4.00, 0.80) | 05 |
| Double spotlight | chrome twin-spot bar | `#BFC2C4` | 0.20 | east wall above D-bath, h 2.30 | 05 |
| Smoke detector | white disc | `#F5F5F5` | Ø 0.10 | ceiling, (4.00, 3.60) | 06 |

### 2.4 Kitchen (U-shape: west run = bar, north run = cooking, east run = sink, coffee and tall units)

| Object | Material | Colour | Size | Position | Photo |
|---|---|---|---|---|---|
| **Countertop (all runs)** | **walnut, HERRINGBONE** blocks ~0.35 × 0.07 at 45°, oiled, 40 mm thick | base `#7A4A32`, blocks vary `#5E3524` to `#9A6346` | 0.60 deep, h 0.92 | all runs | 04, 05, 06 |
| Bar / peninsula (west run) | walnut top overhangs **0.30 m into the corridor**. White base with drawers facing east (into the kitchen). | white `#F2F2F0` | top 0.90 × 1.90 | top x 4.40–5.30, base x 4.70–5.30, y 1.90–3.80 | 04, 05, 06 |
| Base cabinets | flat white, handleless (shadow-gap grip), satin | `#F2F2F0` | 0.60 deep, 0.86 tall carcass, plinth 0.10 | all runs | 04, 06 |
| Built-in oven | stainless fascia, black glass door, bar handle, 2 knobs + display | `#B8BBBE` / `#1E2226` | 0.60 × 0.60 | under the hob, x 5.70, facing south | 06 |
| Induction hob | black glass with a thin bevel | `#121314` | 0.58 × 0.51 | north run, centre (5.70, 2.20) | 04, 06 |
| Extractor hood | brushed stainless chimney plus a flat telescopic visor (grease filter visible underneath) | `#B4B6B8` | chimney 0.24 × 0.20, visor 0.60 × 0.50 × 0.05 | north wall above the hob, visor bottom h 1.55, chimney up to the soffit (2.35) | 04, 06 |
| Round sink | stainless, inset | `#A9ACAF` | Ø 0.40 | east run, (6.80, 2.30) | 04 |
| Tap | brushed stainless, tall arched/angular spout, side lever | `#9EA1A4` | 0.30 tall | behind the sink | 04 |
| Wall unit with built-in microwave | white upper cabinet. Stainless microwave with black window and top control strip. | `#F2F2F0` / `#B8BBBE` | 0.60 × 0.35 × 0.95 (microwave 0.38 tall) | east wall, y 2.65–3.25, bottom h 1.40, top h 2.35 | 04 |
| Tall fridge column | white, 3 doors (integrated fridge/freezer) | `#F2F2F0` | 0.60 × 0.60 × 2.35 | (6.80, 3.90) | 04 |
| Coral palm print | thin oak frame, coral/salmon print of a yucca/dracaena | frame `#B08A5E`, print `#E48C78`, plant `#5E8A6A` | 0.30 × 0.40 | east wall, (7.10, 2.25), centre h 1.55 | 04 |
| Capsule coffee machine | black plastic and chrome | `#1A1B1D` | 0.13 × 0.37 × 0.28 | east run, (6.80, 3.15) | 04 |
| Capsule jar | glass jar with metal lid, mixed capsules (gold/white/brown) | glass, capsules `#C9A35A` | Ø 0.10 × 0.20 | (6.80, 3.35), on a cork mat | 04 |
| Olive-wood cutting boards (×2) | 1 long paddle and 1 organic round board, leaning in the NE corner | `#B9874F` | 0.25 × 0.60 and 0.30 × 0.30 | corner (7.00, 2.00) | 04 |
| Beige ceramic pot with lid | matte sand glaze | `#D9C8B5` | Ø 0.15 × 0.13 | next to the tap | 04 |
| Terracotta bowl with 4 oranges | glazed terracotta | `#C2643A`, oranges `#F08A2A` | Ø 0.28 × 0.07 | north run, (6.25, 2.25) | 04, 05, 06 |
| Olive-oil bottles (×2) | dark green glass, white/green labels | `#2F3F25` | Ø 0.06 × 0.28 | next to the hob | 04 |
| Wicker-wrapped bottle | clear glass with a cork, raffia wrap at the bottom | `#C9A774` | Ø 0.10 × 0.28 | on the bread bin | 04, 06 |
| Roll-top bread bin | acacia wood | `#C08A55` | 0.40 × 0.27 × 0.22 | bar, north end (4.95, 2.20) | 04, 05, 06 |
| Small yellow dish | yellow glaze with a green motif | `#F2D23C` | 0.14 × 0.10 | on the bread bin | 04, 05 |
| Bar stools (×2) | dark-stained hardwood (sapele-like), saddle seat, splayed legs, 2 rungs | `#5E2F1E` | 0.38 × 0.26 × 0.66 | corridor side, (4.15, 2.75) and (4.15, 3.25) | 05, 06 |
| Recessed downlights | white trim | `#F5F5F5` | Ø 0.08 | soffit h 2.35: 2 above the bar, 2 in the kitchen | 05, 06 |
| **Pillar** | plastered | wall colour | 0.40 × 0.40 × 2.60 | x 4.70–5.10, y 3.80–4.20 | 05, 06 |
| Tall olive tree (OL1) | (artificial?) olive tree. **Pot not visible.** | leaves `#7E8A6A`, trunk `#6B6253` | ~0.9 wide × 2.2 tall | NE corner of the living room, (6.75, 4.65) | 06 |

### 2.5 Living room

| Object | Material | Colour | Size | Position | Photo |
|---|---|---|---|---|---|
| L-sectional sofa | **greige/taupe velvet or fine corduroy**, dark piping on the arm | `#A39189`, piping `#4A403C` | main 2.90 × 1.00, seat h 0.45, back h 0.80, arm h 0.62 | main x 2.80–5.70, y 5.40–6.40, faces south | 03, 05, 06 |
| Chaise (west end) | same fabric | `#A39189` | 0.95 × 1.15 extra (≈1.6 m total length) | x 2.80–3.75, y 6.40–7.55 | 03, 05 |
| Macramé cushion | cream cotton macramé, fringed | `#EDE7DD` | 0.50 × 0.50 × 0.12 | west seat, against the back | 05 |
| Coffee table | 19 mm glass top, a **rounded triangle** (Noguchi-style). Two interlocking curved solid-wood base pieces. | glass `#DCEBEA` (tint), wood `#B8743F` | 1.27 × 0.92 × 0.40 | (4.55, 7.15) | 03 |
| Tray on the table | wood with low rim | `#8A5A35` | 0.40 × 0.28 × 0.04 | on the table | 03 |
| Pillar candle | marbled white/grey wax | `#E8E4DE` | Ø 0.08 × 0.13 | on the tray | 03 |
| Brass candlesticks (×2) | polished brass, turned | `#C9A44C` | Ø 0.06 × 0.20, plus thin white taper candles | on the tray | 03 |
| Small ceramic bowl | pale glaze | `#E9E3DA` | Ø 0.13 | on the tray | 03 |
| Sideboard | oak frame, **cane/rattan webbing** on 2 doors, thin black steel rod legs | oak `#C49464`, cane `#DDBB8E`, legs `#1A1A1A` | 1.10 × 0.40 × 0.62 (legs 0.17) | x 5.55–6.65, against the south wall | 03 |
| TV | ~32" LCD, black bezel and stand | `#151515` | 0.78 × 0.20 × 0.52 | on the sideboard, facing north | 03 |
| Small black box | black plastic | `#151515` | 0.12 × 0.10 × 0.03 | beside the TV | 03 |
| Table lamp | terracotta/rose-beige ceramic column base, white linen drum shade | base `#A87F70`, shade `#F1EEEA` | Ø 0.25 × 0.55 | sideboard, west end | 03 |
| Small dish | ceramic | `#E2D6CB` | Ø 0.10 | in front of the lamp | 03 |
| Pencil portrait | graphite drawing on cream paper, **wavy/scalloped dark wood frame** | frame `#4A3226`, paper `#EEE9E0` | 0.25 × 0.35 | south wall, x 5.55, centre h 1.75 | 03 |
| Living-room window | white PVC, deep white sill | `#F5F5F3` | see openings | x 4.40–5.35 | 03 |
| Roller blind | black fabric in a cassette, beaded chain pull hanging to ~h 1.0 | `#2B2F38` | 0.95 wide, rolled up | top of the window | 03 |
| Sill decor | small white objects (cloth/ceramic) | `#F1F1F1` | ~0.12 | on the sill | 03 |
| Sliding terrace door | white PVC lift-and-slide, 2 leaves | `#F5F5F3` | 2.20 × 2.10, sill h 0.40 | x 1.80–4.00 | 03 |
| **Oak step platform** | solid light oak, 2 tiers | top `#D4AE84`, risers `#C69872` | upper tier 0.50 deep, h 0.40; lower step 0.30 deep, h 0.20 | x 0.95–4.25, y 8.00–8.80 | 03 |
| Chimney breast | plastered projection (I believe it's the flue for the roof chimney) | wall colour | 0.45 × 0.45 × 2.60 | x 6.65–7.10, y 8.35–8.80 | 03, 07 |
| Olive tree on stool (OL2) | olive tree in a **glossy navy/black glazed pot**, on a **teak mushroom stool** | pot `#1E2433`, stool `#9B6F4E`, leaves `#6E7D5A` | pot Ø 0.30 × 0.26; stool Ø 0.32 × 0.45; tree 1.5 tall | (6.80, 7.55), against the east wall | 03 |
| Woven basket | seagrass/jute with handles | `#A47E5B` | Ø 0.40 × 0.45 | (2.35, 7.70), next to the chaise | 03 |
| Sockets | white Belgian-type | `#F3F2EF` | 0.08 | east wall low h 0.25; north wall under the cactus stool | 03, 05 |

### 2.6 Bedroom

| Object | Material | Colour | Size | Position | Photo |
|---|---|---|---|---|---|
| Bed (two-person) | upholstered or painted **black headboard**, white bedding | headboard `#2A2A2E`, sheets `#F4F2EE` | 1.40 × 2.00 mattress; headboard 1.50 wide × 1.05 tall | x 0.90–2.30, y 0.90–2.90, headboard on the south wall | 01 |
| Throw | sand/oat woven cotton with **black tufted line motif** (abstract strokes) | `#D9C3A0`, lines `#1A1A1A` | 1.60 × 1.20, over the lower 2/3 of the bed | on the bed | 01 |
| Pillows (×3) | blush/peach washed linen | `#D3AC90` | 0.65 × 0.45 | against the headboard | 01 |
| Macramé cushion | cream macramé, fringed (same style as the living room) | `#EDE7DD` | 0.45 × 0.45 | in front of the pillows | 01 |
| Nightstand | light wood frame with a cane-webbing door | frame `#B88A60`, cane `#D9B98C` | 0.42 × 0.38 × 0.50 | (0.57, 2.70), west of the bed | 01 |
| Bedside lamp | speckled grey-green ceramic gourd base, white pleated shade | base `#5F6253`, shade `#F3F0EA` | Ø 0.20 × 0.38 | on the nightstand | 01 |
| Small brass dish | brass | `#C9A44C` | Ø 0.10 | on the nightstand | 01 |
| Wall sconce | bamboo/rattan slat half-cylinder | `#C7A27C` | 0.30 × 0.15 × 0.28 | south wall above the bed's east side, x 2.05, h 1.85 | 01 |
| Light switch | white rocker | `#F3F2EF` | 0.08 | south wall, x 0.80, h 1.15 | 01 |
| Window | white PVC tilt-turn, deep reveal, **dark bluestone sill** (typical for Belgium) | sill `#7F7A74` | see openings | west wall | 01 |
| Radiator | white steel panel radiator (type 22), valve, pipe down to the floor | `#F2F2F0` | 0.70 × 0.10 × 0.60 | under the window, h 0.15 | 01 |
| Ceiling bulkhead | plastered box over the window | wall colour | ~0.25 deep | along the west wall, top | 01 |
| **View outside** | **galvanised steel fixed ladder** (2 tube stiles Ø 0.05, rungs every 0.30, scaffold clamps) ~0.6 m outside the glass. Behind it an **old red-brick parapet** with concrete coping, then the city (crane, white offices, residential tower). | steel `#8F959A`, brick `#A0533E`, coping `#B8BDC0` | ladder 0.45 wide | outside W-bed | 01 |

### 2.7 Bathroom

There is no photo. Until you tell me otherwise I'll build a neutral placeholder in the same style:
- walk-in shower with a glass screen
- wall-hung WC
- floating oak vanity with a white basin
- round mirror
- light-grey tiles matching the kitchen floor
- black fittings
- no window

### 2.8 Roof terrace

| Object | Material | Colour | Size | Position | Photo |
|---|---|---|---|---|---|
| Decking | grooved, weathered grey boards, 6 mm gaps, boards running E–W | `#A8A196` (silver-grey, some brown/green variation) | 0.14 wide boards | whole terrace | 02, 07 |
| Parapets (south and east) | white-painted horizontal boards (~8 per height), posts every ~2 m, flat cap board | `#E6E4DF`, slightly weathered | h 1.10, 0.15 thick | south y 14.05, east x 7.25 | 02, 07 |
| Tall west wall | white render, slightly weathered, 3–4 small square vents near the top | `#E6E5E1` | ~6.0 above the deck | x = 0.60, full terrace depth | 02 |
| Façade (living room exterior) | white render, grey concrete coping at the roof edge | `#E9E8E4`, coping `#9C9B96` | top ~3.0 above the deck | y 8.80–9.10 | 07 |
| Chimney stack | rendered stack, concrete cap, stacked louvred vent cap | `#DADAD6` / `#4A4B48` | 0.55 × 0.55, top ~1.0 above the roof | on the roof above the chimney breast, (6.90, 8.95) | 07 |
| Storage cabinet | **silver-grey weathered vertical boards** (0.12 wide), 2 doors, galvanised hinges and hasp | `#B9AEA2` | 0.60 × 1.20 × 2.05 | NE corner, x 6.65–7.25, y 9.20–10.40, **doors facing west** | 03 (through the window), 07 |
| Vertical batten screen | warm-brown hardwood battens 0.04 wide with 0.02 gaps | `#8C6A4F` | 1.20 × 0.05 × 2.20 | on the façade, west end, x 0.70–1.90 | 02 |
| L-lounge sofa | **teak frame** with horizontal back slats, **off-white** canvas cushions | teak `#9A6A43`, cushions `#EDE7DC` | modules 0.75 × 0.75, seat h 0.40, back h 0.75 | long arm (3 modules + corner) along the east parapet, x 6.15–6.90, y 10.55–13.70. Short arm (2 modules) along the south, x 4.65–6.15, y 12.95–13.70 | 03, 07 |
| Olive tree and palm | olive (~2.0 m) and small fan palm (~1.0 m) in dark pots | leaves `#7E8A6A` / `#4E6B3A` | pots Ø 0.45 | SE corner behind the lounge corner | 07 |
| Round side table | teak top, black metal legs | `#9A6A43` / `#1E1E1E` | Ø 0.55 × 0.45 | (5.55, 12.20) | 03, 07 |
| Dining table | **weathered teak slats** (silver-grey with green tint at the joints), **dark grey steel** frame and legs | top `#A9A496`, frame `#3A3D40` | 0.90 × 1.60 × 0.75, long axis N–S | x 2.10–3.00, y 11.70–13.30 | 02, 07 |
| String-weave lounge chair (Acapulco) | white PVC cord on a white steel frame | `#F0F0EE` | Ø 0.75 × 0.85 | (2.55, 11.15), north of the table, facing south | 02, 07 |
| Folding chairs (×2) | slatted wood, painted/stained **red-brown**, weathered | `#8E4636` | 0.45 × 0.50 × 0.80 | east side (3.30, 12.60) facing west; west side (1.75, 12.30) facing east | 02, 07 |
| Candle bowl | turned light wood bowl filled with amber wax and 3 wicks | wood `#B08A5E`, wax `#D9A46A` | Ø 0.25 × 0.12 | table centre | 02, 07 |
| Small jar candle | amber glass with a wooden lid | `#C98A4A` | Ø 0.08 × 0.10 | next to the bowl | 07 |
| Decorative ladder | black powder-coated steel, 5 rungs | `#1A1A1A` | 0.40 × 1.80, leaning ~10° | against the west wall, y 13.30 | 02 |
| Small spiky plant (agave/yucca) | pot on the deck | `#4E6B3A` | ~0.40 | foot of the ladder, SW corner | 02 |
| **Festoon string lights** | black cable, G40 warm bulbs every 0.5 m, sagging in catenaries | bulbs `#FFD9A0` (2200 K) | ~16 m total | along the inside of the south and east parapets at h ~1.0; a run along the west wall at h ~2.1 to the ladder | 02, 07 |

### 2.9 City view and landmarks

**Hero church.** Neo-Gothic, two towers. Seen in `02` left; its tower also shows over the south parapet in `02` right.

- **Brick and stone:** dark red brick `#9A4636` with **horizontal white stone bands** `#E4DCCB`. Bands are ~0.20 m tall, every ~0.9 m. Stone trim on arches, string courses and buttress set-offs.
- **Each tower, from the bottom up:**
  1. Square shaft (~6.5 m wide) with corner buttresses. An oculus with quatrefoil and paired lancets at the level of the main window.
  2. A pierced stone balustrade with projecting corners at about nave-ridge height.
  3. A tall belfry stage with 2 paired lancet openings per face.
  4. A sloped slate "skirt".
  5. An upper stage with small triple-arcaded gables.
  6. **4 corner pinnacles** (slate cones on banded brick turrets).
  7. A very slender **octagonal slate spire** `#545A60`.
  - Estimated total height ≈ 60 m.
- **Centre bay** (~9 m) between the towers:
  - pointed-arch portal at the bottom
  - a band of blind arcading
  - a large pointed tracery window (2 lights plus a rosette)
  - an **arcaded gallery of 7 small arches** under a balustrade
  - the nave gable behind
- **Body:** slate nave roof; a transept gable on the left with a rose window and lancets, with small corner pinnacles.
- **Placement:** facing the flat, about **100–130 m** away, toward plan-**SSW** (seen over the south parapet near the tall west wall). The terrace sits a little higher than the church's nave ridge.

**Around the church**
- **Left of the church:** a 6-storey 1960s/70s office block with white concrete vertical fins and dark windows. A large billboard on the ground floor; I'll use a generic poster with no text or branding.
- **Right of the church:** a 5-storey 19th-century neoclassical building, cream render, tall windows with surrounds.

**East view (`07`)**
- A long white office slab with dense vertical fins, below terrace level.
- Mixed 6–8 storey blocks in render, brick and grey concrete, with rooftop plant rooms and antennas.
- A red-brick building.
- In the distance, a **dark dome with a lantern** (possibly Antwerpen-Centraal station; unconfirmed).

**Other directions**
- **North** (desk window): a white office block with a grid of windows.
- **West** (bedroom): the brick parapet and ladder close by; beyond them a construction crane, white offices and a ~15-storey residential tower.

**Procedural skyline:** the rest is generated (6–8 storeys, flat roofs with plant rooms, mixed façades). Windows light up at night.

**Season in the photos:** early spring (bare street trees in `02`). I'll use spring/summer foliage unless you prefer otherwise.

---

## 3. Sources and uncertainties

**Confident** (seen clearly, cross-checked across 2–3 photos):
- **Kitchen U-layout.** The bar is the west run, with its top overhanging the corridor and the stools on the corridor side (05). The cooking run is on the north wall, with the oven facing the living room (06). Sink, coffee machine, microwave unit and fridge column are on the east wall (04, which is shot from the corridor over the bar).
- **Corridor.** Straight, from the living room to the desk window. Bedroom/bathroom doors are near its north end, on both sides (05, 06).
- **Entrance wall order:** front door, wall devices, hooks, cactus, corridor mouth, pillar, kitchen (05, 06).
- **Sofa orientation.** It faces south toward the TV corner, with its back to the corridor (03 is shot from behind the sofa, 05 from in front of it). The chaise is on the west end.
- **South wall order, east to west:** chimney breast, sideboard + TV, window, sliding door with the oak platform (03).
- **Materials and colours** listed above. Note that photos 05 and 06 are heavily over-exposed, so their colours were corrected against 03 and 04.

**Medium confidence:**
- All room **dimensions** (±0.5 m). I scaled them from known object sizes (door 0.90, hob 0.60, bed 1.40), not from measurements.
- Which side door is the **bedroom (left)** and which the **bathroom (right)**. Bathroom on the right puts it next to the kitchen plumbing, which is why I chose it.
- **Terrace arrangement:**
  - tall white wall on the west
  - lounge in the SE corner
  - dining table west-of-centre
  - cabinet in the NE corner, which you'd see through the living-room window
  - chimney above the SE of the living room

  This is the only layout I found consistent with 02-right, 03 (views through the window and the door) and 07 together. It's also the part most likely to be wrong.
- That the pilaster in 03 is the chimney breast.
- That there are **two** olive trees. You listed two, but they could be one tree moved between photos.
- That the lounge stands ~0.4 m off the parapets with the plants behind its corner.

**Low confidence / unknown:**
- **True compass orientation.** This drives the sun path. The clues conflict:
  - shadows in 07 suggest the sun was plan-SE at the time of the photo;
  - if the church faces west, as churches traditionally do, plan-SSW would be true east.
- **Bathroom:** everything.
- Whether the bedroom window really is on the **west** wall, and what the ladder/brick parapet outside it belongs to (a lower neighbouring roof?).
- Whether the wall section with the cactus is set back ~0.2 m from the door wall. 05 and 06 disagree slightly, possibly because of lens distortion.
- Whether the oak platform runs all the way to the west wall.
- The exact identity, distance and height of the church. A search suggests the twin-towered church by the Stadspark (the former Sint-Jozefkerk, now Christus' Geboortekerk). However, one source calls that church neo-Romanesque, while the one in the photo looks neo-Gothic, so I haven't relied on it.
- Contents of the 5 listing photos I don't have.

---

## 4. Questions for you before I build

1. **Orientation.** Which way does the terrace face (e.g. "south-west"), or which street or church is it near? Without this I'll assume the terrace faces due south.
2. **Terrace layout.** When you step out of the sliding door, is the **lounge to the far left**, the **dining table and tall white wall to the right**, and the **wooden storage cabinet to the left, outside the living-room window**?
3. **Doors.** Is the **left** corridor door the **bedroom** and the **right** one the **bathroom**? Is the bed 140 or 160 cm wide?
4. **Bathroom.** Could you send photos, or describe it (shower or bath, tile colour, vanity, window or not)?
5. **Missing photos.** Could you send the other 5 listing photos (I have 7 of 12)?
6. **Size.** What's the real floor area, if you know it? My estimate is ≈ 53 m² net / 60 m² gross, plus a 33 m² terrace.
7. **Olive trees.** Is the tall olive tree next to the kitchen a second tree, or the one on the mushroom stool moved for the photo?
8. **Your message.** It ended at "# Qu…". What came after that heading?
