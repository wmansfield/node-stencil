import LocalizedContent, { ILocalizedContent } from '@/stencil/models/entities/localizedcontent';
import LocalizedContentEditor from './LocalizedContentEditor';
import ArrayEditor from '../ArrayEditor';
import { Controller, useFormContext } from 'react-hook-form';

type LocalizedContentListEditorProps = {
   className?: string;
   name: string;
   label?: string;
   maxItems?: number;
   minItems?: number;
};

function LocalizedContentListEditor(props: LocalizedContentListEditorProps) {
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
               createNewItem={() => LocalizedContent()}
               renderItem={(index) => <LocalizedContentEditor name={`${name}.${index}`} className="bg-white" />}
               onChange={newValue => {
                  field.onChange(newValue);
                  trigger(name);
               }}
            />
         )}
      />
   );
}

export default LocalizedContentListEditor;