import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, useFormContext, useForm } from 'react-hook-form';
import _ from 'lodash';
import { z } from 'zod';
import CompletionNodeTextInfo, { ICompletionNodeTextInfo } from '@/stencil/models/entities/completionnodetextinfo';
import { closeModal, openModal } from '@/components/ui/Dialog/modalSlice';
import { useAppDispatch } from '@/store/rootStore';
import { Button, Card, Checkbox, DatePicker, Dialog, Form, FormItem, Input } from '@/components/ui';
import NullableCheckbox from '@/views/super/common/NullableCheckbox';
import NestedEditor from '../NestedEditor';


import classNames from '@/utils/classNames';


export const completionNodeTextInfoSchema: z.ZodTypeAny = z.lazy(() =>
   z.object({
   text: z.string()
   })
);

type CompletionNodeTextInfoEditorProps = {
	className?: string;
   name: string;
};


function CompletionNodeTextInfoEditor(props: CompletionNodeTextInfoEditorProps) {
   const { className, name } = props;

	const { control, formState: { errors }, setValue, trigger } = useFormContext();

	const { t } = useTranslation();

   // Set default values if not already set
   useEffect(() => {
      const currentValue = control._getWatch(name) as ICompletionNodeTextInfo;

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
               
         </div>
		</Card>
	);
}

export default CompletionNodeTextInfoEditor;