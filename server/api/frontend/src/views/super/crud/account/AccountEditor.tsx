import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import _ from 'lodash';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { zodResolver } from '@hookform/resolvers/zod';
import Account, { IAccount } from '@/stencil/models/entities/account';
import { useDeleteAccountMutation, useCreateAccountMutation, useReplaceAccountMutation, useGetAccountQuery } from '@/stencil/endpoints/entities/accountApi';
import { closeModal, openModal } from '@/components/ui/Dialog/modalSlice';
import { useAppDispatch } from '@/store/rootStore';
import { Button, Checkbox, DatePicker, Dialog, Form, FormItem, Input } from '@/components/ui';
import NullableCheckbox from '@/views/super/common/NullableCheckbox';

import JurisdictionPicker from '@/views/super/pickers/JurisdictionPicker';
import JurisdictionAssetPicker from '@/views/super/pickers/JurisdictionAssetPicker';
import { AccountStatus } from '@/stencil/models/entities/accountstatus';
import AccountStatusPicker from '@/views/super/pickers/AccountStatusPicker';
import MediaInfo from '@/stencil/models/entities/mediainfo';
import MediaInfoEditor, { mediaInfoSchema } from '../mediainfo/MediaInfoEditor';
import MediaInfoListEditor from '../mediainfo/MediaInfoListEditor';

import classNames from '@/utils/classNames';
import moment from 'moment';
import StencilUtils from '@/utils/stencilUtils';
import { TbEdit, TbPlus } from 'react-icons/tb';
import StringArrayEditor from '../StringArrayEditor';
import Alert from '@/components/shared/Alert';
import NestedEditor from '../NestedEditor';
import { PiX } from 'react-icons/pi';
import ImageUploader from '@/components/shared/ImageUploader';
import { IPreSignedUrl } from '@/stencil/models/entities/presignedurl';
import { ActionResult } from '@/stencil/models/action-result';
import { AssetArea } from '@/stencil/models/entities/assetarea';
import { AssetDependency } from '@/stencil/models/entities/assetdependency';

import { IJurisdictionAsset_Info } from '@/stencil/models/entities/jurisdictionasset';


type FormType = {
   _id?: IAccount["_id"];
   jurisdiction_id: IAccount["jurisdiction_id"];
   asset_id_avatar?: IAccount["asset_id_avatar"];
   email: IAccount["email"];
   display_name?: IAccount["display_name"];
   auth_identifier: IAccount["auth_identifier"];
   auth_provider: IAccount["auth_provider"];
   joined_utc: IAccount["joined_utc"];
   account_status: IAccount["account_status"] | undefined ;
   roles?: IAccount["roles"];
   avatar?: IAccount["avatar"];
   
};

const schema = z.object({
   _id: z.string().optional(),
   jurisdiction_id: z.string().max(10, 'Cannot be more than 10 characters.'),
   asset_id_avatar: z.string().optional(),
   email: z.string().email('Must be a valid email').max(128, 'Cannot be more than 128 characters.'),
   display_name: z.string().max(150, 'Cannot be more than 150 characters.').optional(),
   auth_identifier: z.string().max(150, 'Cannot be more than 150 characters.'),
   auth_provider: z.string().max(150, 'Cannot be more than 150 characters.'),
   joined_utc: z.string(),
   account_status: z.union([z.enum(AccountStatus), z.undefined()]).refine(val => val !== undefined, {
         message: 'Status is required',
      }),
   roles: z.string().array().nullable().optional(),
   avatar: mediaInfoSchema.optional()
   
});

type AccountEditorProps = {
	className?: string;
   is_create: boolean;
   onDelete?: (account: IAccount) => void;
   onCreate?: (account: IAccount) => void;
   jurisdiction_id: string;
   
   _id?: string;
};


function AccountEditor(props: AccountEditorProps) {
	const dispatch = useAppDispatch();
	const { className, _id, is_create, jurisdiction_id, onCreate, onDelete } = props;
	const [openDialog, setOpenDialog] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [targetAccountId, setTargetAccountId] = useState<string>();
	const [original, setOriginal] = useState<IAccount>();

   const defaultValues: FormType = {
		jurisdiction_id: jurisdiction_id,
		asset_id_avatar: undefined,
		email: '',
		display_name: undefined,
		auth_identifier: '',
		auth_provider: '',
		joined_utc: undefined!,
		account_status: undefined,
		roles: undefined,
		
	};
	const formMethods = useForm<FormType>({
		mode: 'onChange',
		defaultValues,
		resolver: zodResolver(schema) as any
	});
   const { handleSubmit, formState, control, reset, setValue, trigger } = formMethods;
	const [createAccount] = useCreateAccountMutation();
	const [replaceAccount] = useReplaceAccountMutation();
	const [deleteAccount] = useDeleteAccountMutation();

	const { isValid, dirtyFields, errors } = formState;

	const { t } = useTranslation();
   
   const accountQueryInput = {
      jurisdiction_id: jurisdiction_id!,
		input: _id!
	};
   
   
	let account = useGetAccountQuery(accountQueryInput, { refetchOnMountOrArgChange: true, skip: !openDialog || !_id });

   useEffect(() => {
      if (!_id) {
         if (!targetAccountId){
            setTargetAccountId(uuidv4());
         }
      } else {
         setTargetAccountId(_id);
      }
   }, [_id]);

   useEffect(() => {
      if (openDialog && account?.data?.item) {
         reset(account.data.item);
         setOriginal(account.data.item);
      }
   }, [openDialog, account]);

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
         setTargetAccountId(uuidv4());
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
						children="Are you sure you want to delete this Account?"
						confirmText='Yes, Delete'
						/>
				)
			})
		);
	};

	function performDelete() {
      const deleteInstance = account.data?.item;
      if (!deleteInstance){
         return;
      }
		setSubmitting(true);
		deleteAccount({ jurisdiction_id: jurisdiction_id!, input: deleteInstance._id!})
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

   
   const handleAvatarUploaded = async function (asset: IJurisdictionAsset_Info): Promise<void> {
      setValue('asset_id_avatar', asset._id);
      
      setValue('avatar', asset);
      
   };
   const handleAvatarRemove = async function (): Promise<void> {
      setValue('asset_id_avatar', undefined);
      
      setValue('avatar', {});
      
   };
   

	function onSubmit(data: FormType) {
      
      

      const apiData = { ...data };
    	const updatedAccount = Account(apiData);
		setSubmitting(true);

      let promise = is_create ? createAccount(updatedAccount) : replaceAccount(updatedAccount);
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
                  {is_create ? 'Create' : 'Edit'} Account
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
                           label="Avatar"
                           invalid={Boolean(errors.asset_id_avatar)}
                           errorMessage={errors.asset_id_avatar?.message}
                        >
                           
                           <Controller
                              name="avatar"
                              control={control}
                              render={({ field }) => 
                                 <>
                                  <div className="flex flex-col gap-4">
                                       <div className="flex-1 flex flex-row items-center gap-8">
                                       {
                                          field.value && 
                                          <div className="flex flex-col items-center pb-6">
                                             <img className="object-cover max-h-32 max-w-32" src={field.value.thumb_small_url || field.value.thumb_large_url} loading="lazy" />
                                          </div>
                                       }
                                       {
                                          
                                          field.value && field.value._id && <Button
                                             type="button"
                                             variant="default"
                                             color="warning"
                                             size="sm"
                                             className="rounded-8 flex flex-row items-center gap-2"
                                             onClick={handleAvatarRemove}
                                             icon={<PiX />}
                                          >
                                             Remove Photo
                                          </Button>
                                       }
                                       </div>
                                    </div>
                                 </>}
                              />
                           <Controller
                              name="asset_id_avatar"
                              control={control}
                              render={({ field }) => (
                                 <ImageUploader jurisdiction_id={jurisdiction_id} button_text="Replace Photo" upload_text="Upload" asset_dependency={AssetDependency.account} dependency_id={targetAccountId} onAssetCreated={handleAvatarUploaded} asset_area={AssetArea.jurisdiction} />
                              )}
                           />
                           
                        </FormItem>
                        
                     
                        <FormItem
                           label="E-mail"
                           invalid={Boolean(errors.email)}
                           errorMessage={errors.email?.message}
                        >
                           
                           <Controller
                              name="email"
                              control={control}
                              render={({ field }) => (
                                 <Input
                                    {...field}
                                    className="mb-2"
                                    id="email"
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
                                 />
                              )}
                           />
                           
                        </FormItem>
                        
                     
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
                           label="Auth Provider"
                           invalid={Boolean(errors.auth_provider)}
                           errorMessage={errors.auth_provider?.message}
                        >
                           
                           <Controller
                              name="auth_provider"
                              control={control}
                              render={({ field }) => (
                                 <Input
                                    {...field}
                                    className="mb-2"
                                    id="auth_provider"
                                    required
                                 />
                              )}
                           />
                           
                        </FormItem>
                        
                     
                        <FormItem
                           label="Joined"
                           invalid={Boolean(errors.joined_utc)}
                           errorMessage={errors.joined_utc?.message}
                        >
                           
                           <Controller
                              name="joined_utc"
                              control={control}
                              render={({ field }) => (
                                 <DatePicker
                                    {...field}
                                    value={field.value ? new Date(field.value) : undefined}
                                    onChange={(date) => field.onChange(date ? date.toISOString() : undefined)}
                                    
                                    className="mb-2"
                                    clearable={true}
                                    //TODO:DateTime:Nullable, REquired
                                 />
                              
                              )}
                           />
                           
                        </FormItem>
                        
                     
                        <FormItem
                           label="Status"
                           invalid={Boolean(errors.account_status)}
                           errorMessage={errors.account_status?.message}
                        >
                           
                           <Controller
                              name="account_status"
                              control={control}
                              render={({ field }) => (
                                 <AccountStatusPicker 
                                    className="mb-2"
                                    
                                    id="account_status"
                                    onChange={value => field.onChange(value ? (Number(value) as AccountStatus) : undefined)}
                                    value={field.value !== undefined ? `${field.value}` : ''}
                                    
                                    required
                                 />
                              )}
                           />
                           
                        </FormItem>
                        
                     
                        <FormItem
                           label="Roles"
                           invalid={Boolean(errors.roles)}
                           errorMessage={errors.roles?.message}
                        >
                           
                           <Controller
                              name="roles"
                              control={control}
                              render={({ field }) => (
                                 <StringArrayEditor
                                    value={field.value || []}
                                    label="Roles"
                                    className="mb-4"
                                    onChange={newValue => {
                                       field.onChange(newValue);
                                       trigger('roles');
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
                              disabled={account.isLoading || !isValid || submitting}
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

export default AccountEditor;