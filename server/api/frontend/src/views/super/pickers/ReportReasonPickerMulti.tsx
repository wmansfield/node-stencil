import { useEffect, useState } from 'react';
import { MultiValue } from 'react-select';
import classNames from 'classnames';
import Select from '@/components/ui/Select';

type Option = {
   value: string;
   display: string;
};
type ReportReasonPickerMultiProps = {
   className?: string;
   id?: string;
   value?: string[];
   null_display?: string;
   readOnly?: boolean;
   loadOnDisplay?: boolean;
   placeholder?: string;
   required?: boolean;
   onChange?: (value: string[]) => void;
   onSelected?: (value: Option[]) => void;
};

function ReportReasonPickerMulti(props: ReportReasonPickerMultiProps) {
   const { className, id, loadOnDisplay = false, null_display, onChange, placeholder = 'Please Select', readOnly = false, required = false } = props;
   const [value, setValue] = useState<Option[] | undefined>();
   const [requiresFocus, setRequiresFocus] = useState<boolean>(() => !loadOnDisplay);

   const reportreasons: Option[] = [
      { value: '1', display: 'Inappropriate' },
      { value: '2', display: 'Harassment' },
      { value: '3', display: 'Spam' },
      { value: '4', display: 'Misinformation' },
      { value: '99', display: 'Other' },
   ];

   if (null_display && null_display.length > 0) {
      reportreasons.unshift({
         value: '',
         display: null_display
      });
   }

   useEffect(() => {
      if (props.value == value?.map(x => x.value)) {
         //value is the same, no need to update
         return;
      }
      if (props.value !== undefined) {
         setValue(props.value.map(x => ({ value: x, display: findOptionLabel(x) })));
      }
   }, [props.value]);

   const findOptionLabel = (value?: string): string => {
      return reportreasons.find(t => t.value === value)?.display ?? '';
   };

   const onFocus = () => {
      if (requiresFocus) {
         setRequiresFocus(false);
      }
   };

   const handleChange = (selected: MultiValue<Option>) => {
      setValue(selected ? [...selected] : undefined);
      if (onChange) {
         onChange(selected ? selected.map(x => x.value) : []);
      }
   };

   return (
      <Select
         value={value}
         onFocus={onFocus}
         onChange={handleChange}
         isLoading={false}
         isMulti={true}
         closeMenuOnSelect={false}
         isClearable={false}
         id={id}
         required={required}
         getOptionLabel={option => option.display}
         getOptionValue={option => option.value}
         isDisabled={readOnly}
         placeholder={placeholder}
         noOptionsMessage={({ inputValue }) => (inputValue ? `No items matching: ${inputValue}` : 'No items found')}
         options={reportreasons}
         className={classNames(className)}
      />
   );
}

export default ReportReasonPickerMulti;