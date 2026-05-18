import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, useFormContext, useForm } from 'react-hook-form';
import _ from 'lodash';
import { z } from 'zod';
import CustodianTransport, { ICustodianTransport } from '@/stencil/models/entities/custodiantransport';
import { closeModal, openModal } from '@/components/ui/Dialog/modalSlice';
import { useAppDispatch } from '@/store/rootStore';
import { Button, Card, Checkbox, DatePicker, Dialog, Form, FormItem, Input } from '@/components/ui';
import NullableCheckbox from '@/views/super/common/NullableCheckbox';
import NestedEditor from '../NestedEditor';


import classNames from '@/utils/classNames';


export const custodianTransportSchema: z.ZodTypeAny = z.lazy(() =>
   z.object({
   iv: z.string(),
   ciphertext: z.string(),
   tag: z.string()
   })
);

type CustodianTransportEditorProps = {
	className?: string;
   name: string;
};


function CustodianTransportEditor(props: CustodianTransportEditorProps) {
   const { className, name } = props;

	const { control, formState: { errors }, setValue, trigger } = useFormContext();

	const { t } = useTranslation();

   // Set default values if not already set
   useEffect(() => {
      const currentValue = control._getWatch(name) as ICustodianTransport;

      const needsDefaults = !currentValue || currentValue.iv === undefined || currentValue.ciphertext === undefined || currentValue.tag === undefined;

      if (needsDefaults) {
         setValue(`${name}.iv`, '');
         setValue(`${name}.ciphertext`, '');
         setValue(`${name}.tag`, '');
         
      }
   }, [name, setValue, control]);

	return (
		<Card 
         className={classNames('', className)}>
         <div className='flex flex-col p-2 sm:p-0' >
            
            <FormItem
               label="Key Exchange"
               invalid={Boolean(errors[`${name}.iv`])}
               errorMessage={errors[`${name}.iv`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.iv`}
                     control={control}
                     render={({ field }) => (
                        <Input
                           {...field}
                           className="mb-2"
                           id="iv"
                           required
                        />
                     )}
                  />
                  
               </FormItem>
               
            <FormItem
               label="Encrypted Value"
               invalid={Boolean(errors[`${name}.ciphertext`])}
               errorMessage={errors[`${name}.ciphertext`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.ciphertext`}
                     control={control}
                     render={({ field }) => (
                        <Input
                           {...field}
                           className="mb-2"
                           id="ciphertext"
                           required
                        />
                     )}
                  />
                  
               </FormItem>
               
            <FormItem
               label="Nonce"
               invalid={Boolean(errors[`${name}.tag`])}
               errorMessage={errors[`${name}.tag`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.tag`}
                     control={control}
                     render={({ field }) => (
                        <Input
                           {...field}
                           className="mb-2"
                           id="tag"
                           required
                        />
                     )}
                  />
                  
               </FormItem>
               
         </div>
		</Card>
	);
}

export default CustodianTransportEditor;