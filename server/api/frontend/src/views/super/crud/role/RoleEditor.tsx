import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import _ from 'lodash';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { zodResolver } from '@hookform/resolvers/zod';
import Role, { IRole } from '@/stencil/models/entities/role';
import { useDeleteRoleMutation, useCreateRoleMutation, useReplaceRoleMutation, useGetRoleQuery } from '@/stencil/endpoints/entities/roleApi';
import { closeModal, openModal } from '@/components/ui/Dialog/modalSlice';
import { useAppDispatch } from '@/store/rootStore';
import { Button, Checkbox, DatePicker, Dialog, Form, FormItem, Input } from '@/components/ui';
import NullableCheckbox from '@/views/super/common/NullableCheckbox';

import classNames from '@/utils/classNames';
import moment from 'moment';
import StencilUtils from '@/utils/stencilUtils';
import { TbEdit, TbPlus } from 'react-icons/tb';
import StringArrayEditor from '../StringArrayEditor';
import Alert from '@/components/shared/Alert';
import NestedEditor from '../NestedEditor';
import { PiX } from 'react-icons/pi';


type FormType = {
   _id?: IRole["_id"];
   role_name: IRole["role_name"];
   permissions: IRole["permissions"];
   
};

const schema = z.object({
   _id: z.string().max(100, 'Cannot be more than 100 characters.').optional(),
   role_name: z.string().max(100, 'Cannot be more than 100 characters.'),
   permissions: z.string().array()
});

type RoleEditorProps = {
	className?: string;
   is_create: boolean;
   onDelete?: (role: IRole) => void;
   onCreate?: (role: IRole) => void;
   _id?: string;
};


function RoleEditor(props: RoleEditorProps) {
	const dispatch = useAppDispatch();
	const { className, _id, is_create, onCreate, onDelete } = props;
	const [openDialog, setOpenDialog] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [targetRoleId, setTargetRoleId] = useState<string>();
	const [original, setOriginal] = useState<IRole>();

   const defaultValues: FormType = {
		role_name: '',
		permissions: [],
		
	};
	const formMethods = useForm<FormType>({
		mode: 'onChange',
		defaultValues,
		resolver: zodResolver(schema) as any
	});
   const { handleSubmit, formState, control, reset, setValue, trigger } = formMethods;
	const [createRole] = useCreateRoleMutation();
	const [replaceRole] = useReplaceRoleMutation();
	const [deleteRole] = useDeleteRoleMutation();

	const { isValid, dirtyFields, errors } = formState;

	const { t } = useTranslation();
   
   const roleQueryInput = _id!;
   
	let role = useGetRoleQuery(roleQueryInput, { refetchOnMountOrArgChange: true, skip: !openDialog || !_id });

   useEffect(() => {
      if (!_id) {
         if (!targetRoleId){
            setTargetRoleId(uuidv4());
         }
      } else {
         setTargetRoleId(_id);
      }
   }, [_id]);

   useEffect(() => {
      if (openDialog && role?.data?.item) {
         reset(role.data.item);
         setOriginal(role.data.item);
      }
   }, [openDialog, role]);

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
         setTargetRoleId(uuidv4());
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
						children="Are you sure you want to delete this Role?"
						confirmText='Yes, Delete'
						/>
				)
			})
		);
	};

	function performDelete() {
      const deleteInstance = role.data?.item;
      if (!deleteInstance){
         return;
      }
		setSubmitting(true);
		deleteRole(_id!)
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
    	const updatedRole = Role(apiData);
		setSubmitting(true);

      let promise = is_create ? createRole(updatedRole) : replaceRole(updatedRole);
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
                  {is_create ? 'Create' : 'Edit'} Role
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
                           label="Role Name"
                           invalid={Boolean(errors.role_name)}
                           errorMessage={errors.role_name?.message}
                        >
                           
                           <Controller
                              name="role_name"
                              control={control}
                              render={({ field }) => (
                                 <Input
                                    {...field}
                                    className="mb-2"
                                    id="role_name"
                                    required
                                 />
                              )}
                           />
                           
                        </FormItem>
                        
                     
                        <FormItem
                           label="Permissions"
                           invalid={Boolean(errors.permissions)}
                           errorMessage={errors.permissions?.message}
                        >
                           
                           <Controller
                              name="permissions"
                              control={control}
                              render={({ field }) => (
                                 <StringArrayEditor
                                    value={field.value || []}
                                    label="Permissions"
                                    className="mb-4"
                                    onChange={newValue => {
                                       field.onChange(newValue);
                                       trigger('permissions');
                                    }}
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
                              disabled={role.isLoading || !isValid || submitting}
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

export default RoleEditor;