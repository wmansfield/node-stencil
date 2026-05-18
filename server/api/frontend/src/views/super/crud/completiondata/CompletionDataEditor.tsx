import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, useFormContext, useForm } from 'react-hook-form';
import _ from 'lodash';
import { z } from 'zod';
import CompletionData, { ICompletionData } from '@/stencil/models/entities/completiondata';
import { closeModal, openModal } from '@/components/ui/Dialog/modalSlice';
import { useAppDispatch } from '@/store/rootStore';
import { Button, Card, Checkbox, DatePicker, Dialog, Form, FormItem, Input } from '@/components/ui';
import NullableCheckbox from '@/views/super/common/NullableCheckbox';
import NestedEditor from '../NestedEditor';


import classNames from '@/utils/classNames';

import CompletionNode from '@/stencil/models/entities/completionnode';
import CompletionNodeEditor, { completionNodeSchema } from '../completionnode/CompletionNodeEditor';

import CompletionNodeListEditor from '../completionnode/CompletionNodeListEditor';


export const completionDataSchema: z.ZodTypeAny = z.lazy(() =>
   z.object({
   text: z.string().max(250, 'Cannot be more than 250 characters.'),
   nodes: z.array(completionNodeSchema).optional()
   })
);

type CompletionDataEditorProps = {
	className?: string;
   name: string;
};


function CompletionDataEditor(props: CompletionDataEditorProps) {
   const { className, name } = props;

	const { control, formState: { errors }, setValue, trigger } = useFormContext();

	const { t } = useTranslation();

   // Set default values if not already set
   useEffect(() => {
      const currentValue = control._getWatch(name) as ICompletionData;

      const needsDefaults = !currentValue || currentValue.text === undefined;

      if (needsDefaults) {
         setValue(`${name}.text`, '');
         
      }
   }, [name, setValue, control]);

	return (
		<Card 
         className={classNames('', className)}>
         <div className='flex flex-col p-2 sm:p-0' >
            
            <FormItem
               label="Text"
               invalid={Boolean(errors[`${name}.text`])}
               errorMessage={errors[`${name}.text`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.text`}
                     control={control}
                     render={({ field }) => (
                        <Input
                           {...field}
                           className="mb-2"
                           id="text"
                           required
                        />
                     )}
                  />
                  
               </FormItem>
               
            <FormItem
               label="Nodes"
               invalid={Boolean(errors[`${name}.nodes`])}
               errorMessage={errors[`${name}.nodes`]?.message as string}
               >
                  
                     <CompletionNodeListEditor
                        name={`${name}.nodes`}
                        label="Nodes"
                        className="mb-4"
                     />
                  
               </FormItem>
               
         </div>
		</Card>
	);
}

export default CompletionDataEditor;