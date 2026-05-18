import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, useFormContext, useForm } from 'react-hook-form';
import _ from 'lodash';
import { z } from 'zod';
import DeletedItem, { IDeletedItem } from '@/stencil/models/entities/deleteditem';
import { closeModal, openModal } from '@/components/ui/Dialog/modalSlice';
import { useAppDispatch } from '@/store/rootStore';
import { Button, Card, Checkbox, DatePicker, Dialog, Form, FormItem, Input } from '@/components/ui';
import NullableCheckbox from '@/views/super/common/NullableCheckbox';
import NestedEditor from '../NestedEditor';


import classNames from '@/utils/classNames';


export const deletedItemSchema: z.ZodTypeAny = z.lazy(() =>
   z.object({
   entity: z.string().optional(),
   identifier: z.string().optional(),
   deleted_utc: z.string().optional()
   })
);

type DeletedItemEditorProps = {
	className?: string;
   name: string;
};


function DeletedItemEditor(props: DeletedItemEditorProps) {
   const { className, name } = props;

	const { control, formState: { errors }, setValue, trigger } = useFormContext();

	const { t } = useTranslation();

   // Set default values if not already set
   useEffect(() => {
      const currentValue = control._getWatch(name) as IDeletedItem;

      const needsDefaults = !currentValue;

      if (needsDefaults) {
         
      }
   }, [name, setValue, control]);

	return (
		<Card 
         className={classNames('', className)}>
         <div className='flex flex-col p-2 sm:p-0' >
            
            <FormItem
               label="Entity"
               invalid={Boolean(errors[`${name}.entity`])}
               errorMessage={errors[`${name}.entity`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.entity`}
                     control={control}
                     render={({ field }) => (
                        <Input
                           {...field}
                           className="mb-2"
                           id="entity"
                        />
                     )}
                  />
                  
               </FormItem>
               
            <FormItem
               label="Identifier"
               invalid={Boolean(errors[`${name}.identifier`])}
               errorMessage={errors[`${name}.identifier`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.identifier`}
                     control={control}
                     render={({ field }) => (
                        <Input
                           {...field}
                           className="mb-2"
                           id="identifier"
                        />
                     )}
                  />
                  
               </FormItem>
               
            <FormItem
               label="Deleted"
               invalid={Boolean(errors[`${name}.deleted_utc`])}
               errorMessage={errors[`${name}.deleted_utc`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.deleted_utc`}
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

export default DeletedItemEditor;