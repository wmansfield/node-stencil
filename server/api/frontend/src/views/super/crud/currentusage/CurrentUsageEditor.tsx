import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, useFormContext, useForm } from 'react-hook-form';
import _ from 'lodash';
import { z } from 'zod';
import CurrentUsage, { ICurrentUsage } from '@/stencil/models/entities/currentusage';
import { closeModal, openModal } from '@/components/ui/Dialog/modalSlice';
import { useAppDispatch } from '@/store/rootStore';
import { Button, Card, Checkbox, DatePicker, Dialog, Form, FormItem, Input } from '@/components/ui';
import NullableCheckbox from '@/views/super/common/NullableCheckbox';
import NestedEditor from '../NestedEditor';


import classNames from '@/utils/classNames';

import CurrentUsageItem from '@/stencil/models/entities/currentusageitem';
import CurrentUsageItemEditor, { currentUsageItemSchema } from '../currentusageitem/CurrentUsageItemEditor';

import CurrentUsageItemListEditor from '../currentusageitem/CurrentUsageItemListEditor';


export const currentUsageSchema: z.ZodTypeAny = z.lazy(() =>
   z.object({
   as_of_utc: z.string(),
   chats: currentUsageItemSchema.optional(),
   comments: currentUsageItemSchema.optional(),
   text_completion: currentUsageItemSchema.optional(),
   text_open: currentUsageItemSchema.optional(),
   image_sd: currentUsageItemSchema.optional(),
   image_hd: currentUsageItemSchema.optional(),
   audio_short: currentUsageItemSchema.optional(),
   audio_long: currentUsageItemSchema.optional()
   })
);

type CurrentUsageEditorProps = {
	className?: string;
   name: string;
};


function CurrentUsageEditor(props: CurrentUsageEditorProps) {
   const { className, name } = props;

	const { control, formState: { errors }, setValue, trigger } = useFormContext();

	const { t } = useTranslation();

   // Set default values if not already set
   useEffect(() => {
      const currentValue = control._getWatch(name) as ICurrentUsage;

      const needsDefaults = !currentValue;

      if (needsDefaults) {
         
      }
   }, [name, setValue, control]);

	return (
		<Card 
         className={classNames('', className)}>
         <div className='flex flex-col p-2 sm:p-0' >
            
            <FormItem
               label="As Of"
               invalid={Boolean(errors[`${name}.as_of_utc`])}
               errorMessage={errors[`${name}.as_of_utc`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.as_of_utc`}
                     control={control}
                     render={({ field }) => (
                        <DatePicker
                           {...field}
                           
                           className="mb-2"
                           clearable={true}
                        />
                     
                     )}
                  />
                  
               </FormItem>
               
            <FormItem
               label="Chats"
               invalid={Boolean(errors[`${name}.chats`])}
               errorMessage={errors[`${name}.chats`]?.message as string}
               >
                  
                  <Controller
                        name={`${name}.chats`}
                        control={control}
                        render={({ field }) => (
                           <NestedEditor
                              className={className}
                              value={field.value}
                              label="Chats"
                              createNewItem={() => CurrentUsageItem()}
                              renderItem={() => <CurrentUsageItemEditor name={`${name}.chats`} className="mb-4" />}
                              onChange={newValue => {
                                 field.onChange(newValue);
                                 trigger(`${name}.chats`);
                              }}
                              itemLabel={''}
                           />
                        )}
                     />
                  
               </FormItem>
               
            <FormItem
               label="Comments"
               invalid={Boolean(errors[`${name}.comments`])}
               errorMessage={errors[`${name}.comments`]?.message as string}
               >
                  
                  <Controller
                        name={`${name}.comments`}
                        control={control}
                        render={({ field }) => (
                           <NestedEditor
                              className={className}
                              value={field.value}
                              label="Comments"
                              createNewItem={() => CurrentUsageItem()}
                              renderItem={() => <CurrentUsageItemEditor name={`${name}.comments`} className="mb-4" />}
                              onChange={newValue => {
                                 field.onChange(newValue);
                                 trigger(`${name}.comments`);
                              }}
                              itemLabel={''}
                           />
                        )}
                     />
                  
               </FormItem>
               
            <FormItem
               label="text_completion"
               invalid={Boolean(errors[`${name}.text_completion`])}
               errorMessage={errors[`${name}.text_completion`]?.message as string}
               >
                  
                  <Controller
                        name={`${name}.text_completion`}
                        control={control}
                        render={({ field }) => (
                           <NestedEditor
                              className={className}
                              value={field.value}
                              label="text_completion"
                              createNewItem={() => CurrentUsageItem()}
                              renderItem={() => <CurrentUsageItemEditor name={`${name}.text_completion`} className="mb-4" />}
                              onChange={newValue => {
                                 field.onChange(newValue);
                                 trigger(`${name}.text_completion`);
                              }}
                              itemLabel={''}
                           />
                        )}
                     />
                  
               </FormItem>
               
            <FormItem
               label="text_completion"
               invalid={Boolean(errors[`${name}.text_open`])}
               errorMessage={errors[`${name}.text_open`]?.message as string}
               >
                  
                  <Controller
                        name={`${name}.text_open`}
                        control={control}
                        render={({ field }) => (
                           <NestedEditor
                              className={className}
                              value={field.value}
                              label="text_completion"
                              createNewItem={() => CurrentUsageItem()}
                              renderItem={() => <CurrentUsageItemEditor name={`${name}.text_open`} className="mb-4" />}
                              onChange={newValue => {
                                 field.onChange(newValue);
                                 trigger(`${name}.text_open`);
                              }}
                              itemLabel={''}
                           />
                        )}
                     />
                  
               </FormItem>
               
            <FormItem
               label="text_completion"
               invalid={Boolean(errors[`${name}.image_sd`])}
               errorMessage={errors[`${name}.image_sd`]?.message as string}
               >
                  
                  <Controller
                        name={`${name}.image_sd`}
                        control={control}
                        render={({ field }) => (
                           <NestedEditor
                              className={className}
                              value={field.value}
                              label="text_completion"
                              createNewItem={() => CurrentUsageItem()}
                              renderItem={() => <CurrentUsageItemEditor name={`${name}.image_sd`} className="mb-4" />}
                              onChange={newValue => {
                                 field.onChange(newValue);
                                 trigger(`${name}.image_sd`);
                              }}
                              itemLabel={''}
                           />
                        )}
                     />
                  
               </FormItem>
               
            <FormItem
               label="text_completion"
               invalid={Boolean(errors[`${name}.image_hd`])}
               errorMessage={errors[`${name}.image_hd`]?.message as string}
               >
                  
                  <Controller
                        name={`${name}.image_hd`}
                        control={control}
                        render={({ field }) => (
                           <NestedEditor
                              className={className}
                              value={field.value}
                              label="text_completion"
                              createNewItem={() => CurrentUsageItem()}
                              renderItem={() => <CurrentUsageItemEditor name={`${name}.image_hd`} className="mb-4" />}
                              onChange={newValue => {
                                 field.onChange(newValue);
                                 trigger(`${name}.image_hd`);
                              }}
                              itemLabel={''}
                           />
                        )}
                     />
                  
               </FormItem>
               
            <FormItem
               label="text_completion"
               invalid={Boolean(errors[`${name}.audio_short`])}
               errorMessage={errors[`${name}.audio_short`]?.message as string}
               >
                  
                  <Controller
                        name={`${name}.audio_short`}
                        control={control}
                        render={({ field }) => (
                           <NestedEditor
                              className={className}
                              value={field.value}
                              label="text_completion"
                              createNewItem={() => CurrentUsageItem()}
                              renderItem={() => <CurrentUsageItemEditor name={`${name}.audio_short`} className="mb-4" />}
                              onChange={newValue => {
                                 field.onChange(newValue);
                                 trigger(`${name}.audio_short`);
                              }}
                              itemLabel={''}
                           />
                        )}
                     />
                  
               </FormItem>
               
            <FormItem
               label="text_completion"
               invalid={Boolean(errors[`${name}.audio_long`])}
               errorMessage={errors[`${name}.audio_long`]?.message as string}
               >
                  
                  <Controller
                        name={`${name}.audio_long`}
                        control={control}
                        render={({ field }) => (
                           <NestedEditor
                              className={className}
                              value={field.value}
                              label="text_completion"
                              createNewItem={() => CurrentUsageItem()}
                              renderItem={() => <CurrentUsageItemEditor name={`${name}.audio_long`} className="mb-4" />}
                              onChange={newValue => {
                                 field.onChange(newValue);
                                 trigger(`${name}.audio_long`);
                              }}
                              itemLabel={''}
                           />
                        )}
                     />
                  
               </FormItem>
               
         </div>
		</Card>
	);
}

export default CurrentUsageEditor;