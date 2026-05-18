import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, useFormContext, useForm } from 'react-hook-form';
import _ from 'lodash';
import { z } from 'zod';
import IDPair, { IIDPair } from '@/stencil/models/entities/idpair';
import { closeModal, openModal } from '@/components/ui/Dialog/modalSlice';
import { useAppDispatch } from '@/store/rootStore';
import { Button, Card, Checkbox, DatePicker, Dialog, Form, FormItem, Input } from '@/components/ui';
import NullableCheckbox from '@/views/super/common/NullableCheckbox';
import NestedEditor from '../NestedEditor';


import classNames from '@/utils/classNames';


export const iDPairSchema: z.ZodTypeAny = z.lazy(() =>
   z.object({
   _id: z.string(),
   text: z.string()
   })
);

type IDPairEditorProps = {
	className?: string;
   name: string;
};


function IDPairEditor(props: IDPairEditorProps) {
   const { className, name } = props;

	const { control, formState: { errors }, setValue, trigger } = useFormContext();

	const { t } = useTranslation();

   // Set default values if not already set
   useEffect(() => {
      const currentValue = control._getWatch(name) as IIDPair;

      const needsDefaults = !currentValue || currentValue._id === undefined || currentValue.text === undefined;

      if (needsDefaults) {
         setValue(`${name}._id`, '');
         setValue(`${name}.text`, '');
         
      }
   }, [name, setValue, control]);

	return (
		<Card 
         className={classNames('', className)}>
         <div className='flex flex-col p-2 sm:p-0' >
            
            <FormItem
               label="Id"
               invalid={Boolean(errors[`${name}._id`])}
               errorMessage={errors[`${name}._id`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}._id`}
                     control={control}
                     render={({ field }) => (
                        <Input
                           {...field}
                           className="mb-2"
                           id="_id"
                           required
                        />
                     )}
                  />
                  
               </FormItem>
               
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

export default IDPairEditor;