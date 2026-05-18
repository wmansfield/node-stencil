import ContentSection, { IContentSection } from '@/stencil/models/entities/contentsection';
import ContentSectionEditor from './ContentSectionEditor';
import ArrayEditor from '../ArrayEditor';
import { Controller, useFormContext } from 'react-hook-form';

type ContentSectionListEditorProps = {
   className?: string;
   name: string;
   label?: string;
   maxItems?: number;
   minItems?: number;
};

function ContentSectionListEditor(props: ContentSectionListEditorProps) {
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
               createNewItem={() => ContentSection()}
               renderItem={(index) => <ContentSectionEditor name={`${name}.${index}`} className="bg-white" />}
               onChange={newValue => {
                  field.onChange(newValue);
                  trigger(name);
               }}
            />
         )}
      />
   );
}

export default ContentSectionListEditor;