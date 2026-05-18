<?xml version="1.0" encoding="UTF-8" ?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
<xsl:key name="perspectiveKey" match="items/item/field[string-length(@perspective)>0]" use="concat(../@name, @perspective)" />
<xsl:key name="isClassKey" match="items/item/field[@isClass='true']" use="concat(../@name, translate(@type, '[]', ''))" />
<xsl:key name="isEnumKey" match="items/item/field[@isEnum='true']" use="concat(../@name, @type)" />

<xsl:template match="/">

<xsl:for-each select="items/item">
   <xsl:variable name="name_lowered"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="@name"/></xsl:call-template></xsl:variable>
   <xsl:variable name="name"><xsl:value-of select="@name"/></xsl:variable>
   <xsl:variable name="self_type" select="@name"></xsl:variable>

'''[STARTFILE:<xsl:value-of select="../@backendPrefix"/>entities\<xsl:value-of select="$name_lowered"/>\<xsl:value-of select="$name_lowered"/>.schema.ts]
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
<xsl:choose><xsl:when test="../@mongooseVersion >= 9">import { Schema as MongooseSchema } from 'mongoose';</xsl:when><xsl:otherwise>import { Document, Schema as MongooseSchema } from 'mongoose';</xsl:otherwise></xsl:choose>
import { ModelAnnotations } from 'src/shared/utils/model-annotations';
import mongooseLeanGetters from 'mongoose-lean-getters';
import { uuidAutoConversionPlugin } from 'src/shared/mongo/uuid-auto-conversion.plugin';
<xsl:for-each select="field[@isClass='true' and generate-id()=generate-id(key('isClassKey',concat(../@name, translate(@type, '[]', '')))[1])]"><xsl:variable name="parent"><xsl:call-template name="ExtractParent"><xsl:with-param name="text" select="@type" /></xsl:call-template></xsl:variable><xsl:variable name="parent_lowered"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="$parent"/></xsl:call-template></xsl:variable>
<xsl:if test="$self_type!=$parent">import { <xsl:value-of select="$parent"/> } from 'src/entities/<xsl:value-of select="$parent_lowered"/>/<xsl:value-of select="$parent_lowered"/>.schema';
</xsl:if></xsl:for-each>
<xsl:for-each select="field[@isEnum='true' and generate-id()=generate-id(key('isEnumKey',concat(../@name, @type))[1])]"><xsl:variable name="type"><xsl:call-template name="Replace"><xsl:with-param name="text" select="@type" /><xsl:with-param name="replace" select="'[]'" /><xsl:with-param name="by" select="''" /></xsl:call-template></xsl:variable><xsl:variable name="type_lowered"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="$type"/></xsl:call-template></xsl:variable>
import { <xsl:value-of select="$type"/> } from 'src/entities/enums/<xsl:value-of select="$type_lowered"/>';</xsl:for-each>
<xsl:for-each select="field[string-length(@extraImport)>0]"><xsl:variable name="type"><xsl:value-of select="@extraImport" /></xsl:variable><xsl:variable name="type_lowered"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="$type"/></xsl:call-template></xsl:variable>
import { <xsl:value-of select="$type"/> } from "../<xsl:value-of select="$type_lowered"/>/<xsl:value-of select="$type_lowered"/>.model";</xsl:for-each>

export const COLLECTION_NAME = '<xsl:value-of select="$name"/>';
export const PRIMARY_KEY = '<xsl:value-of select="field[1]/text()"/>';

export namespace <xsl:value-of select="$name"/> {

   <xsl:for-each select="projection">
   // ===========================================
   // Projection: <xsl:value-of select="$name"/>.<xsl:value-of select="@name"/>
   // ===========================================
   @Schema(<xsl:if test="count(entry[text()='_id'])=0">{ ...ModelAnnotations.suppress_id }</xsl:if>)
   export class <xsl:value-of select="@name"/>Document<xsl:if test="not(../../@mongooseVersion >= 9)"> extends Document</xsl:if> {
      <xsl:for-each select="entry"><xsl:variable name="fieldname" select="text()" />
      <xsl:variable name="current_type"><xsl:call-template name="Replace">
         <xsl:with-param name="text" select="../../field[text()=$fieldname]/@type" />
         <xsl:with-param name="replace" select="'[]'" />
         <xsl:with-param name="by" select="''" />
      </xsl:call-template></xsl:variable>
      @Prop({<xsl:if test="../../field[text()=$fieldname]/@encrypted='true'">
         encrypted: true,</xsl:if>
         <xsl:choose><xsl:when test="../../field[text()=$fieldname]/@type='Uuid'">
         ...ModelAnnotations.uuid,</xsl:when>
         <xsl:when test="../../field[text()=$fieldname]/@type='Uuid[]'">
         ...ModelAnnotations.uuids,</xsl:when>
         <xsl:when test="@type='decimal'">
         ...ModelAnnotations.decimal,</xsl:when>
         <xsl:when test="@type='decimal[]'">
         ...ModelAnnotations.decimals,</xsl:when>
         <xsl:when test="../../field[text()=$fieldname]/@isEnum='true'">
         type: <xsl:if test="contains(../../field[text()=$fieldname]/@type,'[]')">[</xsl:if>Number<xsl:if test="contains(../../field[text()=$fieldname]/@type,'[]')">]</xsl:if>,</xsl:when>
         <xsl:otherwise>
         type: <xsl:if test="contains(../../field[text()=$fieldname]/@type,'[]')">[</xsl:if><xsl:call-template name="MongooseType"><xsl:with-param name="type" select="$current_type"/></xsl:call-template><xsl:if test="../../field[text()=$fieldname]/@isClass='true'"><xsl:if test="not(contains($current_type,'.'))">.<xsl:value-of select="$current_type"/></xsl:if>Schema</xsl:if><xsl:if test="contains(../../field[text()=$fieldname]/@type,'[]')">]</xsl:if>,</xsl:otherwise></xsl:choose>
         required: <xsl:choose><xsl:when test="../../field[text()=$fieldname]/@isNullable='true'">false</xsl:when><xsl:otherwise>true</xsl:otherwise></xsl:choose>,
      })
      <xsl:value-of select="$fieldname"/>: <xsl:call-template name="NodeType"><xsl:with-param name="type" select="$current_type"/></xsl:call-template><xsl:if test="../../field[text()=$fieldname]/@isClass='true'"><xsl:if test="not(contains($current_type,'.'))">.<xsl:value-of select="$current_type"/></xsl:if>Document</xsl:if>;
      </xsl:for-each>
   }

   export const <xsl:value-of select="@name"/>Schema = SchemaFactory.createForClass(<xsl:value-of select="@name"/>Document);
   <xsl:value-of select="@name"/>Schema.plugin(mongooseLeanGetters);
   <xsl:value-of select="@name"/>Schema.plugin(uuidAutoConversionPlugin);
   </xsl:for-each>
   
   // ===========================================
   // Entity: <xsl:value-of select="$name"/>
   // ===========================================

   @Schema({ ...ModelAnnotations.document })
   export class <xsl:value-of select="$name"/>Document<xsl:if test="not(../@mongooseVersion >= 9)"> extends Document</xsl:if> {<xsl:text>
      </xsl:text><xsl:if test="not(@classOnly='true')"><xsl:choose>
      <xsl:when test="field[1]/text()='_id'">@Prop({
         type: String,
         required: false,
      })
      </xsl:when><xsl:otherwise>@Prop({ ...ModelAnnotations.primary_key_uuid })
      </xsl:otherwise></xsl:choose><xsl:value-of select="field[1]/text()"/>: string;
      </xsl:if>
      <xsl:for-each select="field"><xsl:variable name="current_type"><xsl:call-template name="Replace">
	<xsl:with-param name="text" select="@type" />
	<xsl:with-param name="replace" select="'[]'" />
	<xsl:with-param name="by" select="''" />
</xsl:call-template></xsl:variable><xsl:if test="../@classOnly='true' or position()>1"><xsl:text>
      </xsl:text>
      <xsl:choose>
      <xsl:when test="$current_type = $self_type">// Recursive property will be added after schema creation
      </xsl:when>
      <xsl:otherwise>@Prop({<xsl:if test="@encrypted='true'">
         encrypted: true,</xsl:if>
         <xsl:choose>
         <xsl:when test="@type='Uuid'">
         ...ModelAnnotations.uuid,</xsl:when>
         <xsl:when test="@type='Uuid[]'">
         ...ModelAnnotations.uuids,</xsl:when>
         <xsl:when test="@type='decimal'">
         ...ModelAnnotations.decimal,</xsl:when>
         <xsl:when test="@type='decimal[]'">
         ...ModelAnnotations.decimals,</xsl:when>
         <xsl:when test="@isEnum='true'">
         type: <xsl:if test="contains(@type,'[]')">[</xsl:if>Number<xsl:if test="contains(@type,'[]')">]</xsl:if>,</xsl:when>
         <xsl:otherwise>
         type: <xsl:if test="contains(@type,'[]')">[</xsl:if><xsl:call-template name="MongooseType"><xsl:with-param name="type" select="$current_type"/></xsl:call-template><xsl:if test="@isClass='true'"><xsl:if test="not(contains($current_type,'.'))">.<xsl:value-of select="$current_type"/></xsl:if>Schema</xsl:if><xsl:if test="contains(@type,'[]')">]</xsl:if>,</xsl:otherwise></xsl:choose>
         required: <xsl:choose><xsl:when test="@isNullable='true'">false</xsl:when><xsl:otherwise>true</xsl:otherwise></xsl:choose>,
      })
      </xsl:otherwise>
      </xsl:choose>
      <xsl:value-of select="text()"/>: <xsl:call-template name="NodeType"><xsl:with-param name="type" select="$current_type"/></xsl:call-template><xsl:if test="@isClass='true'"><xsl:if test="not(contains($current_type,'.'))">.<xsl:value-of select="$current_type"/></xsl:if>Document</xsl:if><xsl:if test="contains(@type,'[]')">[]</xsl:if>;
      </xsl:if>
      </xsl:for-each>
      <xsl:if test="not(@classOnly='true')">
      @Prop({
         type: Date,
         required: true,
      })
      created_utc: Date;
      
      @Prop({
         type: Date,
         required: true,
      })
      updated_utc: Date;
      </xsl:if>
      <xsl:if test="count(field[@searchable='true'])>0">
      @Prop({
         type: String,
         required: true,
      })
      searchable?: string;
      </xsl:if>

      <xsl:if test="count(field[string-length(@calculated)>0])>0">
      @Prop({
         type: Date,
         required: false,
      })
      calculation_utc?: Date;
      @Prop({
         type: String,
         required: false,
      })
      calculation_agent?: string;
      </xsl:if>
   }
  
   export const <xsl:value-of select="@name"/>Schema = SchemaFactory.createForClass(<xsl:value-of select="@name"/>Document);
   <xsl:for-each select="field[@isClass='true']"><xsl:variable name="looped_type"><xsl:call-template name="Replace">
      <xsl:with-param name="text" select="@type" />
      <xsl:with-param name="replace" select="'[]'" />
      <xsl:with-param name="by" select="''" />
   </xsl:call-template></xsl:variable>
   <xsl:if test="$looped_type = $self_type">
   // Add recursive properties after schema is created
   <xsl:value-of select="../@name"/>Schema.add({
      <xsl:value-of select="text()"/>: {
         type: [<xsl:value-of select="../@name"/>Schema],
         required: false,
      },
   });

   </xsl:if>
   </xsl:for-each>

   <xsl:value-of select="@name"/>Schema.plugin(uuidAutoConversionPlugin);
   <xsl:value-of select="@name"/>Schema.plugin(mongooseLeanGetters);

   

}
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
      <xsl:when test="starts-with($type, 'Record')">MongooseSchema.Types.Mixed</xsl:when>
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
</xsl:stylesheet>