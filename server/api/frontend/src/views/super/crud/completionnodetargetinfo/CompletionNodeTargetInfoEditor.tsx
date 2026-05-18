import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, useFormContext, useForm } from 'react-hook-form';
import _ from 'lodash';
import { z } from 'zod';
import CompletionNodeTargetInfo, { ICompletionNodeTargetInfo } from '@/stencil/models/entities/completionnodetargetinfo';
import { closeModal, openModal } from '@/components/ui/Dialog/modalSlice';
import { useAppDispatch } from '@/store/rootStore';
import { Button, Card, Checkbox, DatePicker, Dialog, Form, FormItem, Input } from '@/components/ui';
import NullableCheckbox from '@/views/super/common/NullableCheckbox';
import NestedEditor from '../NestedEditor';


import classNames from '@/utils/classNames';


export const completionNodeTargetInfoSchema: z.ZodTypeAny = z.lazy(() =>
   z.object({
   connection_id: z.string().optional(),
   account_id: z.string(),
   handle_display: z.string().optional(),
   display_name: z.string().optional(),
   avatar_thumb_small_url: z.string().optional()
   })
);

type CompletionNodeTargetInfoEditorProps = {
	className?: string;
   name: string;
};


function CompletionNodeTargetInfoEditor(props: CompletionNodeTargetInfoEditorProps) {
   const { className, name } = props;

	const { control, formState: { errors }, setValue, trigger } = useFormContext();

	const { t } = useTranslation();

   // Set default values if not already set
   useEffect(() => {
      const currentValue = control._getWatch(name) as ICompletionNodeTargetInfo;

      const needsDefaults = !currentValue;

      if (needsDefaults) {
         
      }
   }, [name, setValue, control]);

	return (
		<Card 
         className={classNames('', className)}>
         <div className='flex flex-col p-2 sm:p-0' >
            
            <FormItem
               label="Connection"
               invalid={Boolean(errors[`${name}.connection_id`])}
               errorMessage={errors[`${name}.connection_id`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.connection_id`}
                     control={control}
                     render={({ field }) => (
                        <Input
                           {...field}
                           className="mb-2"
                           id="connection_id"
                        />
                     )}
                  />
                  
               </FormItem>
               
            <FormItem
               label="Account"
               invalid={Boolean(errors[`${name}.account_id`])}
               errorMessage={errors[`${name}.account_id`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.account_id`}
                     control={control}
                     render={({ field }) => (
                        <Input
                           {...field}
                           className="mb-2"
                           id="account_id"
                           required
                        />
                     )}
                  />
                  
               </FormItem>
               
            <FormItem
               label="Handle Display"
               invalid={Boolean(errors[`${name}.handle_display`])}
               errorMessage={errors[`${name}.handle_display`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.handle_display`}
                     control={control}
                     render={({ field }) => (
                        <Input
                           {...field}
                           className="mb-2"
                           id="handle_display"
                        />
                     )}
                  />
                  
               </FormItem>
               
            <FormItem
               label="Display Name"
               invalid={Boolean(errors[`${name}.display_name`])}
               errorMessage={errors[`${name}.display_name`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.display_name`}
                     control={control}
                     render={({ field }) => (
                        <Input
                           {...field}
                           className="mb-2"
                           id="display_name"
                        />
                     )}
                  />
                  
               </FormItem>
               
            <FormItem
               label="Avatar Thumbsmall"
               invalid={Boolean(errors[`${name}.avatar_thumb_small_url`])}
               errorMessage={errors[`${name}.avatar_thumb_small_url`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.avatar_thumb_small_url`}
                     control={control}
                     render={({ field }) => (
                        <Input
                           {...field}
                           className="mb-2"
                           id="avatar_thumb_small_url"
                        />
                     )}
                  />
                  
               </FormItem>
               
         </div>
		</Card>
	);
}

export default CompletionNodeTargetInfoEditor;