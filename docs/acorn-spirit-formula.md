# Acorn spirit forage calculator — derivation

Implemented in `app/lib/calculator/acorn.ts`, surfaced at `/calculator/acorn`.

The question it answers: *how many pounds of acorns do I need to pick up to
end up with N liters of finished spirit?* It works backwards from the bottle to
the forest floor, dividing by a yield fraction at every step. Every fraction is
a user-editable input; the defaults below are typical values from the
homebrewing / distilling literature and from published acorn composition
ranges, and are deliberately on the conservative side.

## The chain

| Step | Formula | Default |
|---|---|---|
| Pure ethanol in the spirit | `V_spirit × ABV` | 40% ABV |
| Ethanol mass | `× 0.789 kg/L` | constant |
| Ethanol needed in the wash | `÷ distillation recovery` | 80% kept in the hearts cut |
| Fermentable sugar | `÷ (0.511 × fermentation efficiency)` | 92% of the theoretical 0.511 g EtOH / g sugar |
| Starch converted | `÷ (1.111 × conversion efficiency)` | 85% (acorn starch is unmalted; needs amylase or a malt addition) |
| Starch before leaching | `÷ (1 − leach loss)` | 5% white oak, 8% red oak |
| Dry kernel | `÷ starch fraction of dry kernel` | 55% white oak, 45% red oak |
| Fresh kernel | `÷ (1 − moisture)` | 35% water in freshly fallen kernels |
| Sound in-shell acorns | `÷ kernel yield` | 60% kernel, 40% shell and cap |
| Acorns foraged | `÷ (1 − cull rate)` | 25% culled for weevils, mould, floaters |
| Pounds | `÷ 0.45359237` | constant |

Constants: ethanol density 0.789 kg/L; starch → glucose mass gain 180/162 = 1.111
(hydrolysis adds a water per glucose unit); Gay-Lussac theoretical yield
92/180 = 0.511 g ethanol per g glucose.

The wash volume shown in the UI is `wash ethanol ÷ 0.789 ÷ wash ABV` and only
sizes the fermenter; it does not feed into the acorn weight.

## Worked example: 3 L of 40% spirit, white oak defaults

| Step | Value |
|---|---|
| Pure ethanol | 1.20 L = 0.947 kg |
| Ethanol in the wash (÷ 0.80) | 1.18 kg |
| Fermentable sugar (÷ 0.511 ÷ 0.92) | 2.52 kg |
| Starch converted (÷ 1.111 ÷ 0.85) | 2.66 kg |
| Starch before leaching (÷ 0.95) | 2.81 kg |
| Dry kernel (÷ 0.55) | 5.10 kg |
| Fresh kernel (÷ 0.65) | 7.85 kg |
| Sound acorns in shell (÷ 0.60) | 13.1 kg |
| **Acorns foraged (÷ 0.75)** | **17.4 kg = 38.4 lb** |

With the red oak preset (45% starch, 8% leach loss) the same 3 L needs
22.0 kg = 48.5 lb. A practical foraging target for 3 L is therefore
**40 lb of white oak acorns or 50 lb of red oak acorns**, roughly 13 to 16 lb
per liter of spirit.

## Sanity check against malt

A kilogram of base malt gives roughly 0.35 to 0.40 L of pure ethanol in
practice, so 1.2 L of ethanol would take about 3.3 kg (7 lb) of malt. Acorns
need about five to six times that weight because, per pound picked up, you
lose 25% to culling, 40% to shell, 35% to water, and the remaining dry kernel
is only about half starch: 0.75 × 0.60 × 0.65 × 0.55 ≈ 0.16 kg starch per kg
foraged versus ≈ 0.60 kg per kg of malt.

## Caveats

- Acorn composition varies a lot by species, tree and year. The species
  presets are group averages; weigh a shelled, dried sample if you want a
  better starch number.
- Red oak acorns carry 15 to 30% fat on a dry basis. Fat does not ferment and
  can foam in the still; the calculator ignores it except through the lower
  starch fraction.
- Leaching is required for palatability (tannins) but also washes away free
  sugars, which is why starch loss defaults to a few percent rather than zero.
- Distilling spirits at home is illegal in many jurisdictions, including the
  United States without federal (TTB) and state permits. The calculator is a
  planning tool.
