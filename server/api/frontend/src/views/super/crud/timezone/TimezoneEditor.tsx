import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import _ from 'lodash';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { zodResolver } from '@hookform/resolvers/zod';
import Timezone, { ITimezone } from '@/stencil/models/entities/timezone';
import { useDeleteTimezoneMutation, useCreateTimezoneMutation, useReplaceTimezoneMutation, useGetTimezoneQuery } from '@/stencil/endpoints/entities/timezoneApi';
import { closeModal, openModal } from '@/components/ui/Dialog/modalSlice';
import { useAppDispatch } from '@/store/rootStore';
import { Button, Checkbox, DatePicker, Dialog, Form, FormItem, Input } from '@/components/ui';
import NullableCheckbox from '@/views/super/common/NullableCheckbox';

import classNames from '@/utils/classNames';
import moment from 'moment';
import StencilUtils from '@/utils/stencilUtils';
import { TbEdit, TbPlus } from 'react-icons/tb';

import Alert from '@/components/shared/Alert';
import NestedEditor from '../NestedEditor';
import { PiX } from 'react-icons/pi';


type FormType = {
   _id?: ITimezone["_id"];
   iana_zone: ITimezone["iana_zone"];
   display_name: ITimezone["display_name"];
   ui_sort: ITimezone["ui_sort"];
   tag?: ITimezone["tag"];
   
};

const schema = z.object({
   _id: z.string().max(100, 'Cannot be more than 100 characters.').optional(),
   iana_zone: z.string().max(100, 'Cannot be more than 100 characters.'),
   display_name: z.string().max(100, 'Cannot be more than 100 characters.'),
   ui_sort: z.string().max(100, 'Cannot be more than 100 characters.'),
   tag: z.string().max(100, 'Cannot be more than 100 characters.').optional()
});

type TimezoneEditorProps = {
	className?: string;
   is_create: boolean;
   onDelete?: (timezone: ITimezone) => void;
   onCreate?: (timezone: ITimezone) => void;
   _id?: string;
};


function TimezoneEditor(props: TimezoneEditorProps) {
	const dispatch = useAppDispatch();
	const { className, _id, is_create, onCreate, onDelete } = props;
	const [openDialog, setOpenDialog] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [targetTimezoneId, setTargetTimezoneId] = useState<string>();
	const [original, setOriginal] = useState<ITimezone>();

   const defaultValues: FormType = {
		iana_zone: '',
		display_name: '',
		ui_sort: '',
		tag: undefined,
		
	};
	const formMethods = useForm<FormType>({
		mode: 'onChange',
		defaultValues,
		resolver: zodResolver(schema) as any
	});
   const { handleSubmit, formState, control, reset, setValue, trigger } = formMethods;
	const [createTimezone] = useCreateTimezoneMutation();
	const [replaceTimezone] = useReplaceTimezoneMutation();
	const [deleteTimezone] = useDeleteTimezoneMutation();

	const { isValid, dirtyFields, errors } = formState;

	const { t } = useTranslation();
   
   const timezoneQueryInput = _id!;
   
	let timezone = useGetTimezoneQuery(timezoneQueryInput, { refetchOnMountOrArgChange: true, skip: !openDialog || !_id });

   useEffect(() => {
      if (!_id) {
         if (!targetTimezoneId){
            setTargetTimezoneId(uuidv4());
         }
      } else {
         setTargetTimezoneId(_id);
      }
   }, [_id]);

   useEffect(() => {
      if (openDialog && timezone?.data?.item) {
         reset(timezone.data.item);
         setOriginal(timezone.data.item);
      }
   }, [openDialog, timezone]);

	function handleOpenDialog() {
		setOpenDialog(true);
	}

	function handleCloseDialog() {
		setOpenDialog(false);
	}

	function handleDiscard() {
		clearForm();
		setOpenDialog(false);
	}

   function clearForm(){
      reset(defaultValues);
      if (!_id){
         setTargetTimezoneId(uuidv4());
      }
   }
	const confirmDelete = () => {
		dispatch(
			openModal({
				children: (
					<Alert
                  type='danger'
						onCancel={async () => {
							dispatch(closeModal());
						}}
						onConfirm={async () => {
							dispatch(closeModal());
							performDelete()
						}}
						children="Are you sure you want to delete this Timezone?"
						confirmText='Yes, Delete'
						/>
				)
			})
		);
	};

	function performDelete() {
      const deleteInstance = timezone.data?.item;
      if (!deleteInstance){
         return;
      }
		setSubmitting(true);
		deleteTimezone(_id!)
			.unwrap()
			.then((resp) => {
				setSubmitting(false);
				if (!resp.success) {
					showError(resp.message || 'Error deleting data.');
				} else {
					handleCloseDialog();
               clearForm();
               if (onDelete) {
                  onDelete(deleteInstance);
               }
				}
			})
			.catch((ex) => {
				setSubmitting(false);
				const message = StencilUtils.getApiErrorMessage(ex, "Error deleting data.");
				showError(message);
			});
	}

   

	function onSubmit(data: FormType) {
      
      

      const apiData = { ...data };
    	const updatedTimezone = Timezone(apiData);
		setSubmitting(true);

      let promise = is_create ? createTimezone(updatedTimezone) : replaceTimezone(updatedTimezone);
		promise
			.unwrap()
			.then((resp) => {
				setSubmitting(false);
				if (!resp.success) {
					showError(resp.message || 'Error saving data.');
				} else {
					setOpenDialog(false);
               clearForm();
               if (is_create && onCreate && resp.item) {
                  onCreate(resp.item);
               }
				}
			})
			.catch((ex) => {
				setSubmitting(false);
				const message = StencilUtils.getApiErrorMessage(ex, "Error saving data.");
				showError(message);
			});
	}

	function showError(message: string) {
		dispatch(
			openModal({
				children: (
					<Alert
                  type='danger'
						onCancel={async () => {
							dispatch(closeModal());
						}}
                  onConfirm={async () => {
                     dispatch(closeModal());
                  }}
						children={message}
						confirmText='Okay'
                  confirmOnly={true}
					/>
				)
			})
		);
	}

	return (
		<div className={classNames('', className)}>
         {
            is_create ? 
            <Button 
               variant="solid"
               type="button"
               color="primary"
               icon={<TbPlus className="text-xl" /> } onClick={handleOpenDialog} >
               Create
            </Button>
            :
            <Button 
               variant="default"
               type="button"
               size="xs"
               icon={<TbEdit /> } onClick={handleOpenDialog} >
               Edit
            </Button>
         }
			<Dialog
				isOpen={openDialog}
				onClose={handleCloseDialog}
            width={800}
			>
            <Dialog.Header>
               <h4 className="mb-4">
                  {is_create ? 'Create' : 'Edit'} Timezone
               </h4>
				</Dialog.Header>
            <FormProvider {...formMethods}>
               <Form
                  onSubmit={handleSubmit(onSubmit)}
                  className="flex flex-col"
               >
                  <Dialog.Body scrollable={true}>
                     <div className='p-2 sm:p-0' >
                        
                        
                        <FormItem
                           label="Zone"
                           invalid={Boolean(errors.iana_zone)}
                           errorMessage={errors.iana_zone?.message}
                        >
                           
                           <Controller
                              name="iana_zone"
                              control={control}
                              render={({ field }) => (
                                 <Input
                                    {...field}
                                    className="mb-2"
                                    id="iana_zone"
                                    required
                                 />
                              )}
                           />
                           
                        </FormItem>
                        
                     
                        <FormItem
                           label="Display Name"
                           invalid={Boolean(errors.display_name)}
                           errorMessage={errors.display_name?.message}
                        >
                           
                           <Controller
                              name="display_name"
                              control={control}
                              render={({ field }) => (
                                 <Input
                                    {...field}
                                    className="mb-2"
                                    id="display_name"
                                    required
                                 />
                              )}
                           />
                           
                        </FormItem>
                        
                     
                        <FormItem
                           label="Sort"
                           invalid={Boolean(errors.ui_sort)}
                           errorMessage={errors.ui_sort?.message}
                        >
                           
                           <Controller
                              name="ui_sort"
                              control={control}
                              render={({ field }) => (
                                 <Input
                                    {...field}
                                    className="mb-2"
                                    id="ui_sort"
                                    required
                                 />
                              )}
                           />
                           
                        </FormItem>
                        
                     
                        <FormItem
                           label="Tag"
                           invalid={Boolean(errors.tag)}
                           errorMessage={errors.tag?.message}
                        >
                           
                           <Controller
                              name="tag"
                              control={control}
                              render={({ field }) => (
                                 <Input
                                    {...field}
                                    className="mb-2"
                                    id="tag"
                                 />
                              )}
                           />
                           
                        </FormItem>
                        
                     
                     </div>
                  </Dialog.Body>
               
                  <Dialog.Footer>
                     <div className="flex flex-row justify-end space-x-2">
                        <div className="">
                           <Button
                              variant="default"
                              color="default"
                              type="button"
                              onClick={handleDiscard}
                           >
                              Cancel
                           </Button>
                           {
                              !is_create &&original && original._id &&
                              <Button
                                 variant="plain"
                                 color="error"
                                 className="ml-8"
                                 type="button"
                                 onClick={confirmDelete}
                                 disabled={submitting}
                              >
                                 Delete
                              </Button>
                           }
                        </div>

                        <div className="flex-1">
                        </div>

                        <div className="flex flex-row items-center space-x-8">
                           <Button
                              variant="solid"
                              color="primary"
                              type="submit"
                              disabled={timezone.isLoading || !isValid || submitting}
                           >
                              {is_create ? 'Create' : 'Update'}
                           </Button>
                        </div>
                     </div>

                  </Dialog.Footer>
               </Form>
            </FormProvider>
			</Dialog>
		</div>
	);
}

export default TimezoneEditor;