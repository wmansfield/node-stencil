<?xml version="1.0" encoding="UTF-8" ?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
<xsl:key name="perspectiveKey" match="items/item/field[string-length(@perspective)>0]" use="concat(../@name, @perspective)" />
<xsl:key name="isClassFieldKey" match="items/item/field[@isClass='true' and not(contains(@type,'.'))]" use="concat(../@name, translate(@type, '[]', ''))" />
<xsl:key name="isDottedClassFieldKey" match="items/item/field[@isClass='true' and contains(@type,'.')]" use="concat(../@name, substring-before(translate(@type, '[]', ''), '.'))" />
<xsl:key name="isDottedClassProjectionFieldKey" match="items/item/projection/field[@isClass='true' and contains(@type,'.')]" use="concat(../../@name, substring-before(translate(@type, '[]', ''), '.'))" />
<xsl:key name="isEnumFieldKey" match="items/item/field[@isEnum='true']" use="concat(../@name, translate(@type, '[]', ''))" />
<xsl:key name="isEnumProjectionFieldKey" match="items/item/projection/field[@isEnum='true']" use="concat(../../@name, ../@name, translate(@type, '[]', ''))" />

<xsl:template match="/">


'''[STARTFILE:<xsl:value-of select="items/@backendPrefix"/>shared\constants\permissions\admin.ts]
export const AdminPermissions = {
   Admin: {
      <xsl:for-each select="items/item[not(@classOnly='true')]">
      <xsl:variable name="name_lowered"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="@name"/></xsl:call-template></xsl:variable>
      <xsl:variable name="name"><xsl:value-of select="@name"/></xsl:variable>
      <xsl:value-of select="$name"/>: {
         Read: 'admin:<xsl:value-of select="$name_lowered"/>:read',
         Write: 'admin:<xsl:value-of select="$name_lowered"/>:write',<xsl:for-each select="projection">
         <xsl:variable name="projection"><xsl:value-of select="@name"/></xsl:variable>
         <xsl:variable name="projection_lowered"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="@name"/></xsl:call-template></xsl:variable><xsl:text>
         </xsl:text><xsl:value-of select="$projection"/>: {
            Read: 'admin:<xsl:value-of select="$name_lowered"/>.<xsl:value-of select="$projection_lowered"/>:read',
         },
         </xsl:for-each>
         <xsl:for-each select="field[string-length(@perspective)>0 and generate-id()=generate-id(key('perspectiveKey',concat(../@name, @perspective))[1])]"><xsl:variable name="perspective"><xsl:value-of select="@perspective" /></xsl:variable><xsl:variable name="perspective_lowered"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="@perspective"/></xsl:call-template></xsl:variable>
         <xsl:text>
         </xsl:text><xsl:value-of select="$perspective"/>: {
            Write: 'admin:<xsl:value-of select="$name_lowered"/>.<xsl:value-of select="$perspective_lowered"/>:write',
         },
         </xsl:for-each>
      },
      </xsl:for-each>
   }
} as const;


'''[ENDFILE]


<xsl:for-each select="items/item[not(@classOnly='true')]">
   <xsl:variable name="name_lowered"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="@name"/></xsl:call-template></xsl:variable>
   <xsl:variable name="name"><xsl:value-of select="@name"/></xsl:variable>
   <xsl:variable name="tenant"><xsl:choose><xsl:when test="@tenant='Isolated'">Isolated</xsl:when><xsl:otherwise>Shared</xsl:otherwise></xsl:choose></xsl:variable>
   <xsl:variable name="security_route_field"><xsl:value-of select="../@securityRoute"/></xsl:variable>
   <xsl:variable name="unique_id"><xsl:value-of select="field[1]/text()"/></xsl:variable>

'''[STARTFILE:<xsl:value-of select="../@backendPrefix"/>entities\<xsl:value-of select="$name_lowered"/>\<xsl:value-of select="$name_lowered"/>.controller.base.ts]
import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards, UseInterceptors, NotFoundException } from '@nestjs/common';
import { <xsl:value-of select="$name"/> } from './<xsl:value-of select="$name_lowered"/>.model';
import { <xsl:value-of select="$name"/>Manager } from './<xsl:value-of select="$name_lowered"/>.manager';
import { ListResult } from 'src/shared/types/data/list-result';
import { ItemResult } from 'src/shared/types/data/item-result';
import { ActionResult } from 'src/shared/types/data/action-result';
import { AuthGuard, Permission } from 'src/shared/access-control/auth.guard';
import { AppPermissions } from 'src/shared/constants/permissions';
import { OptionalIntPipe, Sanitize } from 'src/shared/utils';
import { OptionalBoolPipe } from 'src/shared/utils/optional-bool.pipe';
<xsl:if test="@useDocument='true'">import './<xsl:value-of select="$name_lowered"/>.sanitized.validators';
</xsl:if>
<xsl:if test="count(field[string-length(@uiUploadAvatar)>0])>0">import { CloudStorageHandler } from 'src/features/platform/storage';
import { StorageUtils } from 'src/features/utils/storage.utils';
</xsl:if>
<xsl:for-each select="field[@isEnum='true' and @filter='true']">import { <xsl:value-of select="@type"/> } from '../enums/<xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="@type"/></xsl:call-template>';
</xsl:for-each>

@Controller('admin/<xsl:for-each select="field[@tenant='true']">:<xsl:value-of select="text()"/>/</xsl:for-each><xsl:value-of select="$name_lowered"/>')
@UseGuards(AuthGuard)
export class <xsl:value-of select="$name"/>ControllerBase {
   constructor(protected readonly manager: <xsl:value-of select="$name"/>Manager, <xsl:if test="count(field[string-length(@uiUploadAvatar)>0])>0">protected readonly cloudStorageHandler: CloudStorageHandler,</xsl:if>) {}

   @Get('find')
   @Permission(AppPermissions.Admin.<xsl:value-of select="@name"/>.Read)
   async find(<xsl:for-each select="field[@tenant='true']">
      @Param('<xsl:value-of select="text()"/>') <xsl:value-of select="text()"/>: string,</xsl:for-each>
      @Query('skip', OptionalIntPipe) skip: number = 0,
      @Query('take', OptionalIntPipe) take: number = 10,
      @Query('order_by') order_by?: string,
      @Query('descending', OptionalBoolPipe) descending: boolean = false,
      @Query('keyword') keyword?: string<xsl:for-each select="field[@foreignKey and not(@noGet='true') and not(@tenant='true')]">,
      @Query('<xsl:value-of select="text()"/>') <xsl:value-of select="text()"/>?: string</xsl:for-each>
      <xsl:for-each select="field[@filter='true' and string-length(@foreignKey)=0]">,
      @Query('<xsl:value-of select="text()"/>'<xsl:choose><xsl:when test="@isEnum='true'">, OptionalIntPipe </xsl:when><xsl:when test="@type='boolean'">, OptionalBoolPipe </xsl:when></xsl:choose>) <xsl:value-of select="text()"/>?: <xsl:call-template name="NodeType"><xsl:with-param name="type" select="@type"/></xsl:call-template></xsl:for-each>
      <xsl:for-each select="field[@nestedFilter='true' and string-length(@foreignKey)=0]"><xsl:variable name="entity" select="@type"/><xsl:variable name="root" select="text()"/>
      <xsl:for-each select="../../item[@name=$entity]/field[@filter='true']">,
      @Query('<xsl:value-of select="text()"/>'<xsl:choose><xsl:when test="@isEnum='true'">, OptionalIntPipe </xsl:when><xsl:when test="@type='boolean'">, OptionalBoolPipe </xsl:when></xsl:choose>) <xsl:value-of select="text()"/>?: <xsl:call-template name="NodeType"><xsl:with-param name="type" select="@type"/></xsl:call-template>
      </xsl:for-each>
      </xsl:for-each>
   ): Promise&lt;ListResult&lt;<xsl:value-of select="@name" /><xsl:if test="count(projection[@default='true'])>0">.<xsl:value-of select="projection[@default='true'][1]/@name"/></xsl:if>&gt;&gt; {
      const result:ListResult&lt;<xsl:value-of select="@name" /><xsl:if test="count(projection[@default='true'])>0">.<xsl:value-of select="projection[@default='true'][1]/@name"/></xsl:if>&gt; = await this.manager.find<xsl:if test="count(projection[@default='true'])>0"><xsl:value-of select="projection[@default='true'][1]/@name"/></xsl:if>(<xsl:for-each select="field[@tenant='true']"><xsl:value-of select="text()"/>, </xsl:for-each>skip, take, keyword, order_by, descending<xsl:for-each select="field[@foreignKey and not(@noGet='true') and not(@tenant='true')]">, <xsl:value-of select="text()"/></xsl:for-each><xsl:for-each select="field[@filter='true' and string-length(@foreignKey)=0]">, <xsl:value-of select="text()"/></xsl:for-each><xsl:for-each select="field[@nestedFilter='true' and string-length(@foreignKey)=0]"><xsl:variable name="entity" select="@type"/><xsl:variable name="root" select="text()"/><xsl:for-each select="../../item[@name=$entity]/field[@filter='true']">, <xsl:value-of select="text()"/></xsl:for-each></xsl:for-each>);
      <xsl:if test="count(field[string-length(@uiUploadAvatar)>0])>0">await this.fillStorageSignatures(result);</xsl:if>
      return result;
   }

   @Get(':<xsl:value-of select="$unique_id"/>')
   @Permission(AppPermissions.Admin.<xsl:value-of select="@name"/>.Read)
   async get(<xsl:for-each select="field[@tenant='true' and not(@isolated='true')]">@Param('<xsl:value-of select="text()"/>') <xsl:value-of select="text()"/>: string, </xsl:for-each>@Param('<xsl:value-of select="$unique_id"/>') <xsl:value-of select="$unique_id"/>: string): Promise&lt;ItemResult&lt;<xsl:value-of select="@name" /><xsl:if test="count(projection[@default='true'])>0">.<xsl:value-of select="projection[@default='true'][1]/@name"/></xsl:if>&gt;&gt; {
      const data = await this.manager.getById<xsl:if test="count(projection[@default='true'])>0"><xsl:value-of select="projection[@default='true'][1]/@name"/></xsl:if>(<xsl:for-each select="field[@tenant='true' and not(@isolated='true')]"><xsl:value-of select="text()"/>, </xsl:for-each><xsl:value-of select="$unique_id"/>);
      const result: ItemResult&lt;<xsl:value-of select="@name" /><xsl:if test="count(projection[@default='true'])>0">.<xsl:value-of select="projection[@default='true'][1]/@name"/></xsl:if>&gt; = {
         success: true,
         item: data,
      };
      <xsl:if test="count(field[string-length(@uiUploadAvatar)>0])>0">await this.fillStorageSignature(result);</xsl:if>
      return result;
   }

   @Post()
   @Permission(AppPermissions.Admin.<xsl:value-of select="@name"/>.Write)
   async create(<xsl:for-each select="field[@tenant='true']">@Param('<xsl:value-of select="text()"/>') <xsl:value-of select="text()"/>: string, </xsl:for-each>@Body(Sanitize.for(<xsl:value-of select="@name" />)) input: <xsl:value-of select="@name" />): Promise&lt;ItemResult&lt;<xsl:value-of select="@name" /><xsl:if test="count(projection[@default='true'])>0">.<xsl:value-of select="projection[@default='true'][1]/@name"/></xsl:if>&gt;&gt; {
      const data = await this.manager.insert<xsl:if test="count(projection[@default='true'])>0"><xsl:value-of select="projection[@default='true'][1]/@name"/></xsl:if>(<xsl:for-each select="field[@tenant='true']"><xsl:value-of select="text()"/>, </xsl:for-each>input);
      const result: ItemResult&lt;<xsl:value-of select="@name" /><xsl:if test="count(projection[@default='true'])>0">.<xsl:value-of select="projection[@default='true'][1]/@name"/></xsl:if>&gt; = {
         success: true,
         item: data,
      };
      <xsl:if test="count(field[string-length(@uiUploadAvatar)>0])>0">await this.fillStorageSignature(result);</xsl:if>
      return result;
   }

   @Put(':<xsl:value-of select="$unique_id"/>')
   @Permission(AppPermissions.Admin.<xsl:value-of select="@name"/>.Write)
   async update(<xsl:for-each select="field[@tenant='true' and not(@isolated='true')]">@Param('<xsl:value-of select="text()"/>') <xsl:value-of select="text()"/>: string, </xsl:for-each>@Param('<xsl:value-of select="$unique_id"/>') <xsl:value-of select="$unique_id"/>: string, @Body(Sanitize.for(<xsl:value-of select="@name" />)) input: <xsl:value-of select="@name" />): Promise&lt;ItemResult&lt;<xsl:value-of select="@name" /><xsl:if test="count(projection[@default='true'])>0">.<xsl:value-of select="projection[@default='true'][1]/@name"/></xsl:if>&gt;&gt; {
      const existing = await this.manager.getById<xsl:if test="count(projection[@default='true'])>0"><xsl:value-of select="projection[@default='true'][1]/@name"/></xsl:if>(<xsl:for-each select="field[@tenant='true' and not(@isolated='true')]"><xsl:value-of select="text()"/>, </xsl:for-each><xsl:value-of select="$unique_id"/>);
      if (!existing) {
         throw new NotFoundException();
      }
      existing.fillFromPartial(input);
      const data = await this.manager.replace<xsl:if test="count(projection[@default='true'])>0"><xsl:value-of select="projection[@default='true'][1]/@name"/></xsl:if>(<xsl:for-each select="field[@tenant='true' and not(@isolated='true')]"><xsl:value-of select="text()"/>, </xsl:for-each><xsl:value-of select="$unique_id"/>, existing);
      const result: ItemResult&lt;<xsl:value-of select="@name" /><xsl:if test="count(projection[@default='true'])>0">.<xsl:value-of select="projection[@default='true'][1]/@name"/></xsl:if>&gt; = {
         success: true,
         item: data,
      };
      <xsl:if test="count(field[string-length(@uiUploadAvatar)>0])>0">await this.fillStorageSignature(result);</xsl:if>
      return result;
   }

   @Delete(':<xsl:value-of select="$unique_id"/>')
   @Permission(AppPermissions.Admin.<xsl:value-of select="@name"/>.Write)
   async delete(<xsl:for-each select="field[@tenant='true' and not(@isolated='true')]">@Param('<xsl:value-of select="text()"/>') <xsl:value-of select="text()"/>: string, </xsl:for-each>@Param('<xsl:value-of select="$unique_id"/>') <xsl:value-of select="$unique_id"/>: string): Promise&lt;ActionResult&gt; {
      const data = await this.manager.getById<xsl:if test="count(projection[@default='true'])>0"><xsl:value-of select="projection[@default='true'][1]/@name"/></xsl:if>(<xsl:for-each select="field[@tenant='true' and not(@isolated='true')]"><xsl:value-of select="text()"/>, </xsl:for-each><xsl:value-of select="$unique_id"/>);
      if (data){
         await this.manager.delete<xsl:if test="count(projection[@default='true'])>0"><xsl:value-of select="projection[@default='true'][1]/@name"/></xsl:if>(data);
      }
      const result: ActionResult = {
         success: true
      };
      return result;
   }

   <xsl:if test="count(field[string-length(@uiUploadAvatar)>0])>0">
   protected async fillStorageSignatures(data: ListResult&lt;<xsl:value-of select="@name" />&gt;) : Promise&lt;void&gt; {
      if (!data?.items) { return; }
      for (const item of data.items) {
         await this.fillStorageSignatureFor<xsl:value-of select="@name" />(item);
      }
   }
   protected async fillStorageSignature(data: ItemResult&lt;<xsl:value-of select="@name" />&gt;) : Promise&lt;void&gt; {
      if (!data?.item) { return; }
      await this.fillStorageSignatureFor<xsl:value-of select="@name" />(data.item);
   }
   protected async fillStorageSignatureFor<xsl:value-of select="@name" />(data:<xsl:value-of select="@name" />) : Promise&lt;void&gt; {
      if (!data) { return; }
      <xsl:for-each select="field[string-length(@uiUploadAvatar)>0]"><xsl:variable name="fieldName" select="@uiUploadAvatar"/>
      await StorageUtils.hydrateAssetUrls(this.cloudStorageHandler, data.<xsl:value-of select="$fieldName" />);
      </xsl:for-each>
   }
   </xsl:if>
}


'''[ENDFILE]

'''[ENSUREFILE:<xsl:value-of select="../@backendPrefix"/>entities\<xsl:value-of select="$name_lowered"/>\<xsl:value-of select="$name_lowered"/>.controller.ts]
import { <xsl:value-of select="$name"/> } from './<xsl:value-of select="$name_lowered"/>.model';
import { <xsl:value-of select="$name"/>Manager } from './<xsl:value-of select="$name_lowered"/>.manager';
import { <xsl:value-of select="$name"/>ControllerBase } from './<xsl:value-of select="$name_lowered"/>.controller.base';
<xsl:if test="count(field[string-length(@uiUploadAvatar)>0])>0">import { CloudStorageHandler } from 'src/features/platform/storage';
</xsl:if>
//NOTE: Codegen will create, but not alter this file.

export class <xsl:value-of select="$name"/>Controller extends <xsl:value-of select="$name"/>ControllerBase  {
   constructor(manager: <xsl:value-of select="$name"/>Manager<xsl:if test="count(field[string-length(@uiUploadAvatar)>0])>0">, cloudStorageHandler: CloudStorageHandler</xsl:if>) {
      super(manager<xsl:if test="count(field[string-length(@uiUploadAvatar)>0])>0">, cloudStorageHandler</xsl:if>);
   }
   // Custom Endpoints here
}


'''[ENDFILE]

<xsl:if test="@useDocument='true'">
'''[STARTFILE:<xsl:value-of select="../@backendPrefix"/>entities\<xsl:value-of select="$name_lowered"/>\<xsl:value-of select="$name_lowered"/>.sanitized.validators.ts]
import { registerSanitizedValidators } from 'src/shared/utils/sanitized.registry';
import type { SanitizedValidatorMap } from 'src/shared/types/sanitized.types';
import { <xsl:value-of select="$name"/> } from './<xsl:value-of select="$name_lowered"/>.model';
import {
   assertString,
   assertStringArray,
   assertBoolean,
   assertNumber,
   assertUuid,
   assertDate,
   assertEnum,
   assertEnumArray,
   assertPlainObject,
   assertNested,
   assertNestedArray,
   optional,
} from 'src/shared/utils/sanitized.validators';

<xsl:for-each select="field[@isEnum='true' and generate-id()=generate-id(key('isEnumFieldKey', concat(../@name, translate(@type, '[]', '')))[1])]">import { <xsl:value-of select="translate(@type, '[]', '')"/> } from 'src/entities/enums/<xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="translate(@type, '[]', '')"/></xsl:call-template>';
</xsl:for-each>
<xsl:for-each select="field[not(@calculated) and @isClass='true' and not(contains(@type,'.')) and generate-id()=generate-id(key('isClassFieldKey',concat(../@name, translate(@type, '[]', '')))[1])]"><xsl:variable name="class_type"><xsl:call-template name="Replace"><xsl:with-param name="text" select="@type"/><xsl:with-param name="replace" select="'[]'"/><xsl:with-param name="by" select="''"/></xsl:call-template></xsl:variable><xsl:variable name="class_type_lower"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="$class_type"/></xsl:call-template></xsl:variable>import { <xsl:value-of select="$class_type"/> } from '../<xsl:value-of select="$class_type_lower"/>/<xsl:value-of select="$class_type_lower"/>.model';
import '../<xsl:value-of select="$class_type_lower"/>/<xsl:value-of select="$class_type_lower"/>.sanitized.validators';
</xsl:for-each>
<xsl:for-each select="field[@calculated and @isClass='true' and not(contains(@type,'.')) and generate-id()=generate-id(key('isClassFieldKey',concat(../@name, translate(@type, '[]', '')))[1])]"><xsl:variable name="calc_class_type"><xsl:call-template name="Replace"><xsl:with-param name="text" select="@type"/><xsl:with-param name="replace" select="'[]'"/><xsl:with-param name="by" select="''"/></xsl:call-template></xsl:variable><xsl:variable name="calc_class_type_lower"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="$calc_class_type"/></xsl:call-template></xsl:variable>import { <xsl:value-of select="$calc_class_type"/> } from '../<xsl:value-of select="$calc_class_type_lower"/>/<xsl:value-of select="$calc_class_type_lower"/>.model';
import '../<xsl:value-of select="$calc_class_type_lower"/>/<xsl:value-of select="$calc_class_type_lower"/>.sanitized.validators';
</xsl:for-each>
<xsl:for-each select="field[not(@calculated) and @isClass='true' and contains(@type,'.') and generate-id()=generate-id(key('isDottedClassFieldKey',concat(../@name, substring-before(translate(@type, '[]', ''), '.')))[1])]"><xsl:variable name="dotted_base" select="substring-before(translate(@type, '[]', ''), '.')"/><xsl:variable name="dotted_base_lower"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="$dotted_base"/></xsl:call-template></xsl:variable><xsl:if test="$dotted_base != $name">import { <xsl:value-of select="$dotted_base"/> } from '../<xsl:value-of select="$dotted_base_lower"/>/<xsl:value-of select="$dotted_base_lower"/>.model';
import '../<xsl:value-of select="$dotted_base_lower"/>/<xsl:value-of select="$dotted_base_lower"/>.sanitized.validators';
</xsl:if></xsl:for-each>
<xsl:for-each select="field[@calculated and @isClass='true' and contains(@type,'.') and generate-id()=generate-id(key('isDottedClassFieldKey',concat(../@name, substring-before(translate(@type, '[]', ''), '.')))[1])]"><xsl:variable name="dotted_base" select="substring-before(translate(@type, '[]', ''), '.')"/><xsl:variable name="dotted_base_lower"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="$dotted_base"/></xsl:call-template></xsl:variable><xsl:if test="$dotted_base != $name">import { <xsl:value-of select="$dotted_base"/> } from '../<xsl:value-of select="$dotted_base_lower"/>/<xsl:value-of select="$dotted_base_lower"/>.model';
import '../<xsl:value-of select="$dotted_base_lower"/>/<xsl:value-of select="$dotted_base_lower"/>.sanitized.validators';
</xsl:if></xsl:for-each>
<xsl:for-each select="projection/field[@isClass='true' and not(contains(@type,'.'))]"><xsl:variable name="proj_class_type"><xsl:call-template name="Replace"><xsl:with-param name="text" select="@type"/><xsl:with-param name="replace" select="'[]'"/><xsl:with-param name="by" select="''"/></xsl:call-template></xsl:variable><xsl:variable name="proj_class_type_lower"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="$proj_class_type"/></xsl:call-template></xsl:variable><xsl:if test="not(../../field[@isClass='true' and not(contains(@type,'.')) and translate(@type,'[]','')=$proj_class_type])">import { <xsl:value-of select="$proj_class_type"/> } from '../<xsl:value-of select="$proj_class_type_lower"/>/<xsl:value-of select="$proj_class_type_lower"/>.model';
import '../<xsl:value-of select="$proj_class_type_lower"/>/<xsl:value-of select="$proj_class_type_lower"/>.sanitized.validators';
</xsl:if></xsl:for-each>
<xsl:for-each select="projection/field[@isClass='true' and contains(@type,'.') and generate-id()=generate-id(key('isDottedClassProjectionFieldKey', concat(../../@name, substring-before(translate(@type, '[]', ''), '.')))[1])]"><xsl:variable name="dotted_base" select="substring-before(translate(@type, '[]', ''), '.')"/><xsl:variable name="dotted_base_lower"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="$dotted_base"/></xsl:call-template></xsl:variable><xsl:if test="$dotted_base != $name and not(../../field[@isClass='true' and contains(@type,'.') and substring-before(translate(@type,'[]',''),'.')=$dotted_base])">import { <xsl:value-of select="$dotted_base"/> } from '../<xsl:value-of select="$dotted_base_lower"/>/<xsl:value-of select="$dotted_base_lower"/>.model';
import '../<xsl:value-of select="$dotted_base_lower"/>/<xsl:value-of select="$dotted_base_lower"/>.sanitized.validators';
</xsl:if></xsl:for-each>
<xsl:for-each select="projection/field[@isEnum='true' and generate-id()=generate-id(key('isEnumProjectionFieldKey', concat(../../@name, ../@name, translate(@type, '[]', '')))[1])]"><xsl:variable name="proj_enum_type"><xsl:call-template name="Replace"><xsl:with-param name="text" select="@type"/><xsl:with-param name="replace" select="'[]'"/><xsl:with-param name="by" select="''"/></xsl:call-template></xsl:variable><xsl:if test="not(../../field[not(@calculated) and @isEnum='true' and @type=$proj_enum_type])">import { <xsl:value-of select="$proj_enum_type"/> } from 'src/entities/enums/<xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="$proj_enum_type"/></xsl:call-template>';
</xsl:if></xsl:for-each>

const <xsl:value-of select="$name_lowered"/>Validators: SanitizedValidatorMap = {
<xsl:for-each select="field[not(@calculated)]">
   <xsl:variable name="fn" select="text()"/>
   <xsl:variable name="opt" select="@isNullable='true' or $fn='_id'"/>
   <xsl:variable name="is_array" select="contains(@type,'[]')"/>
   <xsl:variable name="base_type"><xsl:call-template name="Replace"><xsl:with-param name="text" select="@type"/><xsl:with-param name="replace" select="'[]'"/><xsl:with-param name="by" select="''"/></xsl:call-template></xsl:variable>
   <xsl:value-of select="$fn"/>: <xsl:choose>
   <xsl:when test="@isEnum='true' and $is_array">
         <xsl:if test="$opt">(v) =&gt; optional(assertEnumArray(<xsl:value-of select="$base_type"/>))(v, '<xsl:value-of select="$fn"/>')</xsl:if>
         <xsl:if test="not($opt)">(v) =&gt; assertEnumArray(<xsl:value-of select="$base_type"/>)(v, '<xsl:value-of select="$fn"/>')</xsl:if>
      </xsl:when>
      <xsl:when test="@isEnum='true'">
         <xsl:if test="$opt">(v) =&gt; optional(assertEnum(<xsl:value-of select="@type"/>))(v, '<xsl:value-of select="$fn"/>')</xsl:if>
         <xsl:if test="not($opt)">(v) =&gt; assertEnum(<xsl:value-of select="@type"/>)(v, '<xsl:value-of select="$fn"/>')</xsl:if>
      </xsl:when>
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
      <xsl:when test="@type='Uuid'">
         <xsl:if test="$opt">(v) =&gt; optional(assertUuid)(v, '<xsl:value-of select="$fn"/>')</xsl:if>
         <xsl:if test="not($opt)">(v) =&gt; assertUuid(v, '<xsl:value-of select="$fn"/>')</xsl:if>
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

registerSanitizedValidators(<xsl:value-of select="$name"/>, <xsl:value-of select="$name_lowered"/>Validators);
<xsl:for-each select="projection">
<xsl:variable name="proj_name" select="@name"/>
<xsl:variable name="proj_name_lower"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="$proj_name"/></xsl:call-template></xsl:variable>

const <xsl:value-of select="$name_lowered"/><xsl:value-of select="$proj_name_lower"/>Validators: SanitizedValidatorMap = {
<xsl:for-each select="entry">
   <xsl:variable name="fn" select="text()"/>
   <xsl:variable name="parent_field" select="../../field[text()=$fn]"/>
   <xsl:variable name="opt" select="$parent_field/@isNullable='true' or $fn='_id'"/>
   <xsl:variable name="is_array" select="contains($parent_field/@type,'[]')"/>
   <xsl:variable name="base_type"><xsl:call-template name="Replace"><xsl:with-param name="text" select="$parent_field/@type"/><xsl:with-param name="replace" select="'[]'"/><xsl:with-param name="by" select="''"/></xsl:call-template></xsl:variable>
   <xsl:value-of select="$fn"/>: <xsl:choose>
      <xsl:when test="$parent_field/@isEnum='true' and $is_array">
         <xsl:if test="$opt">(v) =&gt; optional(assertEnumArray(<xsl:value-of select="$base_type"/>))(v, '<xsl:value-of select="$fn"/>')</xsl:if>
         <xsl:if test="not($opt)">(v) =&gt; assertEnumArray(<xsl:value-of select="$base_type"/>)(v, '<xsl:value-of select="$fn"/>')</xsl:if>
      </xsl:when>
      <xsl:when test="$parent_field/@isEnum='true'">
         <xsl:if test="$opt">(v) =&gt; optional(assertEnum(<xsl:value-of select="$parent_field/@type"/>))(v, '<xsl:value-of select="$fn"/>')</xsl:if>
         <xsl:if test="not($opt)">(v) =&gt; assertEnum(<xsl:value-of select="$parent_field/@type"/>)(v, '<xsl:value-of select="$fn"/>')</xsl:if>
      </xsl:when>
      <xsl:when test="$parent_field/@isClass='true' and not(contains($parent_field/@type,'.')) and $is_array">
         <xsl:if test="$opt">(v) =&gt; optional(assertNestedArray(<xsl:value-of select="$base_type"/>))(v, '<xsl:value-of select="$fn"/>')</xsl:if>
         <xsl:if test="not($opt)">(v) =&gt; assertNestedArray(<xsl:value-of select="$base_type"/>)(v, '<xsl:value-of select="$fn"/>')</xsl:if>
      </xsl:when>
      <xsl:when test="$parent_field/@isClass='true' and not(contains($parent_field/@type,'.'))">
         <xsl:if test="$opt">(v) =&gt; optional(assertNested(<xsl:value-of select="$base_type"/>))(v, '<xsl:value-of select="$fn"/>')</xsl:if>
         <xsl:if test="not($opt)">(v) =&gt; assertNested(<xsl:value-of select="$base_type"/>)(v, '<xsl:value-of select="$fn"/>')</xsl:if>
      </xsl:when>
      <xsl:when test="$parent_field/@isClass='true' and contains($parent_field/@type,'.') and $is_array">
         <xsl:if test="$opt">(v) =&gt; optional(assertNestedArray(<xsl:value-of select="$base_type"/>))(v, '<xsl:value-of select="$fn"/>')</xsl:if>
         <xsl:if test="not($opt)">(v) =&gt; assertNestedArray(<xsl:value-of select="$base_type"/>)(v, '<xsl:value-of select="$fn"/>')</xsl:if>
      </xsl:when>
      <xsl:when test="$parent_field/@isClass='true' and contains($parent_field/@type,'.')">
         <xsl:if test="$opt">(v) =&gt; optional(assertNested(<xsl:value-of select="$base_type"/>))(v, '<xsl:value-of select="$fn"/>')</xsl:if>
         <xsl:if test="not($opt)">(v) =&gt; assertNested(<xsl:value-of select="$base_type"/>)(v, '<xsl:value-of select="$fn"/>')</xsl:if>
      </xsl:when>
      <xsl:when test="$parent_field/@type='Uuid'">
         <xsl:if test="$opt">(v) =&gt; optional(assertUuid)(v, '<xsl:value-of select="$fn"/>')</xsl:if>
         <xsl:if test="not($opt)">(v) =&gt; assertUuid(v, '<xsl:value-of select="$fn"/>')</xsl:if>
      </xsl:when>
      <xsl:when test="$parent_field/@type='string'">
         <xsl:if test="$opt">(v) =&gt; optional(assertString)(v, '<xsl:value-of select="$fn"/>')</xsl:if>
         <xsl:if test="not($opt)">(v) =&gt; assertString(v, '<xsl:value-of select="$fn"/>')</xsl:if>
      </xsl:when>
      <xsl:when test="$parent_field/@type='string[]'">
         <xsl:if test="$opt">(v) =&gt; optional(assertStringArray)(v, '<xsl:value-of select="$fn"/>')</xsl:if>
         <xsl:if test="not($opt)">(v) =&gt; assertStringArray(v, '<xsl:value-of select="$fn"/>')</xsl:if>
      </xsl:when>
      <xsl:when test="$parent_field/@type='boolean'">
         <xsl:if test="$opt">(v) =&gt; optional(assertBoolean)(v, '<xsl:value-of select="$fn"/>')</xsl:if>
         <xsl:if test="not($opt)">(v) =&gt; assertBoolean(v, '<xsl:value-of select="$fn"/>')</xsl:if>
      </xsl:when>
      <xsl:when test="$parent_field/@type='int'">
         <xsl:if test="$opt">(v) =&gt; optional(assertNumber)(v, '<xsl:value-of select="$fn"/>')</xsl:if>
         <xsl:if test="not($opt)">(v) =&gt; assertNumber(v, '<xsl:value-of select="$fn"/>')</xsl:if>
      </xsl:when>
      <xsl:when test="$parent_field/@type='Date'">
         <xsl:if test="$opt">(v) =&gt; optional(assertDate)(v, '<xsl:value-of select="$fn"/>')</xsl:if>
         <xsl:if test="not($opt)">(v) =&gt; assertDate(v, '<xsl:value-of select="$fn"/>')</xsl:if>
      </xsl:when>
      <xsl:otherwise>(v) =&gt; optional(assertPlainObject)(v, '<xsl:value-of select="$fn"/>')</xsl:otherwise>
   </xsl:choose>,
</xsl:for-each>
<xsl:for-each select="field">
   <xsl:variable name="fn" select="text()"/>
   <xsl:variable name="opt" select="@isNullable='true'"/>
   <xsl:variable name="is_array" select="contains(@type,'[]')"/>
   <xsl:variable name="base_type"><xsl:call-template name="Replace"><xsl:with-param name="text" select="@type"/><xsl:with-param name="replace" select="'[]'"/><xsl:with-param name="by" select="''"/></xsl:call-template></xsl:variable>
   <xsl:value-of select="$fn"/>: <xsl:choose>
      <xsl:when test="@isEnum='true' and $is_array">
         <xsl:if test="$opt">(v) =&gt; optional(assertEnumArray(<xsl:value-of select="$base_type"/>))(v, '<xsl:value-of select="$fn"/>')</xsl:if>
         <xsl:if test="not($opt)">(v) =&gt; assertEnumArray(<xsl:value-of select="$base_type"/>)(v, '<xsl:value-of select="$fn"/>')</xsl:if>
      </xsl:when>
      <xsl:when test="@isEnum='true'">
         <xsl:if test="$opt">(v) =&gt; optional(assertEnum(<xsl:value-of select="@type"/>))(v, '<xsl:value-of select="$fn"/>')</xsl:if>
         <xsl:if test="not($opt)">(v) =&gt; assertEnum(<xsl:value-of select="@type"/>)(v, '<xsl:value-of select="$fn"/>')</xsl:if>
      </xsl:when>
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
      <xsl:when test="@type='Uuid'">
         <xsl:if test="$opt">(v) =&gt; optional(assertUuid)(v, '<xsl:value-of select="$fn"/>')</xsl:if>
         <xsl:if test="not($opt)">(v) =&gt; assertUuid(v, '<xsl:value-of select="$fn"/>')</xsl:if>
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

registerSanitizedValidators(<xsl:value-of select="$name"/>.<xsl:value-of select="$proj_name"/>, <xsl:value-of select="$name_lowered"/><xsl:value-of select="$proj_name_lower"/>Validators);
</xsl:for-each>

'''[ENDFILE]
</xsl:if>

</xsl:for-each>

<!-- ==========================================
     classOnly item validators
     ========================================== -->
<xsl:for-each select="items/item[@classOnly='true']">
   <xsl:variable name="name_lowered"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="@name"/></xsl:call-template></xsl:variable>
   <xsl:variable name="name"><xsl:value-of select="@name"/></xsl:variable>

'''[STARTFILE:<xsl:value-of select="../@backendPrefix"/>entities\<xsl:value-of select="$name_lowered"/>\<xsl:value-of select="$name_lowered"/>.sanitized.validators.ts]
import { registerSanitizedValidators } from 'src/shared/utils/sanitized.registry';
import type { SanitizedValidatorMap } from 'src/shared/types/sanitized.types';
import { <xsl:value-of select="$name"/> } from './<xsl:value-of select="$name_lowered"/>.model';
import {
   assertString,
   assertStringArray,
   assertBoolean,
   assertNumber,
   assertUuid,
   assertDate,
   assertEnum,
   assertEnumArray,
   assertPlainObject,
   assertNested,
   assertNestedArray,
   optional,
} from 'src/shared/utils/sanitized.validators';
<xsl:for-each select="field[@isEnum='true' and generate-id()=generate-id(key('isEnumFieldKey', concat(../@name, translate(@type, '[]', '')))[1])]">import { <xsl:value-of select="translate(@type, '[]', '')"/> } from 'src/entities/enums/<xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="translate(@type, '[]', '')"/></xsl:call-template>';
</xsl:for-each>
<xsl:for-each select="field[@isClass='true' and not(contains(@type,'.')) and generate-id()=generate-id(key('isClassFieldKey',concat(../@name, translate(@type, '[]', '')))[1])]"><xsl:variable name="class_type"><xsl:call-template name="Replace"><xsl:with-param name="text" select="@type"/><xsl:with-param name="replace" select="'[]'"/><xsl:with-param name="by" select="''"/></xsl:call-template></xsl:variable><xsl:variable name="class_type_lower"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="$class_type"/></xsl:call-template></xsl:variable>
<xsl:if test="$class_type != $name">import { <xsl:value-of select="$class_type"/> } from 'src/entities/<xsl:value-of select="$class_type_lower"/>/<xsl:value-of select="$class_type_lower"/>.model';
import 'src/entities/<xsl:value-of select="$class_type_lower"/>/<xsl:value-of select="$class_type_lower"/>.sanitized.validators';
</xsl:if></xsl:for-each>
<xsl:for-each select="field[@isClass='true' and contains(@type,'.') and generate-id()=generate-id(key('isDottedClassFieldKey',concat(../@name, substring-before(translate(@type, '[]', ''), '.')))[1])]"><xsl:variable name="dotted_base" select="substring-before(translate(@type, '[]', ''), '.')"/><xsl:variable name="dotted_base_lower"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="$dotted_base"/></xsl:call-template></xsl:variable>
<xsl:if test="$dotted_base != $name">import { <xsl:value-of select="$dotted_base"/> } from 'src/entities/<xsl:value-of select="$dotted_base_lower"/>/<xsl:value-of select="$dotted_base_lower"/>.model';
import 'src/entities/<xsl:value-of select="$dotted_base_lower"/>/<xsl:value-of select="$dotted_base_lower"/>.sanitized.validators';
</xsl:if></xsl:for-each>

const <xsl:value-of select="$name_lowered"/>Validators: SanitizedValidatorMap = {
<xsl:for-each select="field">
   <xsl:variable name="fn" select="text()"/>
   <xsl:variable name="opt" select="@isNullable='true'"/>
   <xsl:variable name="is_array" select="contains(@type,'[]')"/>
   <xsl:variable name="base_type"><xsl:call-template name="Replace"><xsl:with-param name="text" select="@type"/><xsl:with-param name="replace" select="'[]'"/><xsl:with-param name="by" select="''"/></xsl:call-template></xsl:variable>
   <xsl:value-of select="$fn"/>: <xsl:choose>
      <xsl:when test="@isEnum='true' and $is_array">
         <xsl:if test="$opt">(v) =&gt; optional(assertEnumArray(<xsl:value-of select="$base_type"/>))(v, '<xsl:value-of select="$fn"/>')</xsl:if>
         <xsl:if test="not($opt)">(v) =&gt; assertEnumArray(<xsl:value-of select="$base_type"/>)(v, '<xsl:value-of select="$fn"/>')</xsl:if>
      </xsl:when>
      <xsl:when test="@isEnum='true'">
         <xsl:if test="$opt">(v) =&gt; optional(assertEnum(<xsl:value-of select="@type"/>))(v, '<xsl:value-of select="$fn"/>')</xsl:if>
         <xsl:if test="not($opt)">(v) =&gt; assertEnum(<xsl:value-of select="@type"/>)(v, '<xsl:value-of select="$fn"/>')</xsl:if>
      </xsl:when>
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
      <xsl:when test="@type='Uuid'">
         <xsl:if test="$opt">(v) =&gt; optional(assertUuid)(v, '<xsl:value-of select="$fn"/>')</xsl:if>
         <xsl:if test="not($opt)">(v) =&gt; assertUuid(v, '<xsl:value-of select="$fn"/>')</xsl:if>
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

registerSanitizedValidators(<xsl:value-of select="$name"/>, <xsl:value-of select="$name_lowered"/>Validators);

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
</xsl:stylesheet>