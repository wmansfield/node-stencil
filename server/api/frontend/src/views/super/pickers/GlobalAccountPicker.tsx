import { useEffect, useState } from 'react';
import { SingleValue } from 'react-select';
import { cloneDeep, isEqual } from 'lodash';
import classNames from 'classnames';
import Select from '@/components/ui/Select';
import { useAppDispatch } from '@/store/rootStore';
import { IGlobalAccountOption } from '@/stencil/models/entities/globalaccount';
import { ListInputGlobalAccount } from '@/stencil/models/entities/requests/list-input-globalaccount';
import { globalaccountEndpoints, useGetGlobalAccountsQuery } from '@/stencil/endpoints/entities/globalAccountApi';

type GlobalAccountPickerProps = {
   className?: string;
   id?: string;
   value?: string;
   value_display?: string;
   readOnly?: boolean;
   loadOnDisplay?: boolean;
   placeholder?: string;
   required?: boolean;
   onChange?: (value: string) => void;
   onSelected?: (value: IGlobalAccountOption) => void;

};
const defaultQueryInput: ListInputGlobalAccount = {
   skip: 0,
   take: 50,
   order_by: 'auth_identifier',
   keyword: '',
};

function GlobalAccountPicker(props: GlobalAccountPickerProps) {
   const dispatch = useAppDispatch();
   const { className, id, loadOnDisplay = false, onChange, placeholder = 'Please Select', readOnly = false, required = false } = props;
   const [value, setValue] = useState<IGlobalAccountOption | undefined>();
   const [requiresFocus, setRequiresFocus] = useState<boolean>(() => !loadOnDisplay);
   const [inputValue, setInputValue] = useState<string>('');
   const [lookedUpValue, setLookedUpValue] = useState<string>();
   const [allowLocalSearch, setAllowLocalSearch] = useState<boolean>(false);
   const [queryInput, setQueryInput] = useState<ListInputGlobalAccount>({
      ...defaultQueryInput,
      keyword: inputValue,
   });

   let globalaccounts = useGetGlobalAccountsQuery(queryInput, { refetchOnMountOrArgChange: true, skip: readOnly || requiresFocus });

   useEffect(() => {
      if (props.value == value?._id) {
         //value is the same, no need to update
         return;
      }
      if (props.value !== undefined) {
         if (typeof props.value === 'string') {
            if (props.value.length > 0){
               setValue({ _id: props.value, auth_identifier: props.value_display ?? props.value });
               if (props.value) {
                  if (!lookedUpValue || props.value_display !== lookedUpValue) {
                     setLookedUpValue(props.value);
                     fetchGlobalAccount(props.value);
                  }
               }
            }
         } else {
            setValue(props.value);
         }
      }
   }, [props.value]);

   useEffect(() => {
      const stepping = globalaccounts?.data?.stepping;
      if (stepping && !stepping.more) {
         if (isEqual(defaultQueryInput, queryInput)) {
            setAllowLocalSearch(true);
         }
      }
   }, [globalaccounts?.isLoading, globalaccounts?.data?.stepping]);

   const fetchGlobalAccount = (_id: string) => {
      const promise = dispatch(
         globalaccountEndpoints.getGlobalAccount.initiate(_id));

      promise.then(
         item => {
            if (item?.data?.item) {
               if (item.data.item._id == value?._id || item.data.item._id == props.value) {
                  setValue(item.data.item);
               }
            }
            promise.unsubscribe();
         },
         error => {
            promise.unsubscribe();
         }
      );
   };

   const onFocus = () => {
      if (requiresFocus) {
         setRequiresFocus(false);
      }
   };

   const handleInputChange = (newValue: string) => {
      setInputValue(newValue);
      if (!allowLocalSearch) {
         const newQuery = cloneDeep(queryInput);
         newQuery.keyword = newValue;
         setQueryInput(newQuery);
      }
      return newValue;
   };

   const handleChange = (selected: SingleValue<IGlobalAccountOption>) => {
      setValue(selected ?? undefined);
      if (onChange) {
         onChange(selected ? selected._id : '');
         setInputValue('');
      }
   };

   return (
      <Select
         value={value}
         onFocus={onFocus}
         onChange={handleChange}
         onInputChange={handleInputChange}
         isLoading={globalaccounts.isLoading}
         isMulti={false}
         isClearable={true}
         id={id}
         required={required}
         getOptionLabel={option => option.auth_identifier}
         getOptionValue={option => option._id}
         isDisabled={readOnly}
         placeholder={placeholder}
         noOptionsMessage={({ inputValue }) => (inputValue ? `No items matching: ${inputValue}` : 'No items found')}
         options={globalaccounts?.data?.items ? globalaccounts.data.items : []}
         className={classNames(className)}
      />
   );
}

export default GlobalAccountPicker;