const items = [
  'Marketing Agencies',
  'IT Companies',
  'Logistics Firms',
  'Private Clinics',
  'Law Firms',
  'Real Estate',
  'E-commerce',
  'Construction',
  'Factories',
  'Hospitals',
];

export function TrustedTicker() {
  const doubled = [...items, ...items];
  return (
    <section className="border-y border-white/10 py-10">
      <div className="flex items-center gap-6 overflow-hidden">
        <p className="flex-shrink-0 pl-4 font-cairo text-sm text-white/35 lg:pl-8">
          Trusted by teams in
        </p>
        <div className="flex min-w-0 flex-1 overflow-hidden">
          <div className="flex animate-marquee whitespace-nowrap">
            {doubled.map((label, i) => (
              <span
                key={`${label}-${i}`}
                className="inline-flex items-center font-cairo text-sm text-white/20 transition-colors hover:text-white/50"
              >
                <span className="px-3">·</span>
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
