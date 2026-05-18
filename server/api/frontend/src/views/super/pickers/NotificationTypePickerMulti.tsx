import { useEffect, useState } from 'react';
import { MultiValue } from 'react-select';
import classNames from 'classnames';
import Select from '@/components/ui/Select';

type Option = {
   value: string;
   display: string;
};
type NotificationTypePickerMultiProps = {
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

function NotificationTypePickerMulti(props: NotificationTypePickerMultiProps) {
   const { className, id, loadOnDisplay = false, null_display, onChange, placeholder = 'Please Select', readOnly = false, required = false } = props;
   const [value, setValue] = useState<Option[] | undefined>();
   const [requiresFocus, setRequiresFocus] = useState<boolean>(() => !loadOnDisplay);

   const notificationtypes: Option[] = [
      { value: '0', display: 'Device Detected' },
      { value: '1', display: 'Invite Accepted' },
      { value: '2', display: 'Message Received' },
      { value: '3', display: 'Friend Re-keyed' },
      { value: '4', display: 'Connection Requested' },
      { value: '5', display: 'Connection Accepted' },
      { value: '6', display: 'Item Unveiled' },
      { value: '7', display: 'Comment Added' },
      { value: '8', display: 'Comment Reply' },
      { value: '9', display: 'Comment Reaction' },
      { value: '10', display: 'Connection Removed' },
      { value: '11', display: 'Handle Changed' },
      { value: '12', display: 'Message Reaction' },
      { value: '13', display: 'Reveal Requested' },
      { value: '14', display: 'Reveal Request Accepted' },
      { value: '15', display: 'Reveal Request Declined' },
      { value: '16', display: 'Reveal Request Responded' },
      { value: '17', display: 'Comment Mention' },
      { value: '18', display: 'Prediction Shared' },
      { value: '19', display: 'Reveal Shared' },
      { value: '20', display: 'Guardian Link' },
   ];

   if (null_display && null_display.length > 0) {
      notificationtypes.unshift({
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
      return notificationtypes.find(t => t.value === value)?.display ?? '';
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
         options={notificationtypes}
         className={classNames(className)}
      />
   );
}

export default NotificationTypePickerMulti;