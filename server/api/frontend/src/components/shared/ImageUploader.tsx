import * as React from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useAppDispatch } from '@/store/rootStore';
import ImageUploading, { ImageListType, ImageType } from 'react-images-uploading';
import { Button, Card } from '../ui';
import { PiCamera, PiUpload } from 'react-icons/pi';
import classNames from '@/utils/classNames';
import Loading from './Loading';
import { closeModal, openModal } from '../ui/Dialog/modalSlice';
import Alert from './Alert';
import StencilUtils from '@/utils/StencilUtils';
import { AssetArea } from '@/stencil/models/entities/assetarea';
import { AssetDependency } from '@/stencil/models/entities/assetdependency';
import { ActionResult } from '@/stencil/models/action-result';
import { IPreSignedUrl } from '@/stencil/models/entities/presignedurl';
import { AssetKind } from '@/stencil/models/entities/assetkind';
import { useUploadCompleteMutation, useUploadPrepareMutation } from '@/stencil/endpoints/features/user/mediaApi';
import { IJurisdictionAsset_Info } from '@/stencil/models/entities/jurisdictionasset';
import { IUploadInfo } from '@/stencil/models/features/user/media/uploadinfo';

type ImageUploaderProps = {
   asset_area: AssetArea;
   className?: string;
   previewClassName?: string;
   button_text?: string;
   upload_text?: string;
   dependency_id?: string;
   jurisdiction_id: string;
   asset_dependency?: AssetDependency;
   /** Overrides the default upload and onAssetCreated callback.  If provided, onAssetCreated is not called. */
   customCompleteUpload?: (uploadedImage: IPreSignedUrl) => PromiseLike<ActionResult>;
   onAssetCreated?: (asset: IJurisdictionAsset_Info) => void;
};

function ImageUploader(props: ImageUploaderProps) {
   const dispatch = useAppDispatch();
   const routeParams = useParams();
   const {
      asset_area,
      className,
      dependency_id,
      jurisdiction_id,
      asset_dependency,
      previewClassName,
      upload_text,
      button_text,
      customCompleteUpload,
      onAssetCreated,
   } = props;

   const [images, setImages] = React.useState<Array<ImageType>>([]);
   const [uploading, setUploading] = React.useState(false);
   const maxNumber = 1;

   const [prepareUpload] = useUploadPrepareMutation();
   const [completeUpload] = useUploadCompleteMutation();

   const handleOnImageUploadingChanged = (value: ImageListType, addUpdatedIndex?: Array<number>) => {
      setImages(value);
   };

   const handleUpload = (image: ImageType, onImageRemoveAll: () => void) => {
      if (!image.file) {
         return;
      }
      setUploading(true);

      const file = image.file;

      const input: IUploadInfo = {
         asset_kind: AssetKind.image,
         asset_area: asset_area,
         file_name: file.name,
         mime_type: file.type,
         jurisdiction_id: jurisdiction_id,
      };

      let promise = prepareUpload(input);
      promise
         .unwrap()
         .then(resp => {
            if (!resp.success || !resp.item) {
               showError(resp.message || 'Error starting upload');
               setUploading(false);
            } else {
               const presignedUrl: IPreSignedUrl = resp.item;
               const instance = axios.create({});
               instance.defaults.headers.common['Authorization'] = null;
               instance
                  .put(resp.item.signed_url, file, {
                     headers: {
                        'Content-Type': file.type,
                        'x-ms-blob-type': 'BlockBlob',
                     },
                  })
                  .then(data => {
                     if (customCompleteUpload) {
                        customCompleteUpload(presignedUrl).then(
                           response => {
                              setUploading(false);
                              if (response.success) {
                                 onImageRemoveAll();
                              } else {
                                 showError(response.message || 'Error Saving data.');
                              }
                           },
                           error => {
                              setUploading(false);
                              const message = StencilUtils.getApiErrorMessage(error, 'Error saving data.');
                              showError(message);
                           }
                        );
                     } else {
                        let promise = completeUpload({
                           jurisdiction_id: jurisdiction_id,
                           presigned: {
                              ...presignedUrl,
                              dependency_id: dependency_id,
                              dependency: asset_dependency,
                           }
                        });
                        promise
                           .unwrap()
                           .then(resp => {
                              setUploading(false);
                              if (resp.success && resp.item) {
                                 onImageRemoveAll();
                                 onAssetCreated?.(resp.item);
                              } else {
                                 showError(resp.message || 'Error persisting upload');
                              }
                           })
                           .catch(ex => {
                              setUploading(false);
                              const message = StencilUtils.getApiErrorMessage(ex, 'Error persisting data.');
                              showError(message);
                           });
                     }
                  })
                  .catch(error => {
                     setUploading(false);
                     const message = StencilUtils.getApiErrorMessage(error, 'Error saving data.');
                     showError(message);
                  });
            }
         })
         .catch(ex => {
            setUploading(false);
            const message = StencilUtils.getApiErrorMessage(ex, 'Error saving data.');
            showError(message);
         });
   };

   function showError(message: string) {
      dispatch(
         openModal({
            children: (
               <Alert
                  type="danger"
                  onCancel={async () => {
                     dispatch(closeModal());
                  }}
                  onConfirm={async () => {
                     dispatch(closeModal());
                  }}
                  children={message}
                  confirmText="Okay"
                  confirmOnly={true}
               />
            ),
         })
      );
   }

   return (
      <div className={classNames('', className)}>
         <ImageUploading value={images} onChange={handleOnImageUploadingChanged} maxNumber={maxNumber} dataURLKey="data_url">
            {({ imageList, onImageUpload, onImageRemoveAll, onImageUpdate, onImageRemove, isDragging, dragProps, errors }) => (
               <div>
                  {imageList && imageList.length == 0 && (
                     <>
                        {button_text == '' ? (
                           <Button type="button" variant="plain" color="primary" className="rounded-8" onClick={onImageUpload} {...dragProps}>
                              <PiCamera />
                           </Button>
                        ) : (
                           <Button
                              type="button"
                              variant="default"
                              color="primary"
                              className="rounded-8 flex flex-row items-center gap-2"
                              onClick={onImageUpload}
                              icon={<PiCamera size={20} className="mr-2" />}
                              {...dragProps}
                           >
                              {button_text != null && button_text != undefined ? button_text : 'Upload Photo'}
                           </Button>
                        )}
                     </>
                  )}

                  {imageList.map((image, index) => (
                     <div key={`img_${index}`} className={classNames(previewClassName, 'flex flex-col items-center')}>
                        <Card key={index} className="my-4 w-full rounded-16 flex flex-col items-center">
                           <img src={image['data_url']} className="max-w-48 max-h-48" alt="" />
                        </Card>
                        <div className="flex flex-row w-full gap-2">
                           <Button type="button" variant="default" color="primary" disabled={uploading} onClick={() => onImageRemove(index)}>
                              Cancel
                           </Button>
                           <Button
                              type="button"
                              variant="solid"
                              color="primary"
                              disabled={uploading}
                              icon={
                                 uploading ? (
                                    <Loading type="refreshing" loading={true} customColorClass="white" />
                                 ) : (
                                    <PiUpload size={20} className="mr-2" />
                                 )
                              }
                              onClick={() => handleUpload(image, onImageRemoveAll)}
                           >
                              {!!upload_text ? upload_text : 'Upload'}
                           </Button>
                        </div>
                     </div>
                  ))}
               </div>
            )}
         </ImageUploading>
      </div>
   );
}

export default ImageUploader;
