import { useEffect, useState } from 'react';
import { SingleValue } from 'react-select';
import { cloneDeep, isEqual } from 'lodash';
import classNames from 'classnames';
import Select from '@/components/ui/Select';
import { useAppDispatch } from '@/store/rootStore';
import { IWidgetOption } from '@/stencil/models/entities/widget';
import { ListInputWidget } from '@/stencil/models/entities/requests/list-input-widget';
import { widgetEndpoints, useGetWidgetsQuery } from '@/stencil/endpoints/entities/widgetApi';
import { RoutedInput } from '@/stencil/models/routed-input';

type WidgetPickerProps = {
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
   onSelected?: (value: IWidgetOption) => void;

};
const defaultQueryInput: ListInputWidget = {
   skip: 0,
   take: 50,
   order_by: 'title',
   keyword: '',
};

function WidgetPicker(props: WidgetPickerProps) {
   const dispatch = useAppDispatch();
   const { className, id, loadOnDisplay = false, onChange, placeholder = 'Please Select', readOnly = false, required = false, jurisdiction_id } = props;
   const [value, setValue] = useState<IWidgetOption | undefined>();
   const [requiresFocus, setRequiresFocus] = useState<boolean>(() => !loadOnDisplay);
   const [inputValue, setInputValue] = useState<string>('');
   const [lookedUpValue, setLookedUpValue] = useState<string>();
   const [allowLocalSearch, setAllowLocalSearch] = useState<boolean>(false);
   const [queryInput, setQueryInput] = useState<RoutedInput<ListInputWidget>>({
      jurisdiction_id: jurisdiction_id,
      input: {
         ...defaultQueryInput,
         keyword: inputValue,
      }
   });

   let widgets = useGetWidgetsQuery(queryInput, { refetchOnMountOrArgChange: true, skip: readOnly || requiresFocus });

   useEffect(() => {
      if (props.value == value?._id) {
         //value is the same, no need to update
         return;
      }
      if (props.value !== undefined) {
         if (typeof props.value === 'string') {
            if (props.value.length > 0){
               setValue({ _id: props.value, title: props.value_display ?? props.value });
               if (props.value) {
                  if (!lookedUpValue || props.value_display !== lookedUpValue) {
                     setLookedUpValue(props.value);
                     fetchWidget(props.value);
                  }
               }
            }
         } else {
            setValue(props.value);
         }
      }
   }, [props.value]);

   useEffect(() => {
      const stepping = widgets?.data?.stepping;
      if (stepping && !stepping.more) {
         if (isEqual(defaultQueryInput, queryInput)) {
            setAllowLocalSearch(true);
         }
      }
   }, [widgets?.isLoading, widgets?.data?.stepping]);

   const fetchWidget = (_id: string) => {
      const promise = dispatch(
         widgetEndpoints.getWidget.initiate({
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

   const handleChange = (selected: SingleValue<IWidgetOption>) => {
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
         isLoading={widgets.isLoading}
         isMulti={false}
         isClearable={true}
         id={id}
         required={required}
         getOptionLabel={option => option.title}
         getOptionValue={option => option._id}
         isDisabled={readOnly}
         placeholder={placeholder}
         noOptionsMessage={({ inputValue }) => (inputValue ? `No items matching: ${inputValue}` : 'No items found')}
         options={widgets?.data?.items ? widgets.data.items : []}
         className={classNames(className)}
      />
   );
}

export default WidgetPicker;