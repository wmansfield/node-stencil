import { useEffect, useState } from 'react';
import { SingleValue } from 'react-select';
import { cloneDeep, isEqual } from 'lodash';
import classNames from 'classnames';
import Select from '@/components/ui/Select';
import { useAppDispatch } from '@/store/rootStore';
import { IJurisdictionAssetOption } from '@/stencil/models/entities/jurisdictionasset';
import { ListInputJurisdictionAsset } from '@/stencil/models/entities/requests/list-input-jurisdictionasset';
import { jurisdictionassetEndpoints, useGetJurisdictionAssetsQuery } from '@/stencil/endpoints/entities/jurisdictionAssetApi';
import { RoutedInput } from '@/stencil/models/routed-input';

type JurisdictionAssetPickerProps = {
   jurisdiction_id: string;
   className?: string;
   id?: string;
   value?: string;
   value_display?: string;
   readOnly?: boolean;
   loadOnDisplay?: boolean;
   placeholder?: string;
   required?: boolean;
   onChange?: (value: string) => void;
   onSelected?: (value: IJurisdictionAssetOption) => void;

};
const defaultQueryInput: ListInputJurisdictionAsset = {
   skip: 0,
   take: 50,
   order_by: 'jurisdiction_id',
   keyword: '',
};

function JurisdictionAssetPicker(props: JurisdictionAssetPickerProps) {
   const dispatch = useAppDispatch();
   const { className, id, loadOnDisplay = false, onChange, placeholder = 'Please Select', readOnly = false, required = false, jurisdiction_id } = props;
   const [value, setValue] = useState<IJurisdictionAssetOption | undefined>();
   const [requiresFocus, setRequiresFocus] = useState<boolean>(() => !loadOnDisplay);
   const [inputValue, setInputValue] = useState<string>('');
   const [lookedUpValue, setLookedUpValue] = useState<string>();
   const [allowLocalSearch, setAllowLocalSearch] = useState<boolean>(false);
   const [queryInput, setQueryInput] = useState<RoutedInput<ListInputJurisdictionAsset>>({
      jurisdiction_id: jurisdiction_id,
      input: {
         ...defaultQueryInput,
         keyword: inputValue,
      }
   });

   let jurisdictionassets = useGetJurisdictionAssetsQuery(queryInput, { refetchOnMountOrArgChange: true, skip: readOnly || requiresFocus });

   useEffect(() => {
      if (props.value == value?._id) {
         //value is the same, no need to update
         return;
      }
      if (props.value !== undefined) {
         if (typeof props.value === 'string') {
            if (props.value.length > 0){
               setValue({ _id: props.value, jurisdiction_id: props.value_display ?? props.value });
               if (props.value) {
                  if (!lookedUpValue || props.value_display !== lookedUpValue) {
                     setLookedUpValue(props.value);
                     fetchJurisdictionAsset(props.value);
                  }
               }
            }
         } else {
            setValue(props.value);
         }
      }
   }, [props.value]);

   useEffect(() => {
      const stepping = jurisdictionassets?.data?.stepping;
      if (stepping && !stepping.more) {
         if (isEqual(defaultQueryInput, queryInput)) {
            setAllowLocalSearch(true);
         }
      }
   }, [jurisdictionassets?.isLoading, jurisdictionassets?.data?.stepping]);

   const fetchJurisdictionAsset = (_id: string) => {
      const promise = dispatch(
         jurisdictionassetEndpoints.getJurisdictionAsset.initiate({
            jurisdiction_id : jurisdiction_id,
            input:  _id  
         }));

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
         newQuery.input.keyword = newValue;
         setQueryInput(newQuery);
      }
      return newValue;
   };

   const handleChange = (selected: SingleValue<IJurisdictionAssetOption>) => {
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
         isLoading={jurisdictionassets.isLoading}
         isMulti={false}
         isClearable={true}
         id={id}
         required={required}
         getOptionLabel={option => option.jurisdiction_id}
         getOptionValue={option => option._id}
         isDisabled={readOnly}
         placeholder={placeholder}
         noOptionsMessage={({ inputValue }) => (inputValue ? `No items matching: ${inputValue}` : 'No items found')}
         options={jurisdictionassets?.data?.items ? jurisdictionassets.data.items : []}
         className={classNames(className)}
      />
   );
}

export default JurisdictionAssetPicker;