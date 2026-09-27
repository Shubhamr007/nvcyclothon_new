import { FaCheck } from "react-icons/fa6";

export function SponsorshipTierCard({ tier, selected, onSelect }) {
  const isAvailable = tier.availability > 0;
  const price = tier.amount_paise > 0 ? `₹${(tier.amount_paise / 100).toLocaleString('en-IN')}` : "In-Kind";

  return (
    <div
      onClick={() => isAvailable && onSelect(tier)}
      className={`relative flex flex-col rounded-2xl border-2 p-6 transition-all ${
        !isAvailable
          ? "cursor-not-allowed border-white/5 opacity-50 grayscale"
          : selected
          ? "cursor-pointer border-[#ff5f3d] bg-white/5 shadow-[0_0_20px_rgba(255,95,61,0.2)]"
          : "cursor-pointer border-[#071313]/15 bg-[#071313] hover:border-[#ff5f3d]/50"
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-black tracking-tight">{tier.name}</h3>
          <p className="mt-2 text-2xl font-black text-[#d9ff38]">{price}</p>
        </div>
        {selected && (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#ff5f3d] text-white">
            <FaCheck size={12} />
          </span>
        )}
      </div>

      <div className="mt-4">
        <span className={`inline-block rounded px-2 py-1 text-[10px] font-black uppercase tracking-wider ${isAvailable ? 'bg-[#d9ff38] text-[#071313]' : 'bg-red-900 text-white'}`}>
          {isAvailable ? `${tier.availability} Available` : 'Sold Out'}
        </span>
      </div>

      <div className="mt-6 flex-1">
        <ul className="space-y-3 text-sm text-white/80">
          {tier.benefits && tier.benefits.map((benefit, index) => (
            <li key={index} className="flex items-start gap-2">
              <FaCheck className="mt-1 shrink-0 text-[#ff5f3d]" size={12} />
              <span>{benefit}</span>
            </li>
          ))}
          {tier.complimentary_entries > 0 && (
            <li className="flex items-start gap-2">
              <FaCheck className="mt-1 shrink-0 text-[#ff5f3d]" size={12} />
              <span>{tier.complimentary_entries} complimentary entries</span>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
