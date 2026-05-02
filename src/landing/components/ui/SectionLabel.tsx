export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-cairo text-sm font-semibold uppercase tracking-[0.2em] text-orange">
      {children}
    </p>
  );
}
