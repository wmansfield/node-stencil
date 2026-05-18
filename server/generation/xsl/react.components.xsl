<?xml version="1.0" encoding="UTF-8" ?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
<xsl:key name="foreignKeyKey" match="items/item/field[string-length(@foreignKey)>0]" use="concat(../@name, @foreignKey)" />
<xsl:variable name="security_route"><xsl:value-of select="items/@securityRoute"/></xsl:variable>
<xsl:template match="/">


<xsl:for-each select="items/item[not(@uiGenerate='false') and not(@classOnly='true')]">
  <xsl:variable name="project"><xsl:value-of select="../@projectName"/></xsl:variable>
  <xsl:variable name="project_lower"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="../@projectName"/></xsl:call-template></xsl:variable>
  <xsl:variable name="name"><xsl:value-of select="@name"/></xsl:variable>
  <xsl:variable name="unique_id"><xsl:value-of select="field[1]/text()"/></xsl:variable>
  <xsl:variable name="ui_name"><xsl:choose><xsl:when test="string-length(@uiName)>0"><xsl:value-of select="@uiName"/></xsl:when><xsl:otherwise><xsl:value-of select="$name"/></xsl:otherwise></xsl:choose></xsl:variable>
  <xsl:variable name="ui_name_plural"><xsl:call-template name="Pluralize"><xsl:with-param name="inputString" select="$ui_name"/></xsl:call-template></xsl:variable>
  <xsl:variable name="name_natural"><xsl:call-template name="breakIntoWords"><xsl:with-param name="string" select="@name"/></xsl:call-template></xsl:variable>
  <xsl:variable name="name_plural"><xsl:call-template name="Pluralize"><xsl:with-param name="inputString" select="@name"/></xsl:call-template></xsl:variable>
  <xsl:variable name="name_plural_lower"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="$name_plural"/></xsl:call-template></xsl:variable>
  <xsl:variable name="name_plural_natural"><xsl:call-template name="breakIntoWords"><xsl:with-param name="string" select="$name_plural"/></xsl:call-template></xsl:variable>
  <xsl:variable name="name_lower"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="@name"/></xsl:call-template></xsl:variable>
  <xsl:variable name="name_upper"><xsl:call-template name="ToUpper"><xsl:with-param name="inputString" select="@name"/></xsl:call-template></xsl:variable>
  <xsl:variable name="name_camel"><xsl:call-template name="FirstLower"><xsl:with-param name="inputString" select="@name"/></xsl:call-template></xsl:variable>
  <xsl:variable name="ui_display_field"><xsl:choose><xsl:when test="string-length(@uiDisplayField)>0"><xsl:value-of select="@uiDisplayField"/></xsl:when><xsl:when test="count(field[@idAlias='true'])>0"><xsl:value-of select="field[@idAlias='true'][1]/text()"/></xsl:when><xsl:when test="count(field[@type='string'])>0"><xsl:value-of select="field[@type='string'][1]/text()"/></xsl:when><xsl:otherwise><xsl:value-of select="$unique_id"/></xsl:otherwise></xsl:choose></xsl:variable>


'''[STARTFILE:<xsl:value-of select="../@frontendPrefix"/>\views\super\pickers\<xsl:value-of select="$name"/>Picker.tsx]
import { useEffect, useState } from 'react';
import { SingleValue } from 'react-select';
import { cloneDeep, isEqual } from 'lodash';
import classNames from 'classnames';
import Select from '@/components/ui/Select';
import { useAppDispatch } from '@/store/rootStore';
import { I<xsl:value-of select="$name"/>Option } from '@/<xsl:value-of select="$project_lower"/>/models/entities/<xsl:value-of select="$name_lower"/>';
import { ListInput<xsl:value-of select="$name"/> } from '@/<xsl:value-of select="$project_lower"/>/models/entities/requests/list-input-<xsl:value-of select="$name_lower"/>';
import { <xsl:value-of select="$name_lower"/>Endpoints, useGet<xsl:value-of select="$name_plural"/>Query } from '@/<xsl:value-of select="$project_lower"/>/endpoints/entities/<xsl:value-of select="$name_camel"/>Api';
<xsl:if test="@tenant='Isolated'">import { RoutedInput } from '@/<xsl:value-of select="$project_lower"/>/models/routed-input';
</xsl:if>
type <xsl:value-of select="$name"/>PickerProps = {<xsl:if test="@tenant='Isolated'"><xsl:text>
   </xsl:text><xsl:value-of select="$security_route"/>: string;</xsl:if>
   className?: string;
   id?: string;
   value?: string;
   value_display?: string;
   readOnly?: boolean;
   loadOnDisplay?: boolean;
   placeholder?: string;
   required?: boolean;
   onChange?: (value: string) =&gt; void;
   onSelected?: (value: I<xsl:value-of select="$name"/>Option) =&gt; void;<xsl:for-each select="field[@uiPickerRoute='true']"><xsl:text>
   </xsl:text><xsl:value-of select="text()"/>?: <xsl:call-template name="ReactType"><xsl:with-param name="type" select="@type"/></xsl:call-template>,</xsl:for-each><xsl:for-each select="field[@uiPickerFilter='true']"><xsl:text>
   /** When true, only shows items where </xsl:text><xsl:value-of select="text()"/>=true */<xsl:text>
   </xsl:text><xsl:value-of select="text()"/>Only?: boolean;</xsl:for-each>

};
const defaultQueryInput: ListInput<xsl:value-of select="$name"/> = {
   skip: 0,
   take: 50,
   order_by: '<xsl:value-of select="$ui_display_field"/>',
   keyword: '',
};

function <xsl:value-of select="$name"/>Picker(props: <xsl:value-of select="$name"/>PickerProps) {
   const dispatch = useAppDispatch();
   const { className, id, loadOnDisplay = false, onChange, placeholder = 'Please Select', readOnly = false, required = false<xsl:if test="@tenant='Isolated'">, <xsl:value-of select="$security_route"/></xsl:if><xsl:for-each select="field[@uiPickerRoute='true']">, <xsl:value-of select="text()"/></xsl:for-each><xsl:for-each select="field[@uiPickerFilter='true']">, <xsl:value-of select="text()"/>Only = false</xsl:for-each> } = props;
   const [value, setValue] = useState&lt;I<xsl:value-of select="$name"/>Option | undefined&gt;();
   const [requiresFocus, setRequiresFocus] = useState&lt;boolean&gt;(() =&gt; !loadOnDisplay);
   const [inputValue, setInputValue] = useState&lt;string&gt;('');
   const [lookedUpValue, setLookedUpValue] = useState&lt;string&gt;();
   const [allowLocalSearch, setAllowLocalSearch] = useState&lt;boolean&gt;(false);<xsl:choose>
   <xsl:when test="@tenant='Isolated'">
   const [queryInput, setQueryInput] = useState&lt;RoutedInput&lt;ListInput<xsl:value-of select="$name"/>&gt;&gt;({
      <xsl:value-of select="$security_route"/>: <xsl:value-of select="$security_route"/>,
      input: {
         ...defaultQueryInput,
         keyword: inputValue,<xsl:for-each select="field[@uiPickerRoute='true']"><xsl:text>
         </xsl:text><xsl:value-of select="text()"/>: <xsl:value-of select="text()"/>,</xsl:for-each><xsl:for-each select="field[@uiPickerFilter='true']"><xsl:text>
         </xsl:text><xsl:value-of select="text()"/>: <xsl:value-of select="text()"/>Only ? true : undefined,</xsl:for-each>
      }
   });</xsl:when>
   <xsl:otherwise>
   const [queryInput, setQueryInput] = useState&lt;ListInput<xsl:value-of select="$name"/>&gt;({
      ...defaultQueryInput,
      keyword: inputValue,<xsl:for-each select="field[@uiPickerRoute='true']"><xsl:text>
      </xsl:text><xsl:value-of select="text()"/>: <xsl:value-of select="text()"/>,</xsl:for-each><xsl:for-each select="field[@uiPickerFilter='true']"><xsl:text>
      </xsl:text><xsl:value-of select="text()"/>: <xsl:value-of select="text()"/>Only ? true : undefined,</xsl:for-each>
   });</xsl:otherwise></xsl:choose>

   let <xsl:value-of select="$name_plural_lower"/> = useGet<xsl:value-of select="$name_plural"/>Query(queryInput, { refetchOnMountOrArgChange: true, skip: readOnly || requiresFocus });

   useEffect(() =&gt; {
      if (props.value == value?.<xsl:value-of select="$unique_id"/>) {
         //value is the same, no need to update
         return;
      }
      if (props.value !== undefined) {
         if (typeof props.value === 'string') {
            if (props.value.length &gt; 0){
               setValue({ <xsl:value-of select="$unique_id"/>: props.value, <xsl:value-of select="$ui_display_field"/>: props.value_display ?? props.value });
               if (props.value) {
                  if (!lookedUpValue || props.value_display !== lookedUpValue) {
                     setLookedUpValue(props.value);
                     fetch<xsl:value-of select="$name"/>(props.value);
                  }
               }
            }
         } else {
            setValue(props.value);
         }
      }
   }, [props.value]);

   useEffect(() =&gt; {
      const stepping = <xsl:value-of select="$name_plural_lower"/>?.data?.stepping;
      if (stepping &amp;&amp; !stepping.more) {
         if (isEqual(defaultQueryInput, queryInput)) {
            setAllowLocalSearch(true);
         }
      }
   }, [<xsl:value-of select="$name_plural_lower"/>?.isLoading, <xsl:value-of select="$name_plural_lower"/>?.data?.stepping]);

   const fetch<xsl:value-of select="$name"/> = (<xsl:value-of select="$unique_id"/>: string) =&gt; {
      const promise = dispatch(
         <xsl:value-of select="$name_lower"/>Endpoints.get<xsl:value-of select="$name"/>.initiate(<xsl:choose>
         <xsl:when test="@tenant='Isolated'">{
            <xsl:value-of select="$security_route"/> : <xsl:value-of select="$security_route"/>,
            input:  <xsl:value-of select="$unique_id"/>  
         }</xsl:when>
   <xsl:otherwise><xsl:value-of select="$unique_id"/></xsl:otherwise>
   </xsl:choose>));

      promise.then(
         item =&gt; {
            if (item?.data?.item) {
               if (item.data.item.<xsl:value-of select="$unique_id"/> == value?.<xsl:value-of select="$unique_id"/> || item.data.item.<xsl:value-of select="$unique_id"/> == props.value) {
                  setValue(item.data.item);
               }
            }
            promise.unsubscribe();
         },
         error =&gt; {
            promise.unsubscribe();
         }
      );
   };

   const onFocus = () =&gt; {
      if (requiresFocus) {
         setRequiresFocus(false);
      }
   };

   const handleInputChange = (newValue: string) =&gt; {
      setInputValue(newValue);
      if (!allowLocalSearch) {
         const newQuery = cloneDeep(queryInput);
         <xsl:choose>
         <xsl:when test="@tenant='Isolated'">newQuery.input.keyword = newValue;</xsl:when>
         <xsl:otherwise>newQuery.keyword = newValue;</xsl:otherwise>
         </xsl:choose>
         setQueryInput(newQuery);
      }
      return newValue;
   };

   const handleChange = (selected: SingleValue&lt;I<xsl:value-of select="$name"/>Option&gt;) =&gt; {
      setValue(selected ?? undefined);
      if (onChange) {
         onChange(selected ? selected.<xsl:value-of select="$unique_id"/> : '');
         setInputValue('');
      }
   };

   return (
      &lt;Select
         value={value}
         onFocus={onFocus}
         onChange={handleChange}
         onInputChange={handleInputChange}
         isLoading={<xsl:value-of select="$name_plural_lower"/>.isLoading}
         isMulti={false}
         isClearable={true}
         id={id}
         required={required}
         getOptionLabel={option =&gt; option.<xsl:value-of select="$ui_display_field"/>}
         getOptionValue={option =&gt; option.<xsl:value-of select="$unique_id"/>}
         isDisabled={readOnly}
         placeholder={placeholder}
         noOptionsMessage={({ inputValue }) =&gt; (inputValue ? `No items matching: ${inputValue}` : 'No items found')}
         options={<xsl:value-of select="$name_plural_lower"/>?.data?.items ? <xsl:value-of select="$name_plural_lower"/>.data.items : []}
         className={classNames(className)}
      /&gt;
   );
}

export default <xsl:value-of select="$name"/>Picker;

'''[ENDFILE]

</xsl:for-each>



<xsl:for-each select="items/enum[not(@uiGenerate='false')]">
  <xsl:variable name="project"><xsl:value-of select="../@projectName"/></xsl:variable>
  <xsl:variable name="project_lower"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="../@projectName"/></xsl:call-template></xsl:variable>
  <xsl:variable name="name"><xsl:value-of select="@name"/></xsl:variable>
  <xsl:variable name="unique_id"><xsl:value-of select="field[1]/text()"/></xsl:variable>
  <xsl:variable name="ui_name"><xsl:choose><xsl:when test="string-length(@uiName)>0"><xsl:value-of select="@uiName"/></xsl:when><xsl:otherwise><xsl:value-of select="$name"/></xsl:otherwise></xsl:choose></xsl:variable>
  <xsl:variable name="ui_name_plural"><xsl:call-template name="Pluralize"><xsl:with-param name="inputString" select="$ui_name"/></xsl:call-template></xsl:variable>
  <xsl:variable name="name_natural"><xsl:call-template name="breakIntoWords"><xsl:with-param name="string" select="@name"/></xsl:call-template></xsl:variable>
  <xsl:variable name="name_plural"><xsl:call-template name="Pluralize"><xsl:with-param name="inputString" select="@name"/></xsl:call-template></xsl:variable>
  <xsl:variable name="name_plural_lower"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="$name_plural"/></xsl:call-template></xsl:variable>
  <xsl:variable name="name_plural_natural"><xsl:call-template name="breakIntoWords"><xsl:with-param name="string" select="$name_plural"/></xsl:call-template></xsl:variable>
  <xsl:variable name="name_lower"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="@name"/></xsl:call-template></xsl:variable>
  <xsl:variable name="name_upper"><xsl:call-template name="ToUpper"><xsl:with-param name="inputString" select="@name"/></xsl:call-template></xsl:variable>
  <xsl:variable name="ui_display_field"><xsl:choose><xsl:when test="string-length(@uiDisplayField)>0"><xsl:value-of select="@uiDisplayField"/></xsl:when><xsl:when test="count(field[@type='string'])>0"><xsl:value-of select="field[@type='string'][1]/text()"/></xsl:when><xsl:otherwise><xsl:value-of select="$unique_id"/></xsl:otherwise></xsl:choose></xsl:variable>


'''[STARTFILE:<xsl:value-of select="../@frontendPrefix"/>\views\super\pickers\<xsl:value-of select="$name"/>Picker.tsx]
import { useEffect, useState } from 'react';
import { SingleValue } from 'react-select';
import classNames from 'classnames';
import Select from '@/components/ui/Select';
<xsl:if test="@tenant='Isolated'">import { RoutedInput } from '@/<xsl:value-of select="$project_lower"/>/models/routed-input';
</xsl:if>
type Option = {
   value: string;
   display: string;
};
type <xsl:value-of select="$name"/>PickerProps = {<xsl:if test="@tenant='Isolated'"><xsl:text>
   </xsl:text><xsl:value-of select="$security_route"/>: string;</xsl:if>
   className?: string;
   id?: string;
   value?: string;
   null_display?: string;
   readOnly?: boolean;
   loadOnDisplay?: boolean;
   placeholder?: string;
   required?: boolean;
   onChange?: (value: string) =&gt; void;
   onSelected?: (value: Option) =&gt; void;
};

function <xsl:value-of select="$name"/>Picker(props: <xsl:value-of select="$name"/>PickerProps) {
   const { className, id, loadOnDisplay = false, null_display, onChange, placeholder = 'Please Select', readOnly = false, required = false<xsl:if test="@tenant='Isolated'">, <xsl:value-of select="$security_route"/></xsl:if> } = props;
   const [value, setValue] = useState&lt;Option | undefined&gt;();
   const [requiresFocus, setRequiresFocus] = useState&lt;boolean&gt;(() =&gt; !loadOnDisplay);

   const <xsl:value-of select="$name_plural_lower"/>: Option[] = [<xsl:choose>
		<xsl:when test="count(field[string-length(@sort)>0])>0">
		<xsl:for-each select="field"><xsl:sort select="@sort" data-type="text" order="ascending"/>
      { value: '<xsl:value-of select="@value"/>', display: <xsl:choose><xsl:when test="string-length(@friendlyName)>0">'<xsl:value-of select="@friendlyName"/>'</xsl:when><xsl:otherwise>'<xsl:value-of select="text()"/>'</xsl:otherwise></xsl:choose> },</xsl:for-each>
		</xsl:when>
		<xsl:otherwise>
		<xsl:for-each select="field">
      { value: '<xsl:value-of select="@value"/>', display: <xsl:choose><xsl:when test="string-length(@friendlyName)>0">'<xsl:value-of select="@friendlyName"/>'</xsl:when><xsl:otherwise>'<xsl:value-of select="text()"/>'</xsl:otherwise></xsl:choose> },</xsl:for-each>
		</xsl:otherwise></xsl:choose>
   ];

   if (null_display &amp;&amp; null_display.length &gt; 0) {
      <xsl:value-of select="$name_plural_lower"/>.unshift({
         value: '',
         display: null_display
      });
   }

   useEffect(() =&gt; {
      if (props.value == value?.value) {
         //value is the same, no need to update
         return;
      }
      if (props.value !== undefined) {
         setValue({ value: props.value, display: findOptionLabel(props.value)});
      }
   }, [props.value]);

   const findOptionLabel = (value?: string): string =&gt; {
      return <xsl:value-of select="$name_plural_lower"/>.find(t =&gt; t.value === value)?.display ?? '';
   };

   const onFocus = () =&gt; {
      if (requiresFocus) {
         setRequiresFocus(false);
      }
   };

   const handleChange = (selected: SingleValue&lt;Option&gt;) =&gt; {
      setValue(selected ?? undefined);
      if (onChange) {
         onChange(selected ? selected.value : '');
      }
   };

   return (
      &lt;Select
         value={value}
         onFocus={onFocus}
         onChange={handleChange}
         isLoading={false}
         isMulti={false}
         isClearable={true}
         id={id}
         required={required}
         getOptionLabel={option =&gt; option.display}
         getOptionValue={option =&gt; option.value}
         isDisabled={readOnly}
         placeholder={placeholder}
         noOptionsMessage={({ inputValue }) =&gt; (inputValue ? `No items matching: ${inputValue}` : 'No items found')}
         options={<xsl:value-of select="$name_plural_lower"/>}
         className={classNames(className)}
      /&gt;
   );
}

export default <xsl:value-of select="$name"/>Picker;

'''[ENDFILE]

'''[STARTFILE:<xsl:value-of select="../@frontendPrefix"/>\views\super\pickers\<xsl:value-of select="$name"/>PickerMulti.tsx]
import { useEffect, useState } from 'react';
import { MultiValue } from 'react-select';
import classNames from 'classnames';
import Select from '@/components/ui/Select';
<xsl:if test="@tenant='Isolated'">import { RoutedInput } from '@/<xsl:value-of select="$project_lower"/>/models/routed-input';
</xsl:if>
type Option = {
   value: string;
   display: string;
};
type <xsl:value-of select="$name"/>PickerMultiProps = {<xsl:if test="@tenant='Isolated'"><xsl:text>
   </xsl:text><xsl:value-of select="$security_route"/>: string;</xsl:if>
   className?: string;
   id?: string;
   value?: string[];
   null_display?: string;
   readOnly?: boolean;
   loadOnDisplay?: boolean;
   placeholder?: string;
   required?: boolean;
   onChange?: (value: string[]) =&gt; void;
   onSelected?: (value: Option[]) =&gt; void;
};

function <xsl:value-of select="$name"/>PickerMulti(props: <xsl:value-of select="$name"/>PickerMultiProps) {
   const { className, id, loadOnDisplay = false, null_display, onChange, placeholder = 'Please Select', readOnly = false, required = false<xsl:if test="@tenant='Isolated'">, <xsl:value-of select="$security_route"/></xsl:if> } = props;
   const [value, setValue] = useState&lt;Option[] | undefined&gt;();
   const [requiresFocus, setRequiresFocus] = useState&lt;boolean&gt;(() =&gt; !loadOnDisplay);

   const <xsl:value-of select="$name_plural_lower"/>: Option[] = [<xsl:choose>
		<xsl:when test="count(field[string-length(@sort)>0])>0">
		<xsl:for-each select="field"><xsl:sort select="@sort" data-type="text" order="ascending"/>
      { value: '<xsl:value-of select="@value"/>', display: <xsl:choose><xsl:when test="string-length(@friendlyName)>0">'<xsl:value-of select="@friendlyName"/>'</xsl:when><xsl:otherwise>'<xsl:value-of select="text()"/>'</xsl:otherwise></xsl:choose> },</xsl:for-each>
		</xsl:when>
		<xsl:otherwise>
		<xsl:for-each select="field">
      { value: '<xsl:value-of select="@value"/>', display: <xsl:choose><xsl:when test="string-length(@friendlyName)>0">'<xsl:value-of select="@friendlyName"/>'</xsl:when><xsl:otherwise>'<xsl:value-of select="text()"/>'</xsl:otherwise></xsl:choose> },</xsl:for-each>
		</xsl:otherwise></xsl:choose>
   ];

   if (null_display &amp;&amp; null_display.length &gt; 0) {
      <xsl:value-of select="$name_plural_lower"/>.unshift({
         value: '',
         display: null_display
      });
   }

   useEffect(() =&gt; {
      if (props.value == value?.map(x =&gt; x.value)) {
         //value is the same, no need to update
         return;
      }
      if (props.value !== undefined) {
         setValue(props.value.map(x =&gt; ({ value: x, display: findOptionLabel(x) })));
      }
   }, [props.value]);

   const findOptionLabel = (value?: string): string =&gt; {
      return <xsl:value-of select="$name_plural_lower"/>.find(t =&gt; t.value === value)?.display ?? '';
   };

   const onFocus = () =&gt; {
      if (requiresFocus) {
         setRequiresFocus(false);
      }
   };

   const handleChange = (selected: MultiValue&lt;Option&gt;) =&gt; {
      setValue(selected ? [...selected] : undefined);
      if (onChange) {
         onChange(selected ? selected.map(x =&gt; x.value) : []);
      }
   };

   return (
      &lt;Select
         value={value}
         onFocus={onFocus}
         onChange={handleChange}
         isLoading={false}
         isMulti={true}
         closeMenuOnSelect={false}
         isClearable={false}
         id={id}
         required={required}
         getOptionLabel={option =&gt; option.display}
         getOptionValue={option =&gt; option.value}
         isDisabled={readOnly}
         placeholder={placeholder}
         noOptionsMessage={({ inputValue }) =&gt; (inputValue ? `No items matching: ${inputValue}` : 'No items found')}
         options={<xsl:value-of select="$name_plural_lower"/>}
         className={classNames(className)}
      /&gt;
   );
}

export default <xsl:value-of select="$name"/>PickerMulti;

'''[ENDFILE]

</xsl:for-each>

</xsl:template>


<xsl:template name="ExtractParentDomain">
    <xsl:param name="text" />
    <xsl:call-template name="Replace">
        <xsl:with-param name="text">
		<xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="substring-before($text, '.')"/></xsl:call-template>
		</xsl:with-param>
        <xsl:with-param name="replace" select="'[]'" />
        <xsl:with-param name="by" select="''" />
    </xsl:call-template>
</xsl:template>
<xsl:template name="ReactType">
   <xsl:param name="type"/>
   <xsl:choose>
      <xsl:when test="contains($type,'.')">I<xsl:call-template name="Replace">
         <xsl:with-param name="text" select="$type" />
         <xsl:with-param name="replace" select="'.'" />
         <xsl:with-param name="by" select="'_'" />
         </xsl:call-template>
      </xsl:when>
      <xsl:when test="$type='Uuid'">string</xsl:when>
      <xsl:when test="$type='Uuid[]'">string[]</xsl:when>
      <xsl:when test="$type='int'">number</xsl:when>
      <xsl:when test="$type='decimal'">number</xsl:when>
      <xsl:when test="$type='int[]'">number[]</xsl:when>
      <xsl:otherwise><xsl:value-of select="$type"/></xsl:otherwise>
   </xsl:choose>
</xsl:template>

<xsl:template name="ExtractArrayType">
    <xsl:param name="text" />
    <xsl:call-template name="Replace">
        <xsl:with-param name="text" select="$text" />
        <xsl:with-param name="replace" select="'[]'" />
        <xsl:with-param name="by" select="''" />
    </xsl:call-template>
</xsl:template>

 <xsl:template name="Pluralize">
   <xsl:param name="inputString"/>
   <xsl:choose>
      <xsl:when test="substring($inputString, string-length($inputString)) = 'x'"><xsl:value-of select="$inputString"/>es</xsl:when>
      <xsl:when test="substring($inputString, string-length($inputString)-1) = 'ch'"><xsl:value-of select="$inputString"/>es</xsl:when>
      <xsl:when test="substring($inputString, string-length($inputString)) = 'y'"><xsl:value-of select="concat(substring($inputString, 1, string-length($inputString)-1),'ies')"/></xsl:when>
      <xsl:otherwise><xsl:value-of select="$inputString"/>s</xsl:otherwise>
   </xsl:choose>
</xsl:template>

<xsl:template name="breakIntoWords">
  <xsl:param name="string" />
  <xsl:call-template name="expandCamelCase">
	<xsl:with-param name="string">
	  <xsl:call-template name="Replace">
		<xsl:with-param name="text" select="$string" />
		<xsl:with-param name="replace" select="' '" />
		<xsl:with-param name="by" select="''" />
	  </xsl:call-template>
	</xsl:with-param>
  </xsl:call-template>
</xsl:template>

<xsl:template name="breakIntoWordsHelper">
  <xsl:param name="string" select="''" />
  <xsl:param name="token" select="''" />
  <xsl:choose>
    <xsl:when test="string-length($string) = 0" />
    <xsl:when test="string-length($token) = 0" />
    <xsl:when test="string-length($string) = string-length($token)">
      <xsl:value-of select="$token" />
    </xsl:when>
    <xsl:when test="contains('ABCDEFGHIJKLMNOPQRSTUVWXYZ',substring($string, string-length($token) + 1, 1)) and contains('ABCDEFGHIJKLMNOPQRSTUVWXYZ',substring($string, string-length($token) + 2, 1))">
      <xsl:choose><xsl:when test="string-length($token)=1"><xsl:value-of select="$token" /></xsl:when><xsl:otherwise><xsl:value-of select="concat($token, ' ')" /></xsl:otherwise></xsl:choose>
      <xsl:call-template name="breakIntoWordsHelper">
        <xsl:with-param name="string" select="substring-after($string, $token)" />
        <xsl:with-param name="token" select="substring($string, string-length($token) + 1, 1)" />
      </xsl:call-template>
    </xsl:when>
    <xsl:when test="contains('ABCDEFGHIJKLMNOPQRSTUVWXYZ',substring($string, string-length($token) + 1, 1))">
      <xsl:value-of select="concat($token, ' ')" />
      <xsl:call-template name="breakIntoWordsHelper">
        <xsl:with-param name="string" select="substring-after($string, $token)" />
        <xsl:with-param name="token" select="substring($string, string-length($token), 1)" />
      </xsl:call-template>
    </xsl:when>
    <xsl:otherwise>
      <xsl:call-template name="breakIntoWordsHelper">
        <xsl:with-param name="string" select="$string" />
        <xsl:with-param name="token" select="substring($string, 1, string-length($token) + 1)" />
      </xsl:call-template>
    </xsl:otherwise>
  </xsl:choose>
</xsl:template>

<xsl:template name="ToUpper">
   <xsl:param name="inputString"/>
   <xsl:variable name="smallCase" select="'abcdefghijklmnopqrstuvwxyz'"/>
   <xsl:variable name="upperCase" select="'ABCDEFGHIJKLMNOPQRSTUVWXYZ'"/>
   <xsl:value-of select="translate($inputString,$smallCase,$upperCase)"/>
</xsl:template>

<xsl:template name="ToLower">
   <xsl:param name="inputString"/>
   <xsl:variable name="smallCase" select="'abcdefghijklmnopqrstuvwxyz'"/>
   <xsl:variable name="upperCase" select="'ABCDEFGHIJKLMNOPQRSTUVWXYZ'"/>
   <xsl:value-of select="translate($inputString,$upperCase,$smallCase)"/>
</xsl:template>

<xsl:template name="Replace">
    <xsl:param name="text" />
    <xsl:param name="replace" />
    <xsl:param name="by" />
    <xsl:choose>
        <xsl:when test="contains($text, $replace)">
        <xsl:value-of select="substring-before($text,$replace)" />
        <xsl:value-of select="$by" />
        <xsl:call-template name="Replace">
            <xsl:with-param name="text" select="substring-after($text,$replace)" />
            <xsl:with-param name="replace" select="$replace" />
            <xsl:with-param name="by" select="$by" />
        </xsl:call-template>
        </xsl:when>
        <xsl:otherwise>
        <xsl:value-of select="$text" />
        </xsl:otherwise>
    </xsl:choose>
</xsl:template>

<xsl:template name="expandCamelCase">
  <xsl:param name="string" />
  <xsl:choose>
    <xsl:when test="string-length($string) &lt; 2">
      <xsl:value-of select="$string" />
    </xsl:when>
    <xsl:otherwise>
      <xsl:call-template name="breakIntoWordsHelper">
        <xsl:with-param name="string" select="$string" />
        <xsl:with-param name="token" select="substring($string, 1, 1)" />
      </xsl:call-template>
    </xsl:otherwise>
  </xsl:choose>
</xsl:template>
<xsl:template name="FirstLower">
   <xsl:param name="inputString"/>
   <xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="substring($inputString,1,1)"/></xsl:call-template><xsl:value-of select="substring($inputString,2,string-length($inputString)-1)"/>
</xsl:template>
</xsl:stylesheet>