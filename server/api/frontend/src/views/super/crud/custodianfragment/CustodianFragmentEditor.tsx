import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, useFormContext, useForm } from 'react-hook-form';
import _ from 'lodash';
import { z } from 'zod';
import CustodianFragment, { ICustodianFragment } from '@/stencil/models/entities/custodianfragment';
import { closeModal, openModal } from '@/components/ui/Dialog/modalSlice';
import { useAppDispatch } from '@/store/rootStore';
import { Button, Card, Checkbox, DatePicker, Dialog, Form, FormItem, Input } from '@/components/ui';
import NullableCheckbox from '@/views/super/common/NullableCheckbox';
import NestedEditor from '../NestedEditor';


import classNames from '@/utils/classNames';


export const custodianFragmentSchema: z.ZodTypeAny = z.lazy(() =>
   z.object({
   kmsCiphertext: z.string(),
   aad: z.string()
   })
);

type CustodianFragmentEditorProps = {
	className?: string;
   name: string;
};


function CustodianFragmentEditor(props: CustodianFragmentEditorProps) {
   const { className, name } = props;

	const { control, formState: { errors }, setValue, trigger } = useFormContext();

	const { t } = useTranslation();

   // Set default values if not already set
   useEffect(() => {
      const currentValue = control._getWatch(name) as ICustodianFragment;

      const needsDefaults = !currentValue || currentValue.kmsCiphertext === undefined || currentValue.aad === undefined;

      if (needsDefaults) {
         setValue(`${name}.kmsCiphertext`, '');
         setValue(`${name}.aad`, '');
         
      }
   }, [name, setValue, control]);

	return (
		<Card 
         className={classNames('', className)}>
         <div className='flex flex-col p-2 sm:p-0' >
            
            <FormItem
               label="Key Exchange"
               invalid={Boolean(errors[`${name}.kmsCiphertext`])}
               errorMessage={errors[`${name}.kmsCiphertext`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.kmsCiphertext`}
                     control={control}
                     render={({ field }) => (
                        <Input
                           {...field}
                           className="mb-2"
                           id="kmsCiphertext"
                           required
                        />
                     )}
                  />
                  
               </FormItem>
               
            <FormItem
               label="Encrypted Value"
               invalid={Boolean(errors[`${name}.aad`])}
               errorMessage={errors[`${name}.aad`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.aad`}
                     control={control}
                     render={({ field }) => (
                        <Input
                           {...field}
                           className="mb-2"
                           id="aad"
                           required
                        />
                     )}
                  />
                  
               </FormItem>
               
         </div>
		</Card>
	);
}

export default CustodianFragmentEditor;