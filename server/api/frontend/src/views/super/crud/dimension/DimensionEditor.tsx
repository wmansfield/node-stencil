import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, useFormContext, useForm } from 'react-hook-form';
import _ from 'lodash';
import { z } from 'zod';
import Dimension, { IDimension } from '@/stencil/models/entities/dimension';
import { closeModal, openModal } from '@/components/ui/Dialog/modalSlice';
import { useAppDispatch } from '@/store/rootStore';
import { Button, Card, Checkbox, DatePicker, Dialog, Form, FormItem, Input } from '@/components/ui';
import NullableCheckbox from '@/views/super/common/NullableCheckbox';
import NestedEditor from '../NestedEditor';


import classNames from '@/utils/classNames';


export const dimensionSchema: z.ZodTypeAny = z.lazy(() =>
   z.object({
   width: z.number(),
   height: z.number()
   })
);

type DimensionEditorProps = {
	className?: string;
   name: string;
};


function DimensionEditor(props: DimensionEditorProps) {
   const { className, name } = props;

	const { control, formState: { errors }, setValue, trigger } = useFormContext();

	const { t } = useTranslation();

   // Set default values if not already set
   useEffect(() => {
      const currentValue = control._getWatch(name) as IDimension;

      const needsDefaults = !currentValue || currentValue.width === undefined || currentValue.height === undefined;

      if (needsDefaults) {
         setValue(`${name}.width`, 0);
         setValue(`${name}.height`, 0);
         
      }
   }, [name, setValue, control]);

	return (
		<Card 
         className={classNames('', className)}>
         <div className='flex flex-col p-2 sm:p-0' >
            
            <FormItem
               label="Width"
               invalid={Boolean(errors[`${name}.width`])}
               errorMessage={errors[`${name}.width`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.width`}
                     control={control}
                     render={({ field }) => (
                        <Input
                           {...field}
                           className="mb-2"
                           onChange={evt => field.onChange(evt?.target?.value ? Number(evt.target.value) : undefined)}
                           id="width"
                           required
                        />
                     )}
                  />
                  
               </FormItem>
               
            <FormItem
               label="Height"
               invalid={Boolean(errors[`${name}.height`])}
               errorMessage={errors[`${name}.height`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.height`}
                     control={control}
                     render={({ field }) => (
                        <Input
                           {...field}
                           className="mb-2"
                           onChange={evt => field.onChange(evt?.target?.value ? Number(evt.target.value) : undefined)}
                           id="height"
                           required
                        />
                     )}
                  />
                  
               </FormItem>
               
         </div>
		</Card>
	);
}

export default DimensionEditor;