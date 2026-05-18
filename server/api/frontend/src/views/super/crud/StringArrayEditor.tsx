import { useCallback, useMemo } from 'react';
import { Button, Input } from '@/components/ui';
import classNames from '@/utils/classNames';
import { TbPlus, TbTrash } from 'react-icons/tb';

type StringArrayEditorProps = {
   value?: string[];
   onChange: (value: string[]) => void;
   className?: string;
   label?: string;
   maxItems?: number;
   minItems?: number;
};

function StringArrayEditor(props: StringArrayEditorProps) {
   const { className, value, onChange, label = 'Item', maxItems, minItems = 0 } = props;

   const items = useMemo(() => value || [], [value]);

   const addItem = useCallback(() => {
      if (!maxItems || items.length < maxItems) {
         onChange([...items, '']);
      }
   }, [items, maxItems, onChange]);

   const removeItem = useCallback(
      (index: number) => {
         if (items.length > minItems) {
            onChange(items.filter((_, i) => i !== index));
         }
      },
      [items, minItems, onChange]
   );

   const updateItem = useCallback(
      (index: number, newValue: string) => {
         const updated = [...items];
         updated[index] = newValue;
         onChange(updated);
      },
      [items, onChange]
   );

   const canAdd = useMemo(() => {
      return !maxItems || items.length < maxItems;
   }, [maxItems, items]);

   const canRemove = useMemo(() => {
      return items.length > minItems;
   }, [minItems, items]);

   return (
      <div className={classNames('space-y-2', className)}>
         <div className="space-y-2">
            {items.map((item, index) => (
               <div key={index} className="flex items-center gap-2">
                  <Input
                     className="flex-1"
                     value={item}
                     placeholder={`${label} ${index + 1}`}
                     onChange={(e) => updateItem(index, e.target.value)}
                  />
                  {canRemove && (
                     <Button
                        variant="plain"
                        size="sm"
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                     >
                        <TbTrash className="h-4 w-4" />
                     </Button>
                  )}
               </div>
            ))}
         </div>
         <Button variant="default" type="button" size="sm" disabled={!canAdd} onClick={addItem} className="flex items-center gap-2">
            <TbPlus className="h-4 w-4" />
            Add {label.toLowerCase()}
         </Button>
         {minItems > 0 && items.length < minItems && (
            <p className="text-sm text-red-600">
               At least {minItems} {label.toLowerCase()}
               {minItems > 1 ? 's' : ''} required
            </p>
         )}
         {maxItems && items.length >= maxItems && (
            <p className="text-sm text-gray-500">
               Maximum {maxItems} {label.toLowerCase()}
               {maxItems > 1 ? 's' : ''} allowed
            </p>
         )}
      </div>
   );
}

export default StringArrayEditor;
