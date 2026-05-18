import { ReactNode, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui';
import classNames from '@/utils/classNames';
import { TbPlus, TbTrash } from 'react-icons/tb';
import { useFormContext } from 'react-hook-form';

type ArrayEditorProps<T> = {
   value?: T[];
   onChange: (value: T[]) => void;
   className?: string;
   name?: string;
   headerLabel?: string;
   itemLabel?: string;
   maxItems?: number;
   minItems?: number;
   createNewItem: () => T;
   renderItem: (index: number) => ReactNode;
};

function ArrayEditor<T>(props: ArrayEditorProps<T>) {
   const { className, value, name, onChange, headerLabel, maxItems, minItems = 0, createNewItem, renderItem, itemLabel = 'Item' } = props;
   const { t } = useTranslation();

   const { control } = useFormContext();

   const addItem = useCallback(() => {
      if (!maxItems || !value || value.length < maxItems) {
         const newItem = createNewItem();
         let currentValue = control._getWatch(name);
         if (!currentValue) {
            currentValue = [];
         }
         currentValue.push(newItem);
         onChange(currentValue);
      }
   }, [value]);

   const removeItem = useCallback(
      (index: number) => {
         if ((value || []).length > minItems) {
            const newValue = (value || []).filter((_, i) => i !== index);
            onChange(newValue);
         }
      },
      [value]
   );

   const canAdd = useMemo(() => {
      return !maxItems || (value || []).length < maxItems;
   }, [maxItems, value]);

   const canRemove = useMemo(() => {
      return (value || []).length > minItems;
   }, [minItems, value]);

   return (
      <div className={classNames('space-y-4', className)}>
         <div className="flex items-center justify-between">
            {headerLabel && headerLabel.length > 0 && <label className="text-sm font-medium text-gray-700">{headerLabel}</label>}
            <Button variant="default" type="button" size="sm" disabled={!canAdd} onClick={addItem} className="flex items-center gap-2">
               <TbPlus className="h-4 w-4" />
               Add {itemLabel.toLowerCase()}
            </Button>
         </div>
         <div className="space-y-3">
            {(value || []).map((item, index) => (
               <div key={index} className="relative group border border-gray-200 rounded-lg p-4 bg-gray-50">
                  {/* Item Header */}
                  <div className="flex items-center justify-between mb-3">
                     <span className="text-sm font-medium text-gray-600">
                        {itemLabel} {index + 1}
                     </span>
                     {canRemove && (
                        <Button
                           variant="plain"
                           size="sm"
                           type="button"
                           onClick={() => removeItem(index)}
                           className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                           <TbTrash className="h-4 w-4" />
                        </Button>
                     )}
                  </div>

                  {/* Rendered Item */}
                  {renderItem(index)}
               </div>
            ))}
         </div>
         {/* Validation Messages */}
         {minItems > 0 && (value || []).length < minItems && (
            <p className="text-sm text-red-600">
               At least {minItems} {itemLabel.toLowerCase()}
               {minItems > 1 ? 's' : ''} required
            </p>
         )}
         {maxItems && (value || []).length >= maxItems && (
            <p className="text-sm text-gray-500">
               Maximum {maxItems} {itemLabel.toLowerCase()}
               {maxItems > 1 ? 's' : ''} allowed
            </p>
         )}
      </div>
   );
}

export default ArrayEditor;
