import Presage, { IPresage } from '@/stencil/models/entities/presage';
import PresageEditor from './PresageEditor';
import ArrayEditor from '../ArrayEditor';
import { Controller, useFormContext } from 'react-hook-form';

type PresageListEditorProps = {
   className?: string;
   name: string;
   label?: string;
   maxItems?: number;
   minItems?: number;
};

function PresageListEditor(props: PresageListEditorProps) {
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
               createNewItem={() => Presage()}
               renderItem={(index) => <PresageEditor name={`${name}.${index}`} className="bg-white" />}
               onChange={newValue => {
                  field.onChange(newValue);
                  trigger(name);
               }}
            />
         )}
      />
   );
}

export default PresageListEditor;