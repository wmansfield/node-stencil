import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import _ from 'lodash';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { zodResolver } from '@hookform/resolvers/zod';
import GlobalAccount, { IGlobalAccount } from '@/stencil/models/entities/globalaccount';
import { useDeleteGlobalAccountMutation, useCreateGlobalAccountMutation, useReplaceGlobalAccountMutation, useGetGlobalAccountQuery } from '@/stencil/endpoints/entities/globalAccountApi';
import { closeModal, openModal } from '@/components/ui/Dialog/modalSlice';
import { useAppDispatch } from '@/store/rootStore';
import { Button, Checkbox, DatePicker, Dialog, Form, FormItem, Input } from '@/components/ui';
import NullableCheckbox from '@/views/super/common/NullableCheckbox';

import JurisdictionPicker from '@/views/super/pickers/JurisdictionPicker';
import classNames from '@/utils/classNames';
import moment from 'moment';
import StencilUtils from '@/utils/stencilUtils';
import { TbEdit, TbPlus } from 'react-icons/tb';

import Alert from '@/components/shared/Alert';
import NestedEditor from '../NestedEditor';
import { PiX } from 'react-icons/pi';


type FormType = {
   _id?: IGlobalAccount["_id"];
   auth_identifier: IGlobalAccount["auth_identifier"];
   jurisdiction_id: IGlobalAccount["jurisdiction_id"];
   
};

const schema = z.object({
   _id: z.string().max(150, 'Cannot be more than 150 characters.').optional(),
   auth_identifier: z.string().max(150, 'Cannot be more than 150 characters.'),
   jurisdiction_id: z.string().max(10, 'Cannot be more than 10 characters.')
});

type GlobalAccountEditorProps = {
	className?: string;
   is_create: boolean;
   onDelete?: (globalaccount: IGlobalAccount) => void;
   onCreate?: (globalaccount: IGlobalAccount) => void;
   _id?: string;
};


function GlobalAccountEditor(props: GlobalAccountEditorProps) {
	const dispatch = useAppDispatch();
	const { className, _id, is_create, onCreate, onDelete } = props;
	const [openDialog, setOpenDialog] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [targetGlobalAccountId, setTargetGlobalAccountId] = useState<string>();
	const [original, setOriginal] = useState<IGlobalAccount>();

   const defaultValues: FormType = {
		auth_identifier: '',
		jurisdiction_id: '',
		
	};
	const formMethods = useForm<FormType>({
		mode: 'onChange',
		defaultValues,
		resolver: zodResolver(schema) as any
	});
   const { handleSubmit, formState, control, reset, setValue, trigger } = formMethods;
	const [createGlobalAccount] = useCreateGlobalAccountMutation();
	const [replaceGlobalAccount] = useReplaceGlobalAccountMutation();
	const [deleteGlobalAccount] = useDeleteGlobalAccountMutation();

	const { isValid, dirtyFields, errors } = formState;

	const { t } = useTranslation();
   
   const globalaccountQueryInput = _id!;
   
	let globalaccount = useGetGlobalAccountQuery(globalaccountQueryInput, { refetchOnMountOrArgChange: true, skip: !openDialog || !_id });

   useEffect(() => {
      if (!_id) {
         if (!targetGlobalAccountId){
            setTargetGlobalAccountId(uuidv4());
         }
      } else {
         setTargetGlobalAccountId(_id);
      }
   }, [_id]);

   useEffect(() => {
      if (openDialog && globalaccount?.data?.item) {
         reset(globalaccount.data.item);
         setOriginal(globalaccount.data.item);
      }
   }, [openDialog, globalaccount]);

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
         setTargetGlobalAccountId(uuidv4());
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
						children="Are you sure you want to delete this GlobalAccount?"
						confirmText='Yes, Delete'
						/>
				)
			})
		);
	};

	function performDelete() {
      const deleteInstance = globalaccount.data?.item;
      if (!deleteInstance){
         return;
      }
		setSubmitting(true);
		deleteGlobalAccount(_id!)
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
    	const updatedGlobalAccount = GlobalAccount(apiData);
		setSubmitting(true);

      let promise = is_create ? createGlobalAccount(updatedGlobalAccount) : replaceGlobalAccount(updatedGlobalAccount);
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
                  {is_create ? 'Create' : 'Edit'} Global Account
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
                           label="Auth Identifier"
                           invalid={Boolean(errors.auth_identifier)}
                           errorMessage={errors.auth_identifier?.message}
                        >
                           
                           <Controller
                              name="auth_identifier"
                              control={control}
                              render={({ field }) => (
                                 <Input
                                    {...field}
                                    className="mb-2"
                                    id="auth_identifier"
                                    required
                                 />
                              )}
                           />
                           
                        </FormItem>
                        
                     
                        <FormItem
                           label="Jurisdiction"
                           invalid={Boolean(errors.jurisdiction_id)}
                           errorMessage={errors.jurisdiction_id?.message}
                        >
                           
                           <Controller
                              name="jurisdiction_id"
                              control={control}
                              render={({ field }) => (
                                 <JurisdictionPicker 
                                    {...field}
                                    className="mb-2"
                                    
                                    id="jurisdiction_id"
                                    value={field.value}
                                    required
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
                              disabled={globalaccount.isLoading || !isValid || submitting}
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

export default GlobalAccountEditor;