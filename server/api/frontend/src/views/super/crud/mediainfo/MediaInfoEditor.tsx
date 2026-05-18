import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, useFormContext, useForm } from 'react-hook-form';
import _ from 'lodash';
import { z } from 'zod';
import MediaInfo, { IMediaInfo } from '@/stencil/models/entities/mediainfo';
import { closeModal, openModal } from '@/components/ui/Dialog/modalSlice';
import { useAppDispatch } from '@/store/rootStore';
import { Button, Card, Checkbox, DatePicker, Dialog, Form, FormItem, Input } from '@/components/ui';
import NullableCheckbox from '@/views/super/common/NullableCheckbox';
import NestedEditor from '../NestedEditor';


import { AssetKind } from '@/stencil/models/entities/assetkind';
import AssetKindPicker from '@/views/super/pickers/AssetKindPicker';
import classNames from '@/utils/classNames';

import Dimension from '@/stencil/models/entities/dimension';
import DimensionEditor, { dimensionSchema } from '../dimension/DimensionEditor';

import DimensionListEditor from '../dimension/DimensionListEditor';


export const mediaInfoSchema: z.ZodTypeAny = z.lazy(() =>
   z.object({
   _id: z.string().optional(),
   asset_kind: z.enum(AssetKind).optional(),
   jurisdiction_id: z.string().optional(),
   storage_key: z.string().optional(),
   thumb_small_key: z.string().optional(),
   thumb_small_url: z.string().optional(),
   thumb_small_dimensions: dimensionSchema.optional(),
   thumb_large_key: z.string().optional(),
   thumb_large_url: z.string().optional(),
   thumb_large_dimensions: dimensionSchema.optional(),
   raw_url: z.string().optional()
   })
);

type MediaInfoEditorProps = {
	className?: string;
   name: string;
};


function MediaInfoEditor(props: MediaInfoEditorProps) {
   const { className, name } = props;

	const { control, formState: { errors }, setValue, trigger } = useFormContext();

	const { t } = useTranslation();

   // Set default values if not already set
   useEffect(() => {
      const currentValue = control._getWatch(name) as IMediaInfo;

      const needsDefaults = !currentValue;

      if (needsDefaults) {
         
      }
   }, [name, setValue, control]);

	return (
		<Card 
         className={classNames('', className)}>
         <div className='flex flex-col p-2 sm:p-0' >
            
            <FormItem
               label="Id"
               invalid={Boolean(errors[`${name}._id`])}
               errorMessage={errors[`${name}._id`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}._id`}
                     control={control}
                     render={({ field }) => (
                        <Input
                           {...field}
                           className="mb-2"
                           id="_id"
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
                        />
                     )}
                  />
                  
               </FormItem>
               
            <FormItem
               label="Jurisdiction"
               invalid={Boolean(errors[`${name}.jurisdiction_id`])}
               errorMessage={errors[`${name}.jurisdiction_id`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.jurisdiction_id`}
                     control={control}
                     render={({ field }) => (
                        <Input
                           {...field}
                           className="mb-2"
                           id="jurisdiction_id"
                        />
                     )}
                  />
                  
               </FormItem>
               
            <FormItem
               label="Storage Key"
               invalid={Boolean(errors[`${name}.storage_key`])}
               errorMessage={errors[`${name}.storage_key`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.storage_key`}
                     control={control}
                     render={({ field }) => (
                        <Input
                           {...field}
                           className="mb-2"
                           id="storage_key"
                        />
                     )}
                  />
                  
               </FormItem>
               
            <FormItem
               label="Thumb Key"
               invalid={Boolean(errors[`${name}.thumb_small_key`])}
               errorMessage={errors[`${name}.thumb_small_key`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.thumb_small_key`}
                     control={control}
                     render={({ field }) => (
                        <Input
                           {...field}
                           className="mb-2"
                           id="thumb_small_key"
                        />
                     )}
                  />
                  
               </FormItem>
               
            <FormItem
               label="Small Url"
               invalid={Boolean(errors[`${name}.thumb_small_url`])}
               errorMessage={errors[`${name}.thumb_small_url`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.thumb_small_url`}
                     control={control}
                     render={({ field }) => (
                        <Input
                           {...field}
                           className="mb-2"
                           id="thumb_small_url"
                        />
                     )}
                  />
                  
               </FormItem>
               
            <FormItem
               label="Thumb Dimensions"
               invalid={Boolean(errors[`${name}.thumb_small_dimensions`])}
               errorMessage={errors[`${name}.thumb_small_dimensions`]?.message as string}
               >
                  
                  <Controller
                        name={`${name}.thumb_small_dimensions`}
                        control={control}
                        render={({ field }) => (
                           <NestedEditor
                              className={className}
                              value={field.value}
                              label="Thumb Dimensions"
                              createNewItem={() => Dimension()}
                              renderItem={() => <DimensionEditor name={`${name}.thumb_small_dimensions`} className="mb-4" />}
                              onChange={newValue => {
                                 field.onChange(newValue);
                                 trigger(`${name}.thumb_small_dimensions`);
                              }}
                              itemLabel={''}
                           />
                        )}
                     />
                  
               </FormItem>
               
            <FormItem
               label="Large Key"
               invalid={Boolean(errors[`${name}.thumb_large_key`])}
               errorMessage={errors[`${name}.thumb_large_key`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.thumb_large_key`}
                     control={control}
                     render={({ field }) => (
                        <Input
                           {...field}
                           className="mb-2"
                           id="thumb_large_key"
                        />
                     )}
                  />
                  
               </FormItem>
               
            <FormItem
               label="Large Url"
               invalid={Boolean(errors[`${name}.thumb_large_url`])}
               errorMessage={errors[`${name}.thumb_large_url`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.thumb_large_url`}
                     control={control}
                     render={({ field }) => (
                        <Input
                           {...field}
                           className="mb-2"
                           id="thumb_large_url"
                        />
                     )}
                  />
                  
               </FormItem>
               
            <FormItem
               label="Large Dimensions"
               invalid={Boolean(errors[`${name}.thumb_large_dimensions`])}
               errorMessage={errors[`${name}.thumb_large_dimensions`]?.message as string}
               >
                  
                  <Controller
                        name={`${name}.thumb_large_dimensions`}
                        control={control}
                        render={({ field }) => (
                           <NestedEditor
                              className={className}
                              value={field.value}
                              label="Large Dimensions"
                              createNewItem={() => Dimension()}
                              renderItem={() => <DimensionEditor name={`${name}.thumb_large_dimensions`} className="mb-4" />}
                              onChange={newValue => {
                                 field.onChange(newValue);
                                 trigger(`${name}.thumb_large_dimensions`);
                              }}
                              itemLabel={''}
                           />
                        )}
                     />
                  
               </FormItem>
               
            <FormItem
               label="Raw Url"
               invalid={Boolean(errors[`${name}.raw_url`])}
               errorMessage={errors[`${name}.raw_url`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.raw_url`}
                     control={control}
                     render={({ field }) => (
                        <Input
                           {...field}
                           className="mb-2"
                           id="raw_url"
                        />
                     )}
                  />
                  
               </FormItem>
               
         </div>
		</Card>
	);
}

export default MediaInfoEditor;