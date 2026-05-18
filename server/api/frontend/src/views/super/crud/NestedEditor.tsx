import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui';
import classNames from '@/utils/classNames';
import { TbMinus, TbPlus, TbTrash } from 'react-icons/tb';

type NestedEditorProps<T> = {
   className?: string;
   value: T;
   label?: string;
   itemLabel?: string;
   createNewItem: () => T;
   renderItem: () => ReactNode;
   onChange: (value: T | undefined) => void;
};

function NestedEditor<T>(props: NestedEditorProps<T>) {
   const { className, value, onChange, label, createNewItem, renderItem, itemLabel = 'Item' } = props;
   const { t } = useTranslation();

   const createItem = () => {
      const newItem = createNewItem();
      onChange(newItem);
   };

   const removeItem = () => {
      onChange(undefined);
   };

   const canAdd = !value;
   const canRemove = !!value;

   return (
      <div className={classNames('space-y-4', className)}>
         <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-gray-500">{label}</label>
            {!!value ? (
               <>
                  <Button variant="default" type="button" size="sm" onClick={removeItem} className="flex items-center gap-2">
                     <TbMinus className="h-4 w-4" />
                     Remove {itemLabel.toLowerCase()}
                  </Button>
               </>
            ) : (
               <>
                  <Button variant="default" type="button" size="sm" onClick={createItem} className="flex items-center gap-2">
                     <TbPlus className="h-4 w-4" />
                     Provide {itemLabel.toLowerCase()}
                  </Button>
               </>
            )}
         </div>
         {!!value && <div className="space-y-3">{renderItem()}</div>}
      </div>
   );
}

export default NestedEditor;
