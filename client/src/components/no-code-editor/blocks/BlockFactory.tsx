import { BlockWrapper } from "./BlockWrapper";
import { FieldRenderer } from "./FieldRenderer";
import {schemaData} from "../../../lib/no-code-blocks";

type BlockFactoryProps = {
  id: string;
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
};

export function BlockFactory({ id, values, onChange }: BlockFactoryProps) {
  const block =
    schemaData.categories
      .flatMap(c => c.components)
      .find(c => c.id === id);

  if (!block) return <div>Unknown block: {id}</div>;

  return (
    <BlockWrapper title={block.label} color={block.color}>
      <FieldRenderer
        fields={block.fields}
        values={values}
        onChange={onChange}
      />
    </BlockWrapper>
  );
}
