import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, useFormContext, useForm } from 'react-hook-form';
import _ from 'lodash';
import { z } from 'zod';
import CompletionNodeAssetInfo, { ICompletionNodeAssetInfo } from '@/stencil/models/entities/completionnodeassetinfo';
import { closeModal, openModal } from '@/components/ui/Dialog/modalSlice';
import { useAppDispatch } from '@/store/rootStore';
import { Button, Card, Checkbox, DatePicker, Dialog, Form, FormItem, Input } from '@/components/ui';
import NullableCheckbox from '@/views/super/common/NullableCheckbox';
import NestedEditor from '../NestedEditor';


import classNames from '@/utils/classNames';


export const completionNodeAssetInfoSchema: z.ZodTypeAny = z.lazy(() =>
   z.object({
   asset_id: z.string(),
   stream_header: z.string().optional()
   })
);

type CompletionNodeAssetInfoEditorProps = {
	className?: string;
   name: string;
};


function CompletionNodeAssetInfoEditor(props: CompletionNodeAssetInfoEditorProps) {
   const { className, name } = props;

	const { control, formState: { errors }, setValue, trigger } = useFormContext();

	const { t } = useTranslation();

   // Set default values if not already set
   useEffect(() => {
      const currentValue = control._getWatch(name) as ICompletionNodeAssetInfo;

      const needsDefaults = !currentValue;

      if (needsDefaults) {
         
      }
   }, [name, setValue, control]);

	return (
		<Card 
         className={classNames('', className)}>
         <div className='flex flex-col p-2 sm:p-0' >
            
            <FormItem
               label="Asset"
               invalid={Boolean(errors[`${name}.asset_id`])}
               errorMessage={errors[`${name}.asset_id`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.asset_id`}
                     control={control}
                     render={({ field }) => (
                        <Input
                           {...field}
                           className="mb-2"
                           id="asset_id"
                           required
                        />
                     )}
                  />
                  
               </FormItem>
               
            <FormItem
               label="Stream Header"
               invalid={Boolean(errors[`${name}.stream_header`])}
               errorMessage={errors[`${name}.stream_header`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.stream_header`}
                     control={control}
                     render={({ field }) => (
                        <Input
                           {...field}
                           className="mb-2"
                           id="stream_header"
                        />
                     )}
                  />
                  
               </FormItem>
               
         </div>
		</Card>
	);
}

export default CompletionNodeAssetInfoEditor;