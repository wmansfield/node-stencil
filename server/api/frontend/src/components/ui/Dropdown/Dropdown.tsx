import { DropdownContextProvider } from './context/dropdownContext';
import DropdownMenu from './DropdownMenu';
import { FloatingTree, useFloatingParentNodeId } from '@floating-ui/react';
import type { DropdownMenuProps, DropdownMenuRef } from './DropdownMenu';
import type { HTMLProps, Ref } from 'react';

export type DropdownRef = DropdownMenuRef;
export interface DropdownProps extends DropdownMenuProps {
   eventKey?: string;
   id?: string;
   ref?: Ref<DropdownRef>;
}

const Dropdown = ({ activeKey, zIndex, ref, ...props }: DropdownProps & HTMLProps<HTMLElement>) => {
   const parentId = useFloatingParentNodeId();

   if (parentId === null) {
      return (
         <DropdownContextProvider value={{ activeKey }}>
            <FloatingTree>
               <DropdownMenu {...props} zIndex={zIndex} ref={ref} />
            </FloatingTree>
         </DropdownContextProvider>
      );
   }

   return <DropdownMenu {...props} zIndex={zIndex} ref={ref} />;
};

export default Dropdown;
