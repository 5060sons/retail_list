import { partnerTypeLabel } from "@/lib/format";
import type { PartnerType } from "@/lib/supabase/types";

export function PartnerBadge({ partnerType }: { partnerType: PartnerType }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs ${
        partnerType === "supplier" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"
      }`}
    >
      {partnerTypeLabel(partnerType)}
    </span>
  );
}
