import { useEffect, useState } from 'react';
import { SingleValue } from 'react-select';
import { cloneDeep, isEqual } from 'lodash';
import classNames from 'classnames';
import Select from '@/components/ui/Select';
import { useAppDispatch } from '@/store/rootStore';
import { IRoleOption } from '@/stencil/models/entities/role';
import { ListInputRole } from '@/stencil/models/entities/requests/list-input-role';
import { roleEndpoints, useGetRolesQuery } from '@/stencil/endpoints/entities/roleApi';

type RolePickerProps = {
   className?: string;
   id?: string;
   value?: string;
   value_display?: string;
   readOnly?: boolean;
   loadOnDisplay?: boolean;
   placeholder?: string;
   required?: boolean;
   onChange?: (value: string) => void;
   onSelected?: (value: IRoleOption) => void;

};
const defaultQueryInput: ListInputRole = {
   skip: 0,
   take: 50,
   order_by: 'role_name',
   keyword: '',
};

function RolePicker(props: RolePickerProps) {
   const dispatch = useAppDispatch();
   const { className, id, loadOnDisplay = false, onChange, placeholder = 'Please Select', readOnly = false, required = false } = props;
   const [value, setValue] = useState<IRoleOption | undefined>();
   const [requiresFocus, setRequiresFocus] = useState<boolean>(() => !loadOnDisplay);
   const [inputValue, setInputValue] = useState<string>('');
   const [lookedUpValue, setLookedUpValue] = useState<string>();
   const [allowLocalSearch, setAllowLocalSearch] = useState<boolean>(false);
   const [queryInput, setQueryInput] = useState<ListInputRole>({
      ...defaultQueryInput,
      keyword: inputValue,
   });

   let roles = useGetRolesQuery(queryInput, { refetchOnMountOrArgChange: true, skip: readOnly || requiresFocus });

   useEffect(() => {
      if (props.value == value?._id) {
         //value is the same, no need to update
         return;
      }
      if (props.value !== undefined) {
         if (typeof props.value === 'string') {
            if (props.value.length > 0){
               setValue({ _id: props.value, role_name: props.value_display ?? props.value });
               if (props.value) {
                  if (!lookedUpValue || props.value_display !== lookedUpValue) {
                     setLookedUpValue(props.value);
                     fetchRole(props.value);
                  }
               }
            }
         } else {
            setValue(props.value);
         }
      }
   }, [props.value]);

   useEffect(() => {
      const stepping = roles?.data?.stepping;
      if (stepping && !stepping.more) {
         if (isEqual(defaultQueryInput, queryInput)) {
            setAllowLocalSearch(true);
         }
      }
   }, [roles?.isLoading, roles?.data?.stepping]);

   const fetchRole = (_id: string) => {
      const promise = dispatch(
         roleEndpoints.getRole.initiate(_id));

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

   const handleChange = (selected: SingleValue<IRoleOption>) => {
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
         isLoading={roles.isLoading}
         isMulti={false}
         isClearable={true}
         id={id}
         required={required}
         getOptionLabel={option => option.role_name}
         getOptionValue={option => option._id}
         isDisabled={readOnly}
         placeholder={placeholder}
         noOptionsMessage={({ inputValue }) => (inputValue ? `No items matching: ${inputValue}` : 'No items found')}
         options={roles?.data?.items ? roles.data.items : []}
         className={classNames(className)}
      />
   );
}

export default RolePicker;