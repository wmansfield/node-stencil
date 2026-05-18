<?xml version="1.0" encoding="UTF-8" ?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
<xsl:key name="standardFieldType" match="items/item/field[not(@isEnum='true') and not(@hackUIDuplicate='true')]" use="concat(../@name, @type)" />
<xsl:key name="standardFeatureFieldTypeKey" match="items/feature/entity[not(@isItem='true')]/field[not(@isEnum='true')]" use="concat(../../@name,../@name, @type)" />
<xsl:key name="nestedFeatureFieldTypeKey" match="items/feature/entity/field[contains(@type,'.')]" use="concat(../@name, @type)" />
<xsl:key name="entityMutationTypesKey" match="items/item/mutation[string-length(@requestType)>0 or string-length(@itemResult)>0 or string-length(@listResult)>0]" use="concat(../@name, @requestType, @itemResult, @listResult)" />
<xsl:key name="entityQueryTypesKey" match="items/item/query[string-length(@requestType)>0 or string-length(@itemResult)>0 or string-length(@listResult)>0]" use="concat(../@name, @requestType, @itemResult, @listResult)" />
<xsl:key name="featureInvalidation" match="items/feature/query[string-length(@invalidation)>0]" use="concat(../@name, ../@area, @invalidation)" />

<xsl:variable name="security_route"><xsl:value-of select="items/@securityRoute"/></xsl:variable>

<xsl:template match="/">



<xsl:for-each select="items/item[not(@classOnly='true')]">
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
  <xsl:variable name="uiDisplayField"><xsl:choose><xsl:when test="string-length(@uiDisplayField)>0"><xsl:value-of select="@uiDisplayField"/></xsl:when><xsl:when test="count(field[@type='string'])>0"><xsl:value-of select="field[@type='string'][1]/text()"/></xsl:when><xsl:otherwise><xsl:value-of select="field[1]/text()"/></xsl:otherwise></xsl:choose></xsl:variable>




'''[STARTFILE:<xsl:value-of select="../@frontendPrefix"/>\<xsl:value-of select="$project_lower"/>\models\entities\requests\list-input-<xsl:value-of select="$name_lower"/>.ts]
import { ListInput } from "@/<xsl:value-of select="$project_lower"/>/models/list-input";
<xsl:for-each select="field[@isEnum='true']">import { <xsl:call-template name="ExtractArrayType"><xsl:with-param name="text" select="@type"/></xsl:call-template> } from "@/<xsl:value-of select="$project_lower"/>/models/entities/<xsl:call-template name="ToLower"><xsl:with-param name="inputString"><xsl:call-template name="ExtractArrayType"><xsl:with-param name="text" select="@type"/></xsl:call-template></xsl:with-param></xsl:call-template>"
</xsl:for-each>
export interface IListInput<xsl:value-of select="$name"/> extends ListInput<xsl:value-of select="$name"/> {
}
/** Obsolete: Will be removed in a future build, Use IListInput<xsl:value-of select="$name"/> */
export interface ListInput<xsl:value-of select="$name"/> extends ListInput {
   <xsl:for-each select="field[string-length(@foreignKey)>0 and not(@noGet='true') and not(@tenant='true')]"><xsl:value-of select="text()"/>?: <xsl:call-template name="ReactType"><xsl:with-param name="type" select="@type"/></xsl:call-template>;
   </xsl:for-each>
   <xsl:for-each select="field[@filter='true' and string-length(@foreignKey)=0]"><xsl:value-of select="text()"/>?: <xsl:call-template name="ReactType"><xsl:with-param name="type" select="@type"/></xsl:call-template>;
   </xsl:for-each>
   <xsl:for-each select="field[@nestedFilter='true' and string-length(@foreignKey)=0]"><xsl:variable name="entity" select="@type"/><xsl:variable name="root" select="text()"/><xsl:for-each select="../../item[@name=$entity]/field[@filter='true']"><xsl:value-of select="text()"/>?: <xsl:call-template name="ReactType"><xsl:with-param name="type" select="@type"/></xsl:call-template>;
   </xsl:for-each></xsl:for-each>
}
<xsl:for-each select="projection[@search='true']">
export interface IListInput<xsl:value-of select="$name"/><xsl:value-of select="@name"/> extends ListInput<xsl:value-of select="$name"/><xsl:value-of select="@name"/> {
}
/** Obsolete: Will be removed in a future build, Use IListInput<xsl:value-of select="$name"/><xsl:value-of select="@name"/> */
export interface ListInput<xsl:value-of select="$name"/><xsl:value-of select="@name"/> extends ListInput {
    <xsl:for-each select="../field[@foreignKey and not(@noGet='true') and not(@tenant='true')]"><xsl:value-of select="text()"/>?: string;
    </xsl:for-each>
	<xsl:for-each select="../field[@nestedFilter='true' and string-length(@foreignKey)=0]"><xsl:variable name="entity" select="@type"/><xsl:variable name="root" select="text()"/><xsl:for-each select="../../item[@name=$entity]/field[@filter='true']"><xsl:value-of select="text()"/>?: <xsl:call-template name="ReactType"><xsl:with-param name="type" select="@type"/></xsl:call-template>;
    </xsl:for-each></xsl:for-each>
}
</xsl:for-each>
'''[ENDFILE]


'''[STARTFILE:<xsl:value-of select="../@frontendPrefix"/>\<xsl:value-of select="$project_lower"/>\endpoints\entities\<xsl:value-of select="$name_camel"/>Api.ts]

import apiService from '@/<xsl:value-of select="$project_lower"/>/apiService';
import { I<xsl:value-of select="$name"/><xsl:for-each select="perspective[@sdkUpdate='true']">, I<xsl:value-of select="../@name"/>_<xsl:value-of select="@name"/>Perspective </xsl:for-each>} from '@/<xsl:value-of select="$project_lower"/>/models/entities/<xsl:value-of select="$name_lower"/>';
import { ItemResult, ItemResultMeta } from '@/<xsl:value-of select="$project_lower"/>/models/item-result';
import { ActionResult } from '@/<xsl:value-of select="$project_lower"/>/models/action-result';
import { ListInput } from '@/<xsl:value-of select="$project_lower"/>/models/list-input';
import { ListInput<xsl:value-of select="$name"/> } from '@/<xsl:value-of select="$project_lower"/>/models/entities/requests/list-input-<xsl:value-of select="$name_lower"/>';
import { ListResult, ListResultMeta } from '@/<xsl:value-of select="$project_lower"/>/models/list-result';
import { RoutedInput, RoutedNoInput } from '@/<xsl:value-of select="$project_lower"/>/models/routed-input';
<xsl:for-each select="projection">import { I<xsl:value-of select="../@name"/>_<xsl:value-of select="@name"/> } from '@/<xsl:value-of select="$project_lower"/>/models/entities/<xsl:value-of select="$name_lower"/>';
</xsl:for-each>
<xsl:for-each select="mutation[string-length(@requestType)>0 and generate-id()=generate-id(key('entityMutationTypesKey',concat(../@name,@requestType,@itemResult,@listResult))[1])]">
<xsl:if test="string-length(@requestType)>0">import { I<xsl:value-of select="@requestType"/> } from '@/<xsl:value-of select="$project_lower"/>/models/entities/<xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="@requestType"/></xsl:call-template>';</xsl:if>
<xsl:if test="string-length(@itemResult)>0">import { I<xsl:value-of select="@itemResult"/> } from '@/<xsl:value-of select="$project_lower"/>/models/entities/<xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="@itemResult"/></xsl:call-template>';</xsl:if>
<xsl:if test="string-length(@listResult)>0">import { I<xsl:value-of select="@listResult"/> } from '@/<xsl:value-of select="$project_lower"/>/models/entities/<xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="@listResult"/></xsl:call-template>';</xsl:if>
</xsl:for-each>
<xsl:for-each select="query[string-length(@requestType)>0 and generate-id()=generate-id(key('entityQueryTypesKey',concat(../@name,@requestType,@itemResult,@listResult))[1])]">
<xsl:if test="string-length(@requestType)>0">import { I<xsl:value-of select="@requestType"/> } from '@/<xsl:value-of select="$project_lower"/>/models/entities/<xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="@requestType"/></xsl:call-template>';</xsl:if>
<xsl:if test="string-length(@itemResult)>0">import { I<xsl:value-of select="@itemResult"/> } from '@/<xsl:value-of select="$project_lower"/>/models/entities/<xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="@itemResult"/></xsl:call-template>';</xsl:if>
<xsl:if test="string-length(@listResult)>0">import { I<xsl:value-of select="@listResult"/> } from '@/<xsl:value-of select="$project_lower"/>/models/entities/<xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="@listResult"/></xsl:call-template>';</xsl:if>
</xsl:for-each>
export const addTagTypes = ['<xsl:value-of select="$name_lower"/>', '<xsl:value-of select="$name_plural_lower"/>'<xsl:for-each select="query[string-length(@invalidation)>0]">, '<xsl:value-of select="@invalidation"/>'</xsl:for-each>] as const;

const <xsl:value-of select="$name_plural"/>Api = apiService
   .enhanceEndpoints({
      addTagTypes,
   })
   .injectEndpoints({
      endpoints: build =&gt; ({
         get<xsl:value-of select="$name_plural"/>: build.query&lt;ListResult&lt;I<xsl:value-of select="$name"/>&gt;, <xsl:if test="@tenant='Isolated'">RoutedInput&lt;</xsl:if>ListInput<xsl:value-of select="$name"/>&gt;<xsl:if test="@tenant='Isolated'">&gt;</xsl:if>({
            query: params =&gt; ({ 
               url: `admin/<xsl:if test="@tenant='Isolated'">${params.<xsl:value-of select="$security_route"/>}/</xsl:if><xsl:value-of select="$name_lower"/>/find`,
               method: 'GET',
               params: params<xsl:if test="@tenant='Isolated'">.input</xsl:if>
            }),
            providesTags: ['<xsl:value-of select="$name_plural_lower"/>']
         })<xsl:for-each select="query">,
         <xsl:value-of select="@name"/>: build.query&lt;<xsl:value-of select="@result"/>,<xsl:if test="not(../@tenant='Isolated')"> string</xsl:if><xsl:if test="../@tenant='Isolated'"><xsl:choose><xsl:when test="string-length(@request)>0">RoutedInput&lt;<xsl:value-of select="@request"/>&gt;</xsl:when><xsl:otherwise>RoutedNoInput</xsl:otherwise></xsl:choose></xsl:if> &gt;({
            query: (<xsl:choose><xsl:when test="../@tenant='Isolated'">{<xsl:value-of select="$security_route"/><xsl:if test="string-length(@request)>0">, input</xsl:if>}</xsl:when><xsl:when test="string-length(@request)>0">input</xsl:when></xsl:choose>) =&gt; ({
               url: `admin/<xsl:if test="../@tenant='Isolated'">${<xsl:value-of select="$security_route"/>}/</xsl:if><xsl:value-of select="$name_lower"/>/<xsl:value-of select="@route"/>`,
               <xsl:choose>
               <xsl:when test="@post='true'">method: 'POST',
               data: input</xsl:when>
               <xsl:when test="@delete='true'">method: 'DELETE'</xsl:when>
               <xsl:otherwise>method: 'GET',
               params: input</xsl:otherwise>
               </xsl:choose>
            }),
            providesTags: [<xsl:if test="string-length(@invalidation)>0">'<xsl:value-of select="@invalidation" />'</xsl:if>]
         })</xsl:for-each><xsl:for-each select="projection[@search='true']">,
         get<xsl:value-of select="$name_plural"/><xsl:value-of select="@name"/>: build.query&lt;ListResult&lt;I<xsl:value-of select="$name"/>_<xsl:value-of select="@name"/>&gt;, <xsl:if test="../@tenant='Isolated'">RoutedInput&lt;</xsl:if>ListInput<xsl:value-of select="$name"/>&gt;<xsl:if test="../@tenant='Isolated'">&gt;</xsl:if>({
            query: params =&gt; ({
               url: `admin/<xsl:if test="../@tenant='Isolated'">${params.<xsl:value-of select="$security_route"/>}/</xsl:if><xsl:value-of select="$name_lower"/>/search/<xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="@name"/></xsl:call-template>`,
               method: 'POST',
               data: params<xsl:if test="../@tenant='Isolated'">.input</xsl:if>
            }),
            providesTags: ['<xsl:value-of select="$name_plural_lower"/>'],
         })</xsl:for-each>,
			get<xsl:value-of select="$name"/>: build.query&lt;ItemResult&lt;I<xsl:value-of select="$name"/>&gt;, <xsl:if test="@tenant='Isolated'">RoutedInput&lt;</xsl:if>string&gt;<xsl:if test="@tenant='Isolated'">&gt;</xsl:if>({
				query: params =&gt; ({ 
					url: `admin/<xsl:if test="@tenant='Isolated'">${params.<xsl:value-of select="$security_route"/>}/</xsl:if><xsl:value-of select="$name_lower"/>/${params<xsl:if test="@tenant='Isolated'">.input</xsl:if>}`,
					method: 'GET'
				}),
				providesTags: ['<xsl:value-of select="$name_lower"/>']
			})<xsl:for-each select="projection[@get='true']">,
			get<xsl:value-of select="$name"/><xsl:value-of select="@name"/>: build.query&lt;ItemResult&lt;I<xsl:value-of select="$name"/>_<xsl:value-of select="@name"/>&gt;, <xsl:if test="../@tenant='Isolated'">RoutedInput&lt;</xsl:if>string&gt;<xsl:if test="../@tenant='Isolated'">&gt;</xsl:if>({
				query: (params) =&gt; ({ 
					url: `admin/<xsl:if test="../@tenant='Isolated'">${params.<xsl:value-of select="$security_route"/>}/</xsl:if><xsl:value-of select="$name_lower"/>/${params<xsl:if test="../@tenant='Isolated'">.input</xsl:if>}/<xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="@name"/></xsl:call-template>`,
          			method: 'GET',
				}),
				providesTags: ['<xsl:value-of select="$name_lower"/>']
			})</xsl:for-each>,
			delete<xsl:value-of select="$name"/>: build.mutation&lt;ActionResult, <xsl:if test="@tenant='Isolated'">RoutedInput&lt;</xsl:if>string&gt;<xsl:if test="@tenant='Isolated'">&gt;</xsl:if>({
				query: (params) =&gt; ({
					url: `admin/<xsl:if test="@tenant='Isolated' and count(field[@isolated='true'])=0">${params.<xsl:value-of select="$security_route"/>}/</xsl:if><xsl:value-of select="$name_lower"/>/${params<xsl:if test="@tenant='Isolated'">.input</xsl:if>}`,
					method: 'DELETE'
				}),
				invalidatesTags: ['<xsl:value-of select="$name_lower"/>', '<xsl:value-of select="$name_plural_lower"/>'<xsl:for-each select="query[string-length(@invalidation)>0]">, '<xsl:value-of select="@invalidation"/>'</xsl:for-each>]
			}),
			<xsl:if test="not(@noCreateApi='true')">create<xsl:value-of select="$name"/>: build.mutation&lt;ItemResult&lt;I<xsl:value-of select="$name"/>&gt;, I<xsl:value-of select="$name"/>&gt;({
				query: (<xsl:value-of select="$name_lower"/>) =&gt; {
					return {
						url: `admin/<xsl:if test="@tenant='Isolated' and count(field[@isolated='true'])=0">${<xsl:value-of select="$name_lower"/>.<xsl:value-of select="$security_route"/>}/</xsl:if><xsl:value-of select="$name_lower"/>`,
						method: 'POST',
						data: <xsl:value-of select="$name_lower"/>
					};
				},
				invalidatesTags: ['<xsl:value-of select="$name_lower"/>', '<xsl:value-of select="$name_plural_lower"/>'<xsl:for-each select="query[string-length(@invalidation)>0]">, '<xsl:value-of select="@invalidation"/>'</xsl:for-each>]
			}),</xsl:if>
			<xsl:if test="not(@noReplaceApi='true')">replace<xsl:value-of select="$name"/>: build.mutation&lt;ItemResult&lt;I<xsl:value-of select="$name"/>&gt;, I<xsl:value-of select="$name"/>&gt;({
				query: (<xsl:value-of select="$name_lower"/>) =&gt; ({
					url: `admin/<xsl:if test="@tenant='Isolated' and count(field[@isolated='true'])=0">${<xsl:value-of select="$name_lower"/>.<xsl:value-of select="$security_route"/>}/</xsl:if><xsl:value-of select="$name_lower"/>/${<xsl:value-of select="$name_lower"/>.<xsl:value-of select="$unique_id"/>}`,
					method: 'PUT',
					data: <xsl:value-of select="$name_lower"/>
				}),
				invalidatesTags: ['<xsl:value-of select="$name_lower"/>','<xsl:value-of select="$name_plural_lower"/>'<xsl:for-each select="query[string-length(@invalidation)>0]">, '<xsl:value-of select="@invalidation"/>'</xsl:for-each>]
			})</xsl:if><xsl:for-each select="perspective[@sdkUpdate='true']">,
			update<xsl:value-of select="../@name"/><xsl:value-of select="@name"/>: build.mutation&lt;ActionResult, I<xsl:value-of select="$name"/>_<xsl:value-of select="@name"/>Perspective&gt;({
				query: (perspective) =&gt; ({
					url: `admin/<xsl:if test="../@tenant='Isolated'">${perspective.<xsl:value-of select="$security_route"/>}/</xsl:if><xsl:value-of select="$name_lower"/>/${perspective.<xsl:value-of select="$unique_id"/>}/<xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="@name"/></xsl:call-template>`,
					method: 'POST',
					data: perspective
				}),
				invalidatesTags: ['<xsl:value-of select="$name_lower"/>', '<xsl:value-of select="$name_plural_lower"/>'<xsl:for-each select="query[string-length(@invalidation)>0]">, '<xsl:value-of select="@invalidation"/>'</xsl:for-each>]
			})</xsl:for-each>
			<xsl:for-each select="projection[@update='true' and not(@manualUpdate='true')]"><xsl:variable name="current_projection"><xsl:value-of select="@name"/></xsl:variable>,
			update<xsl:value-of select="../@name"/><xsl:value-of select="$current_projection"/>: build.mutation&lt;ActionResult, I<xsl:value-of select="$name"/>_<xsl:value-of select="@name"/>&gt;({
				query: (<xsl:value-of select="$name_lower"/>) =&gt; ({
					url: `admin/<xsl:if test="../@tenant='Isolated'">${<xsl:value-of select="$name_lower"/>.<xsl:value-of select="$security_route"/>}/</xsl:if><xsl:value-of select="$name_lower"/>/${<xsl:value-of select="$name_lower"/>.<xsl:value-of select="$unique_id"/>}/<xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="@name"/></xsl:call-template>`,
					method: 'POST',
					data: <xsl:value-of select="$name_lower"/>
				}),
				invalidatesTags: ['<xsl:value-of select="$name_lower"/>', '<xsl:value-of select="$name_plural_lower"/>'<xsl:for-each select="query[string-length(@invalidation)>0]">, '<xsl:value-of select="@invalidation"/>'</xsl:for-each>]
			})
			</xsl:for-each>
			
         <xsl:for-each select="query">
         <xsl:variable name="requestType"><xsl:value-of select="@requestType"/></xsl:variable>
         <xsl:variable name="itemResult"><xsl:value-of select="@itemResult"/></xsl:variable>
         <xsl:variable name="listResult"><xsl:value-of select="@listResult"/></xsl:variable>
         <xsl:variable name="itemResultParent"><xsl:call-template name="ExtractParent"><xsl:with-param name="text" select="$itemResult" /></xsl:call-template></xsl:variable>
         <xsl:variable name="item_result"><xsl:if test="count(../../item[@name=$itemResult])>0">I</xsl:if><xsl:value-of select="$itemResult"/></xsl:variable>
         <xsl:variable name="list_result"><xsl:if test="count(../../item[@name=$listResult])>0">I</xsl:if><xsl:value-of select="$listResult"/></xsl:variable>
         <xsl:call-template name="FirstLower"><xsl:with-param name="inputString" select="@name"/></xsl:call-template>: build.query&lt;<xsl:choose>
            <xsl:when test="string-length($item_result)>0">ItemResult&lt;<xsl:call-template name="ReactType"><xsl:with-param name="type" select="$item_result"/></xsl:call-template>&gt;</xsl:when>
            <xsl:when test="string-length($list_result)>0">ListResult&lt;<xsl:call-template name="ReactType"><xsl:with-param name="type" select="$list_result"/></xsl:call-template>&gt;</xsl:when>
            <xsl:otherwise>ListResult&lt;I<xsl:value-of select="../@name"/>&gt;</xsl:otherwise></xsl:choose>, <xsl:choose><xsl:when test="@requestRouted='true'">RoutedInput&lt;<xsl:if test="count(../../item[@name=$requestType])>0">I</xsl:if><xsl:value-of select="@requestType"/>&gt;</xsl:when><xsl:otherwise><xsl:if test="count(../../item[@name=$requestType])>0">I</xsl:if><xsl:value-of select="@requestType"/><xsl:if test="string-length(@requestType)=0">void</xsl:if></xsl:otherwise></xsl:choose>&gt;({
            query: (<xsl:if test="string-length(@request)>0"><xsl:value-of select="@request"/>: </xsl:if><xsl:choose><xsl:when test="@requestRouted='true'">RoutedInput&lt;<xsl:if test="count(../../item[@name=$requestType])>0">I</xsl:if><xsl:call-template name="ReactType"><xsl:with-param name="type" select="$requestType"/></xsl:call-template>&gt;</xsl:when><xsl:otherwise><xsl:if test="count(../../item[@name=$requestType])>0">I</xsl:if><xsl:value-of select="@requestType"/></xsl:otherwise></xsl:choose>) =&gt; ({
               url: `<xsl:value-of select="@route"/>`,
               <xsl:choose>
               <xsl:when test="@post='true'">method: 'POST',
               data: <xsl:value-of select="@request"/><xsl:if test="@requestRouted='true'">.input</xsl:if></xsl:when>
               <xsl:otherwise>method: 'GET',<xsl:if test="not(@requestType='string') and string-length(@request)>0">
               params: <xsl:value-of select="@request"/><xsl:if test="@requestRouted='true'">.input</xsl:if></xsl:if></xsl:otherwise>
               </xsl:choose>
            }),
            providesTags: [<xsl:if test="string-length(@invalidation)>0">'<xsl:value-of select="@invalidation" />'</xsl:if>]
         }),
         </xsl:for-each>
         <xsl:for-each select="mutation">
         <xsl:variable name="requestType"><xsl:value-of select="@requestType"/></xsl:variable>
         <xsl:variable name="itemResult"><xsl:value-of select="@itemResult"/></xsl:variable>
         <xsl:variable name="listResult"><xsl:value-of select="@listResult"/></xsl:variable>
         <xsl:variable name="itemResultParent"><xsl:call-template name="ExtractParent"><xsl:with-param name="text" select="$itemResult" /></xsl:call-template></xsl:variable>
         <xsl:variable name="item_result"><xsl:if test="count(../../item[@name=$itemResult])>0">I</xsl:if><xsl:value-of select="$itemResult"/></xsl:variable>
         <xsl:variable name="list_result"><xsl:if test="count(../../item[@name=$listResult])>0">I</xsl:if><xsl:value-of select="$listResult"/></xsl:variable>,
         <xsl:call-template name="FirstLower"><xsl:with-param name="inputString" select="@name"/></xsl:call-template>: build.mutation&lt;<xsl:choose>
            <xsl:when test="string-length($item_result)>0">ItemResult&lt;<xsl:call-template name="ReactType"><xsl:with-param name="type" select="$item_result"/></xsl:call-template>&gt;</xsl:when>
            <xsl:when test="string-length($list_result)>0">ListResult&lt;<xsl:call-template name="ReactType"><xsl:with-param name="type" select="$list_result"/></xsl:call-template>&gt;</xsl:when>
            <xsl:otherwise>ActionResult</xsl:otherwise></xsl:choose>, <xsl:choose><xsl:when test="@requestRouted='true'">RoutedInput&lt;<xsl:if test="count(../../item[@name=$requestType])>0">I</xsl:if><xsl:call-template name="ReactType"><xsl:with-param name="type" select="@requestType"/></xsl:call-template>&gt;</xsl:when><xsl:otherwise><xsl:if test="count(../../item[@name=$requestType])>0">I</xsl:if><xsl:call-template name="ReactType"><xsl:with-param name="type" select="@requestType"/></xsl:call-template><xsl:if test="string-length(@requestType)=0">void</xsl:if></xsl:otherwise></xsl:choose> &gt;({
            query: (<xsl:if test="string-length(@request)>0"><xsl:value-of select="@request"/>: </xsl:if><xsl:choose><xsl:when test="@requestRouted='true'">RoutedInput&lt;<xsl:if test="count(../../item[@name=$requestType])>0">I</xsl:if><xsl:call-template name="ReactType"><xsl:with-param name="type" select="$requestType"/></xsl:call-template>&gt;</xsl:when><xsl:otherwise><xsl:if test="count(../../item[@name=$requestType])>0">I</xsl:if><xsl:call-template name="ReactType"><xsl:with-param name="type" select="@requestType"/></xsl:call-template></xsl:otherwise></xsl:choose>) =&gt; ({
					url: `admin/<xsl:if test="../@tenant='Isolated'">${<xsl:value-of select="@request"/>.<xsl:value-of select="$security_route"/>}/</xsl:if><xsl:value-of select="$name_lower"/>/<xsl:value-of select="@route"/>`,
					<xsl:choose>
               <xsl:when test="@delete='true'">method: 'DELETE'</xsl:when>
               <xsl:otherwise>method: <xsl:choose><xsl:when test="@put='true'">'PUT'</xsl:when><xsl:otherwise>'POST'</xsl:otherwise></xsl:choose>
               <xsl:if test="string-length($requestType)> 0 and not($requestType='string') and not($requestType='boolean') and not($requestType='int')">,
					data: <xsl:value-of select="@request"/><xsl:if test="@requestRouted='true'">.input</xsl:if></xsl:if>
               </xsl:otherwise>
               </xsl:choose>
				}),
				invalidatesTags: ['<xsl:value-of select="$name_lower"/>', '<xsl:value-of select="$name_plural_lower"/>'<xsl:for-each select="query[string-length(@invalidation)>0]">, '<xsl:value-of select="@invalidation"/>'</xsl:for-each>]
			})
         </xsl:for-each>
		}),
		overrideExisting: false
	});

export default <xsl:value-of select="$name_plural"/>Api;

export const {
	useGet<xsl:value-of select="$name_plural"/>Query<xsl:for-each select="projection[@search='true']">,
	useGet<xsl:value-of select="$name_plural"/><xsl:value-of select="@name"/>Query</xsl:for-each><xsl:for-each select="projection[@get='true']">,
	useGet<xsl:value-of select="$name"/><xsl:value-of select="@name"/>Query</xsl:for-each>,
	useGet<xsl:value-of select="$name"/>Query,<xsl:for-each select="query">
	use<xsl:value-of select="@name"/>Query,</xsl:for-each>
	useDelete<xsl:value-of select="$name"/>Mutation,
	<xsl:if test="not(@noCreateApi='true')">useCreate<xsl:value-of select="$name"/>Mutation,</xsl:if>
	<xsl:if test="not(@noReplaceApi='true')">useReplace<xsl:value-of select="$name"/>Mutation,</xsl:if><xsl:for-each select="perspective[@sdkUpdate='true']">
	useUpdate<xsl:value-of select="../@name"/><xsl:value-of select="@name"/>Mutation,</xsl:for-each><xsl:for-each select="mutation">
	use<xsl:call-template name="FirstUpper"><xsl:with-param name="inputString" select="@name"/></xsl:call-template>Mutation,</xsl:for-each>
	<xsl:for-each select="projection[@update='true' and not(@manualUpdate='true')]"><xsl:variable name="current_projection"><xsl:value-of select="@name"/></xsl:variable>
	useUpdate<xsl:value-of select="../@name"/><xsl:value-of select="$current_projection"/>Mutation,</xsl:for-each>
	endpoints: <xsl:value-of select="$name_lower"/>Endpoints
} = <xsl:value-of select="$name_plural"/>Api;

export type <xsl:value-of select="$name_plural"/>ApiType = {
	[<xsl:value-of select="$name_plural"/>Api.reducerPath]: ReturnType&lt;typeof <xsl:value-of select="$name_plural"/>Api.reducer&gt;;
};


'''[ENDFILE]

</xsl:for-each>




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
  <xsl:variable name="name_camel"><xsl:call-template name="FirstLower"><xsl:with-param name="inputString" select="@name"/></xsl:call-template></xsl:variable>


<xsl:for-each select="entity[not(@isItem='true')]">
  <xsl:variable name="entity"><xsl:value-of select="@name"/></xsl:variable>
  <xsl:variable name="entity_lower"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="@name"/></xsl:call-template></xsl:variable>
  <xsl:variable name="feature_lower"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="../@name"/></xsl:call-template></xsl:variable>

'''[STARTFILE:<xsl:value-of select="../../@frontendPrefix"/>\<xsl:value-of select="$project_lower"/>\models\features\<xsl:value-of select="../@area"/>\<xsl:value-of select="$feature_lower"/>\<xsl:value-of select="$entity_lower"/>.ts]
<xsl:for-each select="field[not(@isEnum='true') and generate-id()=generate-id(key('standardFeatureFieldTypeKey',concat(../../@name,../@name, @type))[1])]">
<xsl:variable name="parent_type"><xsl:call-template name="ExtractParentDomain">
   <xsl:with-param name="text" select="@type" />
</xsl:call-template></xsl:variable>
<xsl:variable name="current_type">
<xsl:call-template name="Replace">
	<xsl:with-param name="text" select="@type" />
	<xsl:with-param name="replace" select="'[]'" />
	<xsl:with-param name="by" select="''" />
</xsl:call-template></xsl:variable>
<xsl:if test="count(../../../item[@name=$current_type])>0">
import { I<xsl:value-of select="$current_type"/> } from '@/<xsl:value-of select="$project_lower"/>/models/entities/<xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="$current_type"/></xsl:call-template>';
</xsl:if><xsl:if test="count(../../entity[@name=$current_type and not(@isItem='true')])>0">
import { I<xsl:value-of select="$current_type"/> } from './<xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="$current_type"/></xsl:call-template>';
</xsl:if><xsl:if test="contains(@type,'.')">// area 3
import { <xsl:variable name="full_name">I<xsl:call-template name="Replace">
        <xsl:with-param name="text" select="@type" />
        <xsl:with-param name="replace" select="'.'" />
        <xsl:with-param name="by" select="'_'" />
    </xsl:call-template></xsl:variable>
<xsl:call-template name="Replace">
        <xsl:with-param name="text" select="$full_name" />
        <xsl:with-param name="replace" select="'[]'" />
        <xsl:with-param name="by" select="''" />
    </xsl:call-template> } from '@/<xsl:value-of select="$project_lower"/>/models/entities/<xsl:call-template name="ExtractParentDomain">
        <xsl:with-param name="text" select="@type" />
    </xsl:call-template>';
</xsl:if>
</xsl:for-each>
<xsl:for-each select="field[@isEnum='true']">
<xsl:variable name="enum_type"><xsl:call-template name="ExtractArrayType"><xsl:with-param name="text" select="@type"/></xsl:call-template></xsl:variable>
<xsl:variable name="enum_type_lower"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="$enum_type"/></xsl:call-template></xsl:variable>
import { <xsl:value-of select="$enum_type"/> } from '@/<xsl:value-of select="$project_lower"/>/models/entities/<xsl:value-of select="$enum_type_lower"/>';</xsl:for-each>

export interface I<xsl:value-of select="$entity"/> {
	<xsl:for-each select="field">
      <xsl:variable name="parent_type"><xsl:call-template name="ExtractParent"><xsl:with-param name="text" select="@type" /></xsl:call-template></xsl:variable>
      <xsl:variable name="current_type"><xsl:call-template name="Replace"><xsl:with-param name="text" select="@type"/><xsl:with-param name="replace" select="'[]'" /><xsl:with-param name="by" select="''" /></xsl:call-template></xsl:variable>
      <xsl:value-of select="text()"/><xsl:if test="@isNullable='true'">?</xsl:if>: <xsl:if test="count(../../../item[@name=$parent_type])>0 or count(../../entity[@name=$parent_type])>0">I</xsl:if><xsl:call-template name="ReactType"><xsl:with-param name="type" select="@type"/></xsl:call-template>;
   </xsl:for-each>
}

'''[ENDFILE]

</xsl:for-each>

'''[STARTFILE:<xsl:value-of select="../@frontendPrefix"/>\<xsl:value-of select="$project_lower"/>\endpoints\features\<xsl:value-of select="@area"/>\<xsl:value-of select="$name_camel"/>Api.ts]
import apiService from '@/<xsl:value-of select="$project_lower"/>/apiService';
import { ItemResult, ItemResultMeta } from '@/<xsl:value-of select="$project_lower"/>/models/item-result';
import { ActionResult } from '@/<xsl:value-of select="$project_lower"/>/models/action-result';
import { ListInput } from '@/<xsl:value-of select="$project_lower"/>/models/list-input';
import { ListResult, ListResultMeta } from '@/<xsl:value-of select="$project_lower"/>/models/list-result';
import { RoutedInput, RoutedNoInput } from '@/<xsl:value-of select="$project_lower"/>/models/routed-input';

<xsl:for-each select="entity[not(@isItem='true')]">
  <xsl:variable name="entity"><xsl:value-of select="@name"/></xsl:variable>
  <xsl:variable name="entity_lower"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="@name"/></xsl:call-template></xsl:variable>
  <xsl:variable name="feature_lower"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="../@name"/></xsl:call-template></xsl:variable>
  <xsl:variable name="feature_area_lower"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="../@area"/></xsl:call-template></xsl:variable>
import { I<xsl:value-of select="$entity"/> } from '@/<xsl:value-of select="$project_lower"/>/models/features/<xsl:value-of select="$feature_area_lower"/>/<xsl:value-of select="$feature_lower"/>/<xsl:value-of select="$entity_lower"/>';
</xsl:for-each>
<xsl:for-each select="entity[@isItem='true']">
  <xsl:variable name="entity"><xsl:value-of select="@name"/></xsl:variable>
  <xsl:variable name="entityParent"><xsl:call-template name="ExtractParent"><xsl:with-param name="text" select="$entity" /></xsl:call-template></xsl:variable>
<xsl:if test="count(../../item[@name=$entityParent])>0">
<xsl:variable name="current_type">
<xsl:call-template name="Replace">
	<xsl:with-param name="text" select="$entity" />
	<xsl:with-param name="replace" select="'[]'" />
	<xsl:with-param name="by" select="''" />
</xsl:call-template></xsl:variable>
<xsl:if test="count(../../item[@name=$current_type])>0">
import { I<xsl:value-of select="$current_type"/> } from '@/<xsl:value-of select="$project_lower"/>/models/entities/<xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="$current_type"/></xsl:call-template>';
</xsl:if><xsl:if test="contains($entity,'.')">
import { <xsl:variable name="full_name">I<xsl:call-template name="Replace">
        <xsl:with-param name="text" select="$entity" />
        <xsl:with-param name="replace" select="'.'" />
        <xsl:with-param name="by" select="'_'" />
    </xsl:call-template></xsl:variable>
<xsl:call-template name="Replace">
        <xsl:with-param name="text" select="$full_name" />
        <xsl:with-param name="replace" select="'[]'" />
        <xsl:with-param name="by" select="''" />
    </xsl:call-template> } from '@/<xsl:value-of select="$project_lower"/>/models/entities/<xsl:call-template name="ExtractParentDomain">
        <xsl:with-param name="text" select="$entity" />
    </xsl:call-template>';
</xsl:if>
</xsl:if>
<xsl:if test="string-length(substring-after($entity, 'ListInput')) > 0">
import { I<xsl:value-of select="$entity"/>  } from '@/<xsl:value-of select="$project_lower"/>/models/entities/requests/list-input-<xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="substring-after($entity, 'ListInput')"/></xsl:call-template>';

</xsl:if>
</xsl:for-each>
export const addTagTypes = [<xsl:for-each select="query[string-length(@invalidation)>0 and generate-id()=generate-id(key('featureInvalidation',concat(../@name, ../@area, @invalidation))[1])]"><xsl:if test="position()>1">, </xsl:if>'<xsl:value-of select="@invalidation"/>'</xsl:for-each>] as const;

const <xsl:value-of select="$name"/>Api = apiService
   .enhanceEndpoints({
      addTagTypes,
   })
   .injectEndpoints({
      endpoints: build =&gt; ({
         <xsl:for-each select="query">
         <xsl:variable name="requestType"><xsl:value-of select="@requestType"/></xsl:variable>
         <xsl:variable name="itemResult"><xsl:value-of select="@itemResult"/></xsl:variable>
         <xsl:variable name="listResult"><xsl:value-of select="@listResult"/></xsl:variable>
         <xsl:variable name="itemResultParent"><xsl:call-template name="ExtractParent"><xsl:with-param name="text" select="$itemResult" /></xsl:call-template></xsl:variable>
         <xsl:variable name="item_result"><xsl:if test="count(../entity[@name=$itemResult])>0 or count(../../item[@name=$itemResult])>0">I</xsl:if><xsl:value-of select="$itemResult"/></xsl:variable>
         <xsl:variable name="list_result"><xsl:if test="count(../entity[@name=$listResult])>0 or count(../../item[@name=$listResult])>0">I</xsl:if><xsl:value-of select="$listResult"/></xsl:variable>
         <xsl:call-template name="FirstLower"><xsl:with-param name="inputString" select="@name"/></xsl:call-template>: build.query&lt;<xsl:choose>
            <xsl:when test="string-length($item_result)>0">ItemResult&lt;<xsl:call-template name="ReactType"><xsl:with-param name="type" select="$item_result"/></xsl:call-template>&gt;</xsl:when>
            <xsl:when test="string-length($list_result)>0">ListResult&lt;<xsl:call-template name="ReactType"><xsl:with-param name="type" select="$list_result"/></xsl:call-template>&gt;</xsl:when>
            <xsl:otherwise>ListResult&lt;I<xsl:value-of select="@entity"/>&gt;</xsl:otherwise></xsl:choose>, <xsl:choose><xsl:when test="@requestRouted='true'">RoutedInput&lt;<xsl:if test="count(../entity[@name=$requestType])>0 or count(../../item[@name=$requestType])>0">I</xsl:if><xsl:value-of select="@requestType"/>&gt;</xsl:when><xsl:otherwise><xsl:if test="count(../entity[@name=$requestType])>0 or count(../../item[@name=$requestType])>0">I</xsl:if><xsl:value-of select="@requestType"/><xsl:if test="string-length(@requestType)=0">void</xsl:if></xsl:otherwise></xsl:choose>&gt;({
            query: (<xsl:if test="string-length(@request)>0"><xsl:value-of select="@request"/>: </xsl:if><xsl:choose><xsl:when test="@requestRouted='true'">RoutedInput&lt;<xsl:if test="count(../entity[@name=$requestType])>0 or count(../../item[@name=$requestType])>0">I</xsl:if><xsl:call-template name="ReactType"><xsl:with-param name="type" select="$requestType"/></xsl:call-template>&gt;</xsl:when><xsl:otherwise><xsl:if test="count(../entity[@name=$requestType])>0 or count(../../item[@name=$requestType])>0">I</xsl:if><xsl:value-of select="@requestType"/></xsl:otherwise></xsl:choose>) =&gt; ({
               url: `<xsl:value-of select="@route"/>`,
               <xsl:choose>
               <xsl:when test="@post='true'">method: 'POST',
               data: <xsl:value-of select="@request"/><xsl:if test="@requestRouted='true'">.input</xsl:if></xsl:when>
               <xsl:otherwise>method: 'GET',<xsl:if test="not(@requestType='string') and string-length(@request)>0">
               params: <xsl:value-of select="@request"/><xsl:if test="@requestRouted='true'">.input</xsl:if></xsl:if></xsl:otherwise>
               </xsl:choose>
            }),
            providesTags: [<xsl:if test="string-length(@invalidation)>0">'<xsl:value-of select="@invalidation" />'</xsl:if>]
         }),
         </xsl:for-each><xsl:for-each select="mutation">
         <xsl:variable name="requestType"><xsl:value-of select="@requestType"/></xsl:variable>
         <xsl:variable name="itemResult"><xsl:value-of select="@itemResult"/></xsl:variable>
         <xsl:variable name="listResult"><xsl:value-of select="@listResult"/></xsl:variable>
         <xsl:variable name="itemResultParent"><xsl:call-template name="ExtractParent"><xsl:with-param name="text" select="$itemResult" /></xsl:call-template></xsl:variable>
         <xsl:variable name="item_result"><xsl:if test="count(../entity[@name=$itemResult])>0 or count(../../item[@name=$itemResult])>0">I</xsl:if><xsl:value-of select="$itemResult"/></xsl:variable>
         <xsl:variable name="list_result"><xsl:if test="count(../entity[@name=$listResult])>0 or count(../../item[@name=$listResult])>0">I</xsl:if><xsl:value-of select="$listResult"/></xsl:variable>
			<xsl:call-template name="FirstLower"><xsl:with-param name="inputString" select="@name"/></xsl:call-template>: build.mutation&lt;<xsl:choose>
            <xsl:when test="string-length($item_result)>0">ItemResult&lt;<xsl:call-template name="ReactType"><xsl:with-param name="type" select="$item_result"/></xsl:call-template>&gt;</xsl:when>
            <xsl:when test="string-length($list_result)>0">ListResult&lt;<xsl:call-template name="ReactType"><xsl:with-param name="type" select="$list_result"/></xsl:call-template>&gt;</xsl:when>
            <xsl:otherwise>ActionResult</xsl:otherwise></xsl:choose>, <xsl:choose><xsl:when test="@requestRouted='true'">RoutedInput&lt;<xsl:if test="count(../entity[@name=$requestType])>0 or count(../../item[@name=$requestType])>0">I</xsl:if><xsl:call-template name="ReactType"><xsl:with-param name="type" select="@requestType"/></xsl:call-template>&gt;</xsl:when><xsl:otherwise><xsl:if test="count(../entity[@name=$requestType])>0 or count(../../item[@name=$requestType])>0">I</xsl:if><xsl:call-template name="ReactType"><xsl:with-param name="type" select="@requestType"/></xsl:call-template><xsl:if test="string-length(@requestType)=0">void</xsl:if></xsl:otherwise></xsl:choose> &gt;({
            query: (<xsl:if test="string-length(@request)>0"><xsl:value-of select="@request"/>: </xsl:if><xsl:choose><xsl:when test="@requestRouted='true'">RoutedInput&lt;<xsl:if test="count(../entity[@name=$requestType])>0 or count(../../item[@name=$requestType])>0">I</xsl:if><xsl:call-template name="ReactType"><xsl:with-param name="type" select="$requestType"/></xsl:call-template>&gt;</xsl:when><xsl:otherwise><xsl:if test="count(../entity[@name=$requestType])>0 or count(../../item[@name=$requestType])>0">I</xsl:if><xsl:call-template name="ReactType"><xsl:with-param name="type" select="@requestType"/></xsl:call-template></xsl:otherwise></xsl:choose>) =&gt; ({
					url: `<xsl:value-of select="@route"/>`,
					<xsl:choose>
               <xsl:when test="@delete='true'">method: 'DELETE'</xsl:when>
               <xsl:otherwise>method: <xsl:choose><xsl:when test="@put='true'">'PUT'</xsl:when><xsl:otherwise>'POST'</xsl:otherwise></xsl:choose>
               <xsl:if test="string-length($requestType)> 0 and not($requestType='string') and not($requestType='boolean') and not($requestType='int')">,
					data: <xsl:value-of select="@request"/><xsl:if test="@requestRouted='true'">.input</xsl:if></xsl:if>
               </xsl:otherwise>
               </xsl:choose><xsl:if test="string-length(@authToken)>0 or string-length(@authJurisdiction)>0">,
               headers: { <xsl:if test="string-length(@authToken)>0">Authorization: `Bearer ${<xsl:value-of select="@authToken"/>}`,</xsl:if>
               <xsl:if test="string-length(@authJurisdiction)>0">'x-jurisdiction': <xsl:value-of select="@authJurisdiction"/>, </xsl:if> }</xsl:if>
				}),
				invalidatesTags: [<xsl:if test="string-length(@invalidation)>0">'<xsl:value-of select="@invalidation" />'</xsl:if>]
			}),

         </xsl:for-each>
		}),
		overrideExisting: false
	});

export default <xsl:value-of select="$name"/>Api;

export const {<xsl:for-each select="query">
	use<xsl:call-template name="FirstUpper"><xsl:with-param name="inputString" select="@name"/></xsl:call-template>Query,</xsl:for-each><xsl:for-each select="mutation">
   use<xsl:call-template name="FirstUpper"><xsl:with-param name="inputString" select="@name"/></xsl:call-template>Mutation,</xsl:for-each>
	endpoints: <xsl:call-template name="FirstLower"><xsl:with-param name="inputString" select="@name"/></xsl:call-template>Endpoints
} = <xsl:value-of select="$name"/>Api;


export type <xsl:value-of select="$name"/>ApiType = {
	[<xsl:value-of select="$name"/>Api.reducerPath]: ReturnType&lt;typeof <xsl:value-of select="$name"/>Api.reducer&gt;;
};

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
      <xsl:when test="contains($type,'.')"><xsl:call-template name="Replace">
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

<xsl:template name="FirstLower">
   <xsl:param name="inputString"/>
   <xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="substring($inputString,1,1)"/></xsl:call-template><xsl:value-of select="substring($inputString,2,string-length($inputString)-1)"/>
</xsl:template>
<xsl:template name="FirstUpper">
   <xsl:param name="inputString"/>
   <xsl:call-template name="ToUpper"><xsl:with-param name="inputString" select="substring($inputString,1,1)"/></xsl:call-template><xsl:value-of select="substring($inputString,2,string-length($inputString)-1)"/>
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