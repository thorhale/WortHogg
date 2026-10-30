import type { Metadata } from "next";
import AcornForm from "./AcornForm";

export const metadata: Metadata = {
  title: "Acorn Spirit Forage Calculator · WortHogg",
  description:
    "Work out how many pounds of acorns to forage for a given volume of acorn spirit, step by step from spirit volume back to the forest floor.",
};

export default function AcornCalculatorPage() {
  return (
    <div>
      <h1>Acorn Spirit Forage Calculator</h1>
      <p style={{ color: "#666" }}>
        Enter how much finished spirit you want and this works backwards through every loss in the
        chain (distillation cut, fermentation, starch conversion, leaching, drying, shelling, culling)
        to the weight of acorns you need to pick up. Every assumption is editable; the defaults are
        typical published values and are explained in <code>docs/acorn-spirit-formula.md</code>.
      </p>
      <p style={{ color: "#666", fontSize: "0.85rem" }}>
        Distilling spirits at home is illegal in many places, including the United States without
        federal and state permits. Check your local laws before using this for anything but
        planning on paper.
      </p>
      <AcornForm />
    </div>
  );
}
