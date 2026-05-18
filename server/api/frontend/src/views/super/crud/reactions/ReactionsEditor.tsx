import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, useFormContext, useForm } from 'react-hook-form';
import _ from 'lodash';
import { z } from 'zod';
import Reactions, { IReactions } from '@/stencil/models/entities/reactions';
import { closeModal, openModal } from '@/components/ui/Dialog/modalSlice';
import { useAppDispatch } from '@/store/rootStore';
import { Button, Card, Checkbox, DatePicker, Dialog, Form, FormItem, Input } from '@/components/ui';
import NullableCheckbox from '@/views/super/common/NullableCheckbox';
import NestedEditor from '../NestedEditor';


import classNames from '@/utils/classNames';


export const reactionsSchema: z.ZodTypeAny = z.lazy(() =>
   z.object({
   like_count: z.number().optional(),
   love_count: z.number().optional(),
   joy_count: z.number().optional(),
   wow_count: z.number().optional(),
   sad_count: z.number().optional(),
   angry_count: z.number().optional(),
   applause_count: z.number().optional(),
   thinking_count: z.number().optional(),
   fire_count: z.number().optional(),
   mindblown_count: z.number().optional()
   })
);

type ReactionsEditorProps = {
	className?: string;
   name: string;
};


function ReactionsEditor(props: ReactionsEditorProps) {
   const { className, name } = props;

	const { control, formState: { errors }, setValue, trigger } = useFormContext();

	const { t } = useTranslation();

   // Set default values if not already set
   useEffect(() => {
      const currentValue = control._getWatch(name) as IReactions;

      const needsDefaults = !currentValue;

      if (needsDefaults) {
         
      }
   }, [name, setValue, control]);

	return (
		<Card 
         className={classNames('', className)}>
         <div className='flex flex-col p-2 sm:p-0' >
            
            <FormItem
               label="Like Count"
               invalid={Boolean(errors[`${name}.like_count`])}
               errorMessage={errors[`${name}.like_count`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.like_count`}
                     control={control}
                     render={({ field }) => (
                        <Input
                           {...field}
                           className="mb-2"
                           onChange={evt => field.onChange(evt?.target?.value ? Number(evt.target.value) : undefined)}
                           id="like_count"
                        />
                     )}
                  />
                  
               </FormItem>
               
            <FormItem
               label="Love Count"
               invalid={Boolean(errors[`${name}.love_count`])}
               errorMessage={errors[`${name}.love_count`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.love_count`}
                     control={control}
                     render={({ field }) => (
                        <Input
                           {...field}
                           className="mb-2"
                           onChange={evt => field.onChange(evt?.target?.value ? Number(evt.target.value) : undefined)}
                           id="love_count"
                        />
                     )}
                  />
                  
               </FormItem>
               
            <FormItem
               label="Joy Count"
               invalid={Boolean(errors[`${name}.joy_count`])}
               errorMessage={errors[`${name}.joy_count`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.joy_count`}
                     control={control}
                     render={({ field }) => (
                        <Input
                           {...field}
                           className="mb-2"
                           onChange={evt => field.onChange(evt?.target?.value ? Number(evt.target.value) : undefined)}
                           id="joy_count"
                        />
                     )}
                  />
                  
               </FormItem>
               
            <FormItem
               label="Wow Count"
               invalid={Boolean(errors[`${name}.wow_count`])}
               errorMessage={errors[`${name}.wow_count`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.wow_count`}
                     control={control}
                     render={({ field }) => (
                        <Input
                           {...field}
                           className="mb-2"
                           onChange={evt => field.onChange(evt?.target?.value ? Number(evt.target.value) : undefined)}
                           id="wow_count"
                        />
                     )}
                  />
                  
               </FormItem>
               
            <FormItem
               label="Sad Count"
               invalid={Boolean(errors[`${name}.sad_count`])}
               errorMessage={errors[`${name}.sad_count`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.sad_count`}
                     control={control}
                     render={({ field }) => (
                        <Input
                           {...field}
                           className="mb-2"
                           onChange={evt => field.onChange(evt?.target?.value ? Number(evt.target.value) : undefined)}
                           id="sad_count"
                        />
                     )}
                  />
                  
               </FormItem>
               
            <FormItem
               label="Angry Count"
               invalid={Boolean(errors[`${name}.angry_count`])}
               errorMessage={errors[`${name}.angry_count`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.angry_count`}
                     control={control}
                     render={({ field }) => (
                        <Input
                           {...field}
                           className="mb-2"
                           onChange={evt => field.onChange(evt?.target?.value ? Number(evt.target.value) : undefined)}
                           id="angry_count"
                        />
                     )}
                  />
                  
               </FormItem>
               
            <FormItem
               label="Applause Count"
               invalid={Boolean(errors[`${name}.applause_count`])}
               errorMessage={errors[`${name}.applause_count`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.applause_count`}
                     control={control}
                     render={({ field }) => (
                        <Input
                           {...field}
                           className="mb-2"
                           onChange={evt => field.onChange(evt?.target?.value ? Number(evt.target.value) : undefined)}
                           id="applause_count"
                        />
                     )}
                  />
                  
               </FormItem>
               
            <FormItem
               label="Thinking Count"
               invalid={Boolean(errors[`${name}.thinking_count`])}
               errorMessage={errors[`${name}.thinking_count`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.thinking_count`}
                     control={control}
                     render={({ field }) => (
                        <Input
                           {...field}
                           className="mb-2"
                           onChange={evt => field.onChange(evt?.target?.value ? Number(evt.target.value) : undefined)}
                           id="thinking_count"
                        />
                     )}
                  />
                  
               </FormItem>
               
            <FormItem
               label="Fire Count"
               invalid={Boolean(errors[`${name}.fire_count`])}
               errorMessage={errors[`${name}.fire_count`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.fire_count`}
                     control={control}
                     render={({ field }) => (
                        <Input
                           {...field}
                           className="mb-2"
                           onChange={evt => field.onChange(evt?.target?.value ? Number(evt.target.value) : undefined)}
                           id="fire_count"
                        />
                     )}
                  />
                  
               </FormItem>
               
            <FormItem
               label="Mindblown Count"
               invalid={Boolean(errors[`${name}.mindblown_count`])}
               errorMessage={errors[`${name}.mindblown_count`]?.message as string}
               >
                  
                  <Controller
                     name={`${name}.mindblown_count`}
                     control={control}
                     render={({ field }) => (
                        <Input
                           {...field}
                           className="mb-2"
                           onChange={evt => field.onChange(evt?.target?.value ? Number(evt.target.value) : undefined)}
                           id="mindblown_count"
                        />
                     )}
                  />
                  
               </FormItem>
               
         </div>
		</Card>
	);
}

export default ReactionsEditor;