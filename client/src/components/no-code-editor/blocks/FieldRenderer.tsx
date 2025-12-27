type FieldRendererProps = {
  fields: Record<string, any>;
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
};

export function FieldRenderer({ fields, values, onChange }: FieldRendererProps) {
  return (
    <>
      {Object.entries(fields).map(([key, field]) => {
        const value = values[key] ?? field.default;

        // text + number
        if (field.type === "text" || field.type === "number")
          return (
            <div key={key}>
              <label className="text-xs block mb-1">{field.label}</label>
              <input
                type={field.type === "number" ? "number" : "text"}
                value={value}
                className="w-full border rounded px-2 py-1"
                onChange={e => onChange(key, e.target.value)}
              />
            </div>
          );

        // dropdown
        if (field.type === "select")
          return (
            <div key={key}>
              <label className="text-xs block mb-1">{field.label}</label>
              <select
                value={value}
                className="w-full border rounded px-2 py-1"
                onChange={e => onChange(key, e.target.value)}
              >
                {field.options.map((o: any) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          );

        // toggle / checkbox
        if (field.type === "toggle")
          return (
            <div key={key} className="flex justify-between items-center">
              <label className="text-xs">{field.label}</label>
              <input
                type="checkbox"
                checked={!!value}
                onChange={e => onChange(key, e.target.checked)}
              />
            </div>
          );

        // color picker
        if (field.type === "color")
          return (
            <div key={key}>
              <label className="text-xs block mb-1">{field.label}</label>
              <input
                type="color"
                value={value}
                className="w-10 h-8 p-0 border rounded"
                onChange={e => onChange(key, e.target.value)}
              />
            </div>
          );

        return null;
      })}
    </>
  );
}
