import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, useFormContext, useForm } from 'react-hook-form';
import _ from 'lodash';
import { z } from 'zod';
import PreSignedUrl, { IPreSignedUrl } from '@/stencil/models/entities/presignedurl';
import { closeModal, openModal } from '@/components/ui/Dialog/modalSlice';
import { useAppDispatch } from '@/store/rootStore';
import { Button, Card, Checkbox, DatePicker, Dialog, Form, FormItem, Input } from '@/components/ui';
import NullableCheckbox from '@/views/super/common/NullableCheckbox';
import NestedEditor from '../NestedEditor';


import { AssetKind } from '@/stencil/models/entities/assetkind';
import AssetKindPicker from '@/views/super/pickers/AssetKindPicker';
import { AssetDependency } from '@/stencil/models/entities/assetdependency';
import AssetDependencyPicker from '@/views/super/pickers/AssetDependencyPicker';
import classNames from '@/utils/classNames';


export const preSignedUrlSchema: z.ZodTypeAny = z.lazy(() =>
   z.object({
   id: z.string(),
   url: z.string(),
   signed_url: z.string(),
   mime_type: z.string(),
   asset_kind: z.enum(AssetKind),
   dependency: z.enum(AssetDependency).optional(),
   dependency_id: z.string().optional()
   })
);

type PreSignedUrlEditorProps = {
	className?: string;
   name: string;
};


function PreSignedUrlEditor(props: PreSignedUrlEditorProps) {
   const { className, name } = props;

	const { control, formState: { errors }, setValue, trigger } = useFormContext();

	const { t } = useTranslation();

   // Set default values if not already set
   useEffect(() => {
      const currentValue = control._getWatch(name) as IPreSignedUrl;

      const needsDefaults = !currentValue || currentValue.id === undefined || currentValue.url === undefined || currentValue.signed_url === undefined || currentValue.mime_type === undefined || currentValue.asset_kind === undefined;

      if (needsDefaults) {
         setValue(`${name}.id`, '');
         setValue(`${name}.url`, '');
         setValue(`${name}.signed_url`, '');
         setValue(`${name}.mime_type`, '');
         setValue(`${name}.asset_kind`, 0 as AssetKind);
         
      }
   }, [name, setValue, control]);

	return (
		<Card 
         className={classNames('', className)}>
         <div className='flex flex-col p-2 sm:p-0' >
            
            <FormItem
               label="id"
               invalid={Boolean(errors[`${name}.id`])}
               errorMessage={errors[`${name}.id`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.id`}
                     control={control}
                     render={({ field }) => (
                        <Input
                           {...field}
                           className="mb-2"
                           id="id"
                           required
                        />
                     )}
                  />
                  
               </FormItem>
               
            <FormItem
               label="url"
               invalid={Boolean(errors[`${name}.url`])}
               errorMessage={errors[`${name}.url`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.url`}
                     control={control}
                     render={({ field }) => (
                        <Input
                           {...field}
                           className="mb-2"
                           id="url"
                           required
                        />
                     )}
                  />
                  
               </FormItem>
               
            <FormItem
               label="signed_url"
               invalid={Boolean(errors[`${name}.signed_url`])}
               errorMessage={errors[`${name}.signed_url`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.signed_url`}
                     control={control}
                     render={({ field }) => (
                        <Input
                           {...field}
                           className="mb-2"
                           id="signed_url"
                           required
                        />
                     )}
                  />
                  
               </FormItem>
               
            <FormItem
               label="mime_type"
               invalid={Boolean(errors[`${name}.mime_type`])}
               errorMessage={errors[`${name}.mime_type`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.mime_type`}
                     control={control}
                     render={({ field }) => (
                        <Input
                           {...field}
                           className="mb-2"
                           id="mime_type"
                           required
                        />
                     )}
                  />
                  
               </FormItem>
               
            <FormItem
               label="asset_kind"
               invalid={Boolean(errors[`${name}.asset_kind`])}
               errorMessage={errors[`${name}.asset_kind`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.asset_kind`}
                     control={control}
                     render={({ field }) => (
                        <AssetKindPicker 
                           {...field}
                           className="mb-2"
                           
                           id="asset_kind"
                           onChange={value => field.onChange(value ? Number(value) : undefined)}
                           value={`${field.value}`}
                           required
                        />
                     )}
                  />
                  
               </FormItem>
               
            <FormItem
               label="Dependencies"
               invalid={Boolean(errors[`${name}.dependency`])}
               errorMessage={errors[`${name}.dependency`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.dependency`}
                     control={control}
                     render={({ field }) => (
                        <AssetDependencyPicker 
                           {...field}
                           className="mb-2"
                           
                           id="dependency"
                           onChange={value => field.onChange(value ? Number(value) : undefined)}
                           value={`${field.value}`}
                        />
                     )}
                  />
                  
               </FormItem>
               
            <FormItem
               label="Dependency ID"
               invalid={Boolean(errors[`${name}.dependency_id`])}
               errorMessage={errors[`${name}.dependency_id`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.dependency_id`}
                     control={control}
                     render={({ field }) => (
                        <Input
                           {...field}
                           className="mb-2"
                           id="dependency_id"
                        />
                     )}
                  />
                  
               </FormItem>
               
         </div>
		</Card>
	);
}

export default PreSignedUrlEditor;