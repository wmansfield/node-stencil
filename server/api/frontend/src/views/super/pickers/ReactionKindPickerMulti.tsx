import { useEffect, useState } from 'react';
import { MultiValue } from 'react-select';
import classNames from 'classnames';
import Select from '@/components/ui/Select';

type Option = {
   value: string;
   display: string;
};
type ReactionKindPickerMultiProps = {
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

function ReactionKindPickerMulti(props: ReactionKindPickerMultiProps) {
   const { className, id, loadOnDisplay = false, null_display, onChange, placeholder = 'Please Select', readOnly = false, required = false } = props;
   const [value, setValue] = useState<Option[] | undefined>();
   const [requiresFocus, setRequiresFocus] = useState<boolean>(() => !loadOnDisplay);

   const reactionkinds: Option[] = [
      { value: '0', display: 'none' },
      { value: '1', display: 'like' },
      { value: '2', display: 'love' },
      { value: '3', display: 'joy' },
      { value: '4', display: 'wow' },
      { value: '5', display: 'sad' },
      { value: '6', display: 'angry' },
      { value: '7', display: 'applause' },
      { value: '8', display: 'thinking' },
      { value: '9', display: 'fire' },
      { value: '10', display: 'mindblown' },
   ];

   if (null_display && null_display.length > 0) {
      reactionkinds.unshift({
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
      return reactionkinds.find(t => t.value === value)?.display ?? '';
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
         options={reactionkinds}
         className={classNames(className)}
      />
   );
}

export default ReactionKindPickerMulti;