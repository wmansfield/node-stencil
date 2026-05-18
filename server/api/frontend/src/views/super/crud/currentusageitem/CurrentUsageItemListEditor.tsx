import CurrentUsageItem, { ICurrentUsageItem } from '@/stencil/models/entities/currentusageitem';
import CurrentUsageItemEditor from './CurrentUsageItemEditor';
import ArrayEditor from '../ArrayEditor';
import { Controller, useFormContext } from 'react-hook-form';

type CurrentUsageItemListEditorProps = {
   className?: string;
   name: string;
   label?: string;
   maxItems?: number;
   minItems?: number;
};

function CurrentUsageItemListEditor(props: CurrentUsageItemListEditorProps) {
   const { className, name, label, maxItems, minItems } = props;

   const { control, trigger } = useFormContext();

   return (
      <Controller
         name={name}
         control={control}
         render={({ field }) => (
            <ArrayEditor
               className={className}
               value={field.value}
               name={name}
               headerLabel=''
               itemLabel={label}
               minItems={minItems}
               maxItems={maxItems}
               createNewItem={() => CurrentUsageItem()}
               renderItem={(index) => <CurrentUsageItemEditor name={`${name}.${index}`} className="bg-white" />}
               onChange={newValue => {
                  field.onChange(newValue);
                  trigger(name);
               }}
            />
         )}
      />
   );
}

export default CurrentUsageItemListEditor;