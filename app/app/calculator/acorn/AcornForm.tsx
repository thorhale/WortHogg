"use client";

import { useId, useMemo, useState } from "react";
import {
  acornForageForSpirit,
  DEFAULT_ACORN_INPUTS,
  OAK_PRESETS,
  type AcornInputs,
  type OakPreset,
} from "@/lib/calculator/acorn";

type FieldKey = keyof AcornInputs;
type FormValues = Record<FieldKey, string>;

interface FieldDef {
  key: FieldKey;
  label: string;
  help: string;
}

const TARGET_FIELDS: FieldDef[] = [
  { key: "targetVolumeL", label: "Spirit wanted (L)", help: "Finished, bottled volume." },
  { key: "targetAbvPct", label: "Spirit strength (% ABV)", help: "40% is standard bottling strength." },
];

const PROCESS_FIELDS: FieldDef[] = [
  { key: "distillRecoveryPct", label: "Distillation recovery (%)", help: "Wash ethanol kept in the hearts after heads and tails cuts." },
  { key: "fermentEfficiencyPct", label: "Fermentation efficiency (%)", help: "Of the theoretical 0.511 g ethanol per g sugar." },
  { key: "conversionEfficiencyPct", label: "Starch conversion (%)", help: "Acorn starch is unmalted; needs amylase or a malt addition." },
  { key: "washAbvPct", label: "Wash strength (% ABV)", help: "Only used to size the fermenter." },
];

const ACORN_FIELDS: FieldDef[] = [
  { key: "starchPctDry", label: "Starch in dry kernel (%)", help: "White oaks ~50-60%, red oaks ~40-50%." },
  { key: "leachLossPct", label: "Starch lost leaching (%)", help: "Fines and solubles washed away with the tannins." },
  { key: "kernelMoisturePct", label: "Fresh kernel moisture (%)", help: "Freshly fallen acorns are ~30-40% water." },
  { key: "kernelYieldPct", label: "Kernel share of whole acorn (%)", help: "Shell and cap are the other ~40%." },
  { key: "cullPct", label: "Culled on sorting (%)", help: "Weevil holes, mould, floaters. 20-40% is normal." },
];

const PRESET_KEYS: FieldKey[] = ["starchPctDry", "leachLossPct"];

function toStrings(inputs: AcornInputs): FormValues {
  const out = {} as FormValues;
  (Object.keys(inputs) as FieldKey[]).forEach((k) => {
    out[k] = String(inputs[k]);
  });
  return out;
}

function toNum(s: string): number {
  const v = parseFloat(s);
  return Number.isFinite(v) ? v : 0;
}

function toInputs(values: FormValues): AcornInputs {
  const out = {} as AcornInputs;
  (Object.keys(values) as FieldKey[]).forEach((k) => {
    out[k] = toNum(values[k]);
  });
  return out;
}

export default function AcornForm() {
  const formId = useId();
  const [values, setValues] = useState<FormValues>(() => toStrings(DEFAULT_ACORN_INPUTS));
  const [preset, setPreset] = useState<OakPreset | "custom">("white");

  const result = useMemo(() => acornForageForSpirit(toInputs(values)), [values]);

  function setField(key: FieldKey, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    if (PRESET_KEYS.includes(key)) setPreset("custom");
  }

  function applyPreset(next: OakPreset | "custom") {
    setPreset(next);
    if (next === "custom") return;
    const p = OAK_PRESETS[next];
    setValues((v) => ({ ...v, starchPctDry: String(p.starchPctDry), leachLossPct: String(p.leachLossPct) }));
  }

  const roundedUpLb = Math.ceil(result.foragedLb / 5) * 5;

  return (
    <div>
      <div
        style={{
          margin: "1rem 0 1.5rem",
          padding: "1rem 1.25rem",
          background: "#f5e9d8",
          borderRadius: 8,
          display: "flex",
          gap: "2rem",
          flexWrap: "wrap",
          alignItems: "flex-end",
        }}
      >
        <div>
          <div style={{ fontSize: "2.25rem", fontWeight: 700, lineHeight: 1.1 }}>
            {result.foragedLb.toFixed(1)} lb
          </div>
          <div style={{ fontSize: "0.8rem", color: "#5a4a3a", textTransform: "uppercase" }}>
            acorns to forage ({result.foragedKg.toFixed(1)} kg)
          </div>
        </div>
        <Stat label="Round up to" value={`${roundedUpLb} lb`} />
        <Stat label="Per liter of spirit" value={`${result.lbPerLiter.toFixed(1)} lb`} />
        <Stat label="Wash to ferment" value={`${result.washVolumeL.toFixed(1)} L`} />
        <Stat label="Shelled kernels" value={`${(result.freshKernelKg / 0.45359237).toFixed(1)} lb`} />
      </div>

      <section>
        <h2>Target</h2>
        <FieldGrid fields={TARGET_FIELDS} values={values} setField={setField} formId={formId} />
      </section>

      <section style={{ marginTop: "1.5rem" }}>
        <h2>Acorns</h2>
        <label
          htmlFor={`${formId}-preset`}
          style={{ display: "flex", flexDirection: "column", fontSize: "0.85rem", gap: "0.25rem", marginBottom: "1rem" }}
        >
          Oak species preset
          <select
            id={`${formId}-preset`}
            value={preset}
            onChange={(e) => applyPreset(e.target.value as OakPreset | "custom")}
            style={{ ...inputStyle, width: 220 }}
          >
            {(Object.keys(OAK_PRESETS) as OakPreset[]).map((k) => (
              <option key={k} value={k}>
                {OAK_PRESETS[k].label}
              </option>
            ))}
            <option value="custom">Custom</option>
          </select>
          <span style={{ color: "#888", fontSize: "0.75rem" }}>
            {preset === "custom" ? "Using your own starch and leaching values." : OAK_PRESETS[preset].note}
          </span>
        </label>
        <FieldGrid fields={ACORN_FIELDS} values={values} setField={setField} formId={formId} />
      </section>

      <section style={{ marginTop: "1.5rem" }}>
        <h2>Process</h2>
        <FieldGrid fields={PROCESS_FIELDS} values={values} setField={setField} formId={formId} />
      </section>

      <section style={{ marginTop: "1.5rem" }}>
        <details open={preset === "red"}>
          <summary style={{ cursor: "pointer", fontWeight: 700, fontSize: "1.1rem" }}>Mash notes</summary>
          <ul style={{ fontSize: "0.9rem", lineHeight: 1.5, paddingLeft: "1.25rem", marginTop: "0.5rem" }}>
            <li>
              <strong>Leach before you mash.</strong> Grind the shelled kernels coarsely and cold-leach in
              several changes of water until the bitterness is gone. Keep the water cold: heat gelatinizes
              the starch and traps the tannins, and tannins knock down amylase and stress the yeast.
            </li>
            <li>
              <strong>Bring your own enzymes.</strong> Acorns have no diastatic power. Boil the leached meal
              to gelatinize the starch, then add high-temperature alpha-amylase and glucoamylase, or mash
              with 20 to 25% six-row distiller&apos;s malt. The starch conversion field above assumes you
              do one of these.
            </li>
            <li style={preset === "red" ? { background: "#f5e9d8", padding: "0.3rem 0.5rem", borderRadius: 4 } : undefined}>
              <strong>Skim the oil cap.</strong> Red and black oak acorns run 15 to 24% fat, so an oil
              slick rises during the boil. Skim it off: it goes rancid in the wash and foams in the still.
              White oak acorns are usually under 10% fat and need less attention here.
              {preset === "red" && " You have the red oak preset selected, so plan on skimming."}
            </li>
          </ul>
        </details>
      </section>

      <section style={{ marginTop: "1.5rem" }}>
        <h2>Step by step</h2>
        <table style={{ borderCollapse: "collapse", minWidth: 360 }}>
          <tbody>
            <Row label="Pure ethanol in the spirit" value={`${result.pureEthanolL.toFixed(2)} L (${result.pureEthanolKg.toFixed(2)} kg)`} />
            <Row label="Ethanol needed in the wash" value={`${result.washEthanolKg.toFixed(2)} kg`} />
            <Row label="Fermentable sugar needed" value={`${result.sugarKg.toFixed(2)} kg`} />
            <Row label="Starch converted" value={`${result.starchKg.toFixed(2)} kg`} />
            <Row label="Starch before leaching" value={`${result.starchHarvestedKg.toFixed(2)} kg`} />
            <Row label="Dry kernel" value={`${result.dryKernelKg.toFixed(2)} kg`} />
            <Row label="Fresh kernel (shelled)" value={`${result.freshKernelKg.toFixed(2)} kg`} />
            <Row label="Sound acorns in shell" value={`${result.soundAcornsKg.toFixed(2)} kg`} />
            <Row label="Acorns foraged, before culling" value={`${result.foragedKg.toFixed(2)} kg = ${result.foragedLb.toFixed(1)} lb`} bold />
          </tbody>
        </table>
      </section>
    </div>
  );
}

function FieldGrid({
  fields,
  values,
  setField,
  formId,
}: {
  fields: FieldDef[];
  values: FormValues;
  setField: (key: FieldKey, value: string) => void;
  formId: string;
}) {
  return (
    <div style={{ display: "flex", gap: "1rem 1.5rem", flexWrap: "wrap" }}>
      {fields.map((f) => (
        <label
          key={f.key}
          htmlFor={`${formId}-${f.key}`}
          style={{ display: "flex", flexDirection: "column", fontSize: "0.85rem", gap: "0.25rem", width: 200 }}
        >
          {f.label}
          <input
            id={`${formId}-${f.key}`}
            inputMode="decimal"
            value={values[f.key]}
            onChange={(e) => setField(f.key, e.target.value)}
            style={{ ...inputStyle, width: 100 }}
          />
          <span style={{ color: "#888", fontSize: "0.75rem" }}>{f.help}</span>
        </label>
      ))}
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <tr style={{ fontWeight: bold ? 700 : 400 }}>
      <td style={{ padding: "0.3rem 1rem 0.3rem 0", borderBottom: "1px solid #eee" }}>{label}</td>
      <td style={{ padding: "0.3rem 0", borderBottom: "1px solid #eee", textAlign: "right", whiteSpace: "nowrap" }}>
        {value}
      </td>
    </tr>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{value}</div>
      <div style={{ fontSize: "0.75rem", color: "#5a4a3a", textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "0.3rem",
  border: "1px solid #ccc",
  borderRadius: 4,
  width: "100%",
};
