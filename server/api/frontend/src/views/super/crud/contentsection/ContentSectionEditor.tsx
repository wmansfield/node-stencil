import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, useFormContext, useForm } from 'react-hook-form';
import _ from 'lodash';
import { z } from 'zod';
import ContentSection, { IContentSection } from '@/stencil/models/entities/contentsection';
import { closeModal, openModal } from '@/components/ui/Dialog/modalSlice';
import { useAppDispatch } from '@/store/rootStore';
import { Button, Card, Checkbox, DatePicker, Dialog, Form, FormItem, Input } from '@/components/ui';
import NullableCheckbox from '@/views/super/common/NullableCheckbox';
import NestedEditor from '../NestedEditor';


import { ContentSectionKind } from '@/stencil/models/entities/contentsectionkind';
import ContentSectionKindPicker from '@/views/super/pickers/ContentSectionKindPicker';
import classNames from '@/utils/classNames';

import MediaInfo from '@/stencil/models/entities/mediainfo';
import MediaInfoEditor, { mediaInfoSchema } from '../mediainfo/MediaInfoEditor';

import MediaInfoListEditor from '../mediainfo/MediaInfoListEditor';

import PreSignedUrl from '@/stencil/models/entities/presignedurl';
import PreSignedUrlEditor, { preSignedUrlSchema } from '../presignedurl/PreSignedUrlEditor';

import PreSignedUrlListEditor from '../presignedurl/PreSignedUrlListEditor';


export const contentSectionSchema: z.ZodTypeAny = z.lazy(() =>
   z.object({
   section_kind: z.enum(ContentSectionKind),
   markdown: z.string().optional(),
   text: z.string().optional(),
   target: z.string().optional(),
   sequence: z.number().optional(),
   asset_id: z.string().optional(),
   ui_tag: z.string().optional(),
   ui_text: z.string().optional(),
   photo: mediaInfoSchema.optional(),
   upload_info: preSignedUrlSchema.optional()
   })
);

type ContentSectionEditorProps = {
	className?: string;
   name: string;
};


function ContentSectionEditor(props: ContentSectionEditorProps) {
   const { className, name } = props;

	const { control, formState: { errors }, setValue, trigger } = useFormContext();

	const { t } = useTranslation();

   // Set default values if not already set
   useEffect(() => {
      const currentValue = control._getWatch(name) as IContentSection;

      const needsDefaults = !currentValue || currentValue.section_kind === undefined;

      if (needsDefaults) {
         setValue(`${name}.section_kind`, 0 as ContentSectionKind);
         
      }
   }, [name, setValue, control]);

	return (
		<Card 
         className={classNames('', className)}>
         <div className='flex flex-col p-2 sm:p-0' >
            
            <FormItem
               label="Content Section Kind"
               invalid={Boolean(errors[`${name}.section_kind`])}
               errorMessage={errors[`${name}.section_kind`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.section_kind`}
                     control={control}
                     render={({ field }) => (
                        <ContentSectionKindPicker 
                           {...field}
                           className="mb-2"
                           
                           id="section_kind"
                           onChange={value => field.onChange(value ? Number(value) : undefined)}
                           value={`${field.value}`}
                           required
                        />
                     )}
                  />
                  
               </FormItem>
               
            <FormItem
               label="Markdown"
               invalid={Boolean(errors[`${name}.markdown`])}
               errorMessage={errors[`${name}.markdown`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.markdown`}
                     control={control}
                     render={({ field }) => (
                        <Input
                           {...field}
                           textArea
                           className="mb-2"
                           id="markdown"
                        />
                     )}
                  />
                  
               </FormItem>
               
            <FormItem
               label="Text"
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
               label="Target"
               invalid={Boolean(errors[`${name}.target`])}
               errorMessage={errors[`${name}.target`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.target`}
                     control={control}
                     render={({ field }) => (
                        <Input
                           {...field}
                           className="mb-2"
                           id="target"
                        />
                     )}
                  />
                  
               </FormItem>
               
            <FormItem
               label="Sequence"
               invalid={Boolean(errors[`${name}.sequence`])}
               errorMessage={errors[`${name}.sequence`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.sequence`}
                     control={control}
                     render={({ field }) => (
                        <Input
                           {...field}
                           className="mb-2"
                           onChange={evt => field.onChange(evt?.target?.value ? Number(evt.target.value) : undefined)}
                           id="sequence"
                        />
                     )}
                  />
                  
               </FormItem>
               
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
                        />
                     )}
                  />
                  
               </FormItem>
               
            <FormItem
               label="UI Tag"
               invalid={Boolean(errors[`${name}.ui_tag`])}
               errorMessage={errors[`${name}.ui_tag`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.ui_tag`}
                     control={control}
                     render={({ field }) => (
                        <Input
                           {...field}
                           className="mb-2"
                           id="ui_tag"
                        />
                     )}
                  />
                  
               </FormItem>
               
            <FormItem
               label="UI Text"
               invalid={Boolean(errors[`${name}.ui_text`])}
               errorMessage={errors[`${name}.ui_text`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.ui_text`}
                     control={control}
                     render={({ field }) => (
                        <Input
                           {...field}
                           className="mb-2"
                           id="ui_text"
                        />
                     )}
                  />
                  
               </FormItem>
               
            <FormItem
               label="Photo"
               invalid={Boolean(errors[`${name}.photo`])}
               errorMessage={errors[`${name}.photo`]?.message as string}
               >
                  
                  <Controller
                        name={`${name}.photo`}
                        control={control}
                        render={({ field }) => (
                           <NestedEditor
                              className={className}
                              value={field.value}
                              label="Photo"
                              createNewItem={() => MediaInfo()}
                              renderItem={() => <MediaInfoEditor name={`${name}.photo`} className="mb-4" />}
                              onChange={newValue => {
                                 field.onChange(newValue);
                                 trigger(`${name}.photo`);
                              }}
                              itemLabel={''}
                           />
                        )}
                     />
                  
               </FormItem>
               
            <FormItem
               label="Upload Info"
               invalid={Boolean(errors[`${name}.upload_info`])}
               errorMessage={errors[`${name}.upload_info`]?.message as string}
               >
                  
                  <Controller
                        name={`${name}.upload_info`}
                        control={control}
                        render={({ field }) => (
                           <NestedEditor
                              className={className}
                              value={field.value}
                              label="Upload Info"
                              createNewItem={() => PreSignedUrl()}
                              renderItem={() => <PreSignedUrlEditor name={`${name}.upload_info`} className="mb-4" />}
                              onChange={newValue => {
                                 field.onChange(newValue);
                                 trigger(`${name}.upload_info`);
                              }}
                              itemLabel={''}
                           />
                        )}
                     />
                  
               </FormItem>
               
         </div>
		</Card>
	);
}

export default ContentSectionEditor;