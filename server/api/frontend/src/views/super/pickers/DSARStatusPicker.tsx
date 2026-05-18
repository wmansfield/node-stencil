import { useEffect, useState } from 'react';
import { SingleValue } from 'react-select';
import classNames from 'classnames';
import Select from '@/components/ui/Select';

type Option = {
   value: string;
   display: string;
};
type DSARStatusPickerProps = {
   className?: string;
   id?: string;
   value?: string;
   null_display?: string;
   readOnly?: boolean;
   loadOnDisplay?: boolean;
   placeholder?: string;
   required?: boolean;
   onChange?: (value: string) => void;
   onSelected?: (value: Option) => void;
};

function DSARStatusPicker(props: DSARStatusPickerProps) {
   const { className, id, loadOnDisplay = false, null_display, onChange, placeholder = 'Please Select', readOnly = false, required = false } = props;
   const [value, setValue] = useState<Option | undefined>();
   const [requiresFocus, setRequiresFocus] = useState<boolean>(() => !loadOnDisplay);

   const dsarstatuss: Option[] = [
      { value: '0', display: 'Received' },
      { value: '1', display: 'Matched' },
      { value: '2', display: 'Verification Sent' },
      { value: '3', display: 'Verified' },
      { value: '4', display: 'Processing' },
      { value: '5', display: 'Completed' },
      { value: '6', display: 'Denied' },
      { value: '7', display: 'Unmatched' },
   ];

   if (null_display && null_display.length > 0) {
      dsarstatuss.unshift({
         value: '',
         display: null_display
      });
   }

   useEffect(() => {
      if (props.value == value?.value) {
         //value is the same, no need to update
         return;
      }
      if (props.value !== undefined) {
         setValue({ value: props.value, display: findOptionLabel(props.value)});
      }
   }, [props.value]);

   const findOptionLabel = (value?: string): string => {
      return dsarstatuss.find(t => t.value === value)?.display ?? '';
   };

   const onFocus = () => {
      if (requiresFocus) {
         setRequiresFocus(false);
      }
   };

   const handleChange = (selected: SingleValue<Option>) => {
      setValue(selected ?? undefined);
      if (onChange) {
         onChange(selected ? selected.value : '');
      }
   };

   return (
      <Select
         value={value}
         onFocus={onFocus}
         onChange={handleChange}
         isLoading={false}
         isMulti={false}
         isClearable={true}
         id={id}
         required={required}
         getOptionLabel={option => option.display}
         getOptionValue={option => option.value}
         isDisabled={readOnly}
         placeholder={placeholder}
         noOptionsMessage={({ inputValue }) => (inputValue ? `No items matching: ${inputValue}` : 'No items found')}
         options={dsarstatuss}
         className={classNames(className)}
      />
   );
}

export default DSARStatusPicker;