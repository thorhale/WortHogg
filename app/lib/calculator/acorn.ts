// Acorn spirit forage calculator.
//
// Works backwards from a target volume of finished spirit to the weight of
// acorns you need to pick up off the ground. Every loss step in the chain is
// an explicit, user-editable percentage so the assumptions are visible rather
// than baked in. See docs/acorn-spirit-formula.md for the derivation, the
// sources behind the defaults, and the worked 3 L example.
//
// Chain (each step divides by a yield fraction):
//   spirit volume -> pure ethanol -> ethanol in the wash -> fermentable sugar
//   -> starch -> dry kernel -> fresh kernel -> sound in-shell acorns
//   -> acorns foraged (including the ones you will cull)

export const ETHANOL_DENSITY_KG_PER_L = 0.789;
// Hydrolysis adds one water per glucose unit: 162 g starch -> 180 g glucose.
export const STARCH_TO_SUGAR_MASS_RATIO = 180 / 162;
// Gay-Lussac: 180 g glucose -> 92 g ethanol + 88 g CO2.
export const THEORETICAL_ETHANOL_PER_SUGAR = 92 / 180;
export const KG_PER_LB = 0.45359237;

export interface AcornInputs {
  /** Finished spirit you want, in liters. */
  targetVolumeL: number;
  /** Strength of the finished spirit, % alcohol by volume. */
  targetAbvPct: number;
  /** Share of wash ethanol that ends up in the kept hearts cut, %. */
  distillRecoveryPct: number;
  /** Fermentation yield as % of the theoretical 0.511 g ethanol per g sugar. */
  fermentEfficiencyPct: number;
  /** Starch actually converted to fermentable sugar (enzymes / malt), %. */
  conversionEfficiencyPct: number;
  /** Starch lost as fines and solubles while leaching tannins, %. */
  leachLossPct: number;
  /** Starch as % of the dry kernel mass. */
  starchPctDry: number;
  /** Water content of the fresh kernel, %. */
  kernelMoisturePct: number;
  /** Kernel mass as % of whole in-shell acorn mass (rest is shell and cap). */
  kernelYieldPct: number;
  /** Foraged acorns rejected for weevils, mould or floating, %. */
  cullPct: number;
  /** Target strength of the fermented wash, % ABV (sizes the fermenter). */
  washAbvPct: number;
}

export interface AcornResult {
  pureEthanolL: number;
  pureEthanolKg: number;
  washEthanolKg: number;
  washVolumeL: number;
  sugarKg: number;
  starchKg: number;
  starchHarvestedKg: number;
  dryKernelKg: number;
  freshKernelKg: number;
  soundAcornsKg: number;
  foragedKg: number;
  foragedLb: number;
  /** Pounds of foraged acorns per liter of finished spirit. */
  lbPerLiter: number;
}

export type OakPreset = "white" | "red";

export const OAK_PRESETS: Record<OakPreset, { label: string; starchPctDry: number; leachLossPct: number; note: string }> = {
  white: {
    label: "White oak group",
    starchPctDry: 55,
    leachLossPct: 5,
    note: "White, bur, swamp white, chestnut oak: starchier, lower tannin, leaches fast.",
  },
  red: {
    label: "Red oak group",
    starchPctDry: 45,
    leachLossPct: 8,
    note: "Northern red, pin, black oak: oilier, more tannin, needs longer leaching.",
  },
};

export const DEFAULT_ACORN_INPUTS: AcornInputs = {
  targetVolumeL: 3,
  targetAbvPct: 40,
  distillRecoveryPct: 80,
  fermentEfficiencyPct: 92,
  conversionEfficiencyPct: 85,
  leachLossPct: OAK_PRESETS.white.leachLossPct,
  starchPctDry: OAK_PRESETS.white.starchPctDry,
  kernelMoisturePct: 35,
  kernelYieldPct: 60,
  cullPct: 25,
  washAbvPct: 8,
};

function fraction(pct: number): number {
  return pct / 100;
}

/** Divide by a yield fraction, returning 0 instead of Infinity/NaN for a zero yield. */
function expand(value: number, yieldFraction: number): number {
  if (!(yieldFraction > 0) || !Number.isFinite(yieldFraction)) return 0;
  return value / yieldFraction;
}

export function acornForageForSpirit(inputs: AcornInputs): AcornResult {
  const pureEthanolL = Math.max(0, inputs.targetVolumeL) * fraction(inputs.targetAbvPct);
  const pureEthanolKg = pureEthanolL * ETHANOL_DENSITY_KG_PER_L;

  const washEthanolKg = expand(pureEthanolKg, fraction(inputs.distillRecoveryPct));
  const washVolumeL = expand(washEthanolKg / ETHANOL_DENSITY_KG_PER_L, fraction(inputs.washAbvPct));

  const sugarKg = expand(washEthanolKg, THEORETICAL_ETHANOL_PER_SUGAR * fraction(inputs.fermentEfficiencyPct));
  const starchKg = expand(sugarKg, STARCH_TO_SUGAR_MASS_RATIO * fraction(inputs.conversionEfficiencyPct));
  const starchHarvestedKg = expand(starchKg, 1 - fraction(inputs.leachLossPct));

  const dryKernelKg = expand(starchHarvestedKg, fraction(inputs.starchPctDry));
  const freshKernelKg = expand(dryKernelKg, 1 - fraction(inputs.kernelMoisturePct));
  const soundAcornsKg = expand(freshKernelKg, fraction(inputs.kernelYieldPct));
  const foragedKg = expand(soundAcornsKg, 1 - fraction(inputs.cullPct));
  const foragedLb = foragedKg / KG_PER_LB;

  return {
    pureEthanolL,
    pureEthanolKg,
    washEthanolKg,
    washVolumeL,
    sugarKg,
    starchKg,
    starchHarvestedKg,
    dryKernelKg,
    freshKernelKg,
    soundAcornsKg,
    foragedKg,
    foragedLb,
    lbPerLiter: inputs.targetVolumeL > 0 ? foragedLb / inputs.targetVolumeL : 0,
  };
}
