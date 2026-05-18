import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, useFormContext, useForm } from 'react-hook-form';
import _ from 'lodash';
import { z } from 'zod';
import CurrentUsageItem, { ICurrentUsageItem } from '@/stencil/models/entities/currentusageitem';
import { closeModal, openModal } from '@/components/ui/Dialog/modalSlice';
import { useAppDispatch } from '@/store/rootStore';
import { Button, Card, Checkbox, DatePicker, Dialog, Form, FormItem, Input } from '@/components/ui';
import NullableCheckbox from '@/views/super/common/NullableCheckbox';
import NestedEditor from '../NestedEditor';


import classNames from '@/utils/classNames';


export const currentUsageItemSchema: z.ZodTypeAny = z.lazy(() =>
   z.object({
   limit: z.number(),
   current: z.number(),
   remaining: z.number()
   })
);

type CurrentUsageItemEditorProps = {
	className?: string;
   name: string;
};


function CurrentUsageItemEditor(props: CurrentUsageItemEditorProps) {
   const { className, name } = props;

	const { control, formState: { errors }, setValue, trigger } = useFormContext();

	const { t } = useTranslation();

   // Set default values if not already set
   useEffect(() => {
      const currentValue = control._getWatch(name) as ICurrentUsageItem;

      const needsDefaults = !currentValue || currentValue.limit === undefined || currentValue.current === undefined || currentValue.remaining === undefined;

      if (needsDefaults) {
         setValue(`${name}.limit`, 0);
         setValue(`${name}.current`, 0);
         setValue(`${name}.remaining`, 0);
         
      }
   }, [name, setValue, control]);

	return (
		<Card 
         className={classNames('', className)}>
         <div className='flex flex-col p-2 sm:p-0' >
            
            <FormItem
               label="Limit"
               invalid={Boolean(errors[`${name}.limit`])}
               errorMessage={errors[`${name}.limit`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.limit`}
                     control={control}
                     render={({ field }) => (
                        <Input
                           {...field}
                           className="mb-2"
                           onChange={evt => field.onChange(evt?.target?.value ? Number(evt.target.value) : undefined)}
                           id="limit"
                           required
                        />
                     )}
                  />
                  
               </FormItem>
               
            <FormItem
               label="Current"
               invalid={Boolean(errors[`${name}.current`])}
               errorMessage={errors[`${name}.current`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.current`}
                     control={control}
                     render={({ field }) => (
                        <Input
                           {...field}
                           className="mb-2"
                           onChange={evt => field.onChange(evt?.target?.value ? Number(evt.target.value) : undefined)}
                           id="current"
                           required
                        />
                     )}
                  />
                  
               </FormItem>
               
            <FormItem
               label="Remaining"
               invalid={Boolean(errors[`${name}.remaining`])}
               errorMessage={errors[`${name}.remaining`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.remaining`}
                     control={control}
                     render={({ field }) => (
                        <Input
                           {...field}
                           className="mb-2"
                           onChange={evt => field.onChange(evt?.target?.value ? Number(evt.target.value) : undefined)}
                           id="remaining"
                           required
                        />
                     )}
                  />
                  
               </FormItem>
               
         </div>
		</Card>
	);
}

export default CurrentUsageItemEditor;