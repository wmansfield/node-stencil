import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import _ from 'lodash';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { zodResolver } from '@hookform/resolvers/zod';
import JurisdictionAsset, { IJurisdictionAsset } from '@/stencil/models/entities/jurisdictionasset';
import { useDeleteJurisdictionAssetMutation, useCreateJurisdictionAssetMutation, useReplaceJurisdictionAssetMutation, useGetJurisdictionAssetQuery } from '@/stencil/endpoints/entities/jurisdictionAssetApi';
import { closeModal, openModal } from '@/components/ui/Dialog/modalSlice';
import { useAppDispatch } from '@/store/rootStore';
import { Button, Checkbox, DatePicker, Dialog, Form, FormItem, Input } from '@/components/ui';
import NullableCheckbox from '@/views/super/common/NullableCheckbox';

import JurisdictionPicker from '@/views/super/pickers/JurisdictionPicker';
import { AssetKind } from '@/stencil/models/entities/assetkind';
import AssetKindPicker from '@/views/super/pickers/AssetKindPicker';
import { AssetDependency } from '@/stencil/models/entities/assetdependency';
import AssetDependencyPicker from '@/views/super/pickers/AssetDependencyPicker';
import Dimension from '@/stencil/models/entities/dimension';
import DimensionEditor, { dimensionSchema } from '../dimension/DimensionEditor';
import DimensionListEditor from '../dimension/DimensionListEditor';

import classNames from '@/utils/classNames';
import moment from 'moment';
import StencilUtils from '@/utils/stencilUtils';
import { TbEdit, TbPlus } from 'react-icons/tb';

import Alert from '@/components/shared/Alert';
import NestedEditor from '../NestedEditor';
import { PiX } from 'react-icons/pi';


type FormType = {
   _id?: IJurisdictionAsset["_id"];
   jurisdiction_id: IJurisdictionAsset["jurisdiction_id"];
   asset_kind: IJurisdictionAsset["asset_kind"] | undefined ;
   file_name: IJurisdictionAsset["file_name"];
   storage_key: IJurisdictionAsset["storage_key"];
   size_kb?: IJurisdictionAsset["size_kb"];
   duration_secs?: IJurisdictionAsset["duration_secs"];
   dependency?: IJurisdictionAsset["dependency"] | undefined ;
   account_id_creator?: IJurisdictionAsset["account_id_creator"];
   dependency_id?: IJurisdictionAsset["dependency_id"];
   available: IJurisdictionAsset["available"];
   resize_required: IJurisdictionAsset["resize_required"];
   resize_status?: IJurisdictionAsset["resize_status"];
   resize_attempts?: IJurisdictionAsset["resize_attempts"];
   resize_attempt_utc?: IJurisdictionAsset["resize_attempt_utc"];
   resize_log?: IJurisdictionAsset["resize_log"];
   thumb_dimensions?: IJurisdictionAsset["thumb_dimensions"];
   large_dimensions?: IJurisdictionAsset["large_dimensions"];
   thumb_small_key?: IJurisdictionAsset["thumb_small_key"];
   thumb_large_key?: IJurisdictionAsset["thumb_large_key"];
   
};

const schema = z.object({
   _id: z.string().optional(),
   jurisdiction_id: z.string().max(10, 'Cannot be more than 10 characters.'),
   asset_kind: z.union([z.enum(AssetKind), z.undefined()]).refine(val => val !== undefined, {
         message: 'Asset kind is required',
      }),
   file_name: z.string().max(120, 'Cannot be more than 120 characters.'),
   storage_key: z.string().max(512, 'Cannot be more than 512 characters.'),
   size_kb: z.number().optional(),
   duration_secs: z.number().optional(),
   dependency: z.union([z.enum(AssetDependency), z.undefined()]).refine(val => val !== undefined, {
         message: 'Dependencies is required',
      }).optional(),
   account_id_creator: z.string().optional(),
   dependency_id: z.string().optional(),
   available: z.boolean(),
   resize_required: z.boolean(),
   resize_status: z.string().max(20, 'Cannot be more than 20 characters.').optional(),
   resize_attempts: z.number().optional(),
   resize_attempt_utc: z.string().optional(),
   resize_log: z.string().max(512, 'Cannot be more than 512 characters.').optional(),
   thumb_dimensions: dimensionSchema.optional(),
   large_dimensions: dimensionSchema.optional(),
   thumb_small_key: z.string().max(512, 'Cannot be more than 512 characters.').optional(),
   thumb_large_key: z.string().max(512, 'Cannot be more than 512 characters.').optional()
});

type JurisdictionAssetEditorProps = {
	className?: string;
   is_create: boolean;
   onDelete?: (jurisdictionasset: IJurisdictionAsset) => void;
   onCreate?: (jurisdictionasset: IJurisdictionAsset) => void;
   jurisdiction_id: string;
   
   _id?: string;
};


function JurisdictionAssetEditor(props: JurisdictionAssetEditorProps) {
	const dispatch = useAppDispatch();
	const { className, _id, is_create, jurisdiction_id, onCreate, onDelete } = props;
	const [openDialog, setOpenDialog] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [targetJurisdictionAssetId, setTargetJurisdictionAssetId] = useState<string>();
	const [original, setOriginal] = useState<IJurisdictionAsset>();

   const defaultValues: FormType = {
		jurisdiction_id: jurisdiction_id,
		asset_kind: undefined,
		file_name: '',
		storage_key: '',
		size_kb: undefined,
		duration_secs: undefined,
		dependency: undefined,
		account_id_creator: undefined,
		dependency_id: undefined,
		available: false,
		resize_required: false,
		resize_status: undefined,
		resize_attempts: undefined,
		resize_attempt_utc: undefined,
		resize_log: undefined,
		thumb_dimensions: undefined,
		large_dimensions: undefined,
		thumb_small_key: undefined,
		thumb_large_key: undefined,
		
	};
	const formMethods = useForm<FormType>({
		mode: 'onChange',
		defaultValues,
		resolver: zodResolver(schema) as any
	});
   const { handleSubmit, formState, control, reset, setValue, trigger } = formMethods;
	const [createJurisdictionAsset] = useCreateJurisdictionAssetMutation();
	const [replaceJurisdictionAsset] = useReplaceJurisdictionAssetMutation();
	const [deleteJurisdictionAsset] = useDeleteJurisdictionAssetMutation();

	const { isValid, dirtyFields, errors } = formState;

	const { t } = useTranslation();
   
   const jurisdictionassetQueryInput = {
      jurisdiction_id: jurisdiction_id!,
		input: _id!
	};
   
   
	let jurisdictionasset = useGetJurisdictionAssetQuery(jurisdictionassetQueryInput, { refetchOnMountOrArgChange: true, skip: !openDialog || !_id });

   useEffect(() => {
      if (!_id) {
         if (!targetJurisdictionAssetId){
            setTargetJurisdictionAssetId(uuidv4());
         }
      } else {
         setTargetJurisdictionAssetId(_id);
      }
   }, [_id]);

   useEffect(() => {
      if (openDialog && jurisdictionasset?.data?.item) {
         reset(jurisdictionasset.data.item);
         setOriginal(jurisdictionasset.data.item);
      }
   }, [openDialog, jurisdictionasset]);

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
         setTargetJurisdictionAssetId(uuidv4());
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
						children="Are you sure you want to delete this JurisdictionAsset?"
						confirmText='Yes, Delete'
						/>
				)
			})
		);
	};

	function performDelete() {
      const deleteInstance = jurisdictionasset.data?.item;
      if (!deleteInstance){
         return;
      }
		setSubmitting(true);
		deleteJurisdictionAsset({ jurisdiction_id: jurisdiction_id!, input: deleteInstance._id!})
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
      
      if (data.thumb_dimensions) {
         try {
            dimensionSchema.parse(data.thumb_dimensions);
         } catch (error) {
            showError('Release date must have both UTC and Local dates selected.');
            return;
         }
      }
      if (data.large_dimensions) {
         try {
            dimensionSchema.parse(data.large_dimensions);
         } catch (error) {
            showError('Release date must have both UTC and Local dates selected.');
            return;
         }
      }
      

      const apiData = { ...data };
    	const updatedJurisdictionAsset = JurisdictionAsset(apiData);
		setSubmitting(true);

      let promise = is_create ? createJurisdictionAsset(updatedJurisdictionAsset) : replaceJurisdictionAsset(updatedJurisdictionAsset);
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
                  {is_create ? 'Create' : 'Edit'} JurisdictionAsset
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
                           label="Assetkind"
                           invalid={Boolean(errors.asset_kind)}
                           errorMessage={errors.asset_kind?.message}
                        >
                           
                           <Controller
                              name="asset_kind"
                              control={control}
                              render={({ field }) => (
                                 <AssetKindPicker 
                                    className="mb-2"
                                    
                                    id="asset_kind"
                                    onChange={value => field.onChange(value ? (Number(value) as AssetKind) : undefined)}
                                    value={field.value !== undefined ? `${field.value}` : ''}
                                    
                                    required
                                 />
                              )}
                           />
                           
                        </FormItem>
                        
                     
                        <FormItem
                           label="File Name"
                           invalid={Boolean(errors.file_name)}
                           errorMessage={errors.file_name?.message}
                        >
                           
                           <Controller
                              name="file_name"
                              control={control}
                              render={({ field }) => (
                                 <Input
                                    {...field}
                                    className="mb-2"
                                    id="file_name"
                                    required
                                 />
                              )}
                           />
                           
                        </FormItem>
                        
                     
                        <FormItem
                           label="Storage Key"
                           invalid={Boolean(errors.storage_key)}
                           errorMessage={errors.storage_key?.message}
                        >
                           
                           <Controller
                              name="storage_key"
                              control={control}
                              render={({ field }) => (
                                 <Input
                                    {...field}
                                    className="mb-2"
                                    id="storage_key"
                                    required
                                 />
                              )}
                           />
                           
                        </FormItem>
                        
                     
                        <FormItem
                           label="Size KB"
                           invalid={Boolean(errors.size_kb)}
                           errorMessage={errors.size_kb?.message}
                        >
                           
                           <Controller
                              name="size_kb"
                              control={control}
                              render={({ field }) => (
                                 <Input
                                    {...field}
                                    className="mb-2"
                                    onChange={e => field.onChange(Number(e.target.value))}
                                    type="number"
                                    id="size_kb"
                                 />
                              
                              )}
                           />
                           
                        </FormItem>
                        
                     
                        <FormItem
                           label="Duraction Secs"
                           invalid={Boolean(errors.duration_secs)}
                           errorMessage={errors.duration_secs?.message}
                        >
                           
                           <Controller
                              name="duration_secs"
                              control={control}
                              render={({ field }) => (
                                 <Input
                                    {...field}
                                    className="mb-2"
                                    onChange={e => field.onChange(Number(e.target.value))}
                                    type="number"
                                    id="duration_secs"
                                 />
                              
                              )}
                           />
                           
                        </FormItem>
                        
                     
                        <FormItem
                           label="Dependencies"
                           invalid={Boolean(errors.dependency)}
                           errorMessage={errors.dependency?.message}
                        >
                           
                           <Controller
                              name="dependency"
                              control={control}
                              render={({ field }) => (
                                 <AssetDependencyPicker 
                                    className="mb-2"
                                    
                                    id="dependency"
                                    onChange={value => field.onChange(value ? (Number(value) as AssetDependency) : undefined)}
                                    value={field.value !== undefined ? `${field.value}` : ''}
                                    
                                 />
                              )}
                           />
                           
                        </FormItem>
                        
                     
                        <FormItem
                           label="Account ID Creator"
                           invalid={Boolean(errors.account_id_creator)}
                           errorMessage={errors.account_id_creator?.message}
                        >
                           
                           <Controller
                              name="account_id_creator"
                              control={control}
                              render={({ field }) => (
                                 <Input
                                    {...field}
                                    className="mb-2"
                                    id="account_id_creator"
                                 />
                              )}
                           />
                           
                        </FormItem>
                        
                     
                        <FormItem
                           label="Dependency ID"
                           invalid={Boolean(errors.dependency_id)}
                           errorMessage={errors.dependency_id?.message}
                        >
                           
                           <Controller
                              name="dependency_id"
                              control={control}
                              render={({ field }) => (
                                 <Input
                                    {...field}
                                    className="mb-2"
                                    id="dependency_id"
                                 />
                              )}
                           />
                           
                        </FormItem>
                        
                     
                        <FormItem
                           label="Available"
                           invalid={Boolean(errors.available)}
                           errorMessage={errors.available?.message}
                        >
                           
                           <Controller
                              name="available"
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
                           label="Should Resize"
                           invalid={Boolean(errors.resize_required)}
                           errorMessage={errors.resize_required?.message}
                        >
                           
                           <Controller
                              name="resize_required"
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
                           label="Resize Status"
                           invalid={Boolean(errors.resize_status)}
                           errorMessage={errors.resize_status?.message}
                        >
                           
                           <Controller
                              name="resize_status"
                              control={control}
                              render={({ field }) => (
                                 <Input
                                    {...field}
                                    className="mb-2"
                                    id="resize_status"
                                 />
                              )}
                           />
                           
                        </FormItem>
                        
                     
                        <FormItem
                           label="Resize Attempts"
                           invalid={Boolean(errors.resize_attempts)}
                           errorMessage={errors.resize_attempts?.message}
                        >
                           
                           <Controller
                              name="resize_attempts"
                              control={control}
                              render={({ field }) => (
                                 <Input
                                    {...field}
                                    className="mb-2"
                                    onChange={e => field.onChange(Number(e.target.value))}
                                    type="number"
                                    id="resize_attempts"
                                 />
                              
                              )}
                           />
                           
                        </FormItem>
                        
                     
                        <FormItem
                           label="Resize Attempt Utc"
                           invalid={Boolean(errors.resize_attempt_utc)}
                           errorMessage={errors.resize_attempt_utc?.message}
                        >
                           
                           <Controller
                              name="resize_attempt_utc"
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
                           label="Resize Log"
                           invalid={Boolean(errors.resize_log)}
                           errorMessage={errors.resize_log?.message}
                        >
                           
                           <Controller
                              name="resize_log"
                              control={control}
                              render={({ field }) => (
                                 <Input
                                    {...field}
                                    className="mb-2"
                                    id="resize_log"
                                 />
                              )}
                           />
                           
                        </FormItem>
                        
                     
                        <FormItem
                           
                           invalid={Boolean(errors.thumb_dimensions)}
                           errorMessage={errors.thumb_dimensions?.message}
                        >
                           
                           <Controller
                                 name="thumb_dimensions"
                                 control={control}
                                 render={({ field }) => (
                                    <NestedEditor
                                       className={className}
                                       value={field.value}
                                       label="Thumb Dimensions"
                                       createNewItem={() => Dimension()}
                                       renderItem={() => <DimensionEditor name="thumb_dimensions" className="mb-4" />}
                                       onChange={newValue => {
                                          field.onChange(newValue);
                                          trigger('thumb_dimensions');
                                       }}
                                       itemLabel={''}
                                    />
                                 )}
                              />
                           
                        </FormItem>
                        
                     
                        <FormItem
                           
                           invalid={Boolean(errors.large_dimensions)}
                           errorMessage={errors.large_dimensions?.message}
                        >
                           
                           <Controller
                                 name="large_dimensions"
                                 control={control}
                                 render={({ field }) => (
                                    <NestedEditor
                                       className={className}
                                       value={field.value}
                                       label="Large Dimensions"
                                       createNewItem={() => Dimension()}
                                       renderItem={() => <DimensionEditor name="large_dimensions" className="mb-4" />}
                                       onChange={newValue => {
                                          field.onChange(newValue);
                                          trigger('large_dimensions');
                                       }}
                                       itemLabel={''}
                                    />
                                 )}
                              />
                           
                        </FormItem>
                        
                     
                        <FormItem
                           label="Thumb Key"
                           invalid={Boolean(errors.thumb_small_key)}
                           errorMessage={errors.thumb_small_key?.message}
                        >
                           
                           <Controller
                              name="thumb_small_key"
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
                           label="Large Key"
                           invalid={Boolean(errors.thumb_large_key)}
                           errorMessage={errors.thumb_large_key?.message}
                        >
                           
                           <Controller
                              name="thumb_large_key"
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
                              disabled={jurisdictionasset.isLoading || !isValid || submitting}
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

export default JurisdictionAssetEditor;