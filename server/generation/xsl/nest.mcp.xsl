<?xml version="1.0" encoding="UTF-8" ?>
<!--
  MCP tools from feature operations. A <query> or <mutation> is exposed only when it carries an <mcp> child.

  Emits:
    features\mcp.schemas.ts                        JSON Schema builders for class-only types and projections (rewritten)
    features\{area}\{feature}\{feature}.operations.ts  operations contract for MCP-enabled operations (rewritten)
    features\{area}\{feature}\{feature}.mcp.base.ts    tool definitions bound to that contract (rewritten)
    features\mcp.registry.ts                       every MCP-enabled feature (rewritten)

  The hand-written {Feature}Controller in {feature}.controller.ts implements the contract; MCP calls
  its methods directly with a FeatureRequest, the same caller shape HTTP passes.

  Contract violations are written as code-gen-error lines so the TypeScript build fails.
-->
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
<xsl:key name="mcpToolKey" match="items/feature/*[self::query or self::mutation]/mcp" use="@tool" />
<xsl:key name="mcpResultParentKey" match="items/feature/*[self::query or self::mutation][mcp]/@itemResult | items/feature/*[self::query or self::mutation][mcp]/@listResult" use="concat(../../@name, '|', substring-before(concat(translate(., '[]', ''), '.'), '.'))" />
<xsl:key name="mcpRequestTypeKey" match="items/feature/*[self::query or self::mutation][mcp]/@requestType" use="concat(../../@name, '|', .)" />

<xsl:variable name="lowerCase" select="'abcdefghijklmnopqrstuvwxyz'" />
<xsl:variable name="upperCase" select="'ABCDEFGHIJKLMNOPQRSTUVWXYZ'" />
<xsl:variable name="backend" select="/items/@backendPrefix" />

<xsl:template match="/">
<xsl:call-template name="SchemasFile" />
<xsl:for-each select="items/feature[*[self::query or self::mutation]/mcp]">
<xsl:call-template name="FeatureFiles" />
</xsl:for-each>
<xsl:call-template name="RegistryFile" />
</xsl:template>

<!-- ================================================================== -->
<!-- features\mcp.schemas.ts                                            -->
<!-- ================================================================== -->
<xsl:template name="SchemasFile">
'''[STARTFILE:<xsl:value-of select="$backend"/>features\mcp.schemas.ts]
import { JsonSchema, McpSchemaMode } from 'src/shared/mcp/mcp.types';
import { objectSchema, schemaProperty } from 'src/shared/mcp/mcp.schema';
<xsl:for-each select="items/item[@classOnly='true']">
export function itemSchema_<xsl:value-of select="@name"/>(mode: McpSchemaMode): JsonSchema {
   return objectSchema(mode, {<xsl:for-each select="field">
      <xsl:text>&#10;      </xsl:text><xsl:value-of select="text()"/>: <xsl:call-template name="FieldSchema"><xsl:with-param name="prefix" select="''"/></xsl:call-template>,</xsl:for-each>
   }, [<xsl:call-template name="RequiredList"><xsl:with-param name="fields" select="field"/></xsl:call-template>]);
}
</xsl:for-each>
<xsl:for-each select="items/item/projection">
export function itemSchema_<xsl:value-of select="../@name"/>_<xsl:value-of select="@name"/>(mode: McpSchemaMode): JsonSchema {
   return objectSchema(mode, {<xsl:for-each select="entry"><xsl:variable name="entry" select="text()"/>
      <xsl:text>&#10;      </xsl:text><xsl:value-of select="$entry"/>: <xsl:choose><xsl:when test="count(../../field[text()=$entry])>0"><xsl:for-each select="../../field[text()=$entry][1]"><xsl:call-template name="FieldSchema"><xsl:with-param name="prefix" select="''"/></xsl:call-template></xsl:for-each></xsl:when><xsl:otherwise>
code-gen-error: MCP schema: projection <xsl:value-of select="../../@name"/>.<xsl:value-of select="../@name"/> entry '<xsl:value-of select="$entry"/>' is not a declared field
</xsl:otherwise></xsl:choose>,</xsl:for-each><xsl:for-each select="field">
      <xsl:text>&#10;      </xsl:text><xsl:value-of select="text()"/>: <xsl:call-template name="FieldSchema"><xsl:with-param name="prefix" select="''"/></xsl:call-template>,</xsl:for-each>
   }, [<xsl:call-template name="RequiredList"><xsl:with-param name="fields" select="../field[text()=current()/entry/text()] | field"/></xsl:call-template>]);
}
</xsl:for-each>
'''[ENDFILE]
</xsl:template>

<!-- ================================================================== -->
<!-- Per-feature files                                                  -->
<!-- ================================================================== -->
<xsl:template name="FeatureFiles">
<xsl:variable name="feature_lower" select="translate(@name, $upperCase, $lowerCase)"/>
<xsl:variable name="pascal" select="concat(translate(substring(@name, 1, 1), $lowerCase, $upperCase), substring(@name, 2))"/>
<xsl:variable name="upper" select="translate(@name, $lowerCase, $upperCase)"/>
<xsl:variable name="folder" select="concat($backend, 'features\', @area, '\', $feature_lower, '\')"/>
<xsl:variable name="ops" select="*[self::query or self::mutation][mcp]"/>

'''[STARTFILE:<xsl:value-of select="$folder"/><xsl:value-of select="$feature_lower"/>.operations.ts]
import { FeatureRequest } from 'src/shared/types/feature-request';
<xsl:call-template name="ContractImports"><xsl:with-param name="withClasses" select="false()"/></xsl:call-template>
/**
 * Operations of the <xsl:value-of select="@name"/> feature that are exposed as MCP tools, implemented by
 * <xsl:value-of select="$pascal"/>Controller. Members use property form so the compiler rejects an implementation
 * that takes the wider StencilRequest: MCP supplies only a FeatureRequest.
 */
export interface I<xsl:value-of select="$pascal"/>Operations {<xsl:for-each select="$ops">
   <xsl:text>&#10;   </xsl:text><xsl:call-template name="OperationSignature"/>;</xsl:for-each>
}
'''[ENDFILE]

'''[STARTFILE:<xsl:value-of select="$folder"/><xsl:value-of select="$feature_lower"/>.mcp.base.ts]
import { JsonSchema, McpFeatureTool, McpResultKind, McpSchemaMode } from 'src/shared/mcp/mcp.types';
import { <xsl:if test="count($ops[string-length(@requestType)=0])>0">emptyInputSchema, </xsl:if><xsl:if test="count($ops[string-length(@listResult)>0])>0">listOutputSchema, </xsl:if>objectSchema, schemaProperty } from 'src/shared/mcp/mcp.schema';
import * as schemas from 'src/features/mcp.schemas';
import { I<xsl:value-of select="$pascal"/>Operations } from './<xsl:value-of select="$feature_lower"/>.operations';
<xsl:call-template name="RequestImports"><xsl:with-param name="withClasses" select="true()"/></xsl:call-template>
<xsl:for-each select="$ops"><xsl:call-template name="Validate"/></xsl:for-each>
<xsl:for-each select="entity[not(@isItem='true')]">
function featureSchema_<xsl:value-of select="@name"/>(mode: McpSchemaMode): JsonSchema {
   return objectSchema(mode, {<xsl:for-each select="field">
      <xsl:text>&#10;      </xsl:text><xsl:value-of select="text()"/>: <xsl:call-template name="FieldSchema"><xsl:with-param name="prefix" select="'schemas.'"/><xsl:with-param name="feature" select=".."/></xsl:call-template>,</xsl:for-each>
   }, [<xsl:call-template name="RequiredList"><xsl:with-param name="fields" select="field"/></xsl:call-template>]);
}
</xsl:for-each>
export const <xsl:value-of select="$upper"/>_MCP_TOOLS: McpFeatureTool&lt;I<xsl:value-of select="$pascal"/>Operations&gt;[] = [<xsl:for-each select="$ops"><xsl:call-template name="ToolEntry"/></xsl:for-each>
];
'''[ENDFILE]
</xsl:template>

<!-- ================================================================== -->
<!-- features\mcp.registry.ts                                           -->
<!-- ================================================================== -->
<xsl:template name="RegistryFile">
'''[STARTFILE:<xsl:value-of select="$backend"/>features\mcp.registry.ts]
import { bindMcpFeature, McpFeatureBinding } from 'src/shared/mcp/mcp.types';
<xsl:for-each select="items/feature[*[self::query or self::mutation]/mcp]"><xsl:variable name="feature_lower" select="translate(@name, $upperCase, $lowerCase)"/><xsl:variable name="pascal" select="concat(translate(substring(@name, 1, 1), $lowerCase, $upperCase), substring(@name, 2))"/>import { <xsl:value-of select="$pascal"/>Controller } from './<xsl:value-of select="@area"/>/<xsl:value-of select="$feature_lower"/>/<xsl:value-of select="$feature_lower"/>.controller';
import { <xsl:value-of select="translate(@name, $lowerCase, $upperCase)"/>_MCP_TOOLS } from './<xsl:value-of select="@area"/>/<xsl:value-of select="$feature_lower"/>/<xsl:value-of select="$feature_lower"/>.mcp.base';
</xsl:for-each>
/** Every feature with MCP-enabled operations, in schema order. */
export const MCP_FEATURE_BINDINGS: McpFeatureBinding[] = [<xsl:for-each select="items/feature[*[self::query or self::mutation]/mcp]"><xsl:variable name="feature_lower" select="translate(@name, $upperCase, $lowerCase)"/><xsl:variable name="pascal" select="concat(translate(substring(@name, 1, 1), $lowerCase, $upperCase), substring(@name, 2))"/>
   bindMcpFeature('<xsl:value-of select="$feature_lower"/>', <xsl:value-of select="$pascal"/>Controller, <xsl:value-of select="translate(@name, $lowerCase, $upperCase)"/>_MCP_TOOLS),</xsl:for-each>
];
'''[ENDFILE]
</xsl:template>

<!-- ================================================================== -->
<!-- Contract pieces (context: feature)                                 -->
<!-- ================================================================== -->
<xsl:template name="ContractImports">
<xsl:param name="withClasses"/>
<xsl:variable name="ops" select="*[self::query or self::mutation][mcp]"/>
<xsl:if test="count($ops[string-length(@itemResult)>0])>0">import { ItemResult } from 'src/shared/types/data/item-result';
</xsl:if><xsl:if test="count($ops[string-length(@listResult)>0])>0">import { ListResult } from 'src/shared/types/data/list-result';
</xsl:if><xsl:if test="count($ops[string-length(@itemResult)=0 and string-length(@listResult)=0])>0">import { ActionResult } from 'src/shared/types/data/action-result';
</xsl:if>
<xsl:variable name="feature" select="."/>
<xsl:for-each select="($ops/@itemResult | $ops/@listResult)[generate-id()=generate-id(key('mcpResultParentKey', concat(../../@name, '|', substring-before(concat(translate(., '[]', ''), '.'), '.')))[1])]">
<xsl:variable name="parent" select="substring-before(concat(translate(., '[]', ''), '.'), '.')"/>
<xsl:choose>
<xsl:when test="count($feature/entity[@name=$parent and not(@isItem='true')])>0"><xsl:if test="count($ops[@requestType=$parent])=0">import { I<xsl:value-of select="$parent"/> } from './models/<xsl:value-of select="translate($parent, $upperCase, $lowerCase)"/>';
</xsl:if></xsl:when>
<xsl:when test="count(/items/item[@name=$parent])>0">import { <xsl:value-of select="$parent"/> } from 'src/entities/<xsl:value-of select="translate($parent, $upperCase, $lowerCase)"/>/<xsl:value-of select="translate($parent, $upperCase, $lowerCase)"/>.model';
</xsl:when>
</xsl:choose>
</xsl:for-each>
<xsl:call-template name="RequestImports"><xsl:with-param name="withClasses" select="$withClasses"/></xsl:call-template>
</xsl:template>

<xsl:template name="RequestImports">
<xsl:param name="withClasses"/>
<xsl:for-each select="*[self::query or self::mutation][mcp]/@requestType[generate-id()=generate-id(key('mcpRequestTypeKey', concat(../../@name, '|', .))[1])]">
<xsl:variable name="request" select="string(.)"/>
<xsl:if test="count(../../entity[@name=$request and not(@isItem='true')])>0">import { I<xsl:value-of select="$request"/><xsl:if test="$withClasses">, <xsl:value-of select="$request"/></xsl:if> } from './models/<xsl:value-of select="translate($request, $upperCase, $lowerCase)"/>';
</xsl:if>
</xsl:for-each>
</xsl:template>

<!-- context: query/mutation; property form (see the operations file comment) -->
<xsl:template name="OperationSignature">
<xsl:value-of select="@name"/>: (request: FeatureRequest<xsl:if test="string-length(@requestType)>0">, input: I<xsl:value-of select="@requestType"/></xsl:if>) =&gt; Promise&lt;<xsl:call-template name="Envelope"/>&gt;</xsl:template>

<!-- context: query/mutation -->
<xsl:template name="Envelope">
<xsl:choose>
<xsl:when test="string-length(@itemResult)>0">ItemResult&lt;<xsl:call-template name="ResultTsType"><xsl:with-param name="type" select="translate(@itemResult, '[]', '')"/></xsl:call-template>&gt;</xsl:when>
<xsl:when test="string-length(@listResult)>0">ListResult&lt;<xsl:call-template name="ResultTsType"><xsl:with-param name="type" select="translate(@listResult, '[]', '')"/></xsl:call-template>&gt;</xsl:when>
<xsl:otherwise>ActionResult</xsl:otherwise>
</xsl:choose>
</xsl:template>

<!-- context: query/mutation -->
<xsl:template name="ResultTsType">
<xsl:param name="type"/>
<xsl:choose>
<xsl:when test="count(../entity[@name=$type and not(@isItem='true')])>0">I<xsl:value-of select="$type"/></xsl:when>
<xsl:otherwise><xsl:value-of select="$type"/></xsl:otherwise>
</xsl:choose>
</xsl:template>

<!-- context: query/mutation; emits the schema builder call for a result type -->
<xsl:template name="ResultSchemaRef">
<xsl:param name="type"/>
<xsl:choose>
<xsl:when test="count(../entity[@name=$type and not(@isItem='true')])>0">featureSchema_<xsl:value-of select="$type"/>(McpSchemaMode.output)</xsl:when>
<xsl:when test="contains($type, '.')">schemas.itemSchema_<xsl:value-of select="translate($type, '.', '_')"/>(McpSchemaMode.output)</xsl:when>
<xsl:otherwise>schemas.itemSchema_<xsl:value-of select="$type"/>(McpSchemaMode.output)</xsl:otherwise>
</xsl:choose>
</xsl:template>

<!-- context: query/mutation -->
<xsl:template name="ToolEntry">
<xsl:variable name="mcp" select="mcp"/>
<xsl:variable name="isQuery" select="boolean(self::query)"/>
   {
      definition: {
         name: '<xsl:value-of select="$mcp/@tool"/>',
         title: '<xsl:call-template name="JsString"><xsl:with-param name="text" select="$mcp/@title"/></xsl:call-template>',
         description: '<xsl:call-template name="JsString"><xsl:with-param name="text" select="$mcp/description"/></xsl:call-template>',
         inputSchema: <xsl:choose><xsl:when test="string-length(@requestType)>0">featureSchema_<xsl:value-of select="@requestType"/>(McpSchemaMode.input)</xsl:when><xsl:otherwise>emptyInputSchema()</xsl:otherwise></xsl:choose>,<xsl:choose>
<xsl:when test="string-length(@itemResult)>0">
         outputSchema: <xsl:call-template name="ResultSchemaRef"><xsl:with-param name="type" select="translate(@itemResult, '[]', '')"/></xsl:call-template>,</xsl:when>
<xsl:when test="string-length(@listResult)>0">
         outputSchema: listOutputSchema(<xsl:call-template name="ResultSchemaRef"><xsl:with-param name="type" select="translate(@listResult, '[]', '')"/></xsl:call-template>),</xsl:when>
</xsl:choose>
         annotations: {
            readOnlyHint: <xsl:call-template name="Flag"><xsl:with-param name="value" select="$mcp/@readOnly"/><xsl:with-param name="default" select="$isQuery"/></xsl:call-template>,
            destructiveHint: <xsl:call-template name="Flag"><xsl:with-param name="value" select="$mcp/@destructive"/><xsl:with-param name="default" select="false()"/></xsl:call-template>,
            idempotentHint: <xsl:call-template name="Flag"><xsl:with-param name="value" select="$mcp/@idempotent"/><xsl:with-param name="default" select="$isQuery"/></xsl:call-template>,
            openWorldHint: <xsl:call-template name="Flag"><xsl:with-param name="value" select="$mcp/@openWorld"/><xsl:with-param name="default" select="false()"/></xsl:call-template>,
         },
      },<xsl:if test="string-length(@requestType)>0">
      requestModel: <xsl:value-of select="@requestType"/>,</xsl:if>
      resultKind: McpResultKind.<xsl:choose><xsl:when test="string-length(@itemResult)>0">item</xsl:when><xsl:when test="string-length(@listResult)>0">list</xsl:when><xsl:otherwise>action</xsl:otherwise></xsl:choose>,
      invoke: <xsl:choose><xsl:when test="string-length(@requestType)>0">(operations, request, input) =&gt; operations.<xsl:value-of select="@name"/>(request, input as I<xsl:value-of select="@requestType"/>)</xsl:when><xsl:otherwise>(operations, request) =&gt; operations.<xsl:value-of select="@name"/>(request)</xsl:otherwise></xsl:choose>,
   },</xsl:template>

<xsl:template name="Flag">
<xsl:param name="value"/>
<xsl:param name="default"/>
<xsl:choose>
<xsl:when test="$value='true'">true</xsl:when>
<xsl:when test="$value='false'">false</xsl:when>
<xsl:when test="$default">true</xsl:when>
<xsl:otherwise>false</xsl:otherwise>
</xsl:choose>
</xsl:template>

<!-- ================================================================== -->
<!-- Validation (context: query/mutation carrying <mcp>)                -->
<!-- ================================================================== -->
<xsl:template name="Validate">
<xsl:variable name="mcp" select="mcp"/>
<xsl:variable name="where" select="concat(../@name, '.', @name)"/>
<xsl:variable name="request" select="string(@requestType)"/>
<xsl:variable name="result" select="translate(concat(@itemResult, @listResult), '[]', '')"/>
<xsl:variable name="resultParent" select="substring-before(concat($result, '.'), '.')"/>
<xsl:variable name="resultChild" select="substring-after($result, '.')"/>
<xsl:if test="count(mcp) > 1">
code-gen-error: MCP <xsl:value-of select="$where"/>: only one &lt;mcp&gt; element is allowed per operation
</xsl:if>
<xsl:if test="../@area != 'user'">
code-gen-error: MCP <xsl:value-of select="$where"/>: MCP tools are only supported on area="user" features (tenant comes from the caller's account)
</xsl:if>
<xsl:if test="string-length($mcp/@tool)=0 or string-length($mcp/@tool)>64 or string-length(translate($mcp/@tool, 'abcdefghijklmnopqrstuvwxyz0123456789_', ''))>0">
code-gen-error: MCP <xsl:value-of select="$where"/>: tool="<xsl:value-of select="$mcp/@tool"/>" must be 1-64 characters of [a-z0-9_]
</xsl:if>
<xsl:if test="count(key('mcpToolKey', $mcp/@tool)) > 1">
code-gen-error: MCP <xsl:value-of select="$where"/>: tool name "<xsl:value-of select="$mcp/@tool"/>" is used by more than one operation
</xsl:if>
<xsl:if test="string-length(normalize-space($mcp/@title))=0">
code-gen-error: MCP <xsl:value-of select="$where"/>: title is required
</xsl:if>
<xsl:if test="string-length(normalize-space($mcp/description))=0">
code-gen-error: MCP <xsl:value-of select="$where"/>: a &lt;description&gt; child is required (it is what the model reads to choose the tool)
</xsl:if>
<xsl:if test="self::mutation and (string-length($mcp/@destructive)=0 or string-length($mcp/@idempotent)=0)">
code-gen-error: MCP <xsl:value-of select="$where"/>: mutations must declare destructive="true|false" and idempotent="true|false"
</xsl:if>
<xsl:if test="@requestRouted='true'">
code-gen-error: MCP <xsl:value-of select="$where"/>: requestRouted operations take a caller-supplied jurisdiction and cannot be MCP tools
</xsl:if>
<xsl:if test="string-length($request)>0 and count(../entity[@name=$request and not(@isItem='true')])=0">
code-gen-error: MCP <xsl:value-of select="$where"/>: requestType="<xsl:value-of select="$request"/>" must be a request &lt;entity&gt; declared in this feature
</xsl:if>
<xsl:if test="string-length(@itemResult)>0 and string-length(@listResult)>0">
code-gen-error: MCP <xsl:value-of select="$where"/>: declare either itemResult or listResult, not both
</xsl:if>
<xsl:if test="not(string-length(@itemResult)>0 and string-length(@listResult)>0) and string-length($result)>0 and not(count(../entity[@name=$result and not(@isItem='true')])>0 or (string-length($resultChild)>0 and count(/items/item[@name=$resultParent]/projection[@name=$resultChild])>0) or (string-length($resultChild)=0 and count(/items/item[@name=$result and @classOnly='true'])>0))">
code-gen-error: MCP <xsl:value-of select="$where"/>: result "<xsl:value-of select="$result"/>" must be a projection, a class-only type, or a feature entity (full documents are never exposed as tool output)
</xsl:if>
</xsl:template>

<!-- ================================================================== -->
<!-- JSON Schema emission (context: field)                              -->
<!-- ================================================================== -->
<xsl:template name="FieldSchema">
<xsl:param name="prefix"/>
<xsl:param name="feature" select="/.."/>
<xsl:variable name="core"><xsl:call-template name="CoreProps"><xsl:with-param name="prefix" select="$prefix"/><xsl:with-param name="feature" select="$feature"/></xsl:call-template></xsl:variable>
<xsl:variable name="annotations"><xsl:if test="string-length(normalize-space(@friendlyName))>0">, title: '<xsl:call-template name="JsString"><xsl:with-param name="text" select="@friendlyName"/></xsl:call-template>'</xsl:if><xsl:if test="string-length(normalize-space(@description))>0">, description: '<xsl:call-template name="JsString"><xsl:with-param name="text" select="@description"/></xsl:call-template>'</xsl:if></xsl:variable>
<xsl:text>schemaProperty(mode, </xsl:text>
<xsl:choose>
<xsl:when test="contains(@type, '[]')">{ type: 'array', items: { <xsl:value-of select="$core"/> }<xsl:value-of select="$annotations"/> }</xsl:when>
<xsl:otherwise>{ <xsl:value-of select="$core"/><xsl:value-of select="$annotations"/> }</xsl:otherwise>
</xsl:choose>
<xsl:text>, </xsl:text>
<xsl:choose><xsl:when test="@isNullable='true'">true</xsl:when><xsl:otherwise>false</xsl:otherwise></xsl:choose>
<xsl:text>)</xsl:text>
</xsl:template>

<xsl:template name="CoreProps">
<xsl:param name="prefix"/>
<xsl:param name="feature"/>
<xsl:variable name="base" select="translate(@type, '[]', '')"/>
<xsl:choose>
<xsl:when test="string-length(@enumString)>0"><xsl:variable name="enumType" select="@enumString"/>type: 'string', enum: [<xsl:for-each select="/items/enum[@name=$enumType]/field"><xsl:if test="position()>1">, </xsl:if>'<xsl:value-of select="text()"/>'</xsl:for-each>]</xsl:when>
<xsl:when test="@isEnum='true' or count(/items/enum[@name=$base])>0">type: 'integer', oneOf: [<xsl:for-each select="/items/enum[@name=$base]/field"><xsl:if test="position()>1">, </xsl:if>{ const: <xsl:value-of select="@value"/>, title: '<xsl:call-template name="JsString"><xsl:with-param name="text"><xsl:choose><xsl:when test="string-length(@friendlyName)>0"><xsl:value-of select="@friendlyName"/></xsl:when><xsl:otherwise><xsl:value-of select="text()"/></xsl:otherwise></xsl:choose></xsl:with-param></xsl:call-template>' }</xsl:for-each>]</xsl:when>
<xsl:when test="$base='string'">type: 'string'<xsl:if test="string(number(@maxLength))!='NaN'">, maxLength: <xsl:value-of select="@maxLength"/></xsl:if><xsl:if test="string(number(@minLength))!='NaN'">, minLength: <xsl:value-of select="@minLength"/></xsl:if></xsl:when>
<xsl:when test="$base='Uuid'">type: 'string', format: 'uuid'</xsl:when>
<xsl:when test="$base='int' or $base='long'">type: 'integer'<xsl:if test="string(number(@minValue))!='NaN'">, minimum: <xsl:value-of select="@minValue"/></xsl:if><xsl:if test="string(number(@maxValue))!='NaN'">, maximum: <xsl:value-of select="@maxValue"/></xsl:if></xsl:when>
<xsl:when test="$base='decimal'">type: 'string'</xsl:when>
<xsl:when test="$base='boolean'">type: 'boolean'</xsl:when>
<xsl:when test="$base='Date'">type: 'string', format: 'date-time'</xsl:when>
<xsl:when test="count($feature/entity[@name=$base and not(@isItem='true')])>0">...featureSchema_<xsl:value-of select="$base"/>(mode)</xsl:when>
<xsl:when test="contains($base, '.') and count(/items/item[@name=substring-before($base, '.')]/projection[@name=substring-after($base, '.')])>0">...<xsl:value-of select="$prefix"/>itemSchema_<xsl:value-of select="translate($base, '.', '_')"/>(mode)</xsl:when>
<xsl:when test="count(/items/item[@name=$base and @classOnly='true'])>0">...<xsl:value-of select="$prefix"/>itemSchema_<xsl:value-of select="$base"/>(mode)</xsl:when>
<xsl:otherwise>
code-gen-error: MCP schema: field '<xsl:value-of select="text()"/>' has unsupported type '<xsl:value-of select="@type"/>' (use a primitive, enum, class-only type, projection, or feature entity)
</xsl:otherwise>
</xsl:choose>
</xsl:template>

<xsl:template name="RequiredList">
<xsl:param name="fields"/>
<xsl:for-each select="$fields[not(@isNullable='true')]"><xsl:if test="position()>1">, </xsl:if>'<xsl:value-of select="text()"/>'</xsl:for-each>
</xsl:template>

<!-- ================================================================== -->
<!-- Helpers                                                            -->
<!-- ================================================================== -->
<xsl:template name="JsString">
<xsl:param name="text"/>
<xsl:variable name="escapedSlashes"><xsl:call-template name="Replace"><xsl:with-param name="text" select="normalize-space($text)"/><xsl:with-param name="replace" select="'\'"/><xsl:with-param name="by" select="'\\'"/></xsl:call-template></xsl:variable>
<xsl:call-template name="Replace"><xsl:with-param name="text" select="$escapedSlashes"/><xsl:with-param name="replace">'</xsl:with-param><xsl:with-param name="by">\'</xsl:with-param></xsl:call-template>
</xsl:template>

<xsl:template name="Replace">
<xsl:param name="text"/>
<xsl:param name="replace"/>
<xsl:param name="by"/>
<xsl:choose>
<xsl:when test="string-length($replace)>0 and contains($text, $replace)"><xsl:value-of select="substring-before($text, $replace)"/><xsl:value-of select="$by"/><xsl:call-template name="Replace"><xsl:with-param name="text" select="substring-after($text, $replace)"/><xsl:with-param name="replace" select="$replace"/><xsl:with-param name="by" select="$by"/></xsl:call-template></xsl:when>
<xsl:otherwise><xsl:value-of select="$text"/></xsl:otherwise>
</xsl:choose>
</xsl:template>

</xsl:stylesheet>
