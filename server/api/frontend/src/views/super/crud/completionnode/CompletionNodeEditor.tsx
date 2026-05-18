import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, useFormContext, useForm } from 'react-hook-form';
import _ from 'lodash';
import { z } from 'zod';
import CompletionNode, { ICompletionNode } from '@/stencil/models/entities/completionnode';
import { closeModal, openModal } from '@/components/ui/Dialog/modalSlice';
import { useAppDispatch } from '@/store/rootStore';
import { Button, Card, Checkbox, DatePicker, Dialog, Form, FormItem, Input } from '@/components/ui';
import NullableCheckbox from '@/views/super/common/NullableCheckbox';
import NestedEditor from '../NestedEditor';


import { CompletionNodeKind } from '@/stencil/models/entities/completionnodekind';
import CompletionNodeKindPicker from '@/views/super/pickers/CompletionNodeKindPicker';
import classNames from '@/utils/classNames';

import CompletionNodeTextInfo from '@/stencil/models/entities/completionnodetextinfo';
import CompletionNodeTextInfoEditor, { completionNodeTextInfoSchema } from '../completionnodetextinfo/CompletionNodeTextInfoEditor';

import CompletionNodeTextInfoListEditor from '../completionnodetextinfo/CompletionNodeTextInfoListEditor';

import CompletionNodeAssetInfo from '@/stencil/models/entities/completionnodeassetinfo';
import CompletionNodeAssetInfoEditor, { completionNodeAssetInfoSchema } from '../completionnodeassetinfo/CompletionNodeAssetInfoEditor';

import CompletionNodeAssetInfoListEditor from '../completionnodeassetinfo/CompletionNodeAssetInfoListEditor';

import CompletionNodeDateInfo from '@/stencil/models/entities/completionnodedateinfo';
import CompletionNodeDateInfoEditor, { completionNodeDateInfoSchema } from '../completionnodedateinfo/CompletionNodeDateInfoEditor';

import CompletionNodeDateInfoListEditor from '../completionnodedateinfo/CompletionNodeDateInfoListEditor';

import CompletionNodeTargetInfo from '@/stencil/models/entities/completionnodetargetinfo';
import CompletionNodeTargetInfoEditor, { completionNodeTargetInfoSchema } from '../completionnodetargetinfo/CompletionNodeTargetInfoEditor';

import CompletionNodeTargetInfoListEditor from '../completionnodetargetinfo/CompletionNodeTargetInfoListEditor';


export const completionNodeSchema: z.ZodTypeAny = z.lazy(() =>
   z.object({
   kind: z.enum(CompletionNodeKind),
   kind_ordinal: z.number(),
   text_info: completionNodeTextInfoSchema.optional(),
   target_info: completionNodeTargetInfoSchema.optional(),
   date_info: completionNodeDateInfoSchema.optional(),
   image_info: completionNodeAssetInfoSchema.optional(),
   audio_info: completionNodeAssetInfoSchema.optional(),
   self_source: z.boolean().optional(),
   tense_me: z.boolean().optional()
   })
);

type CompletionNodeEditorProps = {
	className?: string;
   name: string;
};


function CompletionNodeEditor(props: CompletionNodeEditorProps) {
   const { className, name } = props;

	const { control, formState: { errors }, setValue, trigger } = useFormContext();

	const { t } = useTranslation();

   // Set default values if not already set
   useEffect(() => {
      const currentValue = control._getWatch(name) as ICompletionNode;

      const needsDefaults = !currentValue || currentValue.kind === undefined || currentValue.kind_ordinal === undefined;

      if (needsDefaults) {
         setValue(`${name}.kind`, 0 as CompletionNodeKind);
         setValue(`${name}.kind_ordinal`, 0);
         
      }
   }, [name, setValue, control]);

	return (
		<Card 
         className={classNames('', className)}>
         <div className='flex flex-col p-2 sm:p-0' >
            
            <FormItem
               label="Kind"
               invalid={Boolean(errors[`${name}.kind`])}
               errorMessage={errors[`${name}.kind`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.kind`}
                     control={control}
                     render={({ field }) => (
                        <CompletionNodeKindPicker 
                           {...field}
                           className="mb-2"
                           
                           id="kind"
                           onChange={value => field.onChange(value ? Number(value) : undefined)}
                           value={`${field.value}`}
                           required
                        />
                     )}
                  />
                  
               </FormItem>
               
            <FormItem
               label="Kind Ordinal"
               invalid={Boolean(errors[`${name}.kind_ordinal`])}
               errorMessage={errors[`${name}.kind_ordinal`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.kind_ordinal`}
                     control={control}
                     render={({ field }) => (
                        <Input
                           {...field}
                           className="mb-2"
                           onChange={evt => field.onChange(evt?.target?.value ? Number(evt.target.value) : undefined)}
                           id="kind_ordinal"
                           required
                        />
                     )}
                  />
                  
               </FormItem>
               
            <FormItem
               label="Text"
               invalid={Boolean(errors[`${name}.text_info`])}
               errorMessage={errors[`${name}.text_info`]?.message as string}
               >
                  
                  <Controller
                        name={`${name}.text_info`}
                        control={control}
                        render={({ field }) => (
                           <NestedEditor
                              className={className}
                              value={field.value}
                              label="Text"
                              createNewItem={() => CompletionNodeTextInfo()}
                              renderItem={() => <CompletionNodeTextInfoEditor name={`${name}.text_info`} className="mb-4" />}
                              onChange={newValue => {
                                 field.onChange(newValue);
                                 trigger(`${name}.text_info`);
                              }}
                              itemLabel={''}
                           />
                        )}
                     />
                  
               </FormItem>
               
            <FormItem
               label="Target"
               invalid={Boolean(errors[`${name}.target_info`])}
               errorMessage={errors[`${name}.target_info`]?.message as string}
               >
                  
                  <Controller
                        name={`${name}.target_info`}
                        control={control}
                        render={({ field }) => (
                           <NestedEditor
                              className={className}
                              value={field.value}
                              label="Target"
                              createNewItem={() => CompletionNodeTargetInfo()}
                              renderItem={() => <CompletionNodeTargetInfoEditor name={`${name}.target_info`} className="mb-4" />}
                              onChange={newValue => {
                                 field.onChange(newValue);
                                 trigger(`${name}.target_info`);
                              }}
                              itemLabel={''}
                           />
                        )}
                     />
                  
               </FormItem>
               
            <FormItem
               label="Datae"
               invalid={Boolean(errors[`${name}.date_info`])}
               errorMessage={errors[`${name}.date_info`]?.message as string}
               >
                  
                  <Controller
                        name={`${name}.date_info`}
                        control={control}
                        render={({ field }) => (
                           <NestedEditor
                              className={className}
                              value={field.value}
                              label="Datae"
                              createNewItem={() => CompletionNodeDateInfo()}
                              renderItem={() => <CompletionNodeDateInfoEditor name={`${name}.date_info`} className="mb-4" />}
                              onChange={newValue => {
                                 field.onChange(newValue);
                                 trigger(`${name}.date_info`);
                              }}
                              itemLabel={''}
                           />
                        )}
                     />
                  
               </FormItem>
               
            <FormItem
               label="Image"
               invalid={Boolean(errors[`${name}.image_info`])}
               errorMessage={errors[`${name}.image_info`]?.message as string}
               >
                  
                  <Controller
                        name={`${name}.image_info`}
                        control={control}
                        render={({ field }) => (
                           <NestedEditor
                              className={className}
                              value={field.value}
                              label="Image"
                              createNewItem={() => CompletionNodeAssetInfo()}
                              renderItem={() => <CompletionNodeAssetInfoEditor name={`${name}.image_info`} className="mb-4" />}
                              onChange={newValue => {
                                 field.onChange(newValue);
                                 trigger(`${name}.image_info`);
                              }}
                              itemLabel={''}
                           />
                        )}
                     />
                  
               </FormItem>
               
            <FormItem
               label="Audio"
               invalid={Boolean(errors[`${name}.audio_info`])}
               errorMessage={errors[`${name}.audio_info`]?.message as string}
               >
                  
                  <Controller
                        name={`${name}.audio_info`}
                        control={control}
                        render={({ field }) => (
                           <NestedEditor
                              className={className}
                              value={field.value}
                              label="Audio"
                              createNewItem={() => CompletionNodeAssetInfo()}
                              renderItem={() => <CompletionNodeAssetInfoEditor name={`${name}.audio_info`} className="mb-4" />}
                              onChange={newValue => {
                                 field.onChange(newValue);
                                 trigger(`${name}.audio_info`);
                              }}
                              itemLabel={''}
                           />
                        )}
                     />
                  
               </FormItem>
               
            <FormItem
               label="Self Source"
               invalid={Boolean(errors[`${name}.self_source`])}
               errorMessage={errors[`${name}.self_source`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.self_source`}
                     control={control}
                     render={({ field }) => (
                        <Checkbox 
                           {...field}
                           
                           checked={field.value}
                        />
                     )}
                  />
                  
               </FormItem>
               
            <FormItem
               label="Tense Me"
               invalid={Boolean(errors[`${name}.tense_me`])}
               errorMessage={errors[`${name}.tense_me`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.tense_me`}
                     control={control}
                     render={({ field }) => (
                        <Checkbox 
                           {...field}
                           
                           checked={field.value}
                        />
                     )}
                  />
                  
               </FormItem>
               
         </div>
		</Card>
	);
}

export default CompletionNodeEditor;