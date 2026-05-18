import CompletionNodeDateInfo, { ICompletionNodeDateInfo } from '@/stencil/models/entities/completionnodedateinfo';
import CompletionNodeDateInfoEditor from './CompletionNodeDateInfoEditor';
import ArrayEditor from '../ArrayEditor';
import { Controller, useFormContext } from 'react-hook-form';

type CompletionNodeDateInfoListEditorProps = {
   className?: string;
   name: string;
   label?: string;
   maxItems?: number;
   minItems?: number;
};

function CompletionNodeDateInfoListEditor(props: CompletionNodeDateInfoListEditorProps) {
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
               createNewItem={() => CompletionNodeDateInfo()}
               renderItem={(index) => <CompletionNodeDateInfoEditor name={`${name}.${index}`} className="bg-white" />}
               onChange={newValue => {
                  field.onChange(newValue);
                  trigger(name);
               }}
            />
         )}
      />
   );
}

export default CompletionNodeDateInfoListEditor;