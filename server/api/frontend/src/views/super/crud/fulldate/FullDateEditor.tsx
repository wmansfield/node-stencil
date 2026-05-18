import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, useFormContext, useForm } from 'react-hook-form';
import _ from 'lodash';
import { z } from 'zod';
import FullDate, { IFullDate } from '@/stencil/models/entities/fulldate';
import { closeModal, openModal } from '@/components/ui/Dialog/modalSlice';
import { useAppDispatch } from '@/store/rootStore';
import { Button, Card, Checkbox, DatePicker, Dialog, Form, FormItem, Input } from '@/components/ui';
import NullableCheckbox from '@/views/super/common/NullableCheckbox';
import NestedEditor from '../NestedEditor';


import classNames from '@/utils/classNames';


export const fullDateSchema: z.ZodTypeAny = z.lazy(() =>
   z.object({
   utc: z.string().optional(),
   local: z.string().optional(),
   literal: z.string(),
   iana_zone: z.string()
   })
);

type FullDateEditorProps = {
	className?: string;
   name: string;
};


function FullDateEditor(props: FullDateEditorProps) {
   const { className, name } = props;

	const { control, formState: { errors }, setValue, trigger } = useFormContext();

	const { t } = useTranslation();

   // Set default values if not already set
   useEffect(() => {
      const currentValue = control._getWatch(name) as IFullDate;

      const needsDefaults = !currentValue || currentValue.literal === undefined || currentValue.iana_zone === undefined;

      if (needsDefaults) {
         setValue(`${name}.literal`, '');
         setValue(`${name}.iana_zone`, '');
         
      }
   }, [name, setValue, control]);

	return (
		<Card 
         className={classNames('', className)}>
         <div className='flex flex-col p-2 sm:p-0' >
            
            <FormItem
               label="Literal"
               invalid={Boolean(errors[`${name}.literal`])}
               errorMessage={errors[`${name}.literal`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.literal`}
                     control={control}
                     render={({ field }) => (
                        <Input
                           {...field}
                           className="mb-2"
                           id="literal"
                           required
                        />
                     )}
                  />
                  
               </FormItem>
               
            <FormItem
               label="Timezone"
               invalid={Boolean(errors[`${name}.iana_zone`])}
               errorMessage={errors[`${name}.iana_zone`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.iana_zone`}
                     control={control}
                     render={({ field }) => (
                        <Input
                           {...field}
                           className="mb-2"
                           id="iana_zone"
                           required
                        />
                     )}
                  />
                  
               </FormItem>
               
         </div>
		</Card>
	);
}

export default FullDateEditor;