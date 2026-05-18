<?xml version="1.0" encoding="UTF-8" ?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
<xsl:key name="standardFieldType" match="items/item/field[not(@isEnum='true') and not(@hackUIDuplicate='true') and not(contains(@type,'.'))]" use="concat(../@name, translate(@type, '[]', ''))" />
<xsl:key name="projectionFieldTypeKey" match="items/item/projection/field" use="concat(../../@name, translate(@type, '[]', ''))" />
<xsl:key name="nestedFieldTypeKey" match="items/item/field[contains(@type,'.')]" use="concat(../@name, @type)" />
<xsl:key name="isClassProjectionKey" match="items/item/projection/field[@isClass='true']" use="concat(../../@name, translate(@type, '[]', ''))" />
<xsl:template match="/">


<xsl:for-each select="items/enum">
  <xsl:variable name="project"><xsl:value-of select="../@projectName"/></xsl:variable>
  <xsl:variable name="project_lower"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="../@projectName"/></xsl:call-template></xsl:variable>
  <xsl:variable name="name"><xsl:value-of select="@name"/></xsl:variable>
  <xsl:variable name="name_lower"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="@name"/></xsl:call-template></xsl:variable>

'''[STARTFILE:<xsl:value-of select="../@frontendPrefix"/>\<xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="../@projectName"/></xsl:call-template>\models\entities\<xsl:value-of select="$name_lower"/>.ts]
export enum <xsl:value-of select="$name"/> {
  <xsl:for-each select="field"><xsl:value-of select="text()"/> = <xsl:value-of select="@value"/>,
  </xsl:for-each>
}<xsl:variable name="enumType" select="@name"/><xsl:if test="count(../item/field[@enumString=$enumType])>0">
export enum <xsl:value-of select="$name"/>String {
  <xsl:for-each select="field"><xsl:value-of select="text()"/> = '<xsl:value-of select="text()"/>',
  </xsl:for-each>
}
</xsl:if>
<xsl:if test="count(field[string-length(@friendlyName)>0])>0">
const <xsl:value-of select="$name"/>Friendly: { [key: number]: string } = {};
<xsl:for-each select="field"><xsl:value-of select="$name"/>Friendly[<xsl:value-of select="$name"/>.<xsl:value-of select="text()"/>] = "<xsl:value-of select="@friendlyName"/>";
</xsl:for-each>
export { <xsl:value-of select="$name"/>Friendly }
</xsl:if>

'''[ENDFILE]

</xsl:for-each>





<xsl:for-each select="items/item[not(@uiGenerate='false')]">
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
  <xsl:variable name="uiDisplayField"><xsl:choose><xsl:when test="string-length(@uiDisplayField)>0"><xsl:value-of select="@uiDisplayField"/></xsl:when><xsl:when test="count(field[@type='string'])>0"><xsl:value-of select="field[@type='string'][1]/text()"/></xsl:when><xsl:otherwise><xsl:value-of select="field[1]/text()"/></xsl:otherwise></xsl:choose></xsl:variable>
  <xsl:variable name="self_type" select="@name"></xsl:variable>
  


'''[STARTFILE:<xsl:value-of select="../@frontendPrefix"/>\<xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="../@projectName"/></xsl:call-template>\models\entities\<xsl:value-of select="$name_lower"/>.ts]
import _ from 'lodash';
import { PartialDeep } from 'type-fest';
<xsl:for-each select="field[generate-id()=generate-id(key('standardFieldType',concat(../@name, translate(@type, '[]', '')))[1])]">
<xsl:variable name="parent_type"><xsl:call-template name="ExtractParentDomain">
   <xsl:with-param name="text" select="@type" />
</xsl:call-template></xsl:variable>
<xsl:variable name="current_type">
<xsl:call-template name="Replace">
	<xsl:with-param name="text" select="@type" />
	<xsl:with-param name="replace" select="'[]'" />
	<xsl:with-param name="by" select="''" />
</xsl:call-template></xsl:variable><xsl:if test="count(../../item[@name=$current_type])>0 and $self_type!=$current_type">
import { I<xsl:value-of select="$current_type"/> } from './<xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="$current_type"/></xsl:call-template>';
</xsl:if><xsl:if test="contains(@type,'.')">
import { <xsl:variable name="full_name">I<xsl:call-template name="Replace">
        <xsl:with-param name="text" select="@type" />
        <xsl:with-param name="replace" select="'.'" />
        <xsl:with-param name="by" select="'_'" />
    </xsl:call-template></xsl:variable>
<xsl:call-template name="Replace">
        <xsl:with-param name="text" select="$full_name" />
        <xsl:with-param name="replace" select="'[]'" />
        <xsl:with-param name="by" select="''" />
    </xsl:call-template> } from './<xsl:call-template name="ExtractParentDomain">
        <xsl:with-param name="text" select="@type" />
    </xsl:call-template>';
</xsl:if>
</xsl:for-each>
<xsl:for-each select="projection/field[@isClass='true' and generate-id()=generate-id(key('isClassProjectionKey',concat(../../@name, translate(@type, '[]', '')))[1])]"><xsl:variable name="parent"><xsl:call-template name="ExtractParent"><xsl:with-param name="text" select="@type" /></xsl:call-template></xsl:variable><xsl:variable name="parent_lowered"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="$parent"/></xsl:call-template></xsl:variable>
<xsl:if test="$self_type!=$parent">
import { I<xsl:value-of select="$parent"/> } from './<xsl:value-of select="$parent_lowered"/>';</xsl:if></xsl:for-each>
<xsl:for-each select="field[@isEnum='true']">
<xsl:variable name="enum_type"><xsl:call-template name="ExtractArrayType"><xsl:with-param name="text" select="@type"/></xsl:call-template></xsl:variable>
<xsl:variable name="enum_type_lower"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="$enum_type"/></xsl:call-template></xsl:variable>
import { <xsl:value-of select="$enum_type"/> } from './<xsl:value-of select="$enum_type_lower"/>';</xsl:for-each>
<xsl:for-each select="projection/field[generate-id()=generate-id(key('projectionFieldTypeKey',concat(../../@name, translate(@type, '[]', '')))[1])]"><xsl:if test="contains(@type,'.')"><xsl:variable name="parent"><xsl:call-template name="ExtractParent"><xsl:with-param name="text" select="@type" /></xsl:call-template></xsl:variable><xsl:variable name="parent_lowered"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="$parent"/></xsl:call-template></xsl:variable>
<xsl:if test="$self_type!=$parent">
import { <xsl:variable name="full_name">I<xsl:call-template name="Replace">
        <xsl:with-param name="text" select="@type" />
        <xsl:with-param name="replace" select="'.'" />
        <xsl:with-param name="by" select="'_'" />
    </xsl:call-template></xsl:variable>
<xsl:call-template name="Replace">
        <xsl:with-param name="text" select="$full_name" />
        <xsl:with-param name="replace" select="'[]'" />
        <xsl:with-param name="by" select="''" />
    </xsl:call-template> } from './<xsl:call-template name="ExtractParentDomain">
        <xsl:with-param name="text" select="@type" />
    </xsl:call-template>';</xsl:if>
</xsl:if><xsl:if test="@isEnum='true'">
import { <xsl:value-of select="@type"/> } from './<xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="@type"/></xsl:call-template>';</xsl:if>
</xsl:for-each>
<xsl:for-each select="field[string-length(@uiFacadeType)>0]">
import { <xsl:value-of select="@uiFacadeType"/> } from './<xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="@type"/></xsl:call-template>';
</xsl:for-each>
<xsl:for-each select="field[contains(@type,'.') and generate-id()=generate-id(key('nestedFieldTypeKey',concat(../@name, @type))[1])]"><xsl:variable name="parent_type">
<xsl:call-template name="ExtractParent">
   <xsl:with-param name="text" select="@type" />
</xsl:call-template></xsl:variable>
<xsl:if test="$self_type!=$parent_type">
import { <xsl:variable name="full_name">I<xsl:call-template name="Replace">
        <xsl:with-param name="text" select="@type" />
        <xsl:with-param name="replace" select="'.'" />
        <xsl:with-param name="by" select="'_'" />
    </xsl:call-template></xsl:variable>
<xsl:call-template name="Replace">
        <xsl:with-param name="text" select="$full_name" />
        <xsl:with-param name="replace" select="'[]'" />
        <xsl:with-param name="by" select="''" />
    </xsl:call-template> } from './<xsl:call-template name="ExtractParentDomain">
        <xsl:with-param name="text" select="@type" />
    </xsl:call-template>';
</xsl:if>
</xsl:for-each>

<xsl:variable name="first_string_field"><xsl:choose><xsl:when test="string-length(@uiDisplayField)>0"><xsl:value-of select="@uiDisplayField"/></xsl:when><xsl:otherwise><xsl:value-of select="field[@type='string' and not(text()='_id')][1]"/></xsl:otherwise></xsl:choose></xsl:variable>
<xsl:if test="not(@classOnly='true')">
export interface I<xsl:value-of select="$name"/>Option {
  <xsl:value-of select="field[1]/text()"/>: string;
  <xsl:value-of select="$first_string_field"/>: string;
}
</xsl:if>
export interface I<xsl:value-of select="$name"/> <xsl:if test="not(@classOnly='true')"> extends I<xsl:value-of select="$name"/>Option </xsl:if> {
  <xsl:choose>
	<xsl:when test="not(@classOnly='true')"><xsl:for-each select="field[not(string-length(@uiFacadeType)>0)]">
	<xsl:variable name="current_type"><xsl:call-template name="Replace"><xsl:with-param name="text" select="@type"/><xsl:with-param name="replace" select="'[]'" /><xsl:with-param name="by" select="''" /></xsl:call-template></xsl:variable><xsl:if test="position()>1 and not($first_string_field=text())"><xsl:value-of select="text()"/><xsl:if test="@isNullable='true' or position()=1">?</xsl:if>: <xsl:choose>
  <xsl:when test="string-length(@enumString)>0"><xsl:variable name="enumType" select="@enumString" />
  <xsl:for-each select="../../enum[@name=$enumType]/field"><xsl:if test="position()>1"> | </xsl:if>'<xsl:value-of select="text()"/>'</xsl:for-each>;
  </xsl:when>
  <xsl:otherwise>
  <xsl:if test="count(../../item[@name=$current_type])>0">I</xsl:if><xsl:call-template name="ReactType"><xsl:with-param name="type" select="@type"/></xsl:call-template>;
  </xsl:otherwise>
  </xsl:choose>
    
  </xsl:if></xsl:for-each><xsl:for-each select="field[string-length(@uiFacadeType)>0]"><xsl:value-of select="text()"/><xsl:if test="@isNullable='true' or position()=1">?</xsl:if>: <xsl:value-of select="@uiFacadeType"/>;</xsl:for-each>updated_utc?: Date,
  created_utc?: Date</xsl:when><xsl:otherwise>
	<xsl:for-each select="field[not(string-length(@uiFacadeType)>0)]"><xsl:if test="string-length(@obsolete)>0">/**
   * Obsolete: <xsl:value-of select="@obsolete"/>
   */
  </xsl:if><xsl:variable name="current_type"><xsl:call-template name="Replace"><xsl:with-param name="text" select="@type"/><xsl:with-param name="replace" select="'[]'" /><xsl:with-param name="by" select="''" /></xsl:call-template></xsl:variable><xsl:value-of select="text()"/><xsl:if test="@isNullable='true'">?</xsl:if>: <xsl:choose>
  <xsl:when test="string-length(@enumString)>0"><xsl:variable name="enumType" select="@enumString" /><xsl:for-each select="../../enum[@name=$enumType]/field"><xsl:if test="position()>1"> | </xsl:if>'<xsl:value-of select="text()"/>'</xsl:for-each>
  </xsl:when>
  <xsl:otherwise>
    <xsl:if test="count(../../item[@name=$current_type])>0">I</xsl:if>
	  <xsl:call-template name="ReactType"><xsl:with-param name="type" select="@type"/></xsl:call-template>
  </xsl:otherwise></xsl:choose>;
  </xsl:for-each><xsl:for-each select="field[string-length(@uiFacadeType)>0]">
  <xsl:value-of select="text()"/><xsl:if test="@isNullable='true'">?</xsl:if>: <xsl:value-of select="@uiFacadeType"/>;
  </xsl:for-each>
  </xsl:otherwise>
 </xsl:choose>
}
<xsl:for-each select="perspective[@sdkUpdate='true']"><xsl:variable name="current_perspective"><xsl:value-of select="@name"/></xsl:variable>
export interface I<xsl:value-of select="../@name"/>_<xsl:value-of select="@name"/>Perspective {
   <xsl:value-of select="../field[1]/text()" />: <xsl:call-template name="ReactType"><xsl:with-param name="type" select="../field[1]/@type"/></xsl:call-template>;
   <xsl:for-each select="../field[@tenant='true']"><xsl:value-of select="text()" />: <xsl:call-template name="ReactType"><xsl:with-param name="type" select="../field[1]/@type"/></xsl:call-template>;
   </xsl:for-each><xsl:for-each select="../field[@perspective=$current_perspective]"><xsl:value-of select="text()"/><xsl:if test="@isNullable='true'">?</xsl:if>: <xsl:if test="@isClass='true'">I</xsl:if><xsl:call-template name="ReactType"><xsl:with-param name="type" select="@type"/></xsl:call-template>;
   </xsl:for-each>
}
</xsl:for-each>
<xsl:for-each select="projection"><xsl:variable name="current_projection"><xsl:value-of select="@name"/></xsl:variable>
export interface I<xsl:value-of select="../@name"/>_<xsl:value-of select="@name"/><xsl:if test="string-length(@base)>0"> extends I<xsl:value-of select="../@name"/>_<xsl:value-of select="@base"/></xsl:if> {
   <xsl:for-each select="entry">
   <xsl:variable name="current_entry"><xsl:value-of select="text()"/></xsl:variable>
   <xsl:variable name="current_type"><xsl:call-template name="Replace"><xsl:with-param name="text" select="../../field[text()=$current_entry]/@type"/><xsl:with-param name="replace" select="'[]'" /><xsl:with-param name="by" select="''" /></xsl:call-template></xsl:variable>
   <xsl:if test="not($current_entry='updated_utc')">
   <xsl:value-of select="text()"/><xsl:for-each select="../../field[text()=$current_entry]"><xsl:if test="@isNullable='true'">?</xsl:if>: <xsl:if test="count(../../item[@name=$current_type])>0">I</xsl:if><xsl:call-template name="ReactType"><xsl:with-param name="type" select="@type"/></xsl:call-template></xsl:for-each>;
   </xsl:if></xsl:for-each>
   <xsl:for-each select="field">
      <xsl:variable name="current_entry"><xsl:value-of select="text()"/></xsl:variable>
   <xsl:variable name="current_type"><xsl:call-template name="Replace"><xsl:with-param name="text" select="../field[text()=$current_entry]/@type"/><xsl:with-param name="replace" select="'[]'" /><xsl:with-param name="by" select="''" /></xsl:call-template></xsl:variable>
   <xsl:value-of select="text()"/><xsl:if test="@isNullable='true'">?</xsl:if>: <xsl:if test="count(../../../item[@name=$current_type])>0">I</xsl:if><xsl:call-template name="ReactType"><xsl:with-param name="type" select="@type"/></xsl:call-template>;
   </xsl:for-each>
   updated_utc?: Date
}
</xsl:for-each>

function <xsl:value-of select="$name"/>(updates?: PartialDeep&lt;I<xsl:value-of select="$name"/>&gt;, original?: PartialDeep&lt;I<xsl:value-of select="$name"/>&gt;): I<xsl:value-of select="$name"/> {
	updates = updates || {};
	original = original || {};

	return _.defaults(updates, original, {
    <xsl:for-each select="field">
    <xsl:value-of select="text()"/>: <xsl:choose><xsl:when test="@isNullable='false'">
    <xsl:choose>
      <xsl:when test="@type='Uuid' and position()=1">undefined!</xsl:when>
      <xsl:when test="@type='int'">0</xsl:when>
      <xsl:when test="@type='decimal'">'0'</xsl:when>
      <xsl:when test="@type='Uuid'">undefined!</xsl:when>
      <xsl:when test="@type='boolean'">false</xsl:when>
      <xsl:when test="string-length(@enumString)>0"><xsl:variable name="enumType" select="@enumString" />'<xsl:value-of select="../../enum[@name=$enumType]/field[1]/text()"/>'</xsl:when>
      <xsl:when test="@type='string'">''</xsl:when>
      <xsl:when test="@isEnum='true'">
      <xsl:variable name="enum_type"><xsl:call-template name="ExtractArrayType"><xsl:with-param name="text" select="@type"/></xsl:call-template></xsl:variable>
      <xsl:value-of select="$enum_type"/>.<xsl:value-of select="../../enum[@name=$enum_type]/field[1]/text()"/> 
      </xsl:when>
      <xsl:otherwise>undefined!</xsl:otherwise>
      </xsl:choose>
    </xsl:when>
    <xsl:otherwise>undefined!</xsl:otherwise>
    </xsl:choose>,
    </xsl:for-each><xsl:if test="@useDocument='true'">
    created_utc: undefined,
    updated_utc: undefined</xsl:if>
	});
}

export default <xsl:value-of select="$name"/>;
'''[ENDFILE]

</xsl:for-each>


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
      <xsl:when test="$type='Date'">Date</xsl:when>
      <xsl:when test="$type='decimal'">number</xsl:when>
      <xsl:when test="$type='Uuid[]'">string[]</xsl:when>
      <xsl:when test="$type='int'">number</xsl:when>
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

</xsl:stylesheet>