import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, useFormContext, useForm } from 'react-hook-form';
import _ from 'lodash';
import { z } from 'zod';
import TargetCombination, { ITargetCombination } from '@/stencil/models/entities/targetcombination';
import { closeModal, openModal } from '@/components/ui/Dialog/modalSlice';
import { useAppDispatch } from '@/store/rootStore';
import { Button, Card, Checkbox, DatePicker, Dialog, Form, FormItem, Input } from '@/components/ui';
import NullableCheckbox from '@/views/super/common/NullableCheckbox';
import NestedEditor from '../NestedEditor';


import classNames from '@/utils/classNames';

import Combination from '@/stencil/models/entities/combination';
import CombinationEditor, { combinationSchema } from '../combination/CombinationEditor';

import CombinationListEditor from '../combination/CombinationListEditor';


export const targetCombinationSchema: z.ZodTypeAny = z.lazy(() =>
   z.object({
   combination: combinationSchema,
   connection_id: z.string()
   })
);

type TargetCombinationEditorProps = {
	className?: string;
   name: string;
};


function TargetCombinationEditor(props: TargetCombinationEditorProps) {
   const { className, name } = props;

	const { control, formState: { errors }, setValue, trigger } = useFormContext();

	const { t } = useTranslation();

   // Set default values if not already set
   useEffect(() => {
      const currentValue = control._getWatch(name) as ITargetCombination;

      const needsDefaults = !currentValue;

      if (needsDefaults) {
         
      }
   }, [name, setValue, control]);

	return (
		<Card 
         className={classNames('', className)}>
         <div className='flex flex-col p-2 sm:p-0' >
            
            <FormItem
               label="Combination"
               invalid={Boolean(errors[`${name}.combination`])}
               errorMessage={errors[`${name}.combination`]?.message as string}
               >
                  
                     <CombinationEditor
                        name={`${name}.combination`}
                        className="mb-4"
                     />
                  
               </FormItem>
               
            <FormItem
               label="Connection"
               invalid={Boolean(errors[`${name}.connection_id`])}
               errorMessage={errors[`${name}.connection_id`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.connection_id`}
                     control={control}
                     render={({ field }) => (
                        <Input
                           {...field}
                           className="mb-2"
                           id="connection_id"
                           required
                        />
                     )}
                  />
                  
               </FormItem>
               
         </div>
		</Card>
	);
}

export default TargetCombinationEditor;