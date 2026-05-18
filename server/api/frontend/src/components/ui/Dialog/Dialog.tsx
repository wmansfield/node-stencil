import Modal from 'react-modal';
import classNames from 'classnames';
import CloseButton from '../CloseButton';
import { motion } from 'framer-motion';
import useWindowSize from '../hooks/useWindowSize';
import type ReactModal from 'react-modal';
import type { MouseEvent, ReactNode } from 'react';

export interface DialogProps extends ReactModal.Props {
   /** Whether the dialog can be closed by clicking the close button or overlay */
   closable?: boolean;
   /** Additional CSS classes for the dialog content */
   contentClassName?: string;
   /** Fixed height of the dialog */
   height?: string | number;
   /** Maximum height of the dialog */
   maxHeight?: string | number;
   /** Callback when dialog is closed */
   onClose?: (e: MouseEvent<HTMLSpanElement>) => void;
   /** Width of the dialog */
   width?: number;
}

export interface DialogHeaderProps {
   /** Additional CSS classes */
   className?: string;
   /** Header content */
   children: ReactNode;
}

export interface DialogBodyProps {
   /** Additional CSS classes */
   className?: string;
   /** Whether the body should be scrollable */
   scrollable?: boolean;
   /** Body content */
   children: ReactNode;
}

export interface DialogFooterProps {
   /** Additional CSS classes */
   className?: string;
   /** Footer content */
   children: ReactNode;
}

/**
 * Dialog component with composition pattern for better UX
 *
 * @example
 * // Basic usage with composition
 * <Dialog isOpen={isOpen} onClose={handleClose}>
 *   <DialogHeader>
 *     <h4>Dialog Title</h4>
 *   </DialogHeader>
 *   <DialogBody scrollable={true}>
 *     <div>Long content that will scroll</div>
 *   </DialogBody>
 *   <DialogFooter>
 *     <Button onClick={handleCancel}>Cancel</Button>
 *     <Button onClick={handleSave}>Save</Button>
 *   </DialogFooter>
 * </Dialog>
 *
 * @example
 * // Simple usage (backward compatible)
 * <Dialog isOpen={isOpen} onClose={handleClose}>
 *   <div>Simple content</div>
 * </Dialog>
 */
const Dialog = (props: DialogProps) => {
   const currentSize = useWindowSize();

   const {
      bodyOpenClassName,
      children,
      className,
      closable = true,
      closeTimeoutMS = 150,
      contentClassName,
      height,
      isOpen,
      maxHeight,
      onClose,
      overlayClassName,
      portalClassName,
      style,
      width = 520,
      ...rest
   } = props;

   const onCloseClick = (e: MouseEvent<HTMLSpanElement>) => {
      onClose?.(e);
   };

   const renderCloseButton = <CloseButton absolute className="ltr:right-6 rtl:left-6 top-4.5" onClick={onCloseClick} />;

   const contentStyle = {
      content: {
         inset: 'unset',
      },
      ...style,
   };

   if (width !== undefined) {
      contentStyle.content.width = width;

      if (typeof currentSize.width !== 'undefined' && currentSize.width <= width) {
         contentStyle.content.width = 'auto';
      }
   }

   if (height !== undefined) {
      contentStyle.content.height = height;
   }

   if (maxHeight !== undefined) {
      contentStyle.content.maxHeight = maxHeight;
   }

   const defaultDialogContentClass = 'dialog-content';

   const dialogClass = classNames(defaultDialogContentClass, contentClassName);

   return (
      <Modal
         className={{
            base: classNames('dialog', className as string),
            afterOpen: 'dialog-after-open',
            beforeClose: 'dialog-before-close',
         }}
         overlayClassName={{
            base: classNames('dialog-overlay', overlayClassName as string),
            afterOpen: 'dialog-overlay-after-open',
            beforeClose: 'dialog-overlay-before-close',
         }}
         portalClassName={classNames('dialog-portal', portalClassName)}
         bodyOpenClassName={classNames('dialog-open', bodyOpenClassName)}
         ariaHideApp={false}
         isOpen={isOpen}
         style={{ ...contentStyle }}
         closeTimeoutMS={closeTimeoutMS}
         {...rest}
      >
         <motion.div
            className={dialogClass}
            initial={{ transform: 'scale(0.9)' }}
            animate={{
               transform: isOpen ? 'scale(1)' : 'scale(0.9)',
            }}
         >
            {closable && renderCloseButton}
            {children}
         </motion.div>
      </Modal>
   );
};

/**
 * Dialog Header component
 */
const DialogHeader = ({ className, children }: DialogHeaderProps) => {
   return <div className={classNames('dialog-header', className)}>{children}</div>;
};

/**
 * Dialog Body component with optional scrolling
 */
const DialogBody = ({ className, scrollable = false, children }: DialogBodyProps) => {
   const bodyClass = classNames(
      'dialog-body',
      {
         'dialog-body-scrollable': scrollable,
      },
      className
   );

   return <div className={bodyClass}>{children}</div>;
};

/**
 * Dialog Footer component
 */
const DialogFooter = ({ className, children }: DialogFooterProps) => {
   return <div className={classNames('dialog-footer', className)}>{children}</div>;
};

Dialog.displayName = 'Dialog';
DialogHeader.displayName = 'DialogHeader';
DialogBody.displayName = 'DialogBody';
DialogFooter.displayName = 'DialogFooter';

// Attach sub-components to Dialog
Dialog.Header = DialogHeader;
Dialog.Body = DialogBody;
Dialog.Footer = DialogFooter;

export default Dialog;
