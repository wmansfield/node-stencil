import CurrentUsage, { ICurrentUsage } from '@/stencil/models/entities/currentusage';
import CurrentUsageEditor from './CurrentUsageEditor';
import ArrayEditor from '../ArrayEditor';
import { Controller, useFormContext } from 'react-hook-form';

type CurrentUsageListEditorProps = {
   className?: string;
   name: string;
   label?: string;
   maxItems?: number;
   minItems?: number;
};

function CurrentUsageListEditor(props: CurrentUsageListEditorProps) {
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
               createNewItem={() => CurrentUsage()}
               renderItem={(index) => <CurrentUsageEditor name={`${name}.${index}`} className="bg-white" />}
               onChange={newValue => {
                  field.onChange(newValue);
                  trigger(name);
               }}
            />
         )}
      />
   );
}

export default CurrentUsageListEditor;