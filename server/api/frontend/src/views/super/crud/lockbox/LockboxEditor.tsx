import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, useFormContext, useForm } from 'react-hook-form';
import _ from 'lodash';
import { z } from 'zod';
import Lockbox, { ILockbox } from '@/stencil/models/entities/lockbox';
import { closeModal, openModal } from '@/components/ui/Dialog/modalSlice';
import { useAppDispatch } from '@/store/rootStore';
import { Button, Card, Checkbox, DatePicker, Dialog, Form, FormItem, Input } from '@/components/ui';
import NullableCheckbox from '@/views/super/common/NullableCheckbox';
import NestedEditor from '../NestedEditor';


import classNames from '@/utils/classNames';


export const lockboxSchema: z.ZodTypeAny = z.lazy(() =>
   z.object({
   contents: z.string(),
   nonce: z.string()
   })
);

type LockboxEditorProps = {
	className?: string;
   name: string;
};


function LockboxEditor(props: LockboxEditorProps) {
   const { className, name } = props;

	const { control, formState: { errors }, setValue, trigger } = useFormContext();

	const { t } = useTranslation();

   // Set default values if not already set
   useEffect(() => {
      const currentValue = control._getWatch(name) as ILockbox;

      const needsDefaults = !currentValue || currentValue.contents === undefined || currentValue.nonce === undefined;

      if (needsDefaults) {
         setValue(`${name}.contents`, '');
         setValue(`${name}.nonce`, '');
         
      }
   }, [name, setValue, control]);

	return (
		<Card 
         className={classNames('', className)}>
         <div className='flex flex-col p-2 sm:p-0' >
            
            <FormItem
               label="Contents"
               invalid={Boolean(errors[`${name}.contents`])}
               errorMessage={errors[`${name}.contents`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.contents`}
                     control={control}
                     render={({ field }) => (
                        <Input
                           {...field}
                           className="mb-2"
                           id="contents"
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
               
         </div>
		</Card>
	);
}

export default LockboxEditor;