type InlineFieldRendererProps = {
  fields: Record<string, any>;
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
};

export function InlineFieldRenderer({ fields, values, onChange }: InlineFieldRendererProps) {
  return (
    <div className="space-y-1.5">
      {Object.entries(fields).map(([key, field]) => {
        const value = values[key] ?? field.default;

        // text input
        if (field.type === "text") {
          return (
            <div key={key} className="flex items-center gap-1.5">
              {field.label && (
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {field.label}:
                </span>
              )}
              <input
                type="text"
                value={value || ''}
                className="flex-1 min-w-0 text-xs border border-input rounded px-2 py-0.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
                onChange={(e) => onChange(key, e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                placeholder={field.default || ''}
              />
            </div>
          );
        }

        // number input
        if (field.type === "number") {
          const numValue = value ?? field.default ?? 0;
          return (
            <div key={key} className="flex items-center gap-1.5">
              {field.label && (
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {field.label}:
                </span>
              )}
              <input
                type="number"
                value={numValue}
                className="text-xs border border-input rounded px-2 py-0.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring w-16"
                onChange={(e) => {
                  const inputValue = e.target.value;
                  const parsed = Number(inputValue);
                  // Allow empty input or valid numbers
                  if (inputValue === '') {
                    onChange(key, 0);
                  } else if (!isNaN(parsed)) {
                    onChange(key, parsed);
                  }
                  // If invalid, don't update (keeps previous value)
                }}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              />
            </div>
          );
        }

        // dropdown/select
        if (field.type === "select") {
          return (
            <div key={key} className="flex items-center gap-1.5">
              {field.label && (
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {field.label}:
                </span>
              )}
              <select
                value={value || field.default || ''}
                className="flex-1 min-w-0 text-xs border border-input rounded px-2 py-0.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring cursor-pointer"
                onChange={(e) => onChange(key, e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                {field.options?.map((o: any) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          );
        }

        // toggle / checkbox
        if (field.type === "toggle") {
          return (
            <div key={key} className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                {field.label}:
              </span>
              <input
                type="checkbox"
                checked={!!value}
                onChange={(e) => onChange(key, e.target.checked)}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                className="w-4 h-4 cursor-pointer accent-primary"
              />
            </div>
          );
        }

        // color picker
        if (field.type === "color") {
          return (
            <div key={key} className="flex items-center gap-1.5">
              {field.label && (
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {field.label}:
                </span>
              )}
              <input
                type="color"
                value={value || field.default || '#FF0000'}
                className="w-10 h-7 border border-input rounded cursor-pointer bg-background"
                onChange={(e) => onChange(key, e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              />
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}

