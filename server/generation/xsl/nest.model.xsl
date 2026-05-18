<?xml version="1.0" encoding="UTF-8" ?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
<xsl:key name="perspectiveKey" match="items/item/field[string-length(@perspective)>0]" use="concat(../@name, @perspective)" />
<xsl:key name="isClassKey" match="items/item/field[@isClass='true']" use="concat(../@name, translate(@type, '[]', ''))" />
<xsl:key name="isEnumKey" match="items/item/field[@isEnum='true']" use="concat(../@name, @type)" />
<xsl:key name="isEnumProjectionKey" match="items/item/projection/field[@isEnum='true']" use="concat(../../@name,../@name, @type)" />
<xsl:key name="isClassProjectionKey" match="items/item/projection/field[@isClass='true']" use="concat(../../@name, translate(@type, '[]', ''))" />
<xsl:key name="standardFeatureFieldTypeKey" match="items/feature/entity[not(@isItem='true')]/field[not(@isEnum='true')]" use="concat(../../@name,../@name, translate(@type, '[]', ''))" />
<xsl:key name="isEnumFeatureFieldKey" match="items/feature/entity/field[@isEnum='true']" use="concat(../../@name, ../@name, translate(@type, '[]', ''))" />
<xsl:key name="nestedFeatureFieldTypeKey" match="items/feature/entity/field[contains(@type,'.')]" use="concat(../@name, @type)" />

<xsl:template match="/">



<xsl:for-each select="items/feature">
  <xsl:variable name="project"><xsl:value-of select="../@projectName"/></xsl:variable>
  <xsl:variable name="project_lower"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="../@projectName"/></xsl:call-template></xsl:variable>
  <xsl:variable name="name"><xsl:value-of select="@name"/></xsl:variable>
  <xsl:variable name="name_natural"><xsl:call-template name="breakIntoWords"><xsl:with-param name="string" select="@name"/></xsl:call-template></xsl:variable>
  <xsl:variable name="name_plural"><xsl:call-template name="Pluralize"><xsl:with-param name="inputString" select="@name"/></xsl:call-template></xsl:variable>
  <xsl:variable name="name_plural_lower"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="$name_plural"/></xsl:call-template></xsl:variable>
  <xsl:variable name="name_plural_natural"><xsl:call-template name="breakIntoWords"><xsl:with-param name="string" select="$name_plural"/></xsl:call-template></xsl:variable>
  <xsl:variable name="name_lower"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="@name"/></xsl:call-template></xsl:variable>
  <xsl:variable name="name_upper"><xsl:call-template name="ToUpper"><xsl:with-param name="inputString" select="@name"/></xsl:call-template></xsl:variable>


<xsl:for-each select="entity[not(@isItem='true')]">
  <xsl:variable name="entity"><xsl:value-of select="@name"/></xsl:variable>
  <xsl:variable name="entity_lower"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="@name"/></xsl:call-template></xsl:variable>
  <xsl:variable name="feature_lower"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="../@name"/></xsl:call-template></xsl:variable>

'''[STARTFILE:<xsl:value-of select="../../@backendPrefix"/>features\<xsl:value-of select="../@area"/>\<xsl:value-of select="$feature_lower"/>\models\<xsl:value-of select="$entity_lower"/>.ts]
import { registerSanitizedValidators } from 'src/shared/utils/sanitized.registry';
import type { SanitizedValidatorMap } from 'src/shared/types/sanitized.types';
import {
   assertString,
   assertStringArray,
   assertBoolean,
   assertNumber,
   assertUuid,
   assertDate,
   assertEnum,
   assertEnumArray,
   assertNested,
   assertNestedArray,
   assertPlainObject,
   optional,
} from 'src/shared/utils/sanitized.validators';

<xsl:for-each select="field[not(@isEnum='true') and generate-id()=generate-id(key('standardFeatureFieldTypeKey',concat(../../@name,../@name, translate(@type, '[]', '')))[1])]">
<xsl:variable name="parent_type"><xsl:call-template name="ExtractParent">
   <xsl:with-param name="text" select="@type" />
</xsl:call-template></xsl:variable>
<xsl:variable name="current_type">
<xsl:call-template name="Replace">
	<xsl:with-param name="text" select="@type" />
	<xsl:with-param name="replace" select="'[]'" />
	<xsl:with-param name="by" select="''" />
</xsl:call-template></xsl:variable><xsl:if test="count(../../../item[@name=$parent_type])>0">
import { <xsl:value-of select="$parent_type"/> } from 'src/entities/<xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="$parent_type"/></xsl:call-template>/<xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="$parent_type"/></xsl:call-template>.model';
</xsl:if>
<xsl:if test="count(../../entity[@name=$current_type and not(@isItem='true')])>0 ">
import { <xsl:if test="count(../../entity[@name=$current_type and not(@isItem='true')])>0">I<xsl:value-of select="$current_type"/>, </xsl:if><xsl:value-of select="$current_type"/> } from './<xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="$current_type"/></xsl:call-template>';
</xsl:if>
<xsl:if test="$current_type != parent_type and count(../../../item[@name=$current_type])>0">
import { <xsl:value-of select="$current_type"/> } from 'src/entities/<xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="$current_type"/></xsl:call-template>/<xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="$current_type"/></xsl:call-template>.model';
</xsl:if>
</xsl:for-each>
<xsl:for-each select="field[@isEnum='true' and generate-id()=generate-id(key('isEnumFeatureFieldKey', concat(../../@name, ../@name, translate(@type, '[]', '')))[1])]">
<xsl:variable name="enum_type"><xsl:call-template name="ExtractArrayType"><xsl:with-param name="text" select="@type"/></xsl:call-template></xsl:variable>
<xsl:variable name="enum_type_lower"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="$enum_type"/></xsl:call-template></xsl:variable>
import { <xsl:value-of select="$enum_type"/> } from 'src/entities/enums/<xsl:value-of select="$enum_type_lower"/>';
</xsl:for-each>

export interface I<xsl:value-of select="$entity"/> {
	<xsl:for-each select="field">
		<xsl:if test="string-length(@obsolete)>0">
  </xsl:if><xsl:variable name="current_type"><xsl:call-template name="Replace"><xsl:with-param name="text" select="@type"/><xsl:with-param name="replace" select="'[]'" /><xsl:with-param name="by" select="''" /></xsl:call-template></xsl:variable><xsl:value-of select="text()"/><xsl:if test="@isNullable='true'">?</xsl:if>: <xsl:if test="count(../../entity[@name=$current_type and not(@isItem='true')])>0">I</xsl:if><xsl:call-template name="NodeType"><xsl:with-param name="type" select="@type"/></xsl:call-template>;
   </xsl:for-each>
}

/** Registry key for Sanitize.for(<xsl:value-of select="$entity"/>). Use @Body(Sanitize.for(<xsl:value-of select="$entity"/>)) input: I<xsl:value-of select="$entity"/>. */
export class <xsl:value-of select="$entity"/> {}

const <xsl:value-of select="$entity_lower"/>Validators: SanitizedValidatorMap = {
<xsl:for-each select="field">
   <xsl:variable name="fn" select="text()"/>
   <xsl:variable name="opt" select="@isNullable='true'"/>
   <xsl:variable name="is_array" select="contains(@type,'[]')"/>
   <xsl:variable name="base_type"><xsl:call-template name="Replace"><xsl:with-param name="text" select="@type"/><xsl:with-param name="replace" select="'[]'"/><xsl:with-param name="by" select="''"/></xsl:call-template></xsl:variable>
   <xsl:value-of select="$fn"/>: <xsl:choose>
      <xsl:when test="@isClass='true' and not(contains(@type,'.')) and $is_array">
         <xsl:if test="$opt">(v) =&gt; optional(assertNestedArray(<xsl:value-of select="$base_type"/>))(v, '<xsl:value-of select="$fn"/>')</xsl:if>
         <xsl:if test="not($opt)">(v) =&gt; assertNestedArray(<xsl:value-of select="$base_type"/>)(v, '<xsl:value-of select="$fn"/>')</xsl:if>
      </xsl:when>
      <xsl:when test="@isClass='true' and not(contains(@type,'.'))">
         <xsl:if test="$opt">(v) =&gt; optional(assertNested(<xsl:value-of select="$base_type"/>))(v, '<xsl:value-of select="$fn"/>')</xsl:if>
         <xsl:if test="not($opt)">(v) =&gt; assertNested(<xsl:value-of select="$base_type"/>)(v, '<xsl:value-of select="$fn"/>')</xsl:if>
      </xsl:when>
      <xsl:when test="@isClass='true' and contains(@type,'.') and $is_array">
         <xsl:if test="$opt">(v) =&gt; optional(assertNestedArray(<xsl:value-of select="$base_type"/>))(v, '<xsl:value-of select="$fn"/>')</xsl:if>
         <xsl:if test="not($opt)">(v) =&gt; assertNestedArray(<xsl:value-of select="$base_type"/>)(v, '<xsl:value-of select="$fn"/>')</xsl:if>
      </xsl:when>
      <xsl:when test="@isClass='true' and contains(@type,'.')">
         <xsl:if test="$opt">(v) =&gt; optional(assertNested(<xsl:value-of select="$base_type"/>))(v, '<xsl:value-of select="$fn"/>')</xsl:if>
         <xsl:if test="not($opt)">(v) =&gt; assertNested(<xsl:value-of select="$base_type"/>)(v, '<xsl:value-of select="$fn"/>')</xsl:if>
      </xsl:when>
      <xsl:when test="@isEnum='true' and $is_array">
         <xsl:if test="$opt">(v) =&gt; optional(assertEnumArray(<xsl:value-of select="$base_type"/>))(v, '<xsl:value-of select="$fn"/>')</xsl:if>
         <xsl:if test="not($opt)">(v) =&gt; assertEnumArray(<xsl:value-of select="$base_type"/>)(v, '<xsl:value-of select="$fn"/>')</xsl:if>
      </xsl:when>
      <xsl:when test="@isEnum='true'">
         <xsl:if test="$opt">(v) =&gt; optional(assertEnum(<xsl:value-of select="@type"/>))(v, '<xsl:value-of select="$fn"/>')</xsl:if>
         <xsl:if test="not($opt)">(v) =&gt; assertEnum(<xsl:value-of select="@type"/>)(v, '<xsl:value-of select="$fn"/>')</xsl:if>
      </xsl:when>
      <xsl:when test="@type='Uuid'">
         <xsl:if test="$opt">(v) =&gt; optional(assertUuid)(v, '<xsl:value-of select="$fn"/>')</xsl:if>
         <xsl:if test="not($opt)">(v) =&gt; assertUuid(v, '<xsl:value-of select="$fn"/>')</xsl:if>
      </xsl:when>
      <xsl:when test="@type='Uuid[]'">
         <xsl:if test="$opt">(v) =&gt; optional(assertStringArray)(v, '<xsl:value-of select="$fn"/>')</xsl:if>
         <xsl:if test="not($opt)">(v) =&gt; assertStringArray(v, '<xsl:value-of select="$fn"/>')</xsl:if>
      </xsl:when>
      <xsl:when test="@type='string'">
         <xsl:if test="$opt">(v) =&gt; optional(assertString)(v, '<xsl:value-of select="$fn"/>')</xsl:if>
         <xsl:if test="not($opt)">(v) =&gt; assertString(v, '<xsl:value-of select="$fn"/>')</xsl:if>
      </xsl:when>
      <xsl:when test="@type='string[]'">
         <xsl:if test="$opt">(v) =&gt; optional(assertStringArray)(v, '<xsl:value-of select="$fn"/>')</xsl:if>
         <xsl:if test="not($opt)">(v) =&gt; assertStringArray(v, '<xsl:value-of select="$fn"/>')</xsl:if>
      </xsl:when>
      <xsl:when test="@type='boolean'">
         <xsl:if test="$opt">(v) =&gt; optional(assertBoolean)(v, '<xsl:value-of select="$fn"/>')</xsl:if>
         <xsl:if test="not($opt)">(v) =&gt; assertBoolean(v, '<xsl:value-of select="$fn"/>')</xsl:if>
      </xsl:when>
      <xsl:when test="@type='int'">
         <xsl:if test="$opt">(v) =&gt; optional(assertNumber)(v, '<xsl:value-of select="$fn"/>')</xsl:if>
         <xsl:if test="not($opt)">(v) =&gt; assertNumber(v, '<xsl:value-of select="$fn"/>')</xsl:if>
      </xsl:when>
      <xsl:when test="@type='Date'">
         <xsl:if test="$opt">(v) =&gt; optional(assertDate)(v, '<xsl:value-of select="$fn"/>')</xsl:if>
         <xsl:if test="not($opt)">(v) =&gt; assertDate(v, '<xsl:value-of select="$fn"/>')</xsl:if>
      </xsl:when>
      <xsl:otherwise>(v) =&gt; optional(assertPlainObject)(v, '<xsl:value-of select="$fn"/>')</xsl:otherwise>
   </xsl:choose>,
</xsl:for-each>
};

registerSanitizedValidators(<xsl:value-of select="$entity"/>, <xsl:value-of select="$entity_lower"/>Validators);

'''[ENDFILE]

</xsl:for-each>

</xsl:for-each>

<xsl:for-each select="items/enum">
   <xsl:variable name="name_lowered"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="@name"/></xsl:call-template></xsl:variable>
   <xsl:variable name="name"><xsl:value-of select="@name"/></xsl:variable>


'''[STARTFILE:<xsl:value-of select="../@backendPrefix"/>entities\enums\<xsl:value-of select="$name_lowered"/>.ts]
export enum <xsl:value-of select="$name"/> {<xsl:for-each select="field"><xsl:text>
   </xsl:text><xsl:value-of select="text()"/> = <xsl:value-of select="@value"/>,<xsl:if test="@current='true'">
   /**
    * Use caution, this value may change in future builds
    **/
   current = <xsl:value-of select="@value"/></xsl:if></xsl:for-each>
}<xsl:variable name="enumType" select="@name"/><xsl:if test="count(../item/field[@enumString=$enumType])>0">
export enum <xsl:value-of select="$name"/>String {
  <xsl:for-each select="field"><xsl:value-of select="text()"/> = '<xsl:value-of select="text()"/>',
  </xsl:for-each>
}
</xsl:if>
'''[ENDFILE]

</xsl:for-each>


<xsl:for-each select="items/item[@classOnly='true']">
   <xsl:variable name="name_lowered"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="@name"/></xsl:call-template></xsl:variable>
   <xsl:variable name="name"><xsl:value-of select="@name"/></xsl:variable>
   <xsl:variable name="self_type" select="@name"></xsl:variable>


'''[STARTFILE:<xsl:value-of select="../@backendPrefix"/>entities\<xsl:value-of select="$name_lowered"/>\<xsl:value-of select="$name_lowered"/>.model.ts]
<xsl:for-each select="field[@isClass='true' and generate-id()=generate-id(key('isClassKey',concat(../@name, translate(@type, '[]', '')))[1])]"><xsl:variable name="parent"><xsl:call-template name="ExtractParent"><xsl:with-param name="text" select="@type" /></xsl:call-template></xsl:variable><xsl:variable name="parent_lowered"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="$parent"/></xsl:call-template></xsl:variable>
<xsl:if test="$self_type!=$parent">import { <xsl:value-of select="$parent"/> } from 'src/entities/<xsl:value-of select="$parent_lowered"/>/<xsl:value-of select="$parent_lowered"/>.model';
</xsl:if></xsl:for-each>
<xsl:for-each select="field[@isEnum='true' and generate-id()=generate-id(key('isEnumKey',concat(../@name, @type))[1])]"><xsl:variable name="type"><xsl:call-template name="Replace"><xsl:with-param name="text" select="@type" /><xsl:with-param name="replace" select="'[]'" /><xsl:with-param name="by" select="''" /></xsl:call-template></xsl:variable><xsl:variable name="type_lowered"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="$type"/></xsl:call-template></xsl:variable>
import { <xsl:value-of select="$type"/> } from 'src/entities/enums/<xsl:value-of select="$type_lowered"/>';</xsl:for-each>
<xsl:if test="count(field[@type='string' and not(@html='true')])>0 or count(field[@type='string' and @truncateLog='true'])>0">
import { sanitizeHtml, truncateStart } from 'src/shared/utils/string.utils';</xsl:if>
// ===========================================
// Entity
// ===========================================

export class <xsl:value-of select="$name"/> {
   <xsl:for-each select="field"><xsl:variable name="current_type"><xsl:call-template name="Replace">
         <xsl:with-param name="text" select="@type" />
         <xsl:with-param name="replace" select="'[]'" />
         <xsl:with-param name="by" select="''" />
      </xsl:call-template></xsl:variable>
   <xsl:if test="string-length(@obsolete)>0">/**
   * Obsolete: <xsl:value-of select="@obsolete"/>
   */
   </xsl:if><xsl:value-of select="text()"/><xsl:if test="@isNullable='true'">?</xsl:if>: <xsl:choose><xsl:when test="string-length(@enumString)>0"><xsl:variable name="enumType" select="@enumString" /><xsl:for-each select="../../enum[@name=$enumType]/field"><xsl:if test="position()>1"> | </xsl:if>'<xsl:value-of select="text()"/>'</xsl:for-each></xsl:when><xsl:otherwise><xsl:call-template name="NodeType"><xsl:with-param name="type" select="$current_type"/></xsl:call-template></xsl:otherwise></xsl:choose><xsl:if test="contains(@type,'[]')">[]</xsl:if>;
   </xsl:for-each>

   constructor(data: Partial&lt;<xsl:value-of select="$name"/>&gt;) {
      Object.assign(this, data);
   }

   static sanitize(obj: <xsl:value-of select="$name"/>): void {
      if (!obj) return;<xsl:for-each select="field[@type='string' and string-length(@maxLength)>0 and @truncateLog='true']"><xsl:if test="@maxLength!='none'">
      if (obj.<xsl:value-of select="text()"/> &amp;&amp; obj.<xsl:value-of select="text()"/>.length &gt; <xsl:value-of select="@maxLength"/>) {
         obj.<xsl:value-of select="text()"/> = truncateStart(obj.<xsl:value-of select="text()"/>, <xsl:value-of select="@maxLength"/>);
      }</xsl:if></xsl:for-each><xsl:for-each select="field[@type='string' and @forceLower='true']">
      obj.<xsl:value-of select="text()"/> = obj.<xsl:value-of select="text()"/>?.toLowerCase();</xsl:for-each><xsl:for-each select="field[@type='string' and @forceUpper='true']">
      obj.<xsl:value-of select="text()"/> = obj.<xsl:value-of select="text()"/>?.toUpperCase();</xsl:for-each><xsl:for-each select="field[@type='string' and not(@html='true') and string-length(@enumString)=0]">
      obj.<xsl:value-of select="text()"/> = sanitizeHtml(obj.<xsl:value-of select="text()"/>, <xsl:choose><xsl:when test="contains(text(),'url')">true</xsl:when><xsl:otherwise>false</xsl:otherwise></xsl:choose>);</xsl:for-each><xsl:for-each select="field[@isClass='true' and not(contains(@type, '.'))]"><xsl:variable name="nested_type"><xsl:call-template name="Replace"><xsl:with-param name="text" select="@type"/><xsl:with-param name="replace" select="'[]'"/><xsl:with-param name="by" select="''"/></xsl:call-template></xsl:variable><xsl:choose><xsl:when test="contains(@type, '[]')">
      obj.<xsl:value-of select="text()"/>?.forEach(item =&gt; <xsl:value-of select="$nested_type"/>.sanitize(item));</xsl:when><xsl:otherwise>
      if (obj.<xsl:value-of select="text()"/>) <xsl:value-of select="$nested_type"/>.sanitize(obj.<xsl:value-of select="text()"/>);</xsl:otherwise></xsl:choose></xsl:for-each>
   }
}

'''[ENDFILE]

</xsl:for-each>



<xsl:for-each select="items/item[not(@classOnly='true')]">
   <xsl:variable name="name_lowered"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="@name"/></xsl:call-template></xsl:variable>
   <xsl:variable name="name"><xsl:value-of select="@name"/></xsl:variable>
   <xsl:variable name="unique_id" select="field[1]/text()"/>
   <xsl:variable name="self_type" select="@name"></xsl:variable>

'''[STARTFILE:<xsl:value-of select="../@backendPrefix"/>entities\<xsl:value-of select="$name_lowered"/>\<xsl:value-of select="$name_lowered"/>.model.ts]
<xsl:for-each select="field[@isClass='true' and generate-id()=generate-id(key('isClassKey',concat(../@name, translate(@type, '[]', '')))[1])]"><xsl:variable name="parent"><xsl:call-template name="ExtractParent"><xsl:with-param name="text" select="@type" /></xsl:call-template></xsl:variable><xsl:variable name="parent_lowered"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="$parent"/></xsl:call-template></xsl:variable>
<xsl:if test="$self_type!=$parent">
import { <xsl:value-of select="$parent"/> } from 'src/entities/<xsl:value-of select="$parent_lowered"/>/<xsl:value-of select="$parent_lowered"/>.model';</xsl:if></xsl:for-each>
<xsl:for-each select="field[@isEnum='true' and generate-id()=generate-id(key('isEnumKey',concat(../@name, @type))[1])]"><xsl:variable name="type"><xsl:call-template name="Replace"><xsl:with-param name="text" select="@type" /><xsl:with-param name="replace" select="'[]'" /><xsl:with-param name="by" select="''" /></xsl:call-template></xsl:variable><xsl:variable name="type_lowered"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="$type"/></xsl:call-template></xsl:variable>
import { <xsl:value-of select="$type"/> } from 'src/entities/enums/<xsl:value-of select="$type_lowered"/>';</xsl:for-each>
<xsl:for-each select="projection/field[@isEnum='true' and generate-id()=generate-id(key('isEnumProjectionKey',concat(../../@name, ../@name, @type))[1])]"><xsl:variable name="type"><xsl:call-template name="Replace"><xsl:with-param name="text" select="@type" /><xsl:with-param name="replace" select="'[]'" /><xsl:with-param name="by" select="''" /></xsl:call-template></xsl:variable><xsl:variable name="type_lowered"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="$type"/></xsl:call-template></xsl:variable>
import { <xsl:value-of select="$type"/> } from 'src/entities/enums/<xsl:value-of select="$type_lowered"/>';</xsl:for-each>
<xsl:for-each select="projection/field[@isClass='true' and generate-id()=generate-id(key('isClassProjectionKey',concat(../../@name, translate(@type, '[]', '')))[1])]"><xsl:variable name="parent"><xsl:call-template name="ExtractParent"><xsl:with-param name="text" select="@type" /></xsl:call-template></xsl:variable><xsl:variable name="parent_lowered"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="$parent"/></xsl:call-template></xsl:variable>
<xsl:if test="$self_type!=$parent">
import { <xsl:value-of select="$parent"/> } from 'src/entities/<xsl:value-of select="$parent_lowered"/>/<xsl:value-of select="$parent_lowered"/>.model';</xsl:if></xsl:for-each>
<xsl:for-each select="field[string-length(@extraImport)>0]"><xsl:variable name="type"><xsl:value-of select="@extraImport" /></xsl:variable><xsl:variable name="type_lowered"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="$type"/></xsl:call-template></xsl:variable>
import { <xsl:value-of select="$type"/> } from "../<xsl:value-of select="$type_lowered"/>/<xsl:value-of select="$type_lowered"/>.model";</xsl:for-each>
<xsl:if test="count(field[@type='string' and not(@html='true')])>0 or count(field[@type='string' and @truncateLog='true'])>0">
import { sanitizeHtml, truncateStart } from 'src/shared/utils/string.utils';</xsl:if>
// ===========================================
// Entity
// ===========================================

export class <xsl:value-of select="$name"/> {
   static Projection = {
      <xsl:for-each select="field">
      <xsl:value-of select="text()"/>: 1,
      </xsl:for-each>created_utc: 1,
      updated_utc: 1,<xsl:if test="count(field[@searchable='true'])>0">
      //searchable: 0, // here for visibility, we actively do not include `searchable`
   </xsl:if>
   };

   <xsl:for-each select="field"><xsl:variable name="current_type"><xsl:call-template name="Replace">
         <xsl:with-param name="text" select="@type" />
         <xsl:with-param name="replace" select="'[]'" />
         <xsl:with-param name="by" select="''" />
      </xsl:call-template></xsl:variable>
   <xsl:if test="string-length(@calculated)>0">/**
   * Calculated Field
   */
   </xsl:if>
   <xsl:value-of select="text()"/><xsl:if test="@isNullable='true'">?</xsl:if>: <xsl:choose>
     <xsl:when test="string-length(@enumString)>0"><xsl:variable name="enumType" select="@enumString" />
     <xsl:for-each select="../../enum[@name=$enumType]/field"><xsl:if test="position()>1"> | </xsl:if>'<xsl:value-of select="text()"/>'</xsl:for-each>;</xsl:when>
     <xsl:otherwise><xsl:call-template name="NodeType"><xsl:with-param name="type" select="$current_type"/></xsl:call-template><xsl:if test="contains(@type,'[]')">[]</xsl:if>;</xsl:otherwise>
   </xsl:choose><xsl:text>
   </xsl:text>
   </xsl:for-each>/**
   * System Field
   */
   created_utc?: Date;
   /**
   * System Field
   */
   updated_utc?: Date;
   <xsl:if test="count(field[@searchable='true'])>0">
   /**
   * System Field
   */
   searchable?: string;
   </xsl:if>
   <xsl:if test="count(field[string-length(@calculated)>0])>0">
   /**
   * System Field
   */
   calculation_utc?: Date;
   /**
   * System Field
   */
   calculation_agent?: string ;
   /**
   * System Field
   */
   calculation_reason?: string;
   </xsl:if>

   constructor(data: Partial&lt;<xsl:value-of select="$name"/>&gt;) {
      Object.assign(this, data);
   }

   static sanitize(obj: <xsl:value-of select="$name"/>): void {
      if (!obj) return;<xsl:for-each select="field[@type='string' and string-length(@maxLength)>0 and @truncateLog='true']"><xsl:if test="@maxLength!='none'">
      if (obj.<xsl:value-of select="text()"/> &amp;&amp; obj.<xsl:value-of select="text()"/>.length &gt; <xsl:value-of select="@maxLength"/>) {
         obj.<xsl:value-of select="text()"/> = truncateStart(obj.<xsl:value-of select="text()"/>, <xsl:value-of select="@maxLength"/>);
      }</xsl:if></xsl:for-each><xsl:for-each select="field[@type='string' and @forceLower='true']">
      obj.<xsl:value-of select="text()"/> = obj.<xsl:value-of select="text()"/>?.toLowerCase();</xsl:for-each><xsl:for-each select="field[@type='string' and @forceUpper='true']">
      obj.<xsl:value-of select="text()"/> = obj.<xsl:value-of select="text()"/>?.toUpperCase();</xsl:for-each><xsl:for-each select="field[@type='string' and not(@html='true') and string-length(@enumString)=0]">
      obj.<xsl:value-of select="text()"/> = sanitizeHtml(obj.<xsl:value-of select="text()"/>, <xsl:choose><xsl:when test="contains(text(),'url')">true</xsl:when><xsl:otherwise>false</xsl:otherwise></xsl:choose>);</xsl:for-each><xsl:for-each select="field[@isClass='true' and not(contains(@type, '.'))]"><xsl:variable name="nested_type"><xsl:call-template name="Replace"><xsl:with-param name="text" select="@type"/><xsl:with-param name="replace" select="'[]'"/><xsl:with-param name="by" select="''"/></xsl:call-template></xsl:variable><xsl:choose><xsl:when test="contains(@type, '[]')">
      obj.<xsl:value-of select="text()"/>?.forEach(item =&gt; <xsl:value-of select="$nested_type"/>.sanitize(item));</xsl:when><xsl:otherwise>
      if (obj.<xsl:value-of select="text()"/>) <xsl:value-of select="$nested_type"/>.sanitize(obj.<xsl:value-of select="text()"/>);</xsl:otherwise></xsl:choose></xsl:for-each>
   }
   
   <xsl:if test="count(field[string-length(@perspective)>0])>0">
        
   <xsl:for-each select="field[string-length(@perspective)>0 and generate-id()=generate-id(key('perspectiveKey',concat(../@name, @perspective))[1])]">
   <xsl:variable name="targetPerspective"><xsl:value-of select="@perspective" /></xsl:variable>
   as<xsl:value-of select="$targetPerspective"/>Perspective(): <xsl:value-of select="$name"/>.<xsl:value-of select="$targetPerspective"/>Perspective {
      return new <xsl:value-of select="$name"/>.<xsl:value-of select="$targetPerspective"/>Perspective(this);
   }
   </xsl:for-each>

   </xsl:if>

   <xsl:if test="count(field[string-length(@calculated)>0])>0">
   calculationMarkDirty(agent:string, reason?:string): void {
      this.calculation_utc = undefined;
      this.calculation_agent = agent;
      this.calculation_reason = reason;
   }
   calculationMarkClean(stamp_utc?: Date): void {
      this.calculation_utc = stamp_utc ?? new Date();
      this.calculation_agent = undefined;
      this.calculation_reason = undefined;
   }
   </xsl:if>

   <xsl:if test="count(field[string-length(@calculated)>0])>0">
   asCalculationsPerspective(): <xsl:value-of select="@name"/>.CalculationsPerspective {
      return new <xsl:value-of select="@name"/>.CalculationsPerspective(this);
   }
   <xsl:if test="not(@classOnly='true')">
   forCalculation(): <xsl:value-of select="@name"/>.CalculationSource {
      return new <xsl:value-of select="@name"/>.CalculationSource(this);
   }
   </xsl:if>
   </xsl:if>

   <xsl:for-each select="projection">
   to<xsl:value-of select="@name"/>(): <xsl:value-of select="../@name"/>.<xsl:value-of select="@name"/> {
      return <xsl:value-of select="../@name"/>.<xsl:value-of select="@name"/>.from<xsl:value-of select="../@name"/>(this);
   }
   </xsl:for-each>

   /** Fills this with allowed fields from partial. Skips primary key, system fields (searchable, created_utc, updated_utc), and calculated fields. */
   fillFromPartial(partial: Partial&lt;<xsl:value-of select="$name"/>&gt;): void {
      <xsl:for-each select="field[not(@calculated) and text()!=../field[1]/text()]">
      if (partial.<xsl:value-of select="text()"/> !== undefined) {
         this.<xsl:value-of select="text()"/> = partial.<xsl:value-of select="text()"/>!;
      }
      </xsl:for-each>
   }
}

<xsl:if test="count(field[string-length(@perspective)>0])>0 or count(projection)>0 or count(field[string-length(@calculated)>0])>0">
export namespace <xsl:value-of select="$name"/> {
   <xsl:if test="count(field[string-length(@calculated)>0])>0">
   <xsl:variable name="pkey_type"><xsl:call-template name="Replace">
	<xsl:with-param name="text" select="field[1]/@type" />
	<xsl:with-param name="replace" select="'[]'" />
	<xsl:with-param name="by" select="''" />
</xsl:call-template></xsl:variable>
   // ===========================================
   // Calculation Perspective
   // ===========================================
   export class CalculationsPerspective
   {
      static PROPERTIES:string[] = [<xsl:for-each select="field[string-length(@calculated)>0]"><xsl:if test="position()>1">, </xsl:if>"<xsl:value-of select="text()"/>"</xsl:for-each>];

      constructor(actual:<xsl:value-of select="@name"/>) {
         this.actual = actual;
      }
      
      private actual: <xsl:value-of select="@name"/>;

      get <xsl:value-of select="field[1]/text()"/>(): <xsl:call-template name="NodeType"><xsl:with-param name="type" select="$pkey_type"/></xsl:call-template> { 
         return this.actual.<xsl:value-of select="field[1]/text()"/>;
      }
      <xsl:for-each select="field[@tenant='true']">get <xsl:value-of select="text()"/>(): <xsl:call-template name="NodeType"><xsl:with-param name="type" select="@type"/></xsl:call-template><xsl:if test="@isNullable='true'"> | undefined</xsl:if><xsl:text> </xsl:text> { 
         return this.actual.<xsl:value-of select="text()"/>;
      }
      </xsl:for-each>
      <xsl:for-each select="field[string-length(@calculated)>0]">
      get <xsl:value-of select="text()"/>(): <xsl:call-template name="NodeType"><xsl:with-param name="type" select="@type"/></xsl:call-template><xsl:if test="@isNullable='true'"> | undefined</xsl:if><xsl:text> </xsl:text> { 
         return this.actual.<xsl:value-of select="text()"/>;
      }
      set <xsl:value-of select="text()"/>(value: <xsl:call-template name="NodeType"><xsl:with-param name="type" select="@type"/></xsl:call-template><xsl:if test="@isNullable='true'"> | undefined</xsl:if><xsl:text> </xsl:text>) { 
         this.actual.<xsl:value-of select="text()"/> = value;
      }
      </xsl:for-each>
      get calculation_agent(): string | undefined { 
         return this.actual.calculation_agent;
      }
      set calculation_agent(value:string) { 
         this.actual.calculation_agent = value;
      }

      get calculation_utc(): Date | undefined { 
         return this.actual.calculation_utc;
      }
      set calculation_utc(value: Date | undefined) { 
         this.actual.calculation_utc = value;
      }
      
      calculationMarkDirty(agent:string, reason?:string): void {
         const actual:<xsl:value-of select="@name"/>  = this.getActual();
         actual.calculation_utc = undefined;
         actual.calculation_agent = agent;
         actual.calculation_reason = reason;
      }

      calculationMarkClean(stamp_utc: Date | undefined): void {
         const actual:<xsl:value-of select="@name"/> = this.getActual();
         actual.calculation_utc = stamp_utc ?? new Date();
         actual.calculation_agent = undefined;
         actual.calculation_reason = undefined;
      }

      getActual(): <xsl:value-of select="@name"/> {
         return this.actual;
      }

      copyCalculationsToOther(other:CalculationsPerspective): void {
         if (!!other) {<xsl:for-each select="field[string-length(@calculated)>0]">
            other.<xsl:value-of select="text()"/> = this.<xsl:value-of select="text()"/>;</xsl:for-each>
         }
      }

      hasField(properties:string[]): boolean {
         if (!properties || properties.length == 0) {
            return false;
         }
         return CalculationsPerspective.PROPERTIES.some(x =&gt; properties.includes(x));
      }
   }

   // ===========================================
   // Synchronization Projection
   // ===========================================
   export class Synchronization
   {
      static Projection = {
         <xsl:value-of select="field[1]/text()"/>: 1<xsl:for-each select="field[@tenant='true']">,
         <xsl:value-of select="text()"/>: 1</xsl:for-each>
      };

      <xsl:for-each select="field[@tenant='true' or position()=1]"><xsl:variable name="fieldname"><xsl:value-of select="text()"/></xsl:variable>
      <xsl:value-of select="text()"/>: <xsl:call-template name="NodeType"><xsl:with-param name="type" select="@type"/></xsl:call-template>;
      </xsl:for-each>
   }

   <xsl:if test="not(@classOnly='true')">
   export class CalculationSource
   {
      constructor(actual: <xsl:value-of select="@name"/>) {
         this.actual = actual;
      }
      private actual:<xsl:value-of select="@name"/>;

      get <xsl:value-of select="field[1]/text()"/>(): <xsl:call-template name="NodeType"><xsl:with-param name="type" select="$pkey_type"/></xsl:call-template> { 
         return this.actual.<xsl:value-of select="field[1]/text()"/>;
      }

      <xsl:for-each select="field[string-length(@recalculate)>0]"><xsl:variable name="current_type"><xsl:call-template name="Replace">
	<xsl:with-param name="text" select="@type" />
	<xsl:with-param name="replace" select="'[]'" />
	<xsl:with-param name="by" select="''" />
</xsl:call-template></xsl:variable>
      get <xsl:value-of select="text()"/>(): <xsl:call-template name="NodeType"><xsl:with-param name="type" select="$current_type"/></xsl:call-template><xsl:if test="contains(@type,'[]')">[]</xsl:if><xsl:if test="@isNullable='true'"> | undefined</xsl:if> { 
         return this.actual.<xsl:value-of select="text()"/>;
      }
      set <xsl:value-of select="text()"/>(value: <xsl:call-template name="NodeType"><xsl:with-param name="type" select="$current_type"/></xsl:call-template><xsl:if test="contains(@type,'[]')">[]</xsl:if><xsl:if test="@isNullable='true'"> | undefined</xsl:if>) { 
         this.actual.<xsl:value-of select="text()"/> = value;
      }
      </xsl:for-each>

      /**
      * WARNING: Only use for routing fields (e.g. workspace_id). NEVER read fields here for
      * calculation logic — that bypasses change detection. If applyCalculations needs a field,
      * mark it recalculate="true" in the XML so it appears directly on CalculationSource.
      */
      getActual(): <xsl:value-of select="@name"/> {
         return this.actual;
      }
   }

   </xsl:if>
   </xsl:if>
   

   <xsl:if test="count(field[string-length(@perspective)>0])>0">
   // ===========================================
   // Custom Perspectives
   // ===========================================
   </xsl:if>
   <xsl:for-each select="field[string-length(@perspective)>0 and generate-id()=generate-id(key('perspectiveKey',concat(../@name, @perspective))[1])]">
   <xsl:variable name="targetPerspective"><xsl:value-of select="@perspective" /></xsl:variable>
   export class <xsl:value-of select="$targetPerspective"/>Perspective {
      constructor(private actual: <xsl:value-of select="$name"/>) {}
      /**
      * Only use for routing fields (e.g. workspace_id). Do NOT read non-routing fields from
      * the returned object — that bypasses dependency tracking and change detection.
      */
      getActual(): <xsl:value-of select="$name"/> {
         return this.actual;
      }

      get <xsl:value-of select="../field[1]/text()"/>(): string {
         return this.actual.<xsl:value-of select="../field[1]/text()"/>;
      }

      <xsl:for-each select="../field[@tenant='true' and not(@isolated='true')]"><xsl:variable name="current_type"><xsl:call-template name="Replace">
	<xsl:with-param name="text" select="@type" />
	<xsl:with-param name="replace" select="'[]'" />
	<xsl:with-param name="by" select="''" />
</xsl:call-template></xsl:variable>
      set <xsl:value-of select="text()"/>(value: <xsl:call-template name="NodeType"><xsl:with-param name="type" select="@type"/></xsl:call-template><xsl:if test="@isNullable='true'"> | undefined</xsl:if>) { 
         this.actual.<xsl:value-of select="text()"/> = value;
      }
      </xsl:for-each>
      <xsl:for-each select="../field[@tenant='true' and not(@isolated='true')]"><xsl:variable name="current_type"><xsl:call-template name="Replace">
	<xsl:with-param name="text" select="@type" />
	<xsl:with-param name="replace" select="'[]'" />
	<xsl:with-param name="by" select="''" />
</xsl:call-template></xsl:variable>
      get <xsl:value-of select="text()"/>() : <xsl:call-template name="NodeType"><xsl:with-param name="type" select="@type"/></xsl:call-template> {
         return this.actual.<xsl:value-of select="text()"/>;
      }
      </xsl:for-each>
      <xsl:for-each select="../field[@perspective=$targetPerspective and not(@postProcess='true')]"><xsl:variable name="current_type"><xsl:call-template name="Replace">
	<xsl:with-param name="text" select="@type" />
	<xsl:with-param name="replace" select="'[]'" />
	<xsl:with-param name="by" select="''" />
</xsl:call-template></xsl:variable>
      set <xsl:value-of select="text()"/>(value: <xsl:call-template name="NodeType"><xsl:with-param name="type" select="$current_type"/></xsl:call-template><xsl:if test="contains(@type,'[]')">[]</xsl:if><xsl:if test="@isNullable='true'"> | undefined</xsl:if>) { 
         this.actual.<xsl:value-of select="text()"/> = value;
      }
      get <xsl:value-of select="text()"/>() <xsl:if test="@isNullable='true'">: <xsl:call-template name="NodeType"><xsl:with-param name="type" select="$current_type"/></xsl:call-template><xsl:if test="contains(@type,'[]')">[]</xsl:if> | undefined</xsl:if> {
         return this.actual.<xsl:value-of select="text()"/>;
      }
      </xsl:for-each>
   }
   </xsl:for-each>

   <xsl:if test="count(projection)>0">
   // ===========================================
   // Projections
   // ===========================================
   </xsl:if>
   <xsl:for-each select="projection">
   export class <xsl:value-of select="@name"/>
   {
      static Projection = {
         <xsl:for-each select="entry">
         <xsl:value-of select="text()"/>: 1,
         </xsl:for-each><xsl:for-each select="field">
         <xsl:value-of select="text()"/>: 1,
         </xsl:for-each>
      };

      static from<xsl:value-of select="../@name"/>(data: <xsl:value-of select="../@name"/>) : <xsl:value-of select="@name"/> {
         const result = new <xsl:value-of select="@name"/>();
         <xsl:for-each select="entry">result.<xsl:value-of select="text()"/> = data.<xsl:value-of select="text()"/>;
         </xsl:for-each>
         return result;
      }
      static copyTo<xsl:value-of select="../@name"/>(source: <xsl:value-of select="../@name"/>.<xsl:value-of select="@name"/>, target: <xsl:value-of select="../@name"/>): void {
         <xsl:for-each select="entry">
            <xsl:variable name="field_name" select="text()"/>
         <xsl:for-each select="../../field[text()=$field_name]">
         <xsl:if test="text()=$unique_id or @tenant='true'">//Disallow: </xsl:if>target.<xsl:value-of select="text()"/> = source.<xsl:value-of select="text()"/>;
         </xsl:for-each>
         </xsl:for-each>
      }

      <xsl:for-each select="entry"><xsl:variable name="fieldname"><xsl:value-of select="text()"/></xsl:variable>
      <xsl:variable name="raw_type" select="../../field[text()=$fieldname]/@type" />
      <xsl:variable name="raw_enumString" select="../../field[text()=$fieldname]/@enumString" />
      <xsl:variable name="current_type"><xsl:call-template name="Replace">
         <xsl:with-param name="text" select="../../field[text()=$fieldname]/@type" />
         <xsl:with-param name="replace" select="'[]'" />
         <xsl:with-param name="by" select="''" />
      </xsl:call-template></xsl:variable><xsl:value-of select="text()"/><xsl:if test="../../field[text()=$fieldname]/@isNullable='true'">?</xsl:if>: <xsl:choose>
      <xsl:when test="string-length($raw_enumString)>0"><xsl:variable name="enumType" select="$raw_enumString" /><xsl:for-each select="../../../enum[@name=$enumType]/field"><xsl:if test="position()>1"> | </xsl:if>'<xsl:value-of select="text()"/>'</xsl:for-each></xsl:when>
      <xsl:otherwise><xsl:if test="text()='searchable'">string</xsl:if> <xsl:call-template name="NodeType"><xsl:with-param name="type" select="$current_type"/></xsl:call-template><xsl:if test="contains($raw_type,'[]')">[]</xsl:if>
      </xsl:otherwise>
      </xsl:choose>;
      </xsl:for-each>

      <xsl:for-each select="field">
      /**
       * Manually Hydrated
       */
      <xsl:value-of select="text()"/><xsl:if test="@isNullable='true'">?</xsl:if>: <xsl:call-template name="NodeType"><xsl:with-param name="type" select="@type"/></xsl:call-template>
      </xsl:for-each>
   }
   </xsl:for-each>
}
</xsl:if>
'''[ENDFILE]

'''[STARTFILE:<xsl:value-of select="../@backendPrefix"/>entities\<xsl:value-of select="$name_lowered"/>\list-input-<xsl:value-of select="$name_lowered"/>.ts]
import { ListInput } from 'src/shared/types/requests/list-input';
<xsl:for-each select="field[@isEnum='true' and @filter='true']"><xsl:variable name="enum_type"><xsl:call-template name="ExtractArrayType"><xsl:with-param name="text" select="@type"/></xsl:call-template></xsl:variable><xsl:variable name="enum_type_lower"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="$enum_type"/></xsl:call-template></xsl:variable>
import { <xsl:value-of select="$enum_type"/> } from 'src/entities/enums/<xsl:value-of select="$enum_type_lower"/>';</xsl:for-each>

export interface ListInput<xsl:value-of select="$name"/> extends ListInput {
   <xsl:for-each select="field[string-length(@foreignKey)>0 and not(@noGet='true') and not(@tenant='true')]"><xsl:value-of select="text()"/>?: string;
   </xsl:for-each>
   <xsl:for-each select="field[@filter='true' and string-length(@foreignKey)=0]"><xsl:value-of select="text()"/>?: <xsl:call-template name="NodeType"><xsl:with-param name="type" select="@type"/></xsl:call-template>;
   </xsl:for-each>
}
<xsl:for-each select="projection[@search='true']">
export interface ListInput<xsl:value-of select="$name"/><xsl:value-of select="@name"/> extends ListInput {
   <xsl:for-each select="../field[@foreignKey and not(@noGet='true') and not(@tenant='true')]"><xsl:value-of select="text()"/>?: string;
   </xsl:for-each>
}
</xsl:for-each>
'''[ENDFILE]

</xsl:for-each>

</xsl:template>

<xsl:template name="NodeType">
   <xsl:param name="type"/>
   <xsl:choose>
      <xsl:when test="$type='Uuid'">string</xsl:when>
      <xsl:when test="$type='Uuid[]'">string[]</xsl:when>
      <xsl:when test="$type='decimal'">string</xsl:when>
      <xsl:when test="$type='int'">number</xsl:when>
      <xsl:when test="$type='int[]'">number[]</xsl:when>
      <xsl:otherwise><xsl:value-of select="$type"/></xsl:otherwise>
   </xsl:choose>
</xsl:template>
<xsl:template name="MongooseType">
   <xsl:param name="type"/>
   <xsl:choose>
      <xsl:when test="$type='string'">String</xsl:when>
      <xsl:when test="$type='int'">Number</xsl:when>
      <xsl:when test="$type='decimal'">Decimal128</xsl:when>
      <xsl:when test="$type='boolean'">Boolean</xsl:when>
      <xsl:when test="$type='string[]'">[String]</xsl:when>
      <xsl:otherwise><xsl:value-of select="$type"/></xsl:otherwise>
   </xsl:choose>
</xsl:template>
<xsl:template match="@space"> </xsl:template>
<xsl:template name="ToLower">
   <xsl:param name="inputString"/>
   <xsl:variable name="smallCase" select="'abcdefghijklmnopqrstuvwxyz'"/>
   <xsl:variable name="upperCase" select="'ABCDEFGHIJKLMNOPQRSTUVWXYZ'"/>
   <xsl:value-of select="translate($inputString,$upperCase,$smallCase)"/>
</xsl:template>
<xsl:template name="ToUpper">
   <xsl:param name="inputString"/>
   <xsl:variable name="smallCase" select="'abcdefghijklmnopqrstuvwxyz'"/>
   <xsl:variable name="upperCase" select="'ABCDEFGHIJKLMNOPQRSTUVWXYZ'"/>
   <xsl:value-of select="translate($inputString,$smallCase,$upperCase)"/>
</xsl:template>
<xsl:template name="NoSpace">
   <xsl:param name="inputString"/>
   <xsl:variable name="spaces" select="' '"/>
   <xsl:variable name="underlines" select="''"/>
   <xsl:value-of select="translate($inputString,$spaces,$underlines)"/>
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
<xsl:template name="ExtractCharacterSize">
   <xsl:param name="text" />
   <xsl:call-template name="Replace">
      <xsl:with-param name="text"><xsl:call-template name="Replace">
         <xsl:with-param name="text" select="$text" />
         <xsl:with-param name="replace" select="'nvarchar('" />
         <xsl:with-param name="by" select="''" />
      </xsl:call-template></xsl:with-param>
      <xsl:with-param name="replace" select="')'" />
      <xsl:with-param name="by" select="''" />
   </xsl:call-template>
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
<xsl:template name="ExtractParent">
    <xsl:param name="text" />
    <xsl:choose>
      <xsl:when test="contains($text, '.')">
         <xsl:call-template name="Replace">
            <xsl:with-param name="text" select="substring-before($text, '.')" />
            <xsl:with-param name="replace" select="'[]'" />
            <xsl:with-param name="by" select="''" />
         </xsl:call-template>
      </xsl:when>
      <xsl:otherwise>
         <xsl:call-template name="Replace">
            <xsl:with-param name="text" select="$text" />
            <xsl:with-param name="replace" select="'[]'" />
            <xsl:with-param name="by" select="''" />
         </xsl:call-template>
      </xsl:otherwise>
   </xsl:choose>
</xsl:template>
<xsl:template name="ExtractChild">
    <xsl:param name="text" />
    <xsl:call-template name="Replace">
        <xsl:with-param name="text" select="substring-after($text, '.')" />
        <xsl:with-param name="replace" select="'[]'" />
        <xsl:with-param name="by" select="''" />
    </xsl:call-template>
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
<xsl:template name="ExtractArrayType">
    <xsl:param name="text" />
    <xsl:call-template name="Replace">
        <xsl:with-param name="text" select="$text" />
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
</xsl:stylesheet>