import CompletionNodeTargetInfo, { ICompletionNodeTargetInfo } from '@/stencil/models/entities/completionnodetargetinfo';
import CompletionNodeTargetInfoEditor from './CompletionNodeTargetInfoEditor';
import ArrayEditor from '../ArrayEditor';
import { Controller, useFormContext } from 'react-hook-form';

type CompletionNodeTargetInfoListEditorProps = {
   className?: string;
   name: string;
   label?: string;
   maxItems?: number;
   minItems?: number;
};

function CompletionNodeTargetInfoListEditor(props: CompletionNodeTargetInfoListEditorProps) {
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
               createNewItem={() => CompletionNodeTargetInfo()}
               renderItem={(index) => <CompletionNodeTargetInfoEditor name={`${name}.${index}`} className="bg-white" />}
               onChange={newValue => {
                  field.onChange(newValue);
                  trigger(name);
               }}
            />
         )}
      />
   );
}

export default CompletionNodeTargetInfoListEditor;