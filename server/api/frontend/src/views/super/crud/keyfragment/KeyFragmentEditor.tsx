import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, useFormContext, useForm } from 'react-hook-form';
import _ from 'lodash';
import { z } from 'zod';
import KeyFragment, { IKeyFragment } from '@/stencil/models/entities/keyfragment';
import { closeModal, openModal } from '@/components/ui/Dialog/modalSlice';
import { useAppDispatch } from '@/store/rootStore';
import { Button, Card, Checkbox, DatePicker, Dialog, Form, FormItem, Input } from '@/components/ui';
import NullableCheckbox from '@/views/super/common/NullableCheckbox';
import NestedEditor from '../NestedEditor';


import classNames from '@/utils/classNames';


export const keyFragmentSchema: z.ZodTypeAny = z.lazy(() =>
   z.object({
   keyExchange: z.string(),
   encrypted: z.string(),
   nonce: z.string(),
   key_id: z.string()
   })
);

type KeyFragmentEditorProps = {
	className?: string;
   name: string;
};


function KeyFragmentEditor(props: KeyFragmentEditorProps) {
   const { className, name } = props;

	const { control, formState: { errors }, setValue, trigger } = useFormContext();

	const { t } = useTranslation();

   // Set default values if not already set
   useEffect(() => {
      const currentValue = control._getWatch(name) as IKeyFragment;

      const needsDefaults = !currentValue || currentValue.keyExchange === undefined || currentValue.encrypted === undefined || currentValue.nonce === undefined;

      if (needsDefaults) {
         setValue(`${name}.keyExchange`, '');
         setValue(`${name}.encrypted`, '');
         setValue(`${name}.nonce`, '');
         
      }
   }, [name, setValue, control]);

	return (
		<Card 
         className={classNames('', className)}>
         <div className='flex flex-col p-2 sm:p-0' >
            
            <FormItem
               label="Key Exchange"
               invalid={Boolean(errors[`${name}.keyExchange`])}
               errorMessage={errors[`${name}.keyExchange`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.keyExchange`}
                     control={control}
                     render={({ field }) => (
                        <Input
                           {...field}
                           className="mb-2"
                           id="keyExchange"
                           required
                        />
                     )}
                  />
                  
               </FormItem>
               
            <FormItem
               label="Encrypted Value"
               invalid={Boolean(errors[`${name}.encrypted`])}
               errorMessage={errors[`${name}.encrypted`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.encrypted`}
                     control={control}
                     render={({ field }) => (
                        <Input
                           {...field}
                           className="mb-2"
                           id="encrypted"
                           required
                        />
                     )}
                  />
                  
               </FormItem>
               
            <FormItem
               label="Nonce"
               invalid={Boolean(errors[`${name}.nonce`])}
               errorMessage={errors[`${name}.nonce`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.nonce`}
                     control={control}
                     render={({ field }) => (
                        <Input
                           {...field}
                           className="mb-2"
                           id="nonce"
                           required
                        />
                     )}
                  />
                  
               </FormItem>
               
            <FormItem
               label="Key Id"
               invalid={Boolean(errors[`${name}.key_id`])}
               errorMessage={errors[`${name}.key_id`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.key_id`}
                     control={control}
                     render={({ field }) => (
                        <Input
                           {...field}
                           className="mb-2"
                           id="key_id"
                           required
                        />
                     )}
                  />
                  
               </FormItem>
               
         </div>
		</Card>
	);
}

export default KeyFragmentEditor;