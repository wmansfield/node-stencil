import { useAppDispatch, useAppSelector } from '@/store/rootStore';
import Dialog from './Dialog';
import { closeModal, selectModalProps } from './modalSlice';

/**
 * Modal component
 * This component renders a material UI ```Dialog``` component
 * with properties pulled from the redux store
 */
function Modal() {
   const dispatch = useAppDispatch();
   const options = useAppSelector(selectModalProps);

   return (
      <Dialog
         onClose={() => {
            if (options.preventClose) {
               return;
            }
            dispatch(closeModal());
         }}
         style={{
            overlay: { zIndex: 50 },
            content: { zIndex: 51 },
         }}
         contentClassName="pb-0 px-0"
         {...options}
      />
   );
}

export default Modal;
