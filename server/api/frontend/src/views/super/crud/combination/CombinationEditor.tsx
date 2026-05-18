import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, useFormContext, useForm } from 'react-hook-form';
import _ from 'lodash';
import { z } from 'zod';
import Combination, { ICombination } from '@/stencil/models/entities/combination';
import { closeModal, openModal } from '@/components/ui/Dialog/modalSlice';
import { useAppDispatch } from '@/store/rootStore';
import { Button, Card, Checkbox, DatePicker, Dialog, Form, FormItem, Input } from '@/components/ui';
import NullableCheckbox from '@/views/super/common/NullableCheckbox';
import NestedEditor from '../NestedEditor';


import classNames from '@/utils/classNames';

import KeyFragment from '@/stencil/models/entities/keyfragment';
import KeyFragmentEditor, { keyFragmentSchema } from '../keyfragment/KeyFragmentEditor';

import KeyFragmentListEditor from '../keyfragment/KeyFragmentListEditor';


export const combinationSchema: z.ZodTypeAny = z.lazy(() =>
   z.object({
   owner_primary: keyFragmentSchema,
   owner_secondary: keyFragmentSchema,
   owner_early_primary: keyFragmentSchema.optional(),
   owner_early_secondary: keyFragmentSchema.optional(),
   target_primary: keyFragmentSchema,
   target_secondary: keyFragmentSchema,
   target_early_primary: keyFragmentSchema.optional(),
   target_early_secondary: keyFragmentSchema.optional(),
   presage: keyFragmentSchema
   })
);

type CombinationEditorProps = {
	className?: string;
   name: string;
};


function CombinationEditor(props: CombinationEditorProps) {
   const { className, name } = props;

	const { control, formState: { errors }, setValue, trigger } = useFormContext();

	const { t } = useTranslation();

   // Set default values if not already set
   useEffect(() => {
      const currentValue = control._getWatch(name) as ICombination;

      const needsDefaults = !currentValue;

      if (needsDefaults) {
         
      }
   }, [name, setValue, control]);

	return (
		<Card 
         className={classNames('', className)}>
         <div className='flex flex-col p-2 sm:p-0' >
            
            <FormItem
               label="Owner Primary"
               invalid={Boolean(errors[`${name}.owner_primary`])}
               errorMessage={errors[`${name}.owner_primary`]?.message as string}
               >
                  
                     <KeyFragmentEditor
                        name={`${name}.owner_primary`}
                        className="mb-4"
                     />
                  
               </FormItem>
               
            <FormItem
               label="Owner Secondary"
               invalid={Boolean(errors[`${name}.owner_secondary`])}
               errorMessage={errors[`${name}.owner_secondary`]?.message as string}
               >
                  
                     <KeyFragmentEditor
                        name={`${name}.owner_secondary`}
                        className="mb-4"
                     />
                  
               </FormItem>
               
            <FormItem
               label="Owner Early Primary"
               invalid={Boolean(errors[`${name}.owner_early_primary`])}
               errorMessage={errors[`${name}.owner_early_primary`]?.message as string}
               >
                  
                  <Controller
                        name={`${name}.owner_early_primary`}
                        control={control}
                        render={({ field }) => (
                           <NestedEditor
                              className={className}
                              value={field.value}
                              label="Owner Early Primary"
                              createNewItem={() => KeyFragment()}
                              renderItem={() => <KeyFragmentEditor name={`${name}.owner_early_primary`} className="mb-4" />}
                              onChange={newValue => {
                                 field.onChange(newValue);
                                 trigger(`${name}.owner_early_primary`);
                              }}
                              itemLabel={''}
                           />
                        )}
                     />
                  
               </FormItem>
               
            <FormItem
               label="Owner Early Secondary"
               invalid={Boolean(errors[`${name}.owner_early_secondary`])}
               errorMessage={errors[`${name}.owner_early_secondary`]?.message as string}
               >
                  
                  <Controller
                        name={`${name}.owner_early_secondary`}
                        control={control}
                        render={({ field }) => (
                           <NestedEditor
                              className={className}
                              value={field.value}
                              label="Owner Early Secondary"
                              createNewItem={() => KeyFragment()}
                              renderItem={() => <KeyFragmentEditor name={`${name}.owner_early_secondary`} className="mb-4" />}
                              onChange={newValue => {
                                 field.onChange(newValue);
                                 trigger(`${name}.owner_early_secondary`);
                              }}
                              itemLabel={''}
                           />
                        )}
                     />
                  
               </FormItem>
               
            <FormItem
               label="Target Primary"
               invalid={Boolean(errors[`${name}.target_primary`])}
               errorMessage={errors[`${name}.target_primary`]?.message as string}
               >
                  
                     <KeyFragmentEditor
                        name={`${name}.target_primary`}
                        className="mb-4"
                     />
                  
               </FormItem>
               
            <FormItem
               label="Target Secondary"
               invalid={Boolean(errors[`${name}.target_secondary`])}
               errorMessage={errors[`${name}.target_secondary`]?.message as string}
               >
                  
                     <KeyFragmentEditor
                        name={`${name}.target_secondary`}
                        className="mb-4"
                     />
                  
               </FormItem>
               
            <FormItem
               label="Target Early Primary"
               invalid={Boolean(errors[`${name}.target_early_primary`])}
               errorMessage={errors[`${name}.target_early_primary`]?.message as string}
               >
                  
                  <Controller
                        name={`${name}.target_early_primary`}
                        control={control}
                        render={({ field }) => (
                           <NestedEditor
                              className={className}
                              value={field.value}
                              label="Target Early Primary"
                              createNewItem={() => KeyFragment()}
                              renderItem={() => <KeyFragmentEditor name={`${name}.target_early_primary`} className="mb-4" />}
                              onChange={newValue => {
                                 field.onChange(newValue);
                                 trigger(`${name}.target_early_primary`);
                              }}
                              itemLabel={''}
                           />
                        )}
                     />
                  
               </FormItem>
               
            <FormItem
               label="Target Early Secondary"
               invalid={Boolean(errors[`${name}.target_early_secondary`])}
               errorMessage={errors[`${name}.target_early_secondary`]?.message as string}
               >
                  
                  <Controller
                        name={`${name}.target_early_secondary`}
                        control={control}
                        render={({ field }) => (
                           <NestedEditor
                              className={className}
                              value={field.value}
                              label="Target Early Secondary"
                              createNewItem={() => KeyFragment()}
                              renderItem={() => <KeyFragmentEditor name={`${name}.target_early_secondary`} className="mb-4" />}
                              onChange={newValue => {
                                 field.onChange(newValue);
                                 trigger(`${name}.target_early_secondary`);
                              }}
                              itemLabel={''}
                           />
                        )}
                     />
                  
               </FormItem>
               
            <FormItem
               label="Presage"
               invalid={Boolean(errors[`${name}.presage`])}
               errorMessage={errors[`${name}.presage`]?.message as string}
               >
                  
                     <KeyFragmentEditor
                        name={`${name}.presage`}
                        className="mb-4"
                     />
                  
               </FormItem>
               
         </div>
		</Card>
	);
}

export default CombinationEditor;