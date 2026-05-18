import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, useFormContext, useForm } from 'react-hook-form';
import _ from 'lodash';
import { z } from 'zod';
import CompletionNodeDateInfo, { ICompletionNodeDateInfo } from '@/stencil/models/entities/completionnodedateinfo';
import { closeModal, openModal } from '@/components/ui/Dialog/modalSlice';
import { useAppDispatch } from '@/store/rootStore';
import { Button, Card, Checkbox, DatePicker, Dialog, Form, FormItem, Input } from '@/components/ui';
import NullableCheckbox from '@/views/super/common/NullableCheckbox';
import NestedEditor from '../NestedEditor';


import classNames from '@/utils/classNames';


export const completionNodeDateInfoSchema: z.ZodTypeAny = z.lazy(() =>
   z.object({
   date_utc: z.string()
   })
);

type CompletionNodeDateInfoEditorProps = {
	className?: string;
   name: string;
};


function CompletionNodeDateInfoEditor(props: CompletionNodeDateInfoEditorProps) {
   const { className, name } = props;

	const { control, formState: { errors }, setValue, trigger } = useFormContext();

	const { t } = useTranslation();

   // Set default values if not already set
   useEffect(() => {
      const currentValue = control._getWatch(name) as ICompletionNodeDateInfo;

      const needsDefaults = !currentValue;

      if (needsDefaults) {
         
      }
   }, [name, setValue, control]);

	return (
		<Card 
         className={classNames('', className)}>
         <div className='flex flex-col p-2 sm:p-0' >
            
            <FormItem
               label="Date"
               invalid={Boolean(errors[`${name}.date_utc`])}
               errorMessage={errors[`${name}.date_utc`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.date_utc`}
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

export default CompletionNodeDateInfoEditor;