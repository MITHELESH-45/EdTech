type BlockWrapperProps = {
  title: string;
  color: string;
  children: React.ReactNode;
};

export function BlockWrapper({ title, color, children }: BlockWrapperProps) {
  return (
    <div className="rounded-xl border shadow bg-white w-64">
      <div
        className="px-3 py-2 font-semibold text-white rounded-t-xl"
        style={{ backgroundColor: color }}
      >
        {title}
      </div>

      <div className="p-3 space-y-2">
        {children}
      </div>
    </div>
  );
}
