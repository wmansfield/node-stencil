import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import _ from 'lodash';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { zodResolver } from '@hookform/resolvers/zod';
import Widget, { IWidget } from '@/stencil/models/entities/widget';
import { useDeleteWidgetMutation, useCreateWidgetMutation, useReplaceWidgetMutation, useGetWidgetQuery } from '@/stencil/endpoints/entities/widgetApi';
import { closeModal, openModal } from '@/components/ui/Dialog/modalSlice';
import { useAppDispatch } from '@/store/rootStore';
import { Button, Checkbox, DatePicker, Dialog, Form, FormItem, Input } from '@/components/ui';
import NullableCheckbox from '@/views/super/common/NullableCheckbox';

import JurisdictionPicker from '@/views/super/pickers/JurisdictionPicker';
import AssetPicker from '@/views/super/pickers/JurisdictionAssetPicker';
import LocalizedText from '@/stencil/models/entities/localizedtext';
import LocalizedTextEditor, { localizedTextSchema } from '../localizedtext/LocalizedTextEditor';
import LocalizedTextListEditor from '../localizedtext/LocalizedTextListEditor';

import LocalizedContent from '@/stencil/models/entities/localizedcontent';
import LocalizedContentEditor, { localizedContentSchema } from '../localizedcontent/LocalizedContentEditor';
import LocalizedContentListEditor from '../localizedcontent/LocalizedContentListEditor';

import FullDate from '@/stencil/models/entities/fulldate';
import FullDateEditor, { fullDateSchema } from '../fulldate/FullDateEditor';
import FullDateListEditor from '../fulldate/FullDateListEditor';

import MediaInfo from '@/stencil/models/entities/mediainfo';
import MediaInfoEditor, { mediaInfoSchema } from '../mediainfo/MediaInfoEditor';
import MediaInfoListEditor from '../mediainfo/MediaInfoListEditor';

import IDPair from '@/stencil/models/entities/idpair';
import IDPairEditor, { iDPairSchema } from '../idpair/IDPairEditor';
import IDPairListEditor from '../idpair/IDPairListEditor';

import classNames from '@/utils/classNames';
import moment from 'moment';
import StencilUtils from '@/utils/stencilUtils';
import { TbEdit, TbPlus } from 'react-icons/tb';

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
   _id?: IWidget["_id"];
   jurisdiction_id: IWidget["jurisdiction_id"];
   asset_id_media?: IWidget["asset_id_media"];
   title: IWidget["title"];
   title_localized?: IWidget["title_localized"];
   description?: IWidget["description"];
   description_localized?: IWidget["description_localized"];
   published_date?: IWidget["published_date"];
   reference?: IWidget["reference"];
   avatar?: IWidget["avatar"];
   
};

const schema = z.object({
   _id: z.string().optional(),
   jurisdiction_id: z.string().max(10, 'Cannot be more than 10 characters.'),
   asset_id_media: z.string().optional(),
   title: z.string().max(200, 'Cannot be more than 200 characters.'),
   title_localized: z.array(localizedTextSchema).optional(),
   description: z.string().optional(),
   description_localized: z.array(localizedContentSchema).optional(),
   published_date: fullDateSchema.optional(),
   reference: iDPairSchema.optional(),
   avatar: mediaInfoSchema.optional()
   
});

type WidgetEditorProps = {
	className?: string;
   is_create: boolean;
   onDelete?: (widget: IWidget) => void;
   onCreate?: (widget: IWidget) => void;
   jurisdiction_id: string;
   
   _id?: string;
};


function WidgetEditor(props: WidgetEditorProps) {
	const dispatch = useAppDispatch();
	const { className, _id, is_create, jurisdiction_id, onCreate, onDelete } = props;
	const [openDialog, setOpenDialog] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [targetWidgetId, setTargetWidgetId] = useState<string>();
	const [original, setOriginal] = useState<IWidget>();

   const defaultValues: FormType = {
		jurisdiction_id: jurisdiction_id,
		asset_id_media: undefined,
		title: '',
		title_localized: undefined,
		description: undefined,
		description_localized: undefined,
		published_date: undefined,
		reference: undefined,
		
	};
	const formMethods = useForm<FormType>({
		mode: 'onChange',
		defaultValues,
		resolver: zodResolver(schema) as any
	});
   const { handleSubmit, formState, control, reset, setValue, trigger } = formMethods;
	const [createWidget] = useCreateWidgetMutation();
	const [replaceWidget] = useReplaceWidgetMutation();
	const [deleteWidget] = useDeleteWidgetMutation();

	const { isValid, dirtyFields, errors } = formState;

	const { t } = useTranslation();
   
   const widgetQueryInput = {
      jurisdiction_id: jurisdiction_id!,
		input: _id!
	};
   
   
	let widget = useGetWidgetQuery(widgetQueryInput, { refetchOnMountOrArgChange: true, skip: !openDialog || !_id });

   useEffect(() => {
      if (!_id) {
         if (!targetWidgetId){
            setTargetWidgetId(uuidv4());
         }
      } else {
         setTargetWidgetId(_id);
      }
   }, [_id]);

   useEffect(() => {
      if (openDialog && widget?.data?.item) {
         reset(widget.data.item);
         setOriginal(widget.data.item);
      }
   }, [openDialog, widget]);

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
         setTargetWidgetId(uuidv4());
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
						children="Are you sure you want to delete this Widget?"
						confirmText='Yes, Delete'
						/>
				)
			})
		);
	};

	function performDelete() {
      const deleteInstance = widget.data?.item;
      if (!deleteInstance){
         return;
      }
		setSubmitting(true);
		deleteWidget({ jurisdiction_id: jurisdiction_id!, input: deleteInstance._id!})
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

   
   const handleMediaAssetUploaded = async function (asset: IJurisdictionAsset_Info): Promise<void> {
      setValue('asset_id_media', asset._id);
      
      setValue('avatar', asset);
      
   };
   const handleMediaAssetRemove = async function (): Promise<void> {
      setValue('asset_id_media', undefined);
      
      setValue('avatar', {});
      
   };
   

	function onSubmit(data: FormType) {
      
      if (data.published_date) {
         try {
            fullDateSchema.parse(data.published_date);
         } catch (error) {
            showError('Release date must have both UTC and Local dates selected.');
            return;
         }
      }
      if (data.reference) {
         try {
            iDPairSchema.parse(data.reference);
         } catch (error) {
            showError('Release date must have both UTC and Local dates selected.');
            return;
         }
      }
      

      const apiData = { ...data };
    	const updatedWidget = Widget(apiData);
		setSubmitting(true);

      let promise = is_create ? createWidget(updatedWidget) : replaceWidget(updatedWidget);
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
                  {is_create ? 'Create' : 'Edit'} Widget
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
                           label="Media Asset"
                           invalid={Boolean(errors.asset_id_media)}
                           errorMessage={errors.asset_id_media?.message}
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
                                             onClick={handleMediaAssetRemove}
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
                              name="asset_id_media"
                              control={control}
                              render={({ field }) => (
                                 <ImageUploader jurisdiction_id={jurisdiction_id} button_text="Replace Photo" upload_text="Upload" asset_dependency={AssetDependency.widget} dependency_id={targetWidgetId} onAssetCreated={handleMediaAssetUploaded} asset_area={AssetArea.jurisdiction} />
                              )}
                           />
                           
                        </FormItem>
                        
                     
                        <FormItem
                           label="Title"
                           invalid={Boolean(errors.title)}
                           errorMessage={errors.title?.message}
                        >
                           
                           <Controller
                              name="title"
                              control={control}
                              render={({ field }) => (
                                 <Input
                                    {...field}
                                    className="mb-2"
                                    id="title"
                                    required
                                 />
                              )}
                           />
                           
                        </FormItem>
                        
                     
                        <FormItem
                           label="Title Localized"
                           invalid={Boolean(errors.title_localized)}
                           errorMessage={errors.title_localized?.message}
                        >
                           
                              <LocalizedTextListEditor
                                 name="title_localized"
                                 className="mb-4"
                              />
                           
                        </FormItem>
                        
                     
                        <FormItem
                           label="Description"
                           invalid={Boolean(errors.description)}
                           errorMessage={errors.description?.message}
                        >
                           
                           <Controller
                              name="description"
                              control={control}
                              render={({ field }) => (
                                 <Input
                                    {...field}
                                    className="mb-2"
                                    id="description"
                                 />
                              )}
                           />
                           
                        </FormItem>
                        
                     
                        <FormItem
                           label="Description Localized"
                           invalid={Boolean(errors.description_localized)}
                           errorMessage={errors.description_localized?.message}
                        >
                           
                              <LocalizedContentListEditor
                                 name="description_localized"
                                 className="mb-4"
                              />
                           
                        </FormItem>
                        
                     
                        <FormItem
                           
                           invalid={Boolean(errors.published_date)}
                           errorMessage={errors.published_date?.message}
                        >
                           
                           <Controller
                                 name="published_date"
                                 control={control}
                                 render={({ field }) => (
                                    <NestedEditor
                                       className={className}
                                       value={field.value}
                                       label="Published Date"
                                       createNewItem={() => FullDate()}
                                       renderItem={() => <FullDateEditor name="published_date" className="mb-4" />}
                                       onChange={newValue => {
                                          field.onChange(newValue);
                                          trigger('published_date');
                                       }}
                                       itemLabel={''}
                                    />
                                 )}
                              />
                           
                        </FormItem>
                        
                     
                        <FormItem
                           
                           invalid={Boolean(errors.reference)}
                           errorMessage={errors.reference?.message}
                        >
                           
                           <Controller
                                 name="reference"
                                 control={control}
                                 render={({ field }) => (
                                    <NestedEditor
                                       className={className}
                                       value={field.value}
                                       label="Reference"
                                       createNewItem={() => IDPair()}
                                       renderItem={() => <IDPairEditor name="reference" className="mb-4" />}
                                       onChange={newValue => {
                                          field.onChange(newValue);
                                          trigger('reference');
                                       }}
                                       itemLabel={''}
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
                              disabled={widget.isLoading || !isValid || submitting}
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

export default WidgetEditor;