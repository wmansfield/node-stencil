import KeyFragment, { IKeyFragment } from '@/stencil/models/entities/keyfragment';
import KeyFragmentEditor from './KeyFragmentEditor';
import ArrayEditor from '../ArrayEditor';
import { Controller, useFormContext } from 'react-hook-form';

type KeyFragmentListEditorProps = {
   className?: string;
   name: string;
   label?: string;
   maxItems?: number;
   minItems?: number;
};

function KeyFragmentListEditor(props: KeyFragmentListEditorProps) {
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
               createNewItem={() => KeyFragment()}
               renderItem={(index) => <KeyFragmentEditor name={`${name}.${index}`} className="bg-white" />}
               onChange={newValue => {
                  field.onChange(newValue);
                  trigger(name);
               }}
            />
         )}
      />
   );
}

export default KeyFragmentListEditor;