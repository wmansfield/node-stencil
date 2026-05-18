import { combineSlices } from '@reduxjs/toolkit';
import apiService from '../stencil/apiService';

// eslint-disable-next-line
// @ts-ignore
export interface LazyLoadedSlices {}

// `combineSlices` automatically combines the reducers using
// their `reducerPath`s, therefore we no longer need to call `combineReducers`.
export const rootReducer = combineSlices(
   /**
    * Static slices
    */
   // none yet?

   /**
    * Dynamic slices
    */
   {
      [apiService.reducerPath]: apiService.reducer,
   }
).withLazyLoadedSlices<LazyLoadedSlices>();
