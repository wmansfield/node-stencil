import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, useFormContext, useForm } from 'react-hook-form';
import _ from 'lodash';
import { z } from 'zod';
import Presage, { IPresage } from '@/stencil/models/entities/presage';
import { closeModal, openModal } from '@/components/ui/Dialog/modalSlice';
import { useAppDispatch } from '@/store/rootStore';
import { Button, Card, Checkbox, DatePicker, Dialog, Form, FormItem, Input } from '@/components/ui';
import NullableCheckbox from '@/views/super/common/NullableCheckbox';
import NestedEditor from '../NestedEditor';


import classNames from '@/utils/classNames';


export const presageSchema: z.ZodTypeAny = z.lazy(() =>
   z.object({
   precog_id: z.string(),
   public_key: z.string().optional(),
   private_key: z.string().optional(),
   release_utc: z.string()
   })
);

type PresageEditorProps = {
	className?: string;
   name: string;
};


function PresageEditor(props: PresageEditorProps) {
   const { className, name } = props;

	const { control, formState: { errors }, setValue, trigger } = useFormContext();

	const { t } = useTranslation();

   // Set default values if not already set
   useEffect(() => {
      const currentValue = control._getWatch(name) as IPresage;

      const needsDefaults = !currentValue || currentValue.precog_id === undefined;

      if (needsDefaults) {
         setValue(`${name}.precog_id`, '');
         
      }
   }, [name, setValue, control]);

	return (
		<Card 
         className={classNames('', className)}>
         <div className='flex flex-col p-2 sm:p-0' >
            
            <FormItem
               label="Precog ID"
               invalid={Boolean(errors[`${name}.precog_id`])}
               errorMessage={errors[`${name}.precog_id`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.precog_id`}
                     control={control}
                     render={({ field }) => (
                        <Input
                           {...field}
                           className="mb-2"
                           id="precog_id"
                           required
                        />
                     )}
                  />
                  
               </FormItem>
               
            <FormItem
               label="Public Key"
               invalid={Boolean(errors[`${name}.public_key`])}
               errorMessage={errors[`${name}.public_key`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.public_key`}
                     control={control}
                     render={({ field }) => (
                        <Input
                           {...field}
                           className="mb-2"
                           id="public_key"
                        />
                     )}
                  />
                  
               </FormItem>
               
            <FormItem
               label="Private Key"
               invalid={Boolean(errors[`${name}.private_key`])}
               errorMessage={errors[`${name}.private_key`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.private_key`}
                     control={control}
                     render={({ field }) => (
                        <Input
                           {...field}
                           className="mb-2"
                           id="private_key"
                        />
                     )}
                  />
                  
               </FormItem>
               
            <FormItem
               label="Release Date"
               invalid={Boolean(errors[`${name}.release_utc`])}
               errorMessage={errors[`${name}.release_utc`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.release_utc`}
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
               
         </div>
		</Card>
	);
}

export default PresageEditor;