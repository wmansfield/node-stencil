import { rootReducer } from '@/store/rootReducer';
import { createSlice, PayloadAction, WithSlice } from '@reduxjs/toolkit';
import { ReactElement } from 'react';

type InitialStateProps = {
   isOpen: boolean;
   preventClose: boolean;
   children: ReactElement | string;
};

/**
 * The initial state of the dialog slice.
 */
const initialState: InitialStateProps = {
   isOpen: false,
   preventClose: false,
   children: '',
};

/**
 * The Dialog slice
 */
export const modalSlice = createSlice({
   name: 'modal',
   initialState,
   reducers: {
      openModal: (state, action: PayloadAction<{ preventClose?: InitialStateProps['preventClose']; children: InitialStateProps['children'] }>) => {
         state.isOpen = true;
         state.preventClose = action.payload?.preventClose || false;
         state.children = action.payload.children;
      },
      closeModal: () => initialState,
   },
   selectors: {
      selectModalState: dialog => dialog.isOpen,
      selectModalProps: dialog => dialog,
   },
});

/**
 * Lazy load
 * */
rootReducer.inject(modalSlice);
const injectedSlice = modalSlice.injectInto(rootReducer);
declare module '@/store/rootReducer' {
   export interface LazyLoadedSlices extends WithSlice<typeof modalSlice> {}
}

export const { closeModal, openModal } = modalSlice.actions;

export const { selectModalState, selectModalProps } = injectedSlice.selectors;

export type modalSliceType = typeof modalSlice;

export default modalSlice.reducer;
