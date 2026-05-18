import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, useFormContext, useForm } from 'react-hook-form';
import _ from 'lodash';
import { z } from 'zod';
import LocalizedText, { ILocalizedText } from '@/stencil/models/entities/localizedtext';
import { closeModal, openModal } from '@/components/ui/Dialog/modalSlice';
import { useAppDispatch } from '@/store/rootStore';
import { Button, Card, Checkbox, DatePicker, Dialog, Form, FormItem, Input } from '@/components/ui';
import NullableCheckbox from '@/views/super/common/NullableCheckbox';
import NestedEditor from '../NestedEditor';


import classNames from '@/utils/classNames';


export const localizedTextSchema: z.ZodTypeAny = z.lazy(() =>
   z.object({
   language_code: z.string().optional(),
   text: z.string().optional(),
   ui_hash: z.string().optional()
   })
);

type LocalizedTextEditorProps = {
	className?: string;
   name: string;
};


function LocalizedTextEditor(props: LocalizedTextEditorProps) {
   const { className, name } = props;

	const { control, formState: { errors }, setValue, trigger } = useFormContext();

	const { t } = useTranslation();

   // Set default values if not already set
   useEffect(() => {
      const currentValue = control._getWatch(name) as ILocalizedText;

      const needsDefaults = !currentValue;

      if (needsDefaults) {
         
      }
   }, [name, setValue, control]);

	return (
		<Card 
         className={classNames('', className)}>
         <div className='flex flex-col p-2 sm:p-0' >
            
            <FormItem
               label="Language Code"
               invalid={Boolean(errors[`${name}.language_code`])}
               errorMessage={errors[`${name}.language_code`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.language_code`}
                     control={control}
                     render={({ field }) => (
                        <Input
                           {...field}
                           className="mb-2"
                           id="language_code"
                        />
                     )}
                  />
                  
               </FormItem>
               
            <FormItem
               label="text"
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
                        />
                     )}
                  />
                  
               </FormItem>
               
            <FormItem
               label="UI Hash"
               invalid={Boolean(errors[`${name}.ui_hash`])}
               errorMessage={errors[`${name}.ui_hash`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.ui_hash`}
                     control={control}
                     render={({ field }) => (
                        <Input
                           {...field}
                           className="mb-2"
                           id="ui_hash"
                        />
                     )}
                  />
                  
               </FormItem>
               
         </div>
		</Card>
	);
}

export default LocalizedTextEditor;