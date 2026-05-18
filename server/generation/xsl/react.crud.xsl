<?xml version="1.0" encoding="UTF-8" ?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
<xsl:key name="foreignKeyKey" match="items/item/field[string-length(@foreignKey)>0]" use="concat(../@name, @foreignKey)" />
<xsl:key name="isEnumKey" match="items/item/field[@isEnum='true']" use="concat(../@name, @type)" />
<xsl:variable name="security_entity"><xsl:value-of select="items/@securityEntity"/></xsl:variable>
<xsl:variable name="security_route"><xsl:value-of select="items/@securityRoute"/></xsl:variable>

<xsl:template match="/">

'''[STARTFILE:<xsl:value-of select="items/@frontendPrefix"/>configs\navigation.config\super-crud.ts]import { NAV_ITEM_TYPE_ITEM } from '@/constants/navigation.constant';
import type { NavigationTree } from '@/@types/navigation';

const superCrudConfig: NavigationTree[] = [<xsl:for-each select="items/item[not(@classOnly='true') and not(@tenant='Isolated') and count(field[@uiParent='true'])=0]"><xsl:sort select="@name" data-type="text" order="ascending"/>
<xsl:variable name="name_lowered"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="@name"/></xsl:call-template></xsl:variable>
<xsl:variable name="name"><xsl:value-of select="@name"/></xsl:variable>
<xsl:variable name="name_friendly_plural"><xsl:call-template name="Pluralize"><xsl:with-param name="inputString" select="@friendlyName"/></xsl:call-template></xsl:variable>
   {
      key: 'super<xsl:value-of select="$name"/>',
      path: '/super/<xsl:value-of select="$name_lowered"/>',
      title: '<xsl:value-of select="$name_friendly_plural"/>',
      translateKey: 'super.<xsl:value-of select="$name_lowered"/>',
      icon: 'settings',
      type: NAV_ITEM_TYPE_ITEM,
      authority: [],
      subMenu: [],
   },</xsl:for-each>
];

export default superCrudConfig;


'''[ENDFILE]


'''[STARTFILE:<xsl:value-of select="items/@frontendPrefix"/>configs\routes.config\super-crud.routes.ts]
<xsl:variable name="route_entity"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="items/item[@tenant='Route']/@name"/></xsl:call-template></xsl:variable>
<xsl:variable name="route_id"><xsl:choose><xsl:when test="count(items/item[@tenant='Route']/field[@idAlias='true'])>0"><xsl:value-of select="items/item[@tenant='Route']/field[@idAlias='true'][1]/text()"/></xsl:when><xsl:otherwise><xsl:value-of select="items/item[@tenant='Route']/field[1]/text()"/></xsl:otherwise></xsl:choose></xsl:variable>
import { lazy } from 'react';
import type { Routes } from '@/@types/routes';

const superCrudRoutes: Routes = [<xsl:for-each select="items/item[not(@classOnly='true') and not(@tenant='Isolated')]"><xsl:sort select="@name" data-type="text" order="ascending"/>
<xsl:variable name="name_lowered"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="@name"/></xsl:call-template></xsl:variable>
<xsl:variable name="primary_field"><xsl:choose><xsl:when test="count(field[@idAlias='true'])>0"><xsl:value-of select="field[@idAlias='true'][1]/text()"/></xsl:when><xsl:otherwise><xsl:value-of select="field[1]/text()"/></xsl:otherwise></xsl:choose></xsl:variable>
<xsl:variable name="name"><xsl:value-of select="@name"/></xsl:variable>{
      key: 'super<xsl:value-of select="$name"/>',
      path: 'super/<xsl:value-of select="$name_lowered"/>',
      component: lazy(() =&gt; import('@/views/super/crud/<xsl:value-of select="$name_lowered"/>/<xsl:value-of select="$name"/>List')),
      authority: [],
   },
   <xsl:if test="@uiDetail='true' or @tenant='Route'">{
      key: 'super<xsl:value-of select="$name"/>Detail',
      path: 'super/<xsl:value-of select="$name_lowered"/>/:<xsl:value-of select="$primary_field"/>',
      component: lazy(() =&gt; import('@/views/super/crud/<xsl:value-of select="$name_lowered"/>/<xsl:value-of select="$name"/>Detail')),
      authority: [],
   },
   </xsl:if>
</xsl:for-each><xsl:for-each select="items/item[not(@classOnly='true') and @tenant='Isolated']"><xsl:sort select="@name" data-type="text" order="ascending"/>
<xsl:variable name="name_lowered"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="@name"/></xsl:call-template></xsl:variable>
<xsl:variable name="primary_field"><xsl:choose><xsl:when test="count(field[@idAlias='true'])>0"><xsl:value-of select="field[@idAlias='true'][1]/text()"/></xsl:when><xsl:otherwise><xsl:value-of select="field[1]/text()"/></xsl:otherwise></xsl:choose></xsl:variable>
<xsl:variable name="name"><xsl:value-of select="@name"/></xsl:variable>{
      key: 'super<xsl:value-of select="$name"/>',
      path: 'super/<xsl:value-of select="$route_entity"/>/:<xsl:value-of select="$route_id"/>/<xsl:value-of select="$name_lowered"/>',
      component: lazy(() =&gt; import('@/views/super/crud/<xsl:value-of select="$name_lowered"/>/<xsl:value-of select="$name"/>List')),
      authority: [],
   },
   <xsl:if test="@uiDetail='true' or @tenant='Route'">{
      key: 'super<xsl:value-of select="$name"/>Detail',
      path: 'super/<xsl:value-of select="$route_entity"/>/:<xsl:value-of select="$route_id"/>/<xsl:value-of select="$name_lowered"/>/:<xsl:value-of select="$primary_field"/>',
      component: lazy(() =&gt; import('@/views/super/crud/<xsl:value-of select="$name_lowered"/>/<xsl:value-of select="$name"/>Detail')),
      authority: [],
   },
   </xsl:if>
</xsl:for-each>
];

export default superCrudRoutes;


'''[ENDFILE]



<xsl:for-each select="items/item[@uiNestedComponent='true']">
  <xsl:variable name="project"><xsl:value-of select="../@projectName"/></xsl:variable>
  <xsl:variable name="project_lower"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="../@projectName"/></xsl:call-template></xsl:variable>
  <xsl:variable name="name"><xsl:value-of select="@name"/></xsl:variable>
  <xsl:variable name="ui_name"><xsl:choose><xsl:when test="string-length(@uiName)>0"><xsl:value-of select="@uiName"/></xsl:when><xsl:otherwise><xsl:value-of select="$name"/></xsl:otherwise></xsl:choose></xsl:variable>
  <xsl:variable name="ui_name_plural"><xsl:call-template name="Pluralize"><xsl:with-param name="inputString" select="$ui_name"/></xsl:call-template></xsl:variable>
  <xsl:variable name="name_friendly"><xsl:value-of select="@friendlyName"/></xsl:variable>
  <xsl:variable name="name_friendly_plural"><xsl:call-template name="Pluralize"><xsl:with-param name="inputString" select="@friendlyName"/></xsl:call-template></xsl:variable>
  <xsl:variable name="name_plural"><xsl:call-template name="Pluralize"><xsl:with-param name="inputString" select="@name"/></xsl:call-template></xsl:variable>
  <xsl:variable name="name_plural_lower"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="$name_plural"/></xsl:call-template></xsl:variable>
  <xsl:variable name="name_lower"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="@name"/></xsl:call-template></xsl:variable>
  <xsl:variable name="name_upper"><xsl:call-template name="ToUpper"><xsl:with-param name="inputString" select="@name"/></xsl:call-template></xsl:variable>
  <xsl:variable name="name_camel"><xsl:call-template name="FirstLower"><xsl:with-param name="inputString" select="@name"/></xsl:call-template></xsl:variable>
  <xsl:variable name="uiDisplayField"><xsl:choose><xsl:when test="string-length(@uiDisplayField)>0"><xsl:value-of select="@uiDisplayField"/></xsl:when><xsl:when test="count(field[@type='string'])>0"><xsl:value-of select="field[@type='string'][1]/text()"/></xsl:when><xsl:otherwise><xsl:value-of select="field[1]/text()"/></xsl:otherwise></xsl:choose></xsl:variable>



'''[STARTFILE:<xsl:value-of select="../@frontendPrefix"/>\views\super\crud\<xsl:value-of select="$name_lower"/>\<xsl:value-of select="$name"/>ListEditor.tsx]
import <xsl:value-of select="$name"/>, { I<xsl:value-of select="$name"/> } from '@/<xsl:value-of select="$project_lower"/>/models/entities/<xsl:value-of select="$name_lower"/>';
import <xsl:value-of select="$name"/>Editor from './<xsl:value-of select="$name"/>Editor';
import ArrayEditor from '../ArrayEditor';
import { Controller, useFormContext } from 'react-hook-form';

type <xsl:value-of select="$name"/>ListEditorProps = {
   className?: string;
   name: string;
   label?: string;
   maxItems?: number;
   minItems?: number;
};

function <xsl:value-of select="$name"/>ListEditor(props: <xsl:value-of select="$name"/>ListEditorProps) {
   const { className, name, label, maxItems, minItems } = props;

   const { control, trigger } = useFormContext();

   return (
      &lt;Controller
         name={name}
         control={control}
         render={({ field }) =&gt; (
            &lt;ArrayEditor
               className={className}
               value={field.value}
               name={name}
               headerLabel=''
               itemLabel={label}
               minItems={minItems}
               maxItems={maxItems}
               createNewItem={() =&gt; <xsl:value-of select="$name"/>()}
               renderItem={(index) =&gt; &lt;<xsl:value-of select="$name"/>Editor name={`${name}.${index}`} className="bg-white" /&gt;}
               onChange={newValue =&gt; {
                  field.onChange(newValue);
                  trigger(name);
               }}
            /&gt;
         )}
      /&gt;
   );
}

export default <xsl:value-of select="$name"/>ListEditor;


'''[ENDFILE]


'''[STARTFILE:<xsl:value-of select="../@frontendPrefix"/>\views\super\crud\<xsl:value-of select="$name_lower"/>\<xsl:value-of select="$name"/>Editor.tsx]
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, useFormContext, useForm } from 'react-hook-form';
import _ from 'lodash';
import { z } from 'zod';
import <xsl:value-of select="$name"/>, { I<xsl:value-of select="$name"/> } from '@/<xsl:value-of select="$project_lower"/>/models/entities/<xsl:value-of select="$name_lower"/>';
import { closeModal, openModal } from '@/components/ui/Dialog/modalSlice';
import { useAppDispatch } from '@/store/rootStore';
import { Button, Card, Checkbox, DatePicker, Dialog, Form, FormItem, Input } from '@/components/ui';
import NullableCheckbox from '@/views/super/common/NullableCheckbox';
import NestedEditor from '../NestedEditor';

<xsl:for-each select="field[string-length(@foreignKey)>0 and generate-id()=generate-id(key('foreignKeyKey',concat(../@name, @foreignKey))[1])]">
<xsl:variable name="fk_plural"><xsl:call-template name="Pluralize"><xsl:with-param name="inputString" select="@foreignKey"/></xsl:call-template></xsl:variable>
<xsl:variable name="fk_plural_lower"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="$fk_plural"/></xsl:call-template></xsl:variable>
import <xsl:value-of select="@foreignKey"/>Picker from '@/views/super/pickers/<xsl:value-of select="@foreignKey"/>Picker';</xsl:for-each>
<xsl:for-each select="field[@isEnum='true' and generate-id()=generate-id(key('isEnumKey',concat(../@name, @type))[1])]">
<xsl:variable name="enum_type"><xsl:call-template name="ExtractArrayType"><xsl:with-param name="text" select="@type"/></xsl:call-template></xsl:variable>
<xsl:variable name="enum_type_lower"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="$enum_type"/></xsl:call-template></xsl:variable>
<xsl:variable name="enum_plural"><xsl:call-template name="Pluralize"><xsl:with-param name="inputString" select="$enum_type"/></xsl:call-template></xsl:variable>
<xsl:variable name="enum_plural_lower"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="$enum_plural"/></xsl:call-template></xsl:variable>
import { <xsl:value-of select="$enum_type"/> } from '@/<xsl:value-of select="$project_lower"/>/models/entities/<xsl:value-of select="$enum_type_lower"/>';
import <xsl:value-of select="$enum_type"/>Picker<xsl:if test="contains(@type,'[]')">Multi</xsl:if> from '@/views/super/pickers/<xsl:value-of select="$enum_type"/>Picker<xsl:if test="contains(@type,'[]')">Multi</xsl:if>';</xsl:for-each>
import classNames from '@/utils/classNames';
<xsl:if test="count(field[@type='string[]'])>0">
import StringArrayEditor from '../StringArrayEditor';</xsl:if>

<xsl:variable name="selfparent" select="@name"/>
<xsl:for-each select="../item[@uiNestedComponent='true']">
<xsl:variable name="childtype" select="@name"/>
<xsl:variable name="childtypeArray"><xsl:value-of select="$childtype"/>[]</xsl:variable>

<xsl:if test="count(../item[@name=$selfparent]/field[@type=$childtype or @type=$childtypeArray])>0">
<xsl:if test="$selfparent != $childtype">
import <xsl:value-of select="$childtype"/> from '@/<xsl:value-of select="$project_lower"/>/models/entities/<xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="$childtype"/></xsl:call-template>';
import <xsl:value-of select="$childtype"/>Editor, { <xsl:call-template name="FirstLower"><xsl:with-param name="inputString" select="$childtype"/></xsl:call-template>Schema } from '../<xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="$childtype"/></xsl:call-template>/<xsl:value-of select="$childtype"/>Editor';
</xsl:if>
import <xsl:value-of select="$childtype"/>ListEditor from '../<xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="$childtype"/></xsl:call-template>/<xsl:value-of select="$childtype"/>ListEditor';
</xsl:if>
</xsl:for-each>

export const <xsl:value-of select="$name_camel"/>Schema: z.ZodTypeAny = z.lazy(() =&gt;
   z.object({
   <xsl:for-each select="field[string-length(@calculated)=0 and not(contains(@type,'.'))]"><xsl:if test="position()>1">,
   </xsl:if><xsl:value-of select="text()"/>: <xsl:choose>
         <xsl:when test="@isEnum='true' and contains(@type,'[]')">z.coerce.number().array()</xsl:when>
         <xsl:when test="@type='string[]'">z.string().array()</xsl:when>
         <xsl:when test="@isEnum='true'">z.enum(<xsl:value-of select="@type"/>)</xsl:when>
         <xsl:when test="@type='boolean'">z.boolean()</xsl:when>
         <xsl:when test="@type='Date'">z.string()</xsl:when>
         <xsl:when test="@type='decimal'">z.string()</xsl:when>
         <xsl:when test="@type='int'">z.number()</xsl:when>
         <xsl:when test="@isClass='true' and contains(@type,'[]')">z.array(<xsl:call-template name="FirstLower"><xsl:with-param name="inputString"><xsl:call-template name="ExtractArrayType"><xsl:with-param name="text" select="@type"/></xsl:call-template></xsl:with-param></xsl:call-template>Schema)</xsl:when>
         <xsl:when test="@isClass='true'"><xsl:call-template name="FirstLower"><xsl:with-param name="inputString" select="@type"/></xsl:call-template>Schema</xsl:when>
         <xsl:otherwise>z.string()</xsl:otherwise>
      </xsl:choose><xsl:if test="@validate='email'">.email('Must be a valid email')</xsl:if><xsl:if test="string-length(@maxLength)>0 and @maxLength!='none'">.max(<xsl:value-of select="@maxLength"/>, 'Cannot be more than <xsl:value-of select="@maxLength"/> characters.')</xsl:if><xsl:if test="@isNullable='true' or @uiHidden='true'">.optional()</xsl:if></xsl:for-each>
   })
);

type <xsl:value-of select="$name"/>EditorProps = {
	className?: string;
   name: string;
};


function <xsl:value-of select="$name"/>Editor(props: <xsl:value-of select="$name"/>EditorProps) {
   const { className, name } = props;

	const { control, formState: { errors }, setValue, trigger } = useFormContext();

	const { t } = useTranslation();

   // Set default values if not already set
   useEffect(() =&gt; {
      const currentValue = control._getWatch(name) as I<xsl:value-of select="$name"/>;

      const needsDefaults = !currentValue<xsl:for-each select="field[not(@isNullable='true')]"><xsl:choose>
			<xsl:when test="contains(@type, '[]')"> || currentValue.<xsl:value-of select="text()"/> === undefined</xsl:when>
			<xsl:when test="@isEnum='true'"> || currentValue.<xsl:value-of select="text()"/> === undefined</xsl:when>
			<xsl:when test="@type='decimal'"> || currentValue.<xsl:value-of select="text()"/> === undefined</xsl:when>
			<xsl:when test="@type='int'"> || currentValue.<xsl:value-of select="text()"/> === undefined</xsl:when>
			<xsl:when test="@type='boolean'"> || currentValue.<xsl:value-of select="text()"/> === undefined</xsl:when>
			<xsl:when test="@type='string'"> || currentValue.<xsl:value-of select="text()"/> === undefined</xsl:when></xsl:choose>
      </xsl:for-each>;

      if (needsDefaults) {
         <xsl:for-each select="field[not(@isNullable='true')]">
         <xsl:choose>
			<xsl:when test="contains(@type, '[]')">setValue(`${name}.<xsl:value-of select="text()"/>`, []);
         </xsl:when>
			<xsl:when test="@isEnum='true'">setValue(`${name}.<xsl:value-of select="text()"/>`, 0 as <xsl:value-of select="@type"/>);
         </xsl:when>
         <xsl:when test="@type='decimal'">setValue(`${name}.<xsl:value-of select="text()"/>`, '0');
         </xsl:when>
			<xsl:when test="@type='int'">setValue(`${name}.<xsl:value-of select="text()"/>`, 0);
         </xsl:when>
			<xsl:when test="@type='boolean'">setValue(`${name}.<xsl:value-of select="text()"/>`, false);
         </xsl:when>
			<xsl:when test="@type='string'">setValue(`${name}.<xsl:value-of select="text()"/>`, '');
         </xsl:when></xsl:choose></xsl:for-each>
      }
   }, [name, setValue, control]);

	return (
		&lt;Card 
         className={classNames('', className)}&gt;
         &lt;div className='flex flex-col p-2 sm:p-0' &gt;
            <xsl:for-each select="field[string-length(@calculated)=0 and not(@uiHidden='true') and not(@tenant='true') and not(@uiParent='true') and not(contains(@type,'.'))]"><xsl:sort select="@uiOrder" data-type="number" order="ascending"/>
            <xsl:variable name="type" select="@type"/>
            <xsl:variable name="type_base"><xsl:call-template name="ExtractArrayType"><xsl:with-param name="text" select="@type"/></xsl:call-template></xsl:variable>
            &lt;FormItem
               label="<xsl:call-template name="breakIntoWords"><xsl:with-param name="string" select="@friendlyName"/></xsl:call-template>"
               invalid={Boolean(errors[`${name}.<xsl:value-of select="text()"/>`])}
               errorMessage={errors[`${name}.<xsl:value-of select="text()"/>`]?.message as string}
               &gt;
                  <xsl:choose>
                  <xsl:when test="@isNullable='false' and count(../../item[@name=$type and @uiNestedComponent='true'])>0">
                     &lt;<xsl:value-of select="$type"/>Editor
                        name={`${name}.<xsl:value-of select="text()"/>`}
                        className="mb-4"
                     /&gt;
                  </xsl:when>
                  <xsl:when test="@isNullable='true' and count(../../item[@name=$type and @uiNestedComponent='true'])>0">
                  &lt;Controller
                        name={`${name}.<xsl:value-of select="text()"/>`}
                        control={control}
                        render={({ field }) =&gt; (
                           &lt;NestedEditor
                              className={className}
                              value={field.value}
                              label="<xsl:call-template name="breakIntoWords"><xsl:with-param name="string" select="@friendlyName"/></xsl:call-template>"
                              createNewItem={() =&gt; <xsl:value-of select="$type"/>()}
                              renderItem={() =&gt; &lt;<xsl:value-of select="$type"/>Editor name={`${name}.<xsl:value-of select="text()"/>`} className="mb-4" /&gt;}
                              onChange={newValue =&gt; {
                                 field.onChange(newValue);
                                 trigger(`${name}.<xsl:value-of select="text()"/>`);
                              }}
                              itemLabel={''}
                           /&gt;
                        )}
                     /&gt;
                  </xsl:when>
                  <xsl:when test="count(../../item[@name=$type_base and @uiNestedComponent='true'])>0">
                     &lt;<xsl:value-of select="$type_base"/>ListEditor
                        name={`${name}.<xsl:value-of select="text()"/>`}
                        label="<xsl:call-template name="breakIntoWords"><xsl:with-param name="string" select="@friendlyName"/></xsl:call-template>"
                        className="mb-4"
                     /&gt;
                  </xsl:when>
                  <xsl:when test="@type='string[]'">
                  &lt;Controller
                     name={`${name}.<xsl:value-of select="text()"/>`}
                     control={control}
                     render={({ field }) =&gt; (
                        &lt;StringArrayEditor
                           value={field.value || []}
                           label="<xsl:call-template name="breakIntoWords"><xsl:with-param name="string" select="@friendlyName"/></xsl:call-template>"
                           className="mb-4"
                           onChange={newValue =&gt; {
                              field.onChange(newValue);
                              trigger(`${name}.<xsl:value-of select="text()"/>`);
                           }}
                        /&gt;
                     )}
                  /&gt;
                  </xsl:when>
                  <xsl:otherwise>
                  &lt;Controller
                     name={`${name}.<xsl:value-of select="text()"/>`}
                     control={control}
                     render={({ field }) =&gt; (<xsl:choose>
                     <xsl:when test="@type='Date' and @uiReadOnly='true'">
                        &lt;Input
                           {...field}
                           className="mb-2"
                           label="<xsl:value-of select="@friendlyName"/>"
                           id="<xsl:value-of select="text()"/>"
                           variant="plain"
                           fullWidth
                           inputProps={{ readOnly: true }}
                        /&gt;
                     </xsl:when>
                     <xsl:when test="@type='Date'">
                        &lt;DatePicker
                           {...field}
                           <xsl:if test="@uiReadOnly='true'">
                           readOnly={true}</xsl:if>
                           className="mb-2"
                           clearable={true}
                        /&gt;
                     </xsl:when>
                     <xsl:when test="@type='boolean' and not(@uiTriState='true')">
                        &lt;Checkbox 
                           {...field}
                           <xsl:if test="@uiReadOnly='true'">
                           readOnly={true}</xsl:if>
                           checked={field.value}
                        /&gt;</xsl:when>
                     <xsl:when test="@type='boolean' and @uiTriState='true'">
                        &lt;NullableCheckbox 
                           {...field}
                           <xsl:if test="@uiReadOnly='true'">
                           readOnly={true}</xsl:if>
                        /&gt;</xsl:when>
                     <xsl:when test="string-length(@foreignKey)>0">
                        &lt;<xsl:value-of select="@foreignKey"/>Picker 
                           {...field}
                           className="mb-2"
                           <xsl:variable name="fk" select="@foreignKey"/><xsl:if test="../../item[@name=$fk]/@tenant='Isolated'"><xsl:value-of select="$security_route"/>={<xsl:value-of select="$security_route"/>}</xsl:if>
                           <xsl:if test="@uiReadOnly='true'">
                           readOnly={true}</xsl:if>
                           id="<xsl:value-of select="text()"/>"
                           value={field.value}<xsl:if test="not(@isNullable='true')">
                           required</xsl:if>
                        /&gt;</xsl:when>
                     <xsl:when test="@isEnum='true'">
                        &lt;<xsl:call-template name="ExtractArrayType"><xsl:with-param name="text" select="@type"/></xsl:call-template>Picker<xsl:if test="contains(@type,'[]')">Multi</xsl:if> 
                           {...field}
                           className="mb-2"
                           <xsl:if test="@uiReadOnly='true'">
                           readOnly={true}</xsl:if>
                           id="<xsl:value-of select="text()"/>"
                           onChange={value =&gt; field.onChange(value ? Number(value) : undefined)}
                           <xsl:choose>
                           <xsl:when test="contains(@type,'[]')">value={field.value}</xsl:when>
                           <xsl:otherwise>value={`${field.value}`}</xsl:otherwise>
                           </xsl:choose><xsl:if test="not(@isNullable='true')">
                           required</xsl:if>
                        /&gt;</xsl:when>
                        <xsl:when test="@type='int'">
                        &lt;Input
                           {...field}
                           className="mb-2"
                           onChange={evt =&gt; field.onChange(evt?.target?.value ? Number(evt.target.value) : undefined)}
                           id="<xsl:value-of select="text()"/>"<xsl:if test="not(@isNullable='true')">
                           required</xsl:if><xsl:if test="@readOnly='true' or @uiReadOnly='true'">
                           inputProps={{ readOnly: true }}</xsl:if>
                        /&gt;</xsl:when>
                     <xsl:otherwise>
                        &lt;Input
                           {...field}<xsl:if test="@multiLine='true'">
                           textArea</xsl:if>
                           className="mb-2"
                           id="<xsl:value-of select="text()"/>"<xsl:if test="not(@isNullable='true')">
                           required</xsl:if><xsl:if test="@readOnly='true' or @uiReadOnly='true'">
                           inputProps={{ readOnly: true }}</xsl:if>
                        /&gt;</xsl:otherwise>
                     </xsl:choose>
                     )}
                  /&gt;
                  </xsl:otherwise>
                  </xsl:choose>
               &lt;/FormItem&gt;
               </xsl:for-each>
         &lt;/div&gt;
		&lt;/Card&gt;
	);
}

export default <xsl:value-of select="$name"/>Editor;

'''[ENDFILE]
</xsl:for-each>



<xsl:for-each select="items/item[not(@uiGenerate='false') and not(@classOnly='true')]">
  <xsl:variable name="project"><xsl:value-of select="../@projectName"/></xsl:variable>
  <xsl:variable name="project_lower"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="../@projectName"/></xsl:call-template></xsl:variable>
  <xsl:variable name="name"><xsl:value-of select="@name"/></xsl:variable>
  <xsl:variable name="unique_id"><xsl:value-of select="field[1]/text()"/></xsl:variable>
  <xsl:variable name="ui_name"><xsl:choose><xsl:when test="string-length(@uiName)>0"><xsl:value-of select="@uiName"/></xsl:when><xsl:otherwise><xsl:value-of select="$name"/></xsl:otherwise></xsl:choose></xsl:variable>
  <xsl:variable name="ui_name_plural"><xsl:call-template name="Pluralize"><xsl:with-param name="inputString" select="$ui_name"/></xsl:call-template></xsl:variable>
  <xsl:variable name="name_friendly"><xsl:value-of select="@friendlyName"/></xsl:variable>
  <xsl:variable name="name_friendly_plural"><xsl:call-template name="Pluralize"><xsl:with-param name="inputString" select="@friendlyName"/></xsl:call-template></xsl:variable>
  <xsl:variable name="name_plural"><xsl:call-template name="Pluralize"><xsl:with-param name="inputString" select="@name"/></xsl:call-template></xsl:variable>
  <xsl:variable name="name_plural_lower"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="$name_plural"/></xsl:call-template></xsl:variable>
  <xsl:variable name="name_lower"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="@name"/></xsl:call-template></xsl:variable>
  <xsl:variable name="name_upper"><xsl:call-template name="ToUpper"><xsl:with-param name="inputString" select="@name"/></xsl:call-template></xsl:variable>
  <xsl:variable name="name_camel"><xsl:call-template name="FirstLower"><xsl:with-param name="inputString" select="@name"/></xsl:call-template></xsl:variable>
  <xsl:variable name="uiDisplayField"><xsl:choose><xsl:when test="string-length(@uiDisplayField)>0"><xsl:value-of select="@uiDisplayField"/></xsl:when><xsl:when test="count(field[@type='string'])>0"><xsl:value-of select="field[@type='string'][1]/text()"/></xsl:when><xsl:otherwise><xsl:value-of select="$unique_id"/></xsl:otherwise></xsl:choose></xsl:variable>



'''[STARTFILE:<xsl:value-of select="../@frontendPrefix"/>\views\super\crud\<xsl:value-of select="$name_lower"/>\<xsl:value-of select="$name"/>Editor.tsx]
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import _ from 'lodash';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { zodResolver } from '@hookform/resolvers/zod';
import <xsl:value-of select="$name"/>, { I<xsl:value-of select="$name"/> } from '@/<xsl:value-of select="$project_lower"/>/models/entities/<xsl:value-of select="$name_lower"/>';
import { useDelete<xsl:value-of select="$name"/>Mutation, useCreate<xsl:value-of select="$name"/>Mutation, useReplace<xsl:value-of select="$name"/>Mutation, useGet<xsl:value-of select="$name"/>Query } from '@/<xsl:value-of select="$project_lower"/>/endpoints/entities/<xsl:value-of select="$name_camel"/>Api';
import { closeModal, openModal } from '@/components/ui/Dialog/modalSlice';
import { useAppDispatch } from '@/store/rootStore';
import { Button, Checkbox, DatePicker, Dialog, Form, FormItem, Input } from '@/components/ui';
import NullableCheckbox from '@/views/super/common/NullableCheckbox';
<xsl:for-each select="field[string-length(@foreignKey)>0 and generate-id()=generate-id(key('foreignKeyKey',concat(../@name, @foreignKey))[1])]">
<xsl:variable name="fk_plural"><xsl:call-template name="Pluralize"><xsl:with-param name="inputString" select="@foreignKey"/></xsl:call-template></xsl:variable>
<xsl:variable name="fk_plural_lower"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="$fk_plural"/></xsl:call-template></xsl:variable>
import <xsl:value-of select="@foreignKey"/>Picker from '@/views/super/pickers/<xsl:value-of select="@foreignKey"/>Picker';</xsl:for-each>
<xsl:for-each select="field[@isEnum='true' and generate-id()=generate-id(key('isEnumKey',concat(../@name, @type))[1])]">
<xsl:variable name="enum_type"><xsl:call-template name="ExtractArrayType"><xsl:with-param name="text" select="@type"/></xsl:call-template></xsl:variable>
<xsl:variable name="enum_type_lower"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="$enum_type"/></xsl:call-template></xsl:variable>
<xsl:variable name="enum_plural"><xsl:call-template name="Pluralize"><xsl:with-param name="inputString" select="$enum_type"/></xsl:call-template></xsl:variable>
<xsl:variable name="enum_plural_lower"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="$enum_plural"/></xsl:call-template></xsl:variable>
import { <xsl:value-of select="$enum_type"/> } from '@/<xsl:value-of select="$project_lower"/>/models/entities/<xsl:value-of select="$enum_type_lower"/>';
import <xsl:value-of select="$enum_type"/>Picker<xsl:if test="contains(@type,'[]')">Multi</xsl:if> from '@/views/super/pickers/<xsl:value-of select="$enum_type"/>Picker<xsl:if test="contains(@type,'[]')">Multi</xsl:if>';</xsl:for-each>
<xsl:variable name="selfparent" select="@name"/>
<xsl:for-each select="../item[@uiNestedComponent='true']">
<xsl:variable name="childtype" select="@name"/>
<xsl:variable name="childtypeArray"><xsl:value-of select="$childtype"/>[]</xsl:variable>
<xsl:if test="count(../item[@name=$selfparent]/field[@type=$childtype or @type=$childtypeArray])>0">
import <xsl:value-of select="$childtype"/> from '@/<xsl:value-of select="$project_lower"/>/models/entities/<xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="$childtype"/></xsl:call-template>';
import <xsl:value-of select="$childtype"/>Editor, { <xsl:call-template name="FirstLower"><xsl:with-param name="inputString" select="$childtype"/></xsl:call-template>Schema } from '../<xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="$childtype"/></xsl:call-template>/<xsl:value-of select="$childtype"/>Editor';
import <xsl:value-of select="$childtype"/>ListEditor from '../<xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="$childtype"/></xsl:call-template>/<xsl:value-of select="$childtype"/>ListEditor';
</xsl:if>
</xsl:for-each>
import classNames from '@/utils/classNames';
import moment from 'moment';
import <xsl:value-of select="$project"/>Utils from '@/utils/<xsl:value-of select="$project_lower"/>Utils';
import { TbEdit, TbPlus } from 'react-icons/tb';
<xsl:if test="count(field[@type='string[]'])>0">import StringArrayEditor from '../StringArrayEditor';</xsl:if>
import Alert from '@/components/shared/Alert';
import NestedEditor from '../NestedEditor';
import { PiX } from 'react-icons/pi';
<xsl:if test="count(field[string-length(@uiUploadAsset)>0])>0">import ImageUploader from '@/components/shared/ImageUploader';
import { IPreSignedUrl } from '@/<xsl:value-of select="$project_lower"/>/models/entities/presignedurl';
import { ActionResult } from '@/<xsl:value-of select="$project_lower"/>/models/action-result';
import { AssetArea } from '@/<xsl:value-of select="$project_lower"/>/models/entities/assetarea';
import { AssetDependency } from '@/<xsl:value-of select="$project_lower"/>/models/entities/assetdependency';
</xsl:if>
<xsl:if test="count(field[string-length(@uiUploadAsset)>0])>0">
import { I<xsl:value-of select="field[string-length(@uiUploadAsset)>0][1]/@uiUploadAsset"/><xsl:if test="field[string-length(@uiUploadAsset)>0][1]/@uiUploadAsset!='Asset'">Asset</xsl:if>_Info } from '@/<xsl:value-of select="$project_lower"/>/models/entities/<xsl:call-template name="FirstLower"><xsl:with-param name="inputString" select="field[string-length(@uiUploadAsset)>0][1]/@uiUploadAsset"/></xsl:call-template><xsl:if test="field[string-length(@uiUploadAsset)>0][1]/@uiUploadAsset!='Asset'">asset</xsl:if>';
</xsl:if>

type FormType = {
   <xsl:for-each select="field[string-length(@calculated)=0 and not(contains(@type,'.'))]"><xsl:value-of select="text()"/><xsl:if test="@isNullable='true' or position()=1">?</xsl:if>: I<xsl:value-of select="$name"/>["<xsl:value-of select="text()"/>"]<xsl:if test="@isEnum='true'"> | undefined </xsl:if>;
   </xsl:for-each>
   <xsl:for-each select="field[string-length(@calculated)>0 and @isAvatar='true']"><xsl:value-of select="text()"/>?: I<xsl:value-of select="$name"/>["<xsl:value-of select="text()"/>"];
   </xsl:for-each>
};

const schema = z.object({
   <xsl:for-each select="field[string-length(@calculated)=0 and not(contains(@type,'.'))]"><xsl:if test="position()>1">,
   </xsl:if><xsl:value-of select="text()"/>: <xsl:choose>
		<xsl:when test="@isEnum='true' and contains(@type,'[]')">z.coerce.number().array()<xsl:if test="@isNullable='true'">.nullable()</xsl:if></xsl:when>
		<xsl:when test="@type='string[]'">z.string().array()<xsl:if test="@isNullable='true'">.nullable()</xsl:if></xsl:when>
		<xsl:when test="@isEnum='true'">z.union([z.enum(<xsl:value-of select="@type"/>), z.undefined()]).refine(val =&gt; val !== undefined, {
         message: '<xsl:value-of select="@friendlyName"/> is required',
      })</xsl:when>
		<xsl:when test="@type='boolean'">z.boolean()</xsl:when>
		<xsl:when test="@type='Date'">z.string()</xsl:when>
		<xsl:when test="@type='decimal'">z.string()</xsl:when>
		<xsl:when test="@type='int'">z.number()</xsl:when>
		<xsl:when test="@isClass='true' and contains(@type,'[]')">z.array(<xsl:call-template name="FirstLower"><xsl:with-param name="inputString"><xsl:call-template name="ExtractArrayType"><xsl:with-param name="text" select="@type"/></xsl:call-template></xsl:with-param></xsl:call-template>Schema)</xsl:when>
		<xsl:when test="@isClass='true'"><xsl:call-template name="FirstLower"><xsl:with-param name="inputString" select="@type"/></xsl:call-template>Schema</xsl:when>
		<xsl:otherwise>z.string()</xsl:otherwise>
	</xsl:choose><xsl:if test="@validate='email'">.email('Must be a valid email')</xsl:if><xsl:if test="string-length(@maxLength)>0 and @maxLength!='none'">.max(<xsl:value-of select="@maxLength"/>, 'Cannot be more than <xsl:value-of select="@maxLength"/> characters.')</xsl:if><xsl:if test="@isNullable='true' or position()=1">.optional()</xsl:if></xsl:for-each>
   <xsl:for-each select="field[string-length(@calculated)>0 and @isAvatar='true']">,
   <xsl:value-of select="text()"/>: <xsl:call-template name="FirstLower"><xsl:with-param name="inputString" select="@type"/></xsl:call-template>Schema.optional()
   </xsl:for-each>
});

type <xsl:value-of select="$name"/>EditorProps = {
	className?: string;
   is_create: boolean;
   onDelete?: (<xsl:value-of select="$name_lower"/>: I<xsl:value-of select="$name"/>) =&gt; void;
   onCreate?: (<xsl:value-of select="$name_lower"/>: I<xsl:value-of select="$name"/>) =&gt; void;<xsl:for-each select="field[@uiParent='true']"><xsl:text>
   </xsl:text><xsl:value-of select="text()"/>: string;
   </xsl:for-each><xsl:text>
   </xsl:text><xsl:value-of select="$unique_id"/>?: string;<xsl:if test="@tenant='Isolated' and count(field[@uiParent='true' and text()=$security_route])=0"><xsl:if test="not(count(field[@isolated='true']))=1"><xsl:text>
   </xsl:text><xsl:value-of select="$security_route"/>: string;</xsl:if></xsl:if>
};


function <xsl:value-of select="$name"/>Editor(props: <xsl:value-of select="$name"/>EditorProps) {
	const dispatch = useAppDispatch();
	const { className, <xsl:value-of select="$unique_id"/>, is_create<xsl:if test="@tenant='Isolated' and not(count(field[@isolated='true'])=1)">, <xsl:value-of select="$security_route"/></xsl:if><xsl:for-each select="field[@uiParent='true' and not(@tenant='true')]">, <xsl:value-of select="text()"/></xsl:for-each>, onCreate, onDelete } = props;
	const [openDialog, setOpenDialog] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [target<xsl:value-of select="$name"/>Id, setTarget<xsl:value-of select="$name"/>Id] = useState&lt;string&gt;();
	const [original, setOriginal] = useState&lt;I<xsl:value-of select="$name"/>&gt;();

   const defaultValues: FormType = {
		<xsl:for-each select="field[@tenant='true']"><xsl:value-of select="text()"/>: <xsl:value-of select="text()"/>,
		</xsl:for-each>
		<xsl:for-each select="field[not(@tenant='true') and string-length(@calculated)=0 and not(contains(@type,'.'))]"><xsl:if test="text()!=$unique_id">
		<xsl:value-of select="text()"/>: <xsl:choose>
         <xsl:when test="@uiParent='true'"><xsl:value-of select="text()"/></xsl:when>
         <xsl:when test="@isNullable='true'">undefined</xsl:when>
			<xsl:when test="contains(@type, '[]')">[]</xsl:when>
			<xsl:when test="@isEnum='true'">undefined</xsl:when>
			<xsl:when test="@type='int'">0</xsl:when>
			<xsl:when test="@type='decimal'">'0'</xsl:when>
			<xsl:when test="@type='Uuid'">''</xsl:when>
			<xsl:when test="@type='boolean'">false</xsl:when>
			<xsl:when test="@type='Date'">undefined!</xsl:when>
			<xsl:when test="@type='string'">''</xsl:when>
			<xsl:otherwise>undefined!</xsl:otherwise></xsl:choose>,
		</xsl:if></xsl:for-each>
	};
	const formMethods = useForm&lt;FormType&gt;({
		mode: 'onChange',
		defaultValues,
		resolver: zodResolver(schema) as any
	});
   const { handleSubmit, formState, control, reset, setValue, trigger } = formMethods;
	const [create<xsl:value-of select="$name"/>] = useCreate<xsl:value-of select="$name"/>Mutation();
	const [replace<xsl:value-of select="$name"/>] = useReplace<xsl:value-of select="$name"/>Mutation();
	const [delete<xsl:value-of select="$name"/>] = useDelete<xsl:value-of select="$name"/>Mutation();

	const { isValid, dirtyFields, errors } = formState;

	const { t } = useTranslation();
   <xsl:choose><xsl:when test="@tenant='Isolated'">
   const <xsl:value-of select="$name_lower"/>QueryInput = {
      <xsl:value-of select="$security_route"/>: <xsl:value-of select="$security_route"/>!,
		input: <xsl:value-of select="$unique_id"/>!
	};
   </xsl:when>
   <xsl:otherwise>
   const <xsl:value-of select="$name_lower"/>QueryInput = <xsl:value-of select="$unique_id"/>!;</xsl:otherwise>
   </xsl:choose>
   
	let <xsl:value-of select="$name_lower"/> = useGet<xsl:value-of select="$name"/>Query(<xsl:value-of select="$name_lower"/>QueryInput, { refetchOnMountOrArgChange: true, skip: !openDialog || !<xsl:value-of select="$unique_id"/> });

   useEffect(() =&gt; {
      if (!<xsl:value-of select="$unique_id"/>) {
         if (!target<xsl:value-of select="$name"/>Id){
            setTarget<xsl:value-of select="$name"/>Id(uuidv4());
         }
      } else {
         setTarget<xsl:value-of select="$name"/>Id(<xsl:value-of select="$unique_id"/>);
      }
   }, [<xsl:value-of select="$unique_id"/>]);

   useEffect(() =&gt; {
      if (openDialog &amp;&amp; <xsl:value-of select="$name_lower"/>?.data?.item) {
         reset(<xsl:value-of select="$name_lower"/>.data.item);
         setOriginal(<xsl:value-of select="$name_lower"/>.data.item);
      }
   }, [openDialog, <xsl:value-of select="$name_lower"/>]);

	function handleOpenDialog() {
		setOpenDialog(true);
	}

	function handleCloseDialog() {
		setOpenDialog(false);
	}

	function handleDiscard() {
		clearForm();
		setOpenDialog(false);
	}

   function clearForm(){
      reset(defaultValues);
      if (!<xsl:value-of select="$unique_id"/>){
         setTarget<xsl:value-of select="$name"/>Id(uuidv4());
      }
   }
	const confirmDelete = () =&gt; {
		dispatch(
			openModal({
				children: (
					&lt;Alert
                  type='danger'
						onCancel={async () =&gt; {
							dispatch(closeModal());
						}}
						onConfirm={async () =&gt; {
							dispatch(closeModal());
							performDelete()
						}}
						children="Are you sure you want to delete this <xsl:value-of select="$name"/>?"
						confirmText='Yes, Delete'
						/&gt;
				)
			})
		);
	};

	function performDelete() {
      const deleteInstance = <xsl:value-of select="$name_lower"/>.data?.item;
      if (!deleteInstance){
         return;
      }
		setSubmitting(true);
		delete<xsl:value-of select="$name"/>(<xsl:for-each select="field[@tenant='true']">{ <xsl:value-of select="text()"/>: <xsl:value-of select="text()"/>!, input: deleteInstance.</xsl:for-each><xsl:value-of select="$unique_id"/>!<xsl:if test="@tenant='Isolated'">}</xsl:if>)
			.unwrap()
			.then((resp) =&gt; {
				setSubmitting(false);
				if (!resp.success) {
					showError(resp.message || 'Error deleting data.');
				} else {
					handleCloseDialog();
               clearForm();
               if (onDelete) {
                  onDelete(deleteInstance);
               }
				}
			})
			.catch((ex) =&gt; {
				setSubmitting(false);
				const message = <xsl:value-of select="$project"/>Utils.getApiErrorMessage(ex, "Error deleting data.");
				showError(message);
			});
	}

   <xsl:for-each select="field[string-length(@uiUploadAsset)>0]">
   const handle<xsl:call-template name="Spaceless"><xsl:with-param name="text" select="@friendlyName"/></xsl:call-template>Uploaded = async function (asset: I<xsl:value-of select="@uiUploadAsset"/><xsl:if test="@uiUploadAsset!='Asset'">Asset</xsl:if>_Info): Promise&lt;void&gt; {
      setValue('<xsl:value-of select="text()"/>', asset.<xsl:value-of select="@foreignKeyField"/>);
      <xsl:if test="string-length(@uiUploadAvatar)>0">
      setValue('<xsl:value-of select="@uiUploadAvatar"/>', asset);
      </xsl:if>
   };
   const handle<xsl:call-template name="Spaceless"><xsl:with-param name="text" select="@friendlyName"/></xsl:call-template>Remove = async function (): Promise&lt;void&gt; {
      setValue('<xsl:value-of select="text()"/>', undefined);
      <xsl:if test="string-length(@uiUploadAvatar)>0">
      setValue('<xsl:value-of select="@uiUploadAvatar"/>', {});
      </xsl:if>
   };
   </xsl:for-each>

	function onSubmit(data: FormType) {
      <xsl:for-each select="field[@isClass='true' and string-length(@calculated)=0]"><xsl:variable name="field_type" select="@type"/>
      <xsl:if test="count(../../item[@name=$field_type and @uiNestedComponent='true'])>0">
      if (data.<xsl:value-of select="text()"/>) {
         try {
            <xsl:call-template name="FirstLower"><xsl:with-param name="inputString" select="@type"/></xsl:call-template>Schema.parse(data.<xsl:value-of select="text()"/>);
         } catch (error) {
            showError('Release date must have both UTC and Local dates selected.');
            return;
         }
      }</xsl:if>
      </xsl:for-each>
      

      const apiData = { ...data };
    	const updated<xsl:value-of select="$name"/> = <xsl:value-of select="$name"/>(apiData);
		setSubmitting(true);

      let promise = is_create ? create<xsl:value-of select="$name"/>(updated<xsl:value-of select="$name"/>) : replace<xsl:value-of select="$name"/>(updated<xsl:value-of select="$name"/>);
		promise
			.unwrap()
			.then((resp) =&gt; {
				setSubmitting(false);
				if (!resp.success) {
					showError(resp.message || 'Error saving data.');
				} else {
					setOpenDialog(false);
               clearForm();
               if (is_create &amp;&amp; onCreate &amp;&amp; resp.item) {
                  onCreate(resp.item);
               }
				}
			})
			.catch((ex) =&gt; {
				setSubmitting(false);
				const message = <xsl:value-of select="$project"/>Utils.getApiErrorMessage(ex, "Error saving data.");
				showError(message);
			});
	}

	function showError(message: string) {
		dispatch(
			openModal({
				children: (
					&lt;Alert
                  type='danger'
						onCancel={async () =&gt; {
							dispatch(closeModal());
						}}
                  onConfirm={async () =&gt; {
                     dispatch(closeModal());
                  }}
						children={message}
						confirmText='Okay'
                  confirmOnly={true}
					/&gt;
				)
			})
		);
	}

	return (
		&lt;div className={classNames('', className)}&gt;
         {
            is_create ? 
            &lt;Button 
               variant="solid"
               type="button"
               color="primary"
               icon={&lt;TbPlus className="text-xl" /&gt; } onClick={handleOpenDialog} &gt;
               Create
            &lt;/Button&gt;
            :
            &lt;Button 
               variant="default"
               type="button"
               size="xs"
               icon={&lt;TbEdit /&gt; } onClick={handleOpenDialog} &gt;
               Edit
            &lt;/Button&gt;
         }
			&lt;Dialog
				isOpen={openDialog}
				onClose={handleCloseDialog}
            width={800}
			&gt;
            &lt;Dialog.Header&gt;
               &lt;h4 className="mb-4"&gt;
                  {is_create ? 'Create' : 'Edit'} <xsl:value-of select="$name_friendly"/>
               &lt;/h4&gt;
				&lt;/Dialog.Header&gt;
            &lt;FormProvider {...formMethods}&gt;
               &lt;Form
                  onSubmit={handleSubmit(onSubmit)}
                  className="flex flex-col"
               &gt;
                  &lt;Dialog.Body scrollable={true}&gt;
                     &lt;div className='p-2 sm:p-0' &gt;
                        
                        <xsl:for-each select="field[string-length(@calculated)=0 and not(@tenant='true') and not(@uiHidden='true') and not(@uiParent='true') and not(text()=$unique_id) and not(contains(@type,'.'))]"><xsl:sort select="@uiOrder" data-type="number" order="ascending"/>
                        <xsl:variable name="type" select="@type"/>
                        <xsl:variable name="type_base"><xsl:call-template name="ExtractArrayType"><xsl:with-param name="text" select="@type"/></xsl:call-template></xsl:variable>
                        &lt;FormItem
                           <xsl:if test="not(count(../../item[@name=$type and @uiNestedComponent='true'])>0)">label="<xsl:call-template name="breakIntoWords"><xsl:with-param name="string" select="@friendlyName"/></xsl:call-template>"</xsl:if>
                           invalid={Boolean(errors.<xsl:value-of select="text()"/>)}
                           errorMessage={errors.<xsl:value-of select="text()"/>?.message}
                        &gt;
                           <xsl:choose>
                           <xsl:when test="@isNullable='false' and count(../../item[@name=$type and @uiNestedComponent='true'])>0">
                              &lt;<xsl:value-of select="$type"/>Editor
                                 name="<xsl:value-of select="text()"/>"
                                 className="mb-4"
                              /&gt;
                           </xsl:when>
                           <xsl:when test="@isNullable='true' and count(../../item[@name=$type and @uiNestedComponent='true'])>0">
                           &lt;Controller
                                 name="<xsl:value-of select="text()"/>"
                                 control={control}
                                 render={({ field }) =&gt; (
                                    &lt;NestedEditor
                                       className={className}
                                       value={field.value}
                                       label="<xsl:call-template name="breakIntoWords"><xsl:with-param name="string" select="@friendlyName"/></xsl:call-template>"
                                       createNewItem={() =&gt; <xsl:value-of select="$type"/>()}
                                       renderItem={() =&gt; &lt;<xsl:value-of select="$type"/>Editor name="<xsl:value-of select="text()"/>" className="mb-4" /&gt;}
                                       onChange={newValue =&gt; {
                                          field.onChange(newValue);
                                          trigger('<xsl:value-of select="text()"/>');
                                       }}
                                       itemLabel={''}
                                    /&gt;
                                 )}
                              /&gt;
                           </xsl:when>
                           <xsl:when test="count(../../item[@name=$type_base and @uiNestedComponent='true'])>0">
                              &lt;<xsl:value-of select="$type_base"/>ListEditor
                                 name="<xsl:value-of select="text()"/>"
                                 className="mb-4"
                              /&gt;
                           </xsl:when>
                           <xsl:when test="@type='string[]'">
                           &lt;Controller
                              name="<xsl:value-of select="text()"/>"
                              control={control}
                              render={({ field }) =&gt; (
                                 &lt;StringArrayEditor
                                    value={field.value || []}
                                    label="<xsl:call-template name="breakIntoWords"><xsl:with-param name="string" select="@friendlyName"/></xsl:call-template>"
                                    className="mb-4"
                                    onChange={newValue =&gt; {
                                       field.onChange(newValue);
                                       trigger('<xsl:value-of select="text()"/>');
                                    }}
                                 /&gt;
                              )}
                           /&gt;
                           </xsl:when>
                           <xsl:when test="string-length(@uiUploadAsset)>0 and string-length(@uiUploadAvatar)>0">
                           <xsl:variable name="fieldName" select="@uiUploadAvatar"/><xsl:variable name="typeName" select="../field[text()=$fieldName]/@type"/>
                           &lt;Controller
                              name="<xsl:value-of select="@uiUploadAvatar"/>"
                              control={control}
                              render={({ field }) =&gt; 
                                 &lt;&gt;
                                  &lt;div className="flex flex-col gap-4"&gt;
                                       &lt;div className="flex-1 flex flex-row items-center gap-8"&gt;
                                       {
                                          field.value &amp;&amp; 
                                          &lt;div className="flex flex-col items-center pb-6"&gt;
                                             &lt;img className="object-cover max-h-32 max-w-32" src={field.value.thumb_small_url || field.value.thumb_large_url} loading="lazy" /&gt;
                                          &lt;/div&gt;
                                       }
                                       {
                                          
                                          field.value &amp;&amp; field.value.<xsl:value-of select="../../item[@name=$typeName]/field[1]/text()"/> &amp;&amp; &lt;Button
                                             type="button"
                                             variant="default"
                                             color="warning"
                                             size="sm"
                                             className="rounded-8 flex flex-row items-center gap-2"
                                             onClick={handle<xsl:call-template name="Spaceless"><xsl:with-param name="text" select="@friendlyName"/></xsl:call-template>Remove}
                                             icon={&lt;PiX /&gt;}
                                          &gt;
                                             Remove Photo
                                          &lt;/Button&gt;
                                       }
                                       &lt;/div&gt;
                                    &lt;/div&gt;
                                 &lt;/&gt;}
                              /&gt;
                           &lt;Controller
                              name="<xsl:value-of select="text()"/>"
                              control={control}
                              render={({ field }) =&gt; (
                                 &lt;ImageUploader <xsl:for-each select="../field[@tenant='true']"><xsl:value-of select="text()"/>={<xsl:value-of select="text()"/>} </xsl:for-each>button_text="Replace Photo" upload_text="Upload" asset_dependency={AssetDependency.<xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="$name"/></xsl:call-template>} dependency_id={target<xsl:value-of select="$name"/>Id} onAssetCreated={handle<xsl:call-template name="Spaceless"><xsl:with-param name="text" select="@friendlyName"/></xsl:call-template>Uploaded} asset_area={AssetArea.<xsl:call-template name="FirstLower"><xsl:with-param name="inputString" select="@uiUploadAsset"/></xsl:call-template>} /&gt;
                              )}
                           /&gt;
                           </xsl:when>
                           <xsl:otherwise>
                           &lt;Controller
                              name="<xsl:value-of select="text()"/>"
                              control={control}
                              render={({ field }) =&gt; (<xsl:choose>
                              <xsl:when test="@type='Date' and @uiReadOnly='true'">
                                 &lt;Input
                                    {...field}
                                    className="mb-2"
                                    label="<xsl:value-of select="@friendlyName"/>"
                                    id="<xsl:value-of select="text()"/>"
                                    variant="plain"
                                    fullWidth
                                    inputProps={{ readOnly: true }}
                                 /&gt;
                              </xsl:when>
                              <xsl:when test="@type='Date'">
                                 &lt;DatePicker
                                    {...field}
                                    value={field.value ? new Date(field.value) : undefined}
                                    onChange={(date) =&gt; field.onChange(date ? date.toISOString() : undefined)}
                                    <xsl:if test="@uiReadOnly='true'">
                                    readOnly={true}</xsl:if>
                                    className="mb-2"
                                    clearable={true}
                                    //TODO:DateTime:Nullable, REquired
                                 /&gt;
                              </xsl:when>
                              <xsl:when test="@type='boolean' and not(@uiTriState='true')">
                                 &lt;Checkbox 
                                    {...field}
                                    <xsl:if test="@uiReadOnly='true'">
                                    readOnly={true}</xsl:if>
                                    checked={field.value}
                                 /&gt;</xsl:when>
                                 <xsl:when test="@type='boolean' and @uiTriState='true'">
                                 &lt;NullableCheckbox 
                                    {...field}
                                    <xsl:if test="@uiReadOnly='true'">
                                    readOnly={true}</xsl:if>
                                 /&gt;</xsl:when>
                              <xsl:when test="string-length(@foreignKey)>0">
                                 &lt;<xsl:value-of select="@foreignKey"/>Picker 
                                    {...field}
                                    className="mb-2"
                                    <xsl:variable name="fk" select="@foreignKey"/><xsl:variable name="fieldText" select="text()"/><xsl:if test="../../item[@name=$fk]/@tenant='Isolated'"><xsl:value-of select="$security_route"/>={<xsl:value-of select="$security_route"/>}</xsl:if>
                                    <xsl:for-each select="../../item[@name=$fk]/field[@uiPickerRoute='true']"><xsl:value-of select="text()"/>={<xsl:value-of select="text()"/>}</xsl:for-each>
                                    <xsl:if test="@uiReadOnly='true'">
                                    readOnly={true}</xsl:if>
                                    id="<xsl:value-of select="text()"/>"
                                    value={field.value}<xsl:if test="not(@isNullable='true')">
                                    required</xsl:if>
                                 /&gt;</xsl:when>
                              <xsl:when test="@isEnum='true'">
                                 &lt;<xsl:call-template name="ExtractArrayType"><xsl:with-param name="text" select="@type"/></xsl:call-template>Picker<xsl:if test="contains(@type,'[]')">Multi</xsl:if> 
                                    className="mb-2"
                                    <xsl:if test="@uiReadOnly='true'">
                                    readOnly={true}</xsl:if>
                                    id="<xsl:value-of select="text()"/>"
                                    onChange={value =&gt; field.onChange(value ? (Number(value) as <xsl:value-of select="@type"/>) : undefined)}
                                    <xsl:choose>
                                    <xsl:when test="contains(@type,'[]')">value={field.value}</xsl:when>
                                    <xsl:otherwise>value={field.value !== undefined ? `${field.value}` : ''}
                                    </xsl:otherwise>
                                    </xsl:choose><xsl:if test="not(@isNullable='true')">
                                    required</xsl:if>
                                 /&gt;</xsl:when>
                              
                              <xsl:when test="@type='int'">
                                 &lt;Input
                                    {...field}
                                    className="mb-2"
                                    onChange={e =&gt; field.onChange(Number(e.target.value))}
                                    type="number"
                                    id="<xsl:value-of select="text()"/>"<xsl:if test="not(@isNullable='true')">
                                    required</xsl:if><xsl:if test="text()=$unique_id or @readOnly='true' or @uiReadOnly='true'">
                                    readOnly={true}</xsl:if>
                                 /&gt;
                              </xsl:when>
                              <xsl:when test="@type='decimal'">
                                 &lt;Input
                                    {...field}
                                    className="mb-2"
                                    onChange={e =&gt; field.onChange(new Decimal(e.target.value).toString())}
                                    type="number"
                                    id="<xsl:value-of select="text()"/>"<xsl:if test="not(@isNullable='true')">
                                    required</xsl:if><xsl:if test="text()=$unique_id or @readOnly='true' or @uiReadOnly='true'">
                                    readOnly={true}</xsl:if>
                                 /&gt;
                              </xsl:when>
                              <xsl:otherwise>
                                 &lt;Input
                                    {...field}<xsl:if test="@multiLine='true'">
                                    textArea</xsl:if>
                                    className="mb-2"
                                    id="<xsl:value-of select="text()"/>"<xsl:if test="not(@isNullable='true')">
                                    required</xsl:if><xsl:if test="text()=$unique_id or @readOnly='true' or @uiReadOnly='true'">
                                    readOnly={true}</xsl:if>
                                 /&gt;</xsl:otherwise>
                              </xsl:choose>
                              )}
                           /&gt;
                           </xsl:otherwise>
                           </xsl:choose>
                        &lt;/FormItem&gt;
                        
                     </xsl:for-each>
                     &lt;/div&gt;
                  &lt;/Dialog.Body&gt;
               
                  &lt;Dialog.Footer&gt;
                     &lt;div className="flex flex-row justify-end space-x-2"&gt;
                        &lt;div className=""&gt;
                           &lt;Button
                              variant="default"
                              color="default"
                              type="button"
                              onClick={handleDiscard}
                           &gt;
                              Cancel
                           &lt;/Button&gt;
                           {
                              !is_create &amp;&amp;original &amp;&amp; original.<xsl:value-of select="$unique_id"/> &amp;&amp;
                              &lt;Button
                                 variant="plain"
                                 color="error"
                                 className="ml-8"
                                 type="button"
                                 onClick={confirmDelete}
                                 disabled={submitting}
                              &gt;
                                 Delete
                              &lt;/Button&gt;
                           }
                        &lt;/div&gt;

                        &lt;div className="flex-1"&gt;
                        &lt;/div&gt;

                        &lt;div className="flex flex-row items-center space-x-8"&gt;
                           &lt;Button
                              variant="solid"
                              color="primary"
                              type="submit"
                              disabled={<xsl:value-of select="$name_lower"/>.isLoading || !isValid || submitting}
                           &gt;
                              {is_create ? 'Create' : 'Update'}
                           &lt;/Button&gt;
                        &lt;/div&gt;
                     &lt;/div&gt;

                  &lt;/Dialog.Footer&gt;
               &lt;/Form&gt;
            &lt;/FormProvider&gt;
			&lt;/Dialog&gt;
		&lt;/div&gt;
	);
}

export default <xsl:value-of select="$name"/>Editor;

'''[ENDFILE]

<xsl:if test="not(@uiListCards='true')">
'''[STARTFILE:<xsl:value-of select="../@frontendPrefix"/>\views\super\crud\<xsl:value-of select="$name_lower"/>\<xsl:value-of select="$name"/>List.tsx]
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';
import DataTable, { ColumnDef, DataTablePagingData, OnSortParam} from '@/components/shared/DataTable';
import { Button, Input } from '@/components/ui';
import { TbArrowRight, TbPlus, TbSearch } from 'react-icons/tb';
import useDebounce from '@/utils/hooks/useDebounce';
import Loading from '@/components/shared/Loading';
import { AdaptiveCard } from '@/components/shared';
import classNames from 'classnames';
import { Meta } from '@/@types/routes';
import { useAppDispatch } from '@/store/rootStore';

import { I<xsl:value-of select="$name"/> } from '@/<xsl:value-of select="$project_lower"/>/models/entities/<xsl:value-of select="$name_lower"/>';
import { <xsl:value-of select="$name_lower"/>Endpoints, useGet<xsl:value-of select="$name_plural"/>Query } from '@/<xsl:value-of select="$project_lower"/>/endpoints/entities/<xsl:value-of select="$name_camel"/>Api';
import { ListInput<xsl:value-of select="$name"/> } from '@/<xsl:value-of select="$project_lower"/>/models/entities/requests/list-input-<xsl:value-of select="$name_lower"/>';
import <xsl:value-of select="$name"/>Editor from './<xsl:value-of select="$name"/>Editor';<xsl:for-each select="field[@isEnum='true']">
<xsl:variable name="enum_type"><xsl:call-template name="ExtractArrayType"><xsl:with-param name="text" select="@type"/></xsl:call-template></xsl:variable>
<xsl:variable name="enum_type_lower"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="$enum_type"/></xsl:call-template></xsl:variable>
import { <xsl:value-of select="$enum_type"/> } from '@/<xsl:value-of select="$project_lower"/>/models/entities/<xsl:value-of select="$enum_type_lower"/>';</xsl:for-each>
<xsl:if test="@tenant='Isolated'">
import { RoutedInput } from '@/<xsl:value-of select="$project_lower"/>/models/routed-input';
</xsl:if>
import { Link, useNavigate, useParams } from 'react-router';

type <xsl:value-of select="$name"/>ListProps = Meta &amp; {
   expands?: boolean;<xsl:for-each select="field[@uiParent='true' and not(@tenant='true')]"><xsl:text>
   </xsl:text><xsl:value-of select="text()"/>?: string;</xsl:for-each>
}
function <xsl:value-of select="$name"/>List(props: <xsl:value-of select="$name"/>ListProps) {
	const { expands = true<xsl:for-each select="field[@uiParent='true' and not(@tenant='true')]">, <xsl:value-of select="text()"/></xsl:for-each> } = props;
   <xsl:if test="@tenant='Isolated'">const routeParams = useParams();
	const { <xsl:value-of select="$security_route"/> } = routeParams;
   </xsl:if>
   const dispatch = useAppDispatch();
   const navigate = useNavigate();
	const [apiRequest, setApiRequest] = useState&lt;<xsl:choose>
      <xsl:when test="@tenant='Isolated'">RoutedInput&lt;ListInput<xsl:value-of select="$name"/>&gt;</xsl:when>
      <xsl:otherwise>ListInput<xsl:value-of select="$name"/></xsl:otherwise>
   </xsl:choose>&gt;(() =&gt; {
      return <xsl:choose>
      <xsl:when test="@tenant='Isolated'">{
         <xsl:value-of select="$security_route"/>: <xsl:value-of select="$security_route"/>!,
         input: {
            skip: 0,
            take: 10,
            order_by: <xsl:choose><xsl:when test="string-length(@uiDefaultSort)>0">'<xsl:value-of select="@uiDefaultSort"/>'</xsl:when><xsl:otherwise>undefined</xsl:otherwise></xsl:choose>,
            descending: <xsl:choose><xsl:when test="@uiDefaultSortDesc='true'">true</xsl:when><xsl:otherwise>false</xsl:otherwise></xsl:choose>,
            keyword: undefined<xsl:for-each select="field[@uiParent='true' and not(@tenant='true')]">, 
            <xsl:value-of select="text()"/>: <xsl:value-of select="text()"/></xsl:for-each>
         }
      };</xsl:when>
         <xsl:otherwise>{
         skip: 0,
         take: 10,
         order_by: undefined,
         descending: false,
         keyword: undefined<xsl:for-each select="field[@uiParent='true' and not(@tenant='true')]">,
         <xsl:value-of select="text()"/>: <xsl:value-of select="text()"/></xsl:for-each>
      };</xsl:otherwise>
      </xsl:choose>
   });

	const [tablePagingData, setTablePagingData] = useState&lt;DataTablePagingData&gt;({
		total: 0,
		pageIndex: 1,
		pageSize: 10,
	});
	
	const <xsl:value-of select="$name_plural_lower"/> = useGet<xsl:value-of select="$name_plural"/>Query({...apiRequest}, { refetchOnMountOrArgChange: true });

   const performSearch = (value: string) =&gt; {
      setApiRequest(prev =&gt; ({
         ...prev,<xsl:choose>
         <xsl:when test="@tenant='Isolated'">
         input: { 
            ...prev.input, 
            keyword: value,
            skip: 0 
         },</xsl:when>
         <xsl:otherwise>
         keyword: value,
         skip: 0</xsl:otherwise>
         </xsl:choose>
      }));
   }
   const debounceSearch = useDebounce((performSearch), 500)

	const handleRefresh = useCallback(() =&gt; {
      const request = {
         ...apiRequest,<xsl:choose>
         <xsl:when test="@tenant='Isolated'">
         input: { 
            ...apiRequest.input, 
            skip: 0
         },</xsl:when>
         <xsl:otherwise>
         skip: 0</xsl:otherwise>
         </xsl:choose>
      };
      dispatch(<xsl:value-of select="$name_lower"/>Endpoints.get<xsl:value-of select="$name_plural"/>.initiate(request, { forceRefetch: true }));
   }, []);

   const handleSearchChange = useCallback((e: ChangeEvent&lt;HTMLInputElement&gt;) =&gt; {
      debounceSearch(e.target.value)
   }, []);

   const handleSort = useCallback((sort: OnSortParam): void =&gt; {
      if (!!sort) {
         setApiRequest(prev =&gt; ({ 
            ...prev,<xsl:choose>
            <xsl:when test="@tenant='Isolated'">
            input: { 
               ...prev.input, 
               order_by: sort.key.toString(), 
               descending: sort.order == 'desc'
            },</xsl:when>
            <xsl:otherwise>
             order_by: sort.key.toString(), descending: sort.order == 'desc',</xsl:otherwise>
            </xsl:choose>
         }));
      }
   }, []);

   const handlePaginationChange = useCallback((page_number: number) =&gt; {
      setApiRequest(prev =&gt; ({
         ...prev,<xsl:choose>
         <xsl:when test="@tenant='Isolated'">
         input: { 
            ...prev.input,
            skip: (page_number - 1) * prev.input.take 
         },
         </xsl:when>
         <xsl:otherwise>
         skip: (page_number - 1) * prev.take,
         </xsl:otherwise>
         </xsl:choose>
      }));
   }, []);

   const handleSelectChange = useCallback((num: number) =&gt; {
      setApiRequest(prev =&gt; ({
         ...prev,
         <xsl:choose>
         <xsl:when test="@tenant='Isolated'">input: {
            ...prev.input,
            skip: 0,
            take: num,
         },
         </xsl:when>
         <xsl:otherwise>skip: 0,
         take: num,</xsl:otherwise>
         </xsl:choose>
      }));
      setTablePagingData(prev =&gt; ({ 
         ...prev, 
         pageSize: num // leave page number, wait for new data to return
      }));
   }, []);

   <xsl:if test="@uiDetail='true'">
   const detailLink = useCallback((<xsl:value-of select="$unique_id"/>: string) =&gt; {
      return `/super/<xsl:if test="not(@tenant='Route') and count(field[text()=$security_route])>0"><xsl:value-of select="$security_entity"/>/${<xsl:value-of select="$security_route"/>}/</xsl:if><xsl:value-of select="$name_lower"/>/${<xsl:value-of select="$unique_id"/>}`;
   }, []);

   const onCreate = useCallback((<xsl:value-of select="$name_lower"/>: I<xsl:value-of select="$name"/>): void =&gt; {
      if (<xsl:value-of select="$name_lower"/>) {
         navigate(detailLink(<xsl:value-of select="$name_lower"/>.<xsl:value-of select="$unique_id"/>));
      }
   }, []);</xsl:if>
	
   useEffect(() =&gt; {
      const paging = <xsl:value-of select="$name_plural_lower"/>?.data?.paging;
      if (paging) {
         setTablePagingData({
            total: paging.total_pages * paging.page_size,
            pageIndex: paging.current_page,
            pageSize: paging.page_size,
         });
      }
   }, [<xsl:value-of select="$name_plural_lower"/>?.data?.paging]);


	const columns = useMemo&lt;ColumnDef&lt;I<xsl:value-of select="$name"/>&gt;[]&gt;(
		() =&gt; [
         <xsl:if test="count(field[@uiList='true'])=0"><xsl:variable name="first_string_field"><xsl:choose><xsl:when test="string-length(@uiDisplayField)>0"><xsl:value-of select="@uiDisplayField"/></xsl:when><xsl:otherwise><xsl:value-of select="field[@type='string'][1]"/></xsl:otherwise></xsl:choose></xsl:variable>{
            id: '<xsl:value-of select="$first_string_field"/><xsl:if test="string-length($first_string_field)=0"><xsl:value-of select="field[1]/text()"/></xsl:if>',
            accessorKey: '<xsl:value-of select="$first_string_field"/><xsl:if test="string-length($first_string_field)=0"><xsl:value-of select="field[1]/text()"/></xsl:if>',
				header: '<xsl:call-template name="breakIntoWords"><xsl:with-param name="string" select="@friendlyName"/></xsl:call-template>',
				disableFilters: true,
				enableGlobalFilter: false,
            enableSorting: false
         },</xsl:if>
      		<xsl:for-each select="field[@uiList='true']">{
				id: '<xsl:value-of select="text()"/>',
				<xsl:choose>
					<xsl:when test="@isEnum='true'">accessorFn: (row) =&gt; <xsl:value-of select="@type"/>[row.<xsl:value-of select="text()"/>]</xsl:when>
					<xsl:when test="@type='boolean'">accessorFn: (row) =&gt; row.<xsl:value-of select="text()"/>?.toString()</xsl:when>
					<xsl:otherwise>accessorKey: '<xsl:value-of select="text()"/>'</xsl:otherwise>
				</xsl:choose>,
				header: '<xsl:call-template name="breakIntoWords"><xsl:with-param name="string" select="@friendlyName"/></xsl:call-template>',
				disableFilters: true,
				enableGlobalFilter: false,<xsl:choose>
            <xsl:when test="@sortable='true'">
            enableSorting: true</xsl:when>
            <xsl:otherwise>
            enableSorting: false</xsl:otherwise></xsl:choose>
			},
      		</xsl:for-each>
			<xsl:for-each select="field[string-length(@uiList)>0 and not(@uiList='true')]">{
				id: '<xsl:value-of select="text()"/>.<xsl:value-of select="@uiList"/>',
				accessorKey: '<xsl:value-of select="text()"/>.<xsl:value-of select="@uiList"/>',
				header: '<xsl:value-of select="@friendlyName"/>',
				disableFilters: true,
				enableGlobalFilter: false,
			},
      	</xsl:for-each>
         <xsl:choose><xsl:when test="@uiDetail='true' or @tenant='Route'">
         {
            header: '',
            id: 'action',
            cell: props =&gt; (
               &lt;Link to={detailLink(props.row.original.<xsl:value-of select="$unique_id"/>)}&gt;
                  &lt;Button variant="plain" icon={<TbArrowRight />}&gt;View&lt;/Button&gt;
               &lt;/Link&gt;
            )
         }</xsl:when><xsl:otherwise>
         {
            header: '',
            id: 'action',
            cell: props =&gt; &lt;<xsl:value-of select="$name"/>Editor is_create={false} <xsl:for-each select="field[@uiParent='true' and not(@tenant='true')]"><xsl:value-of select="text()"/>={props.row.original.<xsl:value-of select="text()"/>} </xsl:for-each> <xsl:value-of select="$unique_id"/>={props.row.original.<xsl:value-of select="$unique_id"/>} <xsl:if test="@tenant='Isolated'"><xsl:value-of select="$security_route"/>={<xsl:value-of select="$security_route"/>!}</xsl:if>/&gt;,
         }
         </xsl:otherwise></xsl:choose>
		],
		[]
	);

	

	return (
      &lt;AdaptiveCard className={classNames(expands &amp;&amp; 'h-full')}  bodyClass={classNames(expands &amp;&amp; 'h-full')}&gt;
         &lt;div className={classNames(expands &amp;&amp; 'h-full', 'flex flex-col gap-4')}&gt;
            &lt;div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2"&gt;
                  &lt;h3&gt;<xsl:value-of select="$name_friendly_plural"/>&lt;/h3&gt;
                  &lt;<xsl:value-of select="$name"/>Editor is_create={true} <xsl:if test="@uiDetail='true'">onCreate={onCreate} </xsl:if><xsl:for-each select="field[@uiParent='true' and not(@tenant='true')]"><xsl:value-of select="text()"/>={<xsl:value-of select="text()"/>!} </xsl:for-each> <xsl:if test="@tenant='Isolated'"><xsl:value-of select="$security_route"/>={<xsl:value-of select="$security_route"/>!}</xsl:if>/&gt;
            &lt;/div&gt;
            &lt;div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2"&gt;
               &lt;Input
                  placeholder="Search"
                  prefix={&lt;TbSearch className="text-lg" /&gt;}
                  onChange={handleSearchChange}
               /&gt;
               &lt;Button variant="plain" icon={&lt;Loading type="refreshing" loading={<xsl:value-of select="$name_plural_lower"/>.isFetching &amp;&amp; !!<xsl:value-of select="$name_plural_lower"/>?.data?.items} /&gt;} onClick={handleRefresh} /&gt;
            &lt;/div&gt;
            &lt;DataTable
               columns={columns}
               expands={expands}
               data={<xsl:value-of select="$name_plural_lower"/>?.data?.items || []}
               loading={<xsl:value-of select="$name_plural_lower"/>.isLoading}
               fetching={<xsl:value-of select="$name_plural_lower"/>.isFetching}
               pagingData={tablePagingData}
               onPaginationChange={handlePaginationChange}
               onSelectChange={handleSelectChange}
               onSort={handleSort}
            /&gt;
         &lt;/div&gt;
      &lt;/AdaptiveCard&gt;
	);
}

export default <xsl:value-of select="$name"/>List;

'''[ENDFILE]
</xsl:if>


<xsl:if test="@uiListCards='true'">
'''[STARTFILE:<xsl:value-of select="../@frontendPrefix"/>\views\super\crud\<xsl:value-of select="$name_lower"/>\<xsl:value-of select="$name"/>List.tsx]
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Card, Input } from '@/components/ui';
import { TbSearch } from 'react-icons/tb';
import useDebounce from '@/utils/hooks/useDebounce';
import Loading from '@/components/shared/Loading';
import { AdaptiveCard } from '@/components/shared';
import classNames from 'classnames';
import { Meta } from '@/@types/routes';
import { useAppDispatch } from '@/store/rootStore';

import { I<xsl:value-of select="$name"/> } from '@/<xsl:value-of select="$project_lower"/>/models/entities/<xsl:value-of select="$name_lower"/>';
import { <xsl:value-of select="$name_lower"/>Endpoints, useGet<xsl:value-of select="$name_plural"/>Query } from '@/<xsl:value-of select="$project_lower"/>/endpoints/entities/<xsl:value-of select="$name_camel"/>Api';
import { ListInput<xsl:value-of select="$name"/> } from '@/<xsl:value-of select="$project_lower"/>/models/entities/requests/list-input-<xsl:value-of select="$name_lower"/>';
import <xsl:value-of select="$name"/>Editor from './<xsl:value-of select="$name"/>Editor';<xsl:for-each select="field[@isEnum='true']">
<xsl:variable name="enum_type"><xsl:call-template name="ExtractArrayType"><xsl:with-param name="text" select="@type"/></xsl:call-template></xsl:variable>
<xsl:variable name="enum_type_lower"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="$enum_type"/></xsl:call-template></xsl:variable>
import { <xsl:value-of select="$enum_type"/> } from '@/<xsl:value-of select="$project_lower"/>/models/entities/<xsl:value-of select="$enum_type_lower"/>';</xsl:for-each>
<xsl:if test="@tenant='Isolated'">
import { RoutedInput } from '@/<xsl:value-of select="$project_lower"/>/models/routed-input';
</xsl:if>
import { Link, useNavigate, useParams } from 'react-router';

type <xsl:value-of select="$name"/>ListProps = Meta &amp; {
   expands?: boolean;<xsl:for-each select="field[@uiParent='true' and not(@tenant='true')]"><xsl:text>
   </xsl:text><xsl:value-of select="text()"/>?: string;</xsl:for-each>
}
function <xsl:value-of select="$name"/>List(props: <xsl:value-of select="$name"/>ListProps) {
	const { expands = true<xsl:for-each select="field[@uiParent='true' and not(@tenant='true')]">, <xsl:value-of select="text()"/></xsl:for-each> } = props;
   <xsl:if test="@tenant='Isolated'">const routeParams = useParams();
	const { <xsl:value-of select="$security_route"/> } = routeParams;
   </xsl:if>
   const dispatch = useAppDispatch();
   const navigate = useNavigate();
	const [apiRequest, setApiRequest] = useState&lt;<xsl:choose>
      <xsl:when test="@tenant='Isolated'">RoutedInput&lt;ListInput<xsl:value-of select="$name"/>&gt;</xsl:when>
      <xsl:otherwise>ListInput<xsl:value-of select="$name"/></xsl:otherwise>
   </xsl:choose>&gt;(() =&gt; {
      return <xsl:choose>
      <xsl:when test="@tenant='Isolated'">{
         <xsl:value-of select="$security_route"/>: <xsl:value-of select="$security_route"/>!,
         input: {
            skip: 0,
            take: 10000,
            order_by: <xsl:choose><xsl:when test="string-length(@uiDefaultSort)>0">'<xsl:value-of select="@uiDefaultSort"/>'</xsl:when><xsl:otherwise>undefined</xsl:otherwise></xsl:choose>,
            descending: false,
            keyword: undefined<xsl:for-each select="field[@uiParent='true' and not(@tenant='true')]">, 
            <xsl:value-of select="text()"/>: <xsl:value-of select="text()"/></xsl:for-each>
         }
      };</xsl:when>
         <xsl:otherwise>{
         skip: 0,
         take: 10000,
         order_by: undefined,
         descending: false,
         keyword: undefined<xsl:for-each select="field[@uiParent='true' and not(@tenant='true')]">,
         <xsl:value-of select="text()"/>: <xsl:value-of select="text()"/></xsl:for-each>
      };</xsl:otherwise>
      </xsl:choose>
   });

	const <xsl:value-of select="$name_plural_lower"/> = useGet<xsl:value-of select="$name_plural"/>Query({...apiRequest}, { refetchOnMountOrArgChange: true });

   const performSearch = (value: string) =&gt; {
      setApiRequest(prev =&gt; ({
         ...prev,<xsl:choose>
         <xsl:when test="@tenant='Isolated'">
         input: { 
            ...prev.input, 
            keyword: value,
            skip: 0 
         },</xsl:when>
         <xsl:otherwise>
         keyword: value,
         skip: 0</xsl:otherwise>
         </xsl:choose>
      }));
   }
   const debounceSearch = useDebounce((performSearch), 500)

	const handleRefresh = useCallback(() =&gt; {
      const request = {
         ...apiRequest,<xsl:choose>
         <xsl:when test="@tenant='Isolated'">
         input: { 
            ...apiRequest.input, 
            skip: 0
         },</xsl:when>
         <xsl:otherwise>
         skip: 0</xsl:otherwise>
         </xsl:choose>
      };
      dispatch(<xsl:value-of select="$name_lower"/>Endpoints.get<xsl:value-of select="$name_plural"/>.initiate(request, { forceRefetch: true }));
   }, []);

   const handleSearchChange = useCallback((e: ChangeEvent&lt;HTMLInputElement&gt;) =&gt; {
      debounceSearch(e.target.value)
   }, []);


   <xsl:if test="@uiDetail='true'">
   const detailLink = useCallback((<xsl:value-of select="$unique_id"/>: string) =&gt; {
      return `/super/<xsl:if test="not(@tenant='Route') and count(field[text()=$security_route])>0"><xsl:value-of select="$security_entity"/>/${<xsl:value-of select="$security_route"/>}/</xsl:if><xsl:value-of select="$name_lower"/>/${<xsl:value-of select="$unique_id"/>}`;
   }, []);

   const onCreate = useCallback((<xsl:value-of select="$name_lower"/>: I<xsl:value-of select="$name"/>): void =&gt; {
      if (<xsl:value-of select="$name_lower"/>) {
         navigate(detailLink(<xsl:value-of select="$name_lower"/>.<xsl:value-of select="$unique_id"/>));
      }
   }, []);</xsl:if>
	

	return (
      &lt;AdaptiveCard className={classNames(expands &amp;&amp; 'h-full')}  bodyClass={classNames(expands &amp;&amp; 'h-full')}&gt;
         &lt;div className={classNames(expands &amp;&amp; 'h-full', 'flex flex-col gap-4 mb-8')}&gt;
            &lt;div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2"&gt;
               &lt;div className="flex-1 flex flex-row items-center"&gt;
                  &lt;h3&gt;<xsl:value-of select="$name_friendly_plural"/>&lt;/h3&gt;
                  &lt;Button variant="plain" icon={&lt;Loading type="refreshing" loading={<xsl:value-of select="$name_plural_lower"/>.isFetching &amp;&amp; !!<xsl:value-of select="$name_plural_lower"/>?.data?.items} /&gt;} onClick={handleRefresh} /&gt;
                  &lt;div className="w-96"&gt;
                     &lt;Input
                        placeholder="Search"
                        prefix={&lt;TbSearch className="text-lg" /&gt;}
                        onChange={handleSearchChange}
                     /&gt;
                  &lt;/div&gt;
               &lt;/div&gt;
               &lt;<xsl:value-of select="$name"/>Editor is_create={true} <xsl:if test="@uiDetail='true'">onCreate={onCreate} </xsl:if><xsl:for-each select="field[@uiParent='true' and not(@tenant='true')]"><xsl:value-of select="text()"/>={<xsl:value-of select="text()"/>!} </xsl:for-each> <xsl:if test="@tenant='Isolated'"><xsl:value-of select="$security_route"/>={<xsl:value-of select="$security_route"/>!}</xsl:if>/&gt;
            &lt;/div&gt;
         &lt;/div&gt;
         {<xsl:value-of select="$name_plural_lower"/>.data?.items &amp;&amp; (
            <div className="flex flex-row flex-wrap mt-4 gap-4">
               {<xsl:value-of select="$name_plural_lower"/>.data.items.map(item =&gt; (
                  &lt;Card key={`<xsl:value-of select="$name_lower"/>_${item.<xsl:value-of select="field[1]/text()"/>}`} className="min-w-32 min-h-32 flex flex-col"&gt;
                     <xsl:if test="count(field[@uiList='true'])=0"><xsl:variable name="first_string_field"><xsl:choose><xsl:when test="string-length(@uiDisplayField)>0"><xsl:value-of select="@uiDisplayField"/></xsl:when><xsl:otherwise><xsl:value-of select="field[@type='string'][1]"/></xsl:otherwise></xsl:choose></xsl:variable>
                     &lt;div&gt;{item.<xsl:value-of select="$first_string_field"/><xsl:if test="string-length($first_string_field)=0"><xsl:value-of select="field[1]/text()"/></xsl:if>} &lt;/div&gt;
                     </xsl:if>
                     <xsl:for-each select="field[@uiList='true']">
                     &lt;div&gt;<xsl:call-template name="breakIntoWords"><xsl:with-param name="string" select="@friendlyName"/></xsl:call-template>: <xsl:choose>
                        <xsl:when test="@isEnum='true'">{<xsl:value-of select="@type"/>[item.<xsl:value-of select="text()"/>]}</xsl:when>
                        <xsl:when test="@type='boolean'">{item.<xsl:value-of select="text()"/>}.toString()</xsl:when>
                        <xsl:otherwise>{item.<xsl:value-of select="text()"/>}</xsl:otherwise>
                     </xsl:choose>
                     &lt;/div&gt;
                     </xsl:for-each>
                     <xsl:for-each select="field[string-length(@uiList)>0 and not(@uiList='true')]">
                        <xsl:call-template name="breakIntoWords"><xsl:with-param name="string" select="@friendlyName"/></xsl:call-template>: {item.<xsl:value-of select="text()"/>.<xsl:value-of select="@uiList"/>'}
                     </xsl:for-each>
                     &lt;div className="flex-1"&gt;&lt;/div&gt;
                     &lt;div className="mt-4 flex flex-row"&gt;&lt;/div&gt;
                     <xsl:choose>
                     <xsl:when test="@uiDetail='true' or @tenant='Route'">
                     &lt;Link to={detailLink(props.row.original.<xsl:value-of select="$unique_id"/>)}&gt;
                        &lt;Button variant="plain" icon={<TbArrowRight />}&gt;View&lt;/Button&gt;
                     &lt;/Link&gt;
                     </xsl:when>
                     <xsl:otherwise>
                     &lt;<xsl:value-of select="$name"/>Editor is_create={false} <xsl:for-each select="field[@uiParent='true' and not(@tenant='true')]"><xsl:value-of select="text()"/>={item.<xsl:value-of select="text()"/>} </xsl:for-each> <xsl:value-of select="$unique_id"/>={item.<xsl:value-of select="$unique_id"/>} <xsl:if test="@tenant='Isolated'"><xsl:value-of select="$security_route"/>={<xsl:value-of select="$security_route"/>!}</xsl:if>/&gt;
                     </xsl:otherwise>
                     </xsl:choose>
                  &lt;/Card&gt;
               ))}
            </div>
         )}

      &lt;/AdaptiveCard&gt;
	);
}

export default <xsl:value-of select="$name"/>List;


'''[ENDFILE]
</xsl:if>


<xsl:if test="@uiDetail='true' or count(../item/field[@uiParent='true' and @foreignKey=$name])">
'''[STARTFILE:<xsl:value-of select="../@frontendPrefix"/>\views\super\crud\<xsl:value-of select="$name_lower"/>\<xsl:value-of select="$name"/>Crumb.tsx]
import { ActionLink } from '@/components/shared';
<xsl:for-each select="field[@uiParent='true']">import <xsl:value-of select="@foreignKey"/>Crumb from '../<xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="@foreignKey"/></xsl:call-template>/<xsl:value-of select="@foreignKey"/>Crumb';</xsl:for-each>

export function navigationFor<xsl:value-of select="@name"/>(<xsl:if test="count(field[@uiParent='true'])>0"><xsl:value-of select="$security_route"/>?: string, </xsl:if><xsl:value-of select="$unique_id"/>?: string) {
   return `/super/<xsl:if test="count(field[@uiParent='true' and text()=$security_route])>0"><xsl:value-of select="$security_entity"/>/${<xsl:value-of select="$security_route"/>}/</xsl:if><xsl:value-of select="$name_lower"/>/${<xsl:value-of select="$unique_id"/>}`;
}

type <xsl:value-of select="@name"/>CrumbProps = {
   as_root?:boolean;
   <xsl:value-of select="$unique_id"/>?: string;
   <xsl:if test="count(field[@uiParent='true'])>0"><xsl:value-of select="$security_route"/>: string;</xsl:if>
}
function <xsl:value-of select="@name"/>Crumb({<xsl:value-of select="$unique_id"/>, as_root = false<xsl:if test="count(field[@uiParent='true'])>0">, <xsl:value-of select="$security_route"/></xsl:if>}: <xsl:value-of select="@name"/>CrumbProps) {
   return (
      &lt;&gt;<xsl:if test="count(field[@uiParent='true'])=0 and count(../item/field[@uiParent='true' and @foreignKey=$name])>0">
         &lt;ActionLink to={`/super/<xsl:if test="count(field[@uiParent='true'])>0"><xsl:value-of select="$security_entity"/>/${<xsl:value-of select="$security_route"/>}/</xsl:if><xsl:value-of select="$name_lower"/>`}&gt;<xsl:value-of select="$name_plural"/>&lt;/ActionLink&gt;
         </xsl:if><xsl:for-each select="field[@uiParent='true']">{/* //TODO:SHOULD:WILL:Crud Crumbs */}
         &lt;<xsl:value-of select="@foreignKey"/>Crumb <xsl:if test="count(../field[not(@uiParent='true') and text()=$security_route])>0"><xsl:value-of select="$security_route"/>={<xsl:value-of select="$security_route"/>}</xsl:if> /&gt;
         </xsl:for-each>
         { 
            !as_root &amp;&amp;
            &lt;&gt;
            &lt;span&gt;&amp;gt;&lt;/span&gt;
            &lt;ActionLink to={navigationFor<xsl:value-of select="@name"/>(<xsl:if test="count(field[@tenant='true' and not(@isolated='true')])>0"><xsl:value-of select="$security_route"/>, </xsl:if><xsl:value-of select="$unique_id"/>)}&gt;<xsl:value-of select="@name"/>&lt;/ActionLink&gt;
            &lt;/&gt;
         }
      &lt;/&gt;
   );
}

export default <xsl:value-of select="@name"/>Crumb;

'''[ENDFILE]
</xsl:if>


<xsl:if test="@uiDetail='true' or @tenant='Route'">
'''[STARTFILE:<xsl:value-of select="../@frontendPrefix"/>\views\super\crud\<xsl:value-of select="$name_lower"/>\<xsl:value-of select="$name"/>Detail.tsx]
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';
import classNames from '@/utils/classNames';
import { Meta } from '@/@types/routes';
import { ActionLink, AdaptiveCard } from '@/components/shared';
import { I<xsl:value-of select="$name"/> } from '@/<xsl:value-of select="$project_lower"/>/models/entities/<xsl:value-of select="$name_lower"/>';

import <xsl:value-of select="$name"/>Editor from './<xsl:value-of select="$name"/>Editor';
import { useGet<xsl:value-of select="$name"/>Query } from '@/<xsl:value-of select="$project_lower"/>/endpoints/entities/<xsl:value-of select="$name_camel"/>Api';
<xsl:for-each select="../item/field[@uiParent='true' and @foreignKey=$name]">
import <xsl:value-of select="../@name"/>List from '../<xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="../@name"/></xsl:call-template>/<xsl:value-of select="../@name"/>List';</xsl:for-each>
import Loading from '@/components/shared/Loading';
<xsl:for-each select="field[@uiParent='true']">import <xsl:value-of select="@foreignKey"/>Crumb, { navigationFor<xsl:value-of select="@foreignKey"/> } from '../<xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="@foreignKey"/></xsl:call-template>/<xsl:value-of select="@foreignKey"/>Crumb';
</xsl:for-each>
<xsl:if test="count(field[@uiParent='true'])=0 and count(../item/field[@uiParent='true' and @foreignKey=$name])>0">
import <xsl:value-of select="$name"/>Crumb, { navigationFor<xsl:value-of select="$name"/> } from '../<xsl:value-of select="$name_lower"/>/<xsl:value-of select="$name"/>Crumb';
</xsl:if>
<xsl:for-each select="field[@isolated='true']">
import <xsl:value-of select="$name"/>Crumb, { navigationFor<xsl:value-of select="$name"/> } from '../<xsl:value-of select="$name_lower"/>/<xsl:value-of select="$name"/>Crumb';
</xsl:for-each>
type <xsl:value-of select="$name"/>DetailProps = Meta &amp; {
   className?: string;
};

function <xsl:value-of select="$name"/>Detail(props: <xsl:value-of select="$name"/>DetailProps) {
   const { className } = props;
   const { <xsl:value-of select="$unique_id"/><xsl:for-each select="field[@tenant='true' and not(@isolated='true')]">, <xsl:value-of select="text()"/></xsl:for-each> } = useParams();
   const navigate = useNavigate();
   const { t } = useTranslation();

   const <xsl:value-of select="$name_lower"/>QueryInput = <xsl:choose>
      <xsl:when test="@tenant='Isolated'">{
         <xsl:value-of select="$security_route"/>: <xsl:value-of select="$security_route"/>!,
         input: <xsl:value-of select="$unique_id"/>!
      };</xsl:when>
         <xsl:otherwise><xsl:value-of select="$unique_id"/>!;</xsl:otherwise>
      </xsl:choose>

	let <xsl:value-of select="$name_lower"/> = useGet<xsl:value-of select="$name"/>Query(<xsl:value-of select="$name_lower"/>QueryInput, { refetchOnMountOrArgChange: true, skip: false });

   const onDelete = function (<xsl:value-of select="$name_lower"/>: I<xsl:value-of select="$name"/>) {
      <xsl:choose>
      <xsl:when test="count(field[@uiParent='true'])>0 and count(field[text()=$security_route])>0">navigate(navigationFor<xsl:for-each select="field[@uiParent='true']"><xsl:value-of select="@foreignKey"/></xsl:for-each>(<xsl:if test="count(field[@uiParent='true' and not(@tenant='true')])>0"><xsl:value-of select="$name_lower"/>.<xsl:value-of select="$security_route"/>, </xsl:if><xsl:value-of select="$name_lower"/>.<xsl:for-each select="field[@uiParent='true']"><xsl:value-of select="text()"/></xsl:for-each>));</xsl:when>
      <xsl:when test="count(field[@uiParent='true'])>0">navigate(navigationFor<xsl:for-each select="field[@uiParent='true']"><xsl:value-of select="@foreignKey"/></xsl:for-each>(<xsl:value-of select="$name_lower"/>.<xsl:for-each select="field[@uiParent='true']"><xsl:value-of select="text()"/></xsl:for-each>));</xsl:when>
      <xsl:otherwise>navigate(navigationFor<xsl:value-of select="$name"/>(''))</xsl:otherwise>
      </xsl:choose>
   };

   return (
      &lt;div className={classNames('', className)}&gt;
      
         &lt;div className="flex flex-row gap-2 mb-4 ml-2"&gt;
            <xsl:choose><xsl:when test="count(field[@uiParent='true'])>0">
            <xsl:for-each select="field[@uiParent='true']">&lt;<xsl:value-of select="@foreignKey"/>Crumb <xsl:value-of select="@foreignKeyField"/>={<xsl:value-of select="$name_lower"/>.data?.item?.<xsl:value-of select="text()"/>} <xsl:for-each select="../field[@tenant='true' and not(@isolated='true') and not(@uiParent='true')]"><xsl:value-of select="text()"/>={<xsl:value-of select="text()"/>!}</xsl:for-each>/&gt;</xsl:for-each>
            </xsl:when>
            <xsl:otherwise>
            &lt;<xsl:value-of select="$name"/>Crumb as_root={true} <xsl:value-of select="$unique_id"/>={<xsl:value-of select="$unique_id"/>!} /&gt;
            </xsl:otherwise></xsl:choose>
            &lt;span &gt;&amp;gt;&lt;/span&gt;
            <xsl:value-of select="$name_friendly"/>
         &lt;/div&gt;
         &lt;AdaptiveCard&gt;
            &lt;div className="flex flex-col gap-4"&gt;
               &lt;div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2"&gt;
                  &lt;h3 className="flex flex-row"&gt;<xsl:value-of select="$name_friendly"/>&lt;Loading loading={<xsl:value-of select="$name_lower"/>.isLoading} type="inline" className="ml-4" /&gt;&lt;/h3&gt;
                  <xsl:choose><xsl:when test="count(field[@uiParent='true' and not(@tenant='true')])>0">{
                     <xsl:value-of select="$name_lower"/>.data?.item &amp;&amp;
                     &lt;<xsl:value-of select="$name"/>Editor is_create={false} onDelete={onDelete} <xsl:for-each select="field[@uiParent='true' and not(@tenant='true')]"><xsl:value-of select="text()"/>={<xsl:value-of select="$name_lower"/>.data.item.<xsl:value-of select="text()"/>} </xsl:for-each> <xsl:value-of select="$unique_id"/>={<xsl:value-of select="$unique_id"/>!} <xsl:for-each select="field[@tenant='true' and not(@isolated='true')]"><xsl:value-of select="text()"/>={<xsl:value-of select="text()"/>!}</xsl:for-each> /&gt;
                  }</xsl:when>
                  <xsl:otherwise>
                  &lt;<xsl:value-of select="$name"/>Editor is_create={false} onDelete={onDelete} <xsl:value-of select="$unique_id"/>={<xsl:value-of select="$unique_id"/>!} <xsl:for-each select="field[@tenant='true' and not(@isolated='true')]"><xsl:value-of select="text()"/>={<xsl:value-of select="text()"/>!}</xsl:for-each> /&gt;
                  </xsl:otherwise></xsl:choose>
               &lt;/div&gt;
               &lt;div className="flex flex-col gap-2" &gt;
                  &lt;div&gt;<xsl:choose>
                  <xsl:when test="string-length(@uiDisplayField)>0">
                     Name: &lt;b&gt;{<xsl:value-of select="$name_lower"/>.data?.item?.<xsl:value-of select="@uiDisplayField"/>}&lt;/b&gt;&lt;/div&gt;
                  </xsl:when>
                  <xsl:when test="count(field[@type='string'])>0">
                     <xsl:value-of select="field[@type='string'][1]/@friendlyName"/>: &lt;b&gt;{<xsl:value-of select="$name_lower"/>.data?.item?.<xsl:value-of select="field[@type='string'][1]/text()"/>}&lt;/b&gt;&lt;/div&gt;
                  </xsl:when>
                  <xsl:otherwise>
                     <xsl:value-of select="$unique_id"/>
                  </xsl:otherwise></xsl:choose>
                  <xsl:for-each select="field[@uiDetail='true']">
                  &lt;div&gt;<xsl:value-of select="@friendlyName"/>: {<xsl:value-of select="$name_lower"/>.data?.item?.<xsl:value-of select="text()"/>}&lt;/div&gt;</xsl:for-each>
               &lt;/div&gt;
            &lt;/div&gt;
         &lt;/AdaptiveCard&gt;

         <xsl:for-each select="../item/field[@uiParent='true' and @foreignKey=$name]">&lt;div className='my-8'&gt;
            &lt;<xsl:value-of select="../@name"/>List expands={false} <xsl:if test="not(@tenant='true')"><xsl:value-of select="text()"/>={<xsl:value-of select="@foreignKeyField"/>!} </xsl:if>/&gt;
         &lt;/div&gt;
         </xsl:for-each>
      &lt;/div&gt;
   );
}

export default <xsl:value-of select="$name"/>Detail;

'''[ENDFILE]
</xsl:if>
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
<xsl:template name="Spaceless">
   <xsl:param name="text" />
   <xsl:call-template name="Replace">
      <xsl:with-param name="text" select="$text" />
      <xsl:with-param name="replace" select="' '" />
      <xsl:with-param name="by" select="''" />
   </xsl:call-template>
</xsl:template>
</xsl:stylesheet>