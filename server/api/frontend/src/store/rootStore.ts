import { useDispatch, useSelector, useStore } from 'react-redux';
import { Action, Middleware, ThunkAction, configureStore, createSelector } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { rootReducer } from './rootReducer';
import { dynamicMiddleware } from './middleware';
import { apiService } from '../stencil/apiService';

// Infer the `RootState` type from the root reducer
export type RootState = ReturnType<typeof rootReducer>;

const middlewares: Middleware[] = [apiService.middleware, dynamicMiddleware];

export const makeStore = (preloadedState?: Partial<RootState>) => {
   const store = configureStore({
      reducer: rootReducer,
      middleware: getDefaultMiddleware =>
         getDefaultMiddleware({
            serializableCheck: {
               ignoredActions: ['modal/openModal'],
               ignoredPaths: ['modal.children'],
            },
         }).concat(middlewares),
      preloadedState,
   });
   // configure listeners using the provided defaults
   // optional, but required for `refetchOnFocus`/`refetchOnReconnect` behaviors
   setupListeners(store.dispatch);
   return store;
};

export const rootStore = makeStore();

// Infer the type of `store`
export type AppStore = typeof rootStore;
export type AppDispatch = AppStore['dispatch'];
export type AppThunk<ThunkReturnType = void> = ThunkAction<ThunkReturnType, RootState, unknown, Action>;
export type AppAction<R = Promise<void>> = Action<string> | ThunkAction<R, RootState, unknown, Action<string>>;

export const createAppSelector = createSelector.withTypes<RootState>();
export default rootStore;

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
export const useAppStore = useStore.withTypes<AppStore>();
