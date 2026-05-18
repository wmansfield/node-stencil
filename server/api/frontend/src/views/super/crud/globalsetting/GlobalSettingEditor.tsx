import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import _ from 'lodash';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { zodResolver } from '@hookform/resolvers/zod';
import GlobalSetting, { IGlobalSetting } from '@/stencil/models/entities/globalsetting';
import { useDeleteGlobalSettingMutation, useCreateGlobalSettingMutation, useReplaceGlobalSettingMutation, useGetGlobalSettingQuery } from '@/stencil/endpoints/entities/globalSettingApi';
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
   _id?: IGlobalSetting["_id"];
   name: IGlobalSetting["name"];
   value?: IGlobalSetting["value"];
   
};

const schema = z.object({
   _id: z.string().max(100, 'Cannot be more than 100 characters.').optional(),
   name: z.string().max(100, 'Cannot be more than 100 characters.'),
   value: z.string().optional()
});

type GlobalSettingEditorProps = {
	className?: string;
   is_create: boolean;
   onDelete?: (globalsetting: IGlobalSetting) => void;
   onCreate?: (globalsetting: IGlobalSetting) => void;
   _id?: string;
};


function GlobalSettingEditor(props: GlobalSettingEditorProps) {
	const dispatch = useAppDispatch();
	const { className, _id, is_create, onCreate, onDelete } = props;
	const [openDialog, setOpenDialog] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [targetGlobalSettingId, setTargetGlobalSettingId] = useState<string>();
	const [original, setOriginal] = useState<IGlobalSetting>();

   const defaultValues: FormType = {
		name: '',
		value: undefined,
		
	};
	const formMethods = useForm<FormType>({
		mode: 'onChange',
		defaultValues,
		resolver: zodResolver(schema) as any
	});
   const { handleSubmit, formState, control, reset, setValue, trigger } = formMethods;
	const [createGlobalSetting] = useCreateGlobalSettingMutation();
	const [replaceGlobalSetting] = useReplaceGlobalSettingMutation();
	const [deleteGlobalSetting] = useDeleteGlobalSettingMutation();

	const { isValid, dirtyFields, errors } = formState;

	const { t } = useTranslation();
   
   const globalsettingQueryInput = _id!;
   
	let globalsetting = useGetGlobalSettingQuery(globalsettingQueryInput, { refetchOnMountOrArgChange: true, skip: !openDialog || !_id });

   useEffect(() => {
      if (!_id) {
         if (!targetGlobalSettingId){
            setTargetGlobalSettingId(uuidv4());
         }
      } else {
         setTargetGlobalSettingId(_id);
      }
   }, [_id]);

   useEffect(() => {
      if (openDialog && globalsetting?.data?.item) {
         reset(globalsetting.data.item);
         setOriginal(globalsetting.data.item);
      }
   }, [openDialog, globalsetting]);

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
         setTargetGlobalSettingId(uuidv4());
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
						children="Are you sure you want to delete this GlobalSetting?"
						confirmText='Yes, Delete'
						/>
				)
			})
		);
	};

	function performDelete() {
      const deleteInstance = globalsetting.data?.item;
      if (!deleteInstance){
         return;
      }
		setSubmitting(true);
		deleteGlobalSetting(_id!)
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
    	const updatedGlobalSetting = GlobalSetting(apiData);
		setSubmitting(true);

      let promise = is_create ? createGlobalSetting(updatedGlobalSetting) : replaceGlobalSetting(updatedGlobalSetting);
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
                  {is_create ? 'Create' : 'Edit'} Global Setting
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
                           label="Name"
                           invalid={Boolean(errors.name)}
                           errorMessage={errors.name?.message}
                        >
                           
                           <Controller
                              name="name"
                              control={control}
                              render={({ field }) => (
                                 <Input
                                    {...field}
                                    className="mb-2"
                                    id="name"
                                    required
                                 />
                              )}
                           />
                           
                        </FormItem>
                        
                     
                        <FormItem
                           label="Value"
                           invalid={Boolean(errors.value)}
                           errorMessage={errors.value?.message}
                        >
                           
                           <Controller
                              name="value"
                              control={control}
                              render={({ field }) => (
                                 <Input
                                    {...field}
                                    className="mb-2"
                                    id="value"
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
                              disabled={globalsetting.isLoading || !isValid || submitting}
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

export default GlobalSettingEditor;