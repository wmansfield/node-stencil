import CompletionNodeAssetInfo, { ICompletionNodeAssetInfo } from '@/stencil/models/entities/completionnodeassetinfo';
import CompletionNodeAssetInfoEditor from './CompletionNodeAssetInfoEditor';
import ArrayEditor from '../ArrayEditor';
import { Controller, useFormContext } from 'react-hook-form';

type CompletionNodeAssetInfoListEditorProps = {
   className?: string;
   name: string;
   label?: string;
   maxItems?: number;
   minItems?: number;
};

function CompletionNodeAssetInfoListEditor(props: CompletionNodeAssetInfoListEditorProps) {
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
               createNewItem={() => CompletionNodeAssetInfo()}
               renderItem={(index) => <CompletionNodeAssetInfoEditor name={`${name}.${index}`} className="bg-white" />}
               onChange={newValue => {
                  field.onChange(newValue);
                  trigger(name);
               }}
            />
         )}
      />
   );
}

export default CompletionNodeAssetInfoListEditor;