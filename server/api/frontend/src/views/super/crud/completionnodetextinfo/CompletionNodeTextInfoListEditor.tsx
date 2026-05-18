import CompletionNodeTextInfo, { ICompletionNodeTextInfo } from '@/stencil/models/entities/completionnodetextinfo';
import CompletionNodeTextInfoEditor from './CompletionNodeTextInfoEditor';
import ArrayEditor from '../ArrayEditor';
import { Controller, useFormContext } from 'react-hook-form';

type CompletionNodeTextInfoListEditorProps = {
   className?: string;
   name: string;
   label?: string;
   maxItems?: number;
   minItems?: number;
};

function CompletionNodeTextInfoListEditor(props: CompletionNodeTextInfoListEditorProps) {
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
               createNewItem={() => CompletionNodeTextInfo()}
               renderItem={(index) => <CompletionNodeTextInfoEditor name={`${name}.${index}`} className="bg-white" />}
               onChange={newValue => {
                  field.onChange(newValue);
                  trigger(name);
               }}
            />
         )}
      />
   );
}

export default CompletionNodeTextInfoListEditor;