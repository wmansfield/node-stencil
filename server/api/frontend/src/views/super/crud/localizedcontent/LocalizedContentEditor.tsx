import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, useFormContext, useForm } from 'react-hook-form';
import _ from 'lodash';
import { z } from 'zod';
import LocalizedContent, { ILocalizedContent } from '@/stencil/models/entities/localizedcontent';
import { closeModal, openModal } from '@/components/ui/Dialog/modalSlice';
import { useAppDispatch } from '@/store/rootStore';
import { Button, Card, Checkbox, DatePicker, Dialog, Form, FormItem, Input } from '@/components/ui';
import NullableCheckbox from '@/views/super/common/NullableCheckbox';
import NestedEditor from '../NestedEditor';


import classNames from '@/utils/classNames';

import ContentSection from '@/stencil/models/entities/contentsection';
import ContentSectionEditor, { contentSectionSchema } from '../contentsection/ContentSectionEditor';

import ContentSectionListEditor from '../contentsection/ContentSectionListEditor';


export const localizedContentSchema: z.ZodTypeAny = z.lazy(() =>
   z.object({
   language_code: z.string().optional(),
   contents: z.array(contentSectionSchema).optional(),
   ui_hash: z.string().optional()
   })
);

type LocalizedContentEditorProps = {
	className?: string;
   name: string;
};


function LocalizedContentEditor(props: LocalizedContentEditorProps) {
   const { className, name } = props;

	const { control, formState: { errors }, setValue, trigger } = useFormContext();

	const { t } = useTranslation();

   // Set default values if not already set
   useEffect(() => {
      const currentValue = control._getWatch(name) as ILocalizedContent;

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
               label="Contents"
               invalid={Boolean(errors[`${name}.contents`])}
               errorMessage={errors[`${name}.contents`]?.message as string}
               >
                  
                     <ContentSectionListEditor
                        name={`${name}.contents`}
                        label="Contents"
                        className="mb-4"
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

export default LocalizedContentEditor;