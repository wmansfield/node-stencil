import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, useFormContext, useForm } from 'react-hook-form';
import _ from 'lodash';
import { z } from 'zod';
import Ratings, { IRatings } from '@/stencil/models/entities/ratings';
import { closeModal, openModal } from '@/components/ui/Dialog/modalSlice';
import { useAppDispatch } from '@/store/rootStore';
import { Button, Card, Checkbox, DatePicker, Dialog, Form, FormItem, Input } from '@/components/ui';
import NullableCheckbox from '@/views/super/common/NullableCheckbox';
import NestedEditor from '../NestedEditor';


import classNames from '@/utils/classNames';


export const ratingsSchema: z.ZodTypeAny = z.lazy(() =>
   z.object({
   complete_inaccurate_count: z.number().optional(),
   mostly_inaccurate_count: z.number().optional(),
   somewhat_accurate_count: z.number().optional(),
   mostly_accurate_count: z.number().optional(),
   complete_accurate_count: z.number().optional()
   })
);

type RatingsEditorProps = {
	className?: string;
   name: string;
};


function RatingsEditor(props: RatingsEditorProps) {
   const { className, name } = props;

	const { control, formState: { errors }, setValue, trigger } = useFormContext();

	const { t } = useTranslation();

   // Set default values if not already set
   useEffect(() => {
      const currentValue = control._getWatch(name) as IRatings;

      const needsDefaults = !currentValue;

      if (needsDefaults) {
         
      }
   }, [name, setValue, control]);

	return (
		<Card 
         className={classNames('', className)}>
         <div className='flex flex-col p-2 sm:p-0' >
            
            <FormItem
               label="complete_inaccurate Date"
               invalid={Boolean(errors[`${name}.complete_inaccurate_count`])}
               errorMessage={errors[`${name}.complete_inaccurate_count`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.complete_inaccurate_count`}
                     control={control}
                     render={({ field }) => (
                        <Input
                           {...field}
                           className="mb-2"
                           onChange={evt => field.onChange(evt?.target?.value ? Number(evt.target.value) : undefined)}
                           id="complete_inaccurate_count"
                        />
                     )}
                  />
                  
               </FormItem>
               
            <FormItem
               label="mostly_inaccurate Date"
               invalid={Boolean(errors[`${name}.mostly_inaccurate_count`])}
               errorMessage={errors[`${name}.mostly_inaccurate_count`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.mostly_inaccurate_count`}
                     control={control}
                     render={({ field }) => (
                        <Input
                           {...field}
                           className="mb-2"
                           onChange={evt => field.onChange(evt?.target?.value ? Number(evt.target.value) : undefined)}
                           id="mostly_inaccurate_count"
                        />
                     )}
                  />
                  
               </FormItem>
               
            <FormItem
               label="somewhat_accurate Date"
               invalid={Boolean(errors[`${name}.somewhat_accurate_count`])}
               errorMessage={errors[`${name}.somewhat_accurate_count`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.somewhat_accurate_count`}
                     control={control}
                     render={({ field }) => (
                        <Input
                           {...field}
                           className="mb-2"
                           onChange={evt => field.onChange(evt?.target?.value ? Number(evt.target.value) : undefined)}
                           id="somewhat_accurate_count"
                        />
                     )}
                  />
                  
               </FormItem>
               
            <FormItem
               label="mostly_accurate Date"
               invalid={Boolean(errors[`${name}.mostly_accurate_count`])}
               errorMessage={errors[`${name}.mostly_accurate_count`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.mostly_accurate_count`}
                     control={control}
                     render={({ field }) => (
                        <Input
                           {...field}
                           className="mb-2"
                           onChange={evt => field.onChange(evt?.target?.value ? Number(evt.target.value) : undefined)}
                           id="mostly_accurate_count"
                        />
                     )}
                  />
                  
               </FormItem>
               
            <FormItem
               label="complete_accurate Date"
               invalid={Boolean(errors[`${name}.complete_accurate_count`])}
               errorMessage={errors[`${name}.complete_accurate_count`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.complete_accurate_count`}
                     control={control}
                     render={({ field }) => (
                        <Input
                           {...field}
                           className="mb-2"
                           onChange={evt => field.onChange(evt?.target?.value ? Number(evt.target.value) : undefined)}
                           id="complete_accurate_count"
                        />
                     )}
                  />
                  
               </FormItem>
               
         </div>
		</Card>
	);
}

export default RatingsEditor;