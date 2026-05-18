import { LayoutContext } from '@/utils/hooks/useLayout';
import type { LayoutContextProps } from '@/utils/hooks/useLayout';
import type { CommonProps } from '@/@types/common';
import { lazy } from 'react';

type LayoutBaseProps = CommonProps & LayoutContextProps;

const Modal = lazy(() => import('@/components/ui/Dialog/Modal'));

const LayoutBase = (props: LayoutBaseProps) => {
   const { children, className, adaptiveCardActive, type, pageContainerReassemble } = props;

   return (
      <LayoutContext.Provider value={{ adaptiveCardActive, pageContainerReassemble, type }}>
         <div className={className}>{children}</div>
         <Modal />
      </LayoutContext.Provider>
   );
};

export default LayoutBase;
