<?xml version="1.0" encoding="UTF-8" ?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
<xsl:key name="perspectiveKey" match="items/item/field[string-length(@perspective)>0]" use="concat(../@name, @perspective)" />
<xsl:key name="extraValidationKey" match="items/item/field[string-length(@extraValidation)>0]" use="concat(../@name, @extraValidation)" />

<xsl:template match="/">

<xsl:variable name="mongooseVersion" select="items/@mongooseVersion"/>
<xsl:variable name="filterType"><xsl:choose><xsl:when test="$mongooseVersion >= 9">QueryFilter</xsl:when><xsl:otherwise>FilterQuery</xsl:otherwise></xsl:choose></xsl:variable>
<xsl:variable name="dbAccess"><xsl:choose><xsl:when test="$mongooseVersion >= 9">db!</xsl:when><xsl:otherwise>db</xsl:otherwise></xsl:choose></xsl:variable>

<xsl:for-each select="items/item[not(@classOnly='true')]">
   <xsl:variable name="name_lowered"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="@name"/></xsl:call-template></xsl:variable>
   <xsl:variable name="name"><xsl:value-of select="@name"/></xsl:variable>
   <xsl:variable name="tenant"><xsl:choose><xsl:when test="@tenant='Isolated'">Isolated</xsl:when><xsl:otherwise>Shared</xsl:otherwise></xsl:choose></xsl:variable>


'''[ENSUREFILE:<xsl:value-of select="../@backendPrefix"/>entities\<xsl:value-of select="$name_lowered"/>\<xsl:value-of select="$name_lowered"/>.manager.ts]
import { Injectable } from '@nestjs/common';
import { <xsl:value-of select="$name"/> } from './<xsl:value-of select="$name_lowered"/>.model';
import { <xsl:value-of select="$name"/>ManagerBase } from './<xsl:value-of select="$name_lowered"/>.manager.base';
import { MongoConnectionProvider } from 'src/shared/mongo/mongo-connection.provider';
import { DependencyCoordinator } from '../dependencies/dependency-coordinator';
import { EntityRegistry } from '../entity.registry';
import { MemoryCache } from 'src/shared/cache/memory-cache';

@Injectable()
export class <xsl:value-of select="$name"/>Manager extends <xsl:value-of select="$name"/>ManagerBase {
   constructor(connectionProvider: MongoConnectionProvider, entities: EntityRegistry, dependencyCoordinator: DependencyCoordinator, memoryCache:MemoryCache) {
      super(connectionProvider, entities, dependencyCoordinator, memoryCache);
   }

   // add any additions or overrides here
}

'''[ENDFILE]


'''[STARTFILE:<xsl:value-of select="../@backendPrefix"/>entities\<xsl:value-of select="$name_lowered"/>\<xsl:value-of select="$name_lowered"/>.manager.base.ts]
import { ConflictException, forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
<xsl:choose><xsl:when test="@tenant='Isolated'">import { MongoManagerIsolated } from 'src/shared/managers/mongo-manager.isolated';</xsl:when><xsl:otherwise>import { MongoManagerShared } from 'src/shared/managers/mongo-manager.shared';</xsl:otherwise></xsl:choose>
import { MongoConnectionProvider } from 'src/shared/mongo/mongo-connection.provider';
import { <xsl:value-of select="$name"/> } from './<xsl:value-of select="$name_lowered"/>.model';
import { <xsl:value-of select="$filterType"/>, ProjectionFields, SortOrder, UpdateQuery } from 'mongoose';
import type { Document } from 'bson';
import { COLLECTION_NAME, PRIMARY_KEY } from './<xsl:value-of select="$name_lowered"/>.schema';
import { v4 as uuidv4 } from 'uuid';
import { isNullOrWhiteSpace, sanitizeHtml, truncateStart } from 'src/shared/utils/string.utils';<xsl:if test="count(field[@searchable='true'])>0">
import { SEARCHABLE_DIVIDER } from 'src/shared/mongo';</xsl:if>
import { UIException } from 'src/shared/exceptions/friendly-exception';
import { LocalizableString } from 'src/shared/types/i18n/localizable-string';
import { DependencyCoordinator } from '../dependencies/dependency-coordinator';
import { EntityRegistry } from '../entity.registry';
import { DocumentOperation } from '../common/document-operation';
import { ItemResult } from 'src/shared/types/data/item-result';
import { ListResult } from 'src/shared/types/data/list-result';
import { SortInfo } from 'src/shared/types/data/sort-info';
import { MAX_INT_32 } from 'src/shared/constants/int';
import { validate as uuidValidate } from 'uuid';
import { MemoryCache } from 'src/shared/cache/memory-cache';
import { BatchUtils } from 'src/shared/utils';
<xsl:if test="count(field[string-length(@calculated)>0])>0">import { SynchronizableEntity<xsl:if test="@tenant='Isolated'">Isolated</xsl:if><xsl:if test="@tenant='Shared' or @tenant='Route'">Shared</xsl:if> } from 'src/shared/managers/synchronized-entity';</xsl:if>

<xsl:for-each select="field[@isEnum='true' and @filter='true']">import { <xsl:value-of select="@type"/> } from '../enums/<xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="@type"/></xsl:call-template>';
</xsl:for-each>

@Injectable()
export class <xsl:value-of select="$name"/>ManagerBase extends MongoManager<xsl:value-of select="$tenant"/>&lt;<xsl:value-of select="$name"/>&gt; <xsl:if test="count(field[string-length(@calculated)>0])>0">implements SynchronizableEntity<xsl:if test="@tenant='Isolated'">Isolated</xsl:if><xsl:if test="@tenant='Shared' or @tenant='Route'">Shared</xsl:if><xsl:text> </xsl:text></xsl:if>{
   protected readonly logger = new Logger(<xsl:value-of select="$name"/>ManagerBase.name);

   constructor(connectionProvider: MongoConnectionProvider, entities: EntityRegistry, dependencyCoordinator: DependencyCoordinator, memoryCache: MemoryCache) {
      super(COLLECTION_NAME, PRIMARY_KEY, connectionProvider, entities, dependencyCoordinator, memoryCache);
   }<xsl:if test="not(@uiGenerate='false') and count(field[@searchable='true'])=0">
      code-gen-error: //at least one field must me marked with searchable='true' for <xsl:value-of select="$name"/> because uiGenerate is set to true
   </xsl:if>

   async validateExistence(<xsl:for-each select="field[@tenant='true' and not(@isolated='true')]"><xsl:value-of select="text()"/>:<xsl:call-template name="NodeType"><xsl:with-param name="type" select="@type"/></xsl:call-template>, </xsl:for-each><xsl:value-of select="field[1]/text()"/>:string<xsl:if test="not(@tenant='Route') and not(@tenant='Isolated')"> | undefined</xsl:if>) {
      <xsl:if test="not(@tenant='Route') and not(@tenant='Isolated')">if (!<xsl:value-of select="field[1]/text()"/>)
      {
         return;
      }</xsl:if>
      <xsl:choose>
      <xsl:when test="@tenant='Isolated' and ../@isolatedGetByIdUsesWorkspaceFilter='true' and count(field[@tenant='true' and not(@isolated='true')])>0">const filter: <xsl:value-of select="$filterType"/>&lt;<xsl:value-of select="@name"/>&gt; = { <xsl:value-of select="field[@tenant='true' and not(@isolated='true')][1]/text()"/>: <xsl:value-of select="field[@tenant='true' and not(@isolated='true')][1]/text()"/>, <xsl:value-of select="field[1]/text()"/>: <xsl:value-of select="field[1]/text()"/> };
      const found = await this._findOneIsolated&lt;<xsl:value-of select="@name"/>&gt;(<xsl:value-of select="@name"/>, <xsl:value-of select="field[@tenant='true' and not(@isolated='true')][1]/text()"/>, filter, { <xsl:value-of select="field[1]/text()"/>: 1 });</xsl:when>
      <xsl:otherwise>const found = await this._retrieve<xsl:if test="@tenant='Isolated'">Isolated</xsl:if><xsl:if test="@tenant='Shared' or @tenant='Route'">Shared</xsl:if>&lt;<xsl:value-of select="@name"/>&gt;(<xsl:value-of select="@name"/>, <xsl:for-each select="field[@tenant='true']"><xsl:value-of select="text()"/>, </xsl:for-each> <xsl:value-of select="field[1]/text()"/>, { <xsl:value-of select="field[1]/text()"/>: 1 });</xsl:otherwise>
      </xsl:choose>
      
      if (!found) {
         throw new UIException(LocalizableString.General_InvalidReference("<xsl:value-of select="@name"/>"));
      }
   }
   
   <xsl:for-each select="field[string-length(@foreignKey)>0 and not(@fakeForeignKey='true')]"><xsl:variable name="current_fk"><xsl:value-of select="text()"/></xsl:variable>
   async anyWith<xsl:call-template name="Spaceless"><xsl:with-param name="text" select="@friendlyName"/></xsl:call-template>(<xsl:for-each select="../field[@tenant='true' and text()!=$current_fk]"><xsl:value-of select="text()"/>:<xsl:call-template name="NodeType"><xsl:with-param name="type" select="@type"/></xsl:call-template>, </xsl:for-each><xsl:value-of select="text()"/>:<xsl:call-template name="NodeType"><xsl:with-param name="type" select="@type"/></xsl:call-template> | undefined): Promise&lt;boolean&gt;{
      if (!<xsl:value-of select="text()"/>){
         return false;
      }
      const filter: <xsl:value-of select="$filterType"/>&lt;<xsl:value-of select="../@name"/>&gt; = {
         <xsl:for-each select="../field[@tenant='true' and text()!=$current_fk]"><xsl:value-of select="text()"/>: <xsl:value-of select="text()"/>,
         </xsl:for-each><xsl:value-of select="text()"/>: <xsl:value-of select="text()"/>
      };

      const found = await this._find<xsl:if test="../@tenant='Isolated'">Isolated</xsl:if><xsl:if test="../@tenant='Shared' or ../@tenant='Route'">Shared</xsl:if>&lt;<xsl:value-of select="../@name"/>&gt;(<xsl:value-of select="../@name"/>, <xsl:for-each select="../field[@tenant='true']"><xsl:value-of select="text()"/>, </xsl:for-each>filter, { <xsl:value-of select="../field[1]/text()"/>: 1 }, 0, 1, undefined, false);
      return found.items.length &gt; 0;
   }
   </xsl:for-each>

   async getById(<xsl:for-each select="field[@tenant='true' and not(@isolated='true')]"><xsl:value-of select="text()"/>: <xsl:call-template name="NodeType"><xsl:with-param name="type" select="@type"/></xsl:call-template>, </xsl:for-each><xsl:value-of select="field[1]/text()"/>: string): Promise&lt;<xsl:value-of select="$name"/> | undefined&gt; {
      <xsl:choose>
      <xsl:when test="@tenant='Isolated' and ../@isolatedGetByIdUsesWorkspaceFilter='true' and count(field[@tenant='true' and not(@isolated='true')])>0">const filter: <xsl:value-of select="$filterType"/>&lt;<xsl:value-of select="$name"/>&gt; = { <xsl:value-of select="field[@tenant='true' and not(@isolated='true')][1]/text()"/>: <xsl:value-of select="field[@tenant='true' and not(@isolated='true')][1]/text()"/>, <xsl:value-of select="field[1]/text()"/>: <xsl:value-of select="field[1]/text()"/> };
      const result = await this._findOneIsolated&lt;<xsl:value-of select="$name"/>&gt;(<xsl:value-of select="$name"/>, <xsl:value-of select="field[@tenant='true' and not(@isolated='true')][1]/text()"/>, filter, <xsl:value-of select="$name"/>.Projection);</xsl:when>
      <xsl:otherwise>const result = this._retrieve<xsl:value-of select="$tenant"/>&lt;<xsl:value-of select="$name"/>&gt;(<xsl:value-of select="@name"/>, <xsl:for-each select="field[@tenant='true']"><xsl:value-of select="text()"/>, </xsl:for-each><xsl:value-of select="field[1]/text()"/>, <xsl:value-of select="$name"/>.Projection);</xsl:otherwise>
      </xsl:choose>
      return result;
   }
   <xsl:for-each select="projection[@get='true']">
   async getById<xsl:value-of select="@name"/>(<xsl:for-each select="../field[@tenant='true' and not(@isolated='true')]"><xsl:value-of select="text()"/>: <xsl:call-template name="NodeType"><xsl:with-param name="type" select="@type"/></xsl:call-template>, </xsl:for-each><xsl:value-of select="../field[1]/text()" />:string) : Promise&lt;<xsl:value-of select="../@name" />.<xsl:value-of select="@name" /> | undefined&gt; {
      <xsl:choose>
      <xsl:when test="../@tenant='Isolated' and ../../@isolatedGetByIdUsesWorkspaceFilter='true' and count(../field[@tenant='true' and not(@isolated='true')])>0">const filter: <xsl:value-of select="$filterType"/>&lt;<xsl:value-of select="../@name"/>&gt; = { <xsl:value-of select="../field[@tenant='true' and not(@isolated='true')][1]/text()"/>: <xsl:value-of select="../field[@tenant='true' and not(@isolated='true')][1]/text()"/>, <xsl:value-of select="../field[1]/text()"/>: <xsl:value-of select="../field[1]/text()"/> };
      const result = await this._findOneIsolated&lt;<xsl:value-of select="../@name"/>.<xsl:value-of select="@name"/>&gt;(<xsl:value-of select="../@name"/>.<xsl:value-of select="@name"/>, <xsl:value-of select="../field[@tenant='true' and not(@isolated='true')][1]/text()"/>, filter, <xsl:value-of select="../@name"/>.<xsl:value-of select="@name"/>.Projection);</xsl:when>
      <xsl:otherwise>const result = await this._retrieve<xsl:if test="../@tenant='Isolated'">Isolated</xsl:if><xsl:if test="../@tenant='Shared' or ../@tenant='Route'">Shared</xsl:if>&lt;<xsl:value-of select="../@name"/>.<xsl:value-of select="@name"/>&gt;(<xsl:value-of select="../@name"/>.<xsl:value-of select="@name"/>, <xsl:for-each select="../field[@tenant='true']"><xsl:value-of select="text()" />, </xsl:for-each><xsl:value-of select="../field[1]/text()"/>, <xsl:value-of select="../@name"/>.<xsl:value-of select="@name"/>.Projection);</xsl:otherwise>
      </xsl:choose>
      return result;
   }
   </xsl:for-each>

   async getWithin&lt;TProjection&gt;(
      ctor: new (...args: any[]) =&gt; TProjection, 
      projection: ProjectionFields&lt;TProjection&gt;,
      <xsl:for-each select="field[@tenant='true']"><xsl:value-of select="text()"/>: <xsl:call-template name="NodeType"><xsl:with-param name="type" select="@type"/></xsl:call-template>,
      </xsl:for-each>ids: <xsl:call-template name="NodeType"><xsl:with-param name="type" select="field[1]/@type"/></xsl:call-template>[]
   ): Promise&lt;TProjection[]&gt; {
      if (!ids || ids.length === 0) {
         return [];
      }

      const result = BatchUtils.getWithinBuffered(ids, async (ids: string[]): Promise&lt;TProjection[]&gt; =&gt; {
         const orFilter = BatchUtils.createOrFilter&lt;<xsl:value-of select="$name"/>&gt;(ids, '<xsl:value-of select="field[1]/text()"/>');
         const filter: <xsl:value-of select="$filterType"/>&lt;<xsl:value-of select="$name"/>&gt; = {<xsl:for-each select="field[@tenant='true' and not(@isolated='true')]"><xsl:text>
            </xsl:text><xsl:value-of select="text()"/>: <xsl:value-of select="text()"/>,</xsl:for-each>
            ...orFilter,
         };

         const result = await this._find<xsl:value-of select="$tenant"/>&lt;TProjection&gt;(ctor, <xsl:for-each select="field[@tenant='true']"><xsl:value-of select="text()"/>, </xsl:for-each>filter, projection, 0, MAX_INT_32);
         
         return result.items;
      });
      return result;
      
   }

   <xsl:for-each select="field[@getForSingle='true']"><xsl:variable name="current_fk"><xsl:value-of select="text()"/></xsl:variable>
   async getFor<xsl:call-template name="Spaceless"><xsl:with-param name="text" select="@friendlyName"/></xsl:call-template>(<xsl:for-each select="../field[@tenant='true']"><xsl:value-of select="text()"/>: <xsl:call-template name="NodeType"><xsl:with-param name="type" select="@type"/></xsl:call-template>, </xsl:for-each><xsl:value-of select="text()"/>: <xsl:call-template name="NodeType"><xsl:with-param name="type" select="@type"/></xsl:call-template>): Promise&lt;<xsl:value-of select="../@name"/> | undefined&gt; {
      const filter: <xsl:value-of select="$filterType"/>&lt;<xsl:value-of select="../@name"/>&gt; = { <xsl:for-each select="../field[@tenant='true' and text()!=$current_fk]"><xsl:value-of select="text()"/>: <xsl:value-of select="text()"/>, </xsl:for-each><xsl:value-of select="text()"/>: <xsl:value-of select="text()"/> };
      const result = await this._findOne<xsl:value-of select="$tenant"/>&lt;<xsl:value-of select="../@name"/>&gt;(<xsl:value-of select="../@name"/>, <xsl:for-each select="../field[@tenant='true']"><xsl:value-of select="text()"/>, </xsl:for-each>filter, <xsl:value-of select="../@name"/>.Projection);
      return result;
   }
   </xsl:for-each>
   <xsl:for-each select="field[@getFor='true']"><xsl:variable name="current_fk"><xsl:value-of select="text()"/></xsl:variable>
   async getFor<xsl:call-template name="Spaceless"><xsl:with-param name="text" select="@friendlyName"/></xsl:call-template>(<xsl:for-each select="../field[@tenant='true']"><xsl:value-of select="text()"/>: <xsl:call-template name="NodeType"><xsl:with-param name="type" select="@type"/></xsl:call-template>, </xsl:for-each><xsl:if test="not(@tenant='true')"><xsl:value-of select="text()"/>: <xsl:call-template name="NodeType"><xsl:with-param name="type" select="@type"/></xsl:call-template></xsl:if>): Promise&lt;<xsl:value-of select="../@name"/>[]&gt; {
      const filter: <xsl:value-of select="$filterType"/>&lt;<xsl:value-of select="../@name"/>&gt; = { <xsl:for-each select="../field[@tenant='true' and text()!=$current_fk]"><xsl:value-of select="text()"/>: <xsl:value-of select="text()"/>, </xsl:for-each><xsl:value-of select="text()"/>: <xsl:value-of select="text()"/> };
      const result = await this._find<xsl:value-of select="$tenant"/>&lt;<xsl:value-of select="../@name"/>&gt;(<xsl:value-of select="../@name"/>, <xsl:for-each select="../field[@tenant='true']"><xsl:value-of select="text()"/>, </xsl:for-each>filter, <xsl:value-of select="../@name"/>.Projection, 0, MAX_INT_32, undefined, false);
      return result.items;
   }
   </xsl:for-each>

   async find(
      <xsl:for-each select="field[@tenant='true']"><xsl:value-of select="text()"/>: <xsl:call-template name="NodeType"><xsl:with-param name="type" select="@type"/></xsl:call-template>, 
      </xsl:for-each>skip: number, 
      take: number,<xsl:if test="count(field[@searchable='true'])>0">
      keyword?: string,</xsl:if>
      order_by?: string, 
      descending: boolean = false<xsl:for-each select="field[@foreignKey and not(@noGet='true') and not(@tenant='true')]">,
      <xsl:value-of select="text()"/>?: string</xsl:for-each>
      <xsl:for-each select="field[@filter='true' and string-length(@foreignKey)=0]">,
      <xsl:value-of select="text()"/>?: <xsl:call-template name="NodeType"><xsl:with-param name="type" select="@type"/></xsl:call-template></xsl:for-each>
      <xsl:for-each select="field[@nestedFilter='true' and string-length(@foreignKey)=0]"><xsl:variable name="entity" select="@type"/><xsl:variable name="root" select="text()"/>
      <xsl:for-each select="../../item[@name=$entity]/field[@filter='true']">,
      <xsl:value-of select="text()"/>: <xsl:call-template name="NodeType"><xsl:with-param name="type" select="@type"/></xsl:call-template> = undefined</xsl:for-each></xsl:for-each>
   ): Promise&lt;ListResult&lt;<xsl:value-of select="$name"/>&gt;&gt; {
      return await this.findAs&lt;<xsl:value-of select="$name"/>&gt;(
         <xsl:value-of select="$name"/>,
         <xsl:value-of select="$name"/>.Projection,
         <xsl:for-each select="field[@tenant='true']"><xsl:value-of select="text()"/>, 
         </xsl:for-each>skip, 
         take,<xsl:if test="count(field[@searchable='true'])>0">
         keyword,</xsl:if>
         order_by, 
         descending<xsl:for-each select="field[@foreignKey and not(@noGet='true') and not(@tenant='true')]">,
         <xsl:value-of select="text()"/></xsl:for-each>
         <xsl:for-each select="field[@filter='true' and string-length(@foreignKey)=0]">,
         <xsl:value-of select="text()"/></xsl:for-each>
         <xsl:for-each select="field[@nestedFilter='true' and string-length(@foreignKey)=0]"><xsl:variable name="entity" select="@type"/><xsl:variable name="root" select="text()"/>
         <xsl:for-each select="../../item[@name=$entity]/field[@filter='true']">,
         <xsl:value-of select="text()"/></xsl:for-each></xsl:for-each>
      );
   }
   <xsl:for-each select="projection[@search='true' or @default='true']">
   async find<xsl:value-of select="@name"/>(
      <xsl:for-each select="../field[@tenant='true']"><xsl:value-of select="text()"/>: <xsl:call-template name="NodeType"><xsl:with-param name="type" select="@type"/></xsl:call-template>,
      </xsl:for-each>skip: number, 
      take: number,<xsl:if test="count(../field[@searchable='true'])>0">
      keyword?: string,</xsl:if>
      order_by?: string, 
      descending: boolean = false<xsl:for-each select="../field[@foreignKey and not(@noGet='true') and not(@tenant='true')]">,
      <xsl:value-of select="text()"/>?: string</xsl:for-each>
      <xsl:for-each select="../field[@filter='true' and string-length(@foreignKey)=0]">,
      <xsl:value-of select="text()"/>?: <xsl:call-template name="NodeType"><xsl:with-param name="type" select="@type"/></xsl:call-template></xsl:for-each>
      <xsl:for-each select="../field[@nestedFilter='true' and string-length(@foreignKey)=0]"><xsl:variable name="entity" select="@type"/><xsl:variable name="root" select="text()"/>
      <xsl:for-each select="../../item[@name=$entity]/field[@filter='true']">,
      <xsl:value-of select="text()"/>: <xsl:call-template name="NodeType"><xsl:with-param name="type" select="@type"/></xsl:call-template> = undefined</xsl:for-each></xsl:for-each>
   ): Promise&lt;ListResult&lt;<xsl:value-of select="$name"/>.<xsl:value-of select="@name"/>&gt;&gt; {
      return await this.findAs&lt;<xsl:value-of select="$name"/>.<xsl:value-of select="@name"/>&gt;(
         <xsl:value-of select="$name"/>.<xsl:value-of select="@name"/>,
         <xsl:value-of select="$name"/>.<xsl:value-of select="@name"/>.Projection,
         <xsl:for-each select="../field[@tenant='true']"><xsl:value-of select="text()"/>, 
         </xsl:for-each>skip, 
         take,<xsl:if test="count(../field[@searchable='true'])>0">
         keyword,</xsl:if>
         order_by, 
         descending<xsl:for-each select="../field[@foreignKey and not(@noGet='true') and not(@tenant='true')]">,
         <xsl:value-of select="text()"/></xsl:for-each>
         <xsl:for-each select="../field[@filter='true' and string-length(@foreignKey)=0]">,
         <xsl:value-of select="text()"/></xsl:for-each>
         <xsl:for-each select="../field[@nestedFilter='true' and string-length(@foreignKey)=0]"><xsl:variable name="entity" select="@type"/><xsl:variable name="root" select="text()"/>
         <xsl:for-each select="../../item[@name=$entity]/field[@filter='true']">, <xsl:value-of select="text()"/></xsl:for-each></xsl:for-each>
      );
   }
   </xsl:for-each>

   protected async findAs&lt;TProjection&gt;(
      ctor: new (...args: any[]) =&gt; TProjection, 
      projection: ProjectionFields&lt;TProjection&gt;,
      <xsl:for-each select="field[@tenant='true']"><xsl:value-of select="text()"/>: <xsl:call-template name="NodeType"><xsl:with-param name="type" select="@type"/></xsl:call-template>, 
      </xsl:for-each>skip: number, 
      take: number,<xsl:if test="count(field[@searchable='true'])>0">
      keyword?: string,</xsl:if>
      order_by?: string, 
      descending: boolean = false<xsl:for-each select="field[@foreignKey and not(@noGet='true') and not(@tenant='true')]">,
      <xsl:value-of select="text()"/>?: string</xsl:for-each>
      <xsl:for-each select="field[@filter='true' and string-length(@foreignKey)=0]">,
      <xsl:value-of select="text()"/>?: <xsl:call-template name="NodeType"><xsl:with-param name="type" select="@type"/></xsl:call-template></xsl:for-each>
      <xsl:for-each select="field[@nestedFilter='true' and string-length(@foreignKey)=0]"><xsl:variable name="entity" select="@type"/><xsl:variable name="root" select="text()"/>
      <xsl:for-each select="../../item[@name=$entity]/field[@filter='true']">,
      <xsl:value-of select="text()"/>: <xsl:call-template name="NodeType"><xsl:with-param name="type" select="@type"/></xsl:call-template> = undefined</xsl:for-each></xsl:for-each>
      <xsl:for-each select="field[string-length(@searchToggle)>0]"><xsl:variable name="searchType"><xsl:value-of select="@type" /></xsl:variable>,
      <xsl:value-of select="text()"/>: <xsl:call-template name="NodeType"><xsl:with-param name="type" select="@type"/></xsl:call-template> = <xsl:value-of select="@searchToggle"/></xsl:for-each>
   ): Promise&lt;ListResult&lt;TProjection&gt;&gt; {
      const filter: <xsl:value-of select="$filterType"/>&lt;<xsl:value-of select="$name"/>&gt; = {
         <xsl:for-each select="field[@tenant='true']"><xsl:value-of select="text()"/>: <xsl:value-of select="text()"/>,</xsl:for-each>
      };
      <xsl:for-each select="field[@foreignKey and not(@noGet='true') and not(@tenant='true')]">
      if(<xsl:choose><xsl:when test="@type='string'">!isNullOrWhiteSpace(<xsl:value-of select="text()"/>)</xsl:when><xsl:otherwise><xsl:value-of select="text()"/> !== undefined &amp;&amp; <xsl:value-of select="text()"/> !== null</xsl:otherwise></xsl:choose>) {
         filter.<xsl:value-of select="text()"/> = <xsl:value-of select="text()"/>;
      }
      </xsl:for-each>
      <xsl:if test="count(field[@searchable='true'])>0">
      if (!isNullOrWhiteSpace(keyword)) {
         // Escape special regex characters to treat them as literals
         const escapedKeyword = keyword!.toLowerCase().replace(/[+*?^${}()|[\]\\]/g, '\\$&amp;');
         filter.searchable = { $regex: escapedKeyword, $options: 'i' };
      }
      </xsl:if>

      <xsl:for-each select="field[@filter='true' and string-length(@foreignKey)=0]">
      if(<xsl:choose><xsl:when test="@type='string'">!isNullOrWhiteSpace(<xsl:value-of select="text()"/>)</xsl:when><xsl:otherwise><xsl:value-of select="text()"/> !== undefined &amp;&amp; <xsl:value-of select="text()"/> !== null</xsl:otherwise></xsl:choose>) {
         filter.<xsl:value-of select="text()"/> = <xsl:value-of select="text()"/>;
      }
      </xsl:for-each>
      <xsl:for-each select="field[@nestedFilter='true' and string-length(@foreignKey)=0]">
      <xsl:variable name="entity" select="@type"/>
      <xsl:variable name="root" select="text()"/>
      <xsl:for-each select="../../item[@name=$entity]/field[@filter='true']">
      if(<xsl:choose><xsl:when test="@type='string'">!isNullOrWhiteSpace(<xsl:value-of select="text()"/>)</xsl:when><xsl:otherwise><xsl:value-of select="text()"/> !== undefined &amp;&amp; <xsl:value-of select="text()"/> !== null</xsl:otherwise></xsl:choose>) {
         filter.<xsl:value-of select="$root"/>.<xsl:value-of select="text()"/>: <xsl:value-of select="text()"/>;
      }
      </xsl:for-each>
      </xsl:for-each>

      <xsl:for-each select="field[string-length(@searchToggle)>0]">
      if(<xsl:choose><xsl:when test="@type='string'">!isNullOrWhiteSpace(<xsl:value-of select="text()"/>)</xsl:when><xsl:otherwise><xsl:value-of select="text()"/> !== undefined &amp;&amp; <xsl:value-of select="text()"/> !== null</xsl:otherwise></xsl:choose>) {
         filter.<xsl:value-of select="text()"/> = <xsl:value-of select="text()"/>;
      }
      </xsl:for-each>
      const sorts = this.applySafeSort([{ field: order_by, descending}]);

      let result = await this._find<xsl:value-of select="$tenant"/>&lt;TProjection&gt;(ctor, <xsl:for-each select="field[@tenant='true']"><xsl:value-of select="text()"/>, </xsl:for-each>filter, projection, skip, take, sorts);
      
      result = await this.postProcessFindAs(result);

      return result;
   }

   
   async insert(<xsl:for-each select="field[@tenant='true']"><xsl:value-of select="text()"/>: <xsl:call-template name="NodeType"><xsl:with-param name="type" select="@type"/></xsl:call-template>, </xsl:for-each>document: <xsl:value-of select="$name"/><xsl:if test="count(field[string-length(@foreignKeyComputesMe)>0])>0">, skipCascades:boolean = false</xsl:if>): Promise&lt;<xsl:value-of select="$name"/>&gt; {
      <xsl:for-each select="field[@tenant='true' and not(@isolated='true')]">if (<xsl:value-of select="text()"/> != document.<xsl:value-of select="text()"/>) {
         throw new ConflictException("<xsl:value-of select="text()"/> mismatch");
      }
      </xsl:for-each>
      if (!document.<xsl:value-of select="field[1]/text()"/>) {
         document.<xsl:value-of select="field[1]/text()"/> = uuidv4();
      }
      <xsl:for-each select="field[@idAlias='true']">
      // ID Alias
      document.<xsl:value-of select="text()"/> = document.<xsl:value-of select="../field[1]/text()"/>;
      </xsl:for-each>
      document.created_utc = new Date();
      document.updated_utc = document.created_utc;

      await this.preProcessMutationDocument(document, DocumentOperation.insert);<xsl:for-each select="field[string-length(@perspective)>0 and generate-id()=generate-id(key('perspectiveKey',concat(../@name, @perspective))[1])]"><xsl:variable name="perspective"><xsl:value-of select="@perspective" /></xsl:variable><xsl:variable name="perspective_lowered"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="@perspective"/></xsl:call-template></xsl:variable>
      await this.preProcessMutation<xsl:value-of select="$perspective"/>Perspective(document.as<xsl:value-of select="$perspective"/>Perspective(), DocumentOperation.insert);
      </xsl:for-each>
      
      <xsl:if test="count(field[@calculated='self'])>0 and count(field[@calculated='other'])=0">
      await this.calculate(document);
      </xsl:if>
      <xsl:if test="count(field[@searchable='true'])>0">
      await this.calculateSearchable(document);
      </xsl:if>
      await this.sanitize(document);
      <xsl:for-each select="field[string-length(@extraValidation)>0]">
      await <xsl:value-of select="@extraValidation"/>(document);
      </xsl:for-each>
      await this.validate(document);
      <xsl:if test="count(field[string-length(@encryption)>0])>0">
      await this.prepareEncryptionFields(document);
      </xsl:if>
      <xsl:choose><xsl:when test="count(field[@calculated='other'])>0">
      document.calculationMarkDirty(this.defaultAgent, "replace");
      </xsl:when><xsl:when test="count(field[string-length(@calculated)>0])>0">
      document.calculationMarkClean(new Date());
      </xsl:when>
      </xsl:choose>

      <xsl:for-each select="field[string-length(@foreignKey)>0 and not(@fakeForeignKey='true') and not(string-length(@softForeignReason)>0)]"><xsl:variable name="current_fk"><xsl:value-of select="text()"/></xsl:variable><xsl:choose><xsl:when test="@isNullable='true'">
      if (!!document.<xsl:value-of select="text()"/>) {
         await this.entities.<xsl:call-template name="Camel"><xsl:with-param name="inputString" select="@foreignKey"/></xsl:call-template>Manager.validateExistence(<xsl:if test="not(@detachedForeign='true')"><xsl:for-each select="../field[@tenant='true' and text()!=$current_fk]">document.<xsl:value-of select="text()" />, </xsl:for-each></xsl:if>document.<xsl:value-of select="text()"/>);
      }
      </xsl:when><xsl:otherwise>
      await this.entities.<xsl:call-template name="Camel"><xsl:with-param name="inputString" select="@foreignKey"/></xsl:call-template>Manager.validateExistence(<xsl:if test="not(@detachedForeign='true')"><xsl:for-each select="../field[@tenant='true' and text()!=$current_fk]">document.<xsl:value-of select="text()" />, </xsl:for-each></xsl:if>document.<xsl:value-of select="text()"/>);</xsl:otherwise>
      </xsl:choose>
      </xsl:for-each>
      await this._insert<xsl:value-of select="$tenant"/>(<xsl:value-of select="@name"/>, <xsl:for-each select="field[@tenant='true']"><xsl:value-of select="text()"/>, </xsl:for-each>document);
      <xsl:if test="count(field[@calculated='other'])>0">
      await this.calculateAndPersist(document);
      </xsl:if>
      await this.postProcessMutationDocument(document, DocumentOperation.insert);<xsl:for-each select="field[string-length(@perspective)>0 and generate-id()=generate-id(key('perspectiveKey',concat(../@name, @perspective))[1])]"><xsl:variable name="perspective"><xsl:value-of select="@perspective" /></xsl:variable><xsl:variable name="perspective_lowered"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="@perspective"/></xsl:call-template></xsl:variable>
      await this.postProcessMutation<xsl:value-of select="$perspective"/>Perspective(document.as<xsl:value-of select="$perspective"/>Perspective(), DocumentOperation.insert);
      </xsl:for-each>
      <xsl:if test="count(field[string-length(@foreignKeyComputesMe)>0])>0">
      // Cascade computing entities
      if (!skipCascades){
         await this.cascadeComputeSynchronizations(document);
      }
      </xsl:if>
      await this.dependencyCoordinator.markInvalidated("<xsl:value-of select="@name"/>", document);

      return document;
   }

   async replace(<xsl:for-each select="field[@tenant='true' and not(@isolated='true')]"><xsl:value-of select="text()"/>: <xsl:call-template name="NodeType"><xsl:with-param name="type" select="@type"/></xsl:call-template>, </xsl:for-each><xsl:value-of select="field[1]/text()"/>: string, document: <xsl:value-of select="$name"/>): Promise&lt;<xsl:value-of select="$name"/>&gt; {
      <xsl:for-each select="field[@tenant='true' and not(@isolated='true')]">if (<xsl:value-of select="text()"/> != document.<xsl:value-of select="text()"/>) {
         throw new ConflictException("<xsl:value-of select="text()"/> mismatch");
      }
      </xsl:for-each>
      <xsl:for-each select="field[@idAlias='true']">
      // ID Alias
      document.<xsl:value-of select="text()"/> = document.<xsl:value-of select="../field[1]/text()"/>;
      </xsl:for-each>
      document.updated_utc = new Date();

      await this.preProcessMutationDocument(document, DocumentOperation.replace);<xsl:for-each select="field[string-length(@perspective)>0 and generate-id()=generate-id(key('perspectiveKey',concat(../@name, @perspective))[1])]"><xsl:variable name="perspective"><xsl:value-of select="@perspective" /></xsl:variable><xsl:variable name="perspective_lowered"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="@perspective"/></xsl:call-template></xsl:variable>
      await this.preProcessMutation<xsl:value-of select="$perspective"/>Perspective(document.as<xsl:value-of select="$perspective"/>Perspective(), DocumentOperation.replace);
      </xsl:for-each>

      <xsl:if test="count(field[@calculated='self'])>0 and count(field[@calculated='other'])=0">
      await this.calculate(document);
      </xsl:if>
      <xsl:if test="count(field[@searchable='true'])>0">
      await this.calculateSearchable(document);
      </xsl:if>
      await this.sanitize(document);
      <xsl:for-each select="field[string-length(@extraValidation)>0]">
      await this.<xsl:value-of select="@extraValidation"/>(document);
      </xsl:for-each>
      await this.validate(document);
      <xsl:if test="count(field[string-length(@encryption)>0])>0">
      await this.prepareEncryptionFields(document);
      </xsl:if>
      
      <xsl:choose><xsl:when test="count(field[@calculated='other'])>0">
      document.calculationMarkDirty(this.defaultAgent, "replace");
      </xsl:when><xsl:when test="count(field[string-length(@calculated)>0])>0">
      document.calculationMarkClean(new Date());
      </xsl:when>
      </xsl:choose>
      <xsl:for-each select="field[string-length(@foreignKey)>0 and not(@fakeForeignKey='true') and not(string-length(@softForeignReason)>0)]"><xsl:variable name="current_fk"><xsl:value-of select="text()"/></xsl:variable><xsl:choose><xsl:when test="@isNullable='true'">
      if (!!document.<xsl:value-of select="text()"/>) {
         await this.entities.<xsl:call-template name="Camel"><xsl:with-param name="inputString" select="@foreignKey"/></xsl:call-template>Manager.validateExistence(<xsl:if test="not(@detachedForeign='true')"><xsl:for-each select="../field[@tenant='true' and text()!=$current_fk]">document.<xsl:value-of select="text()" />, </xsl:for-each></xsl:if>document.<xsl:value-of select="text()"/>);
      }
      </xsl:when><xsl:otherwise>
      await this.entities.<xsl:call-template name="Camel"><xsl:with-param name="inputString" select="@foreignKey"/></xsl:call-template>Manager.validateExistence(<xsl:if test="not(@detachedForeign='true')"><xsl:for-each select="../field[@tenant='true' and text()!=$current_fk]">document.<xsl:value-of select="text()" />, </xsl:for-each></xsl:if>document.<xsl:value-of select="text()"/>);</xsl:otherwise>
      </xsl:choose>
      </xsl:for-each>
      
      const unset: string[] | undefined = <xsl:choose>
         <xsl:when test="count(field[@isNullable='true' and @isClass='true'])>0">this.determineRemovableFieldsDocument(document);</xsl:when>
         <xsl:when test="count(field[@isNullable='true' and @type='Uuid'])>0">this.determineRemovableFieldsDocument(document);</xsl:when>
         <xsl:otherwise>undefined; // No nullable nested objects to remove</xsl:otherwise>
      </xsl:choose>

      await this._upsert<xsl:if test="@tenant='Isolated'">Isolated</xsl:if><xsl:if test="@tenant='Shared' or @tenant='Route'">Shared</xsl:if>(<xsl:value-of select="@name"/>, <xsl:for-each select="field[@tenant='true']"><xsl:value-of select="text()" />, </xsl:for-each><xsl:value-of select="field[1]/text()"/>, document, unset);
      <xsl:if test="count(field[@calculated='other'])>0">
      await this.calculateAndPersist(document);
      </xsl:if>
      await this.postProcessMutationDocument(document, DocumentOperation.replace);<xsl:for-each select="field[string-length(@perspective)>0 and generate-id()=generate-id(key('perspectiveKey',concat(../@name, @perspective))[1])]"><xsl:variable name="perspective"><xsl:value-of select="@perspective" /></xsl:variable><xsl:variable name="perspective_lowered"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="@perspective"/></xsl:call-template></xsl:variable>
      await this.postProcessMutation<xsl:value-of select="$perspective"/>Perspective(document.as<xsl:value-of select="$perspective"/>Perspective(), DocumentOperation.replace);
      </xsl:for-each>
      <xsl:if test="count(field[string-length(@foreignKeyComputesMe)>0])>0">
      // Cascade computing entities
      await this.cascadeComputeSynchronizations(document);
      </xsl:if>
      await this.dependencyCoordinator.markInvalidated("<xsl:value-of select="@name"/>", document);

      return document;

   }

   

   <xsl:if test="not(@customDelete='true')">async delete(document: <xsl:value-of select="$name"/><xsl:if test="count(../item[not(@classOnly='true')]/field[@foreignKey=$name and not(@fakeForeignKey='true')])>0">, force: boolean = false</xsl:if>): Promise&lt;boolean&gt; {
      await this.preProcessMutationDocument(document, DocumentOperation.delete);
      
      // Get Server version
      const actual = await this.getById(<xsl:for-each select="field[@tenant='true' and not(@isolated='true')]">document.<xsl:value-of select="text()"/>, </xsl:for-each>document.<xsl:value-of select="field[1]/text()" />);
      if (actual == undefined) {
         return true;
      }
      <xsl:if test="count(../item[not(@classOnly='true')]/field[@foreignKey=$name and not(@fakeForeignKey='true')])>0">
      if (!force){
         await this.validateNoReferences(<xsl:for-each select="field[@tenant='true' and not(@isolated='true')]">actual.<xsl:value-of select="text()"/>, </xsl:for-each>actual.<xsl:value-of select="field[1]/text()"/>);
      }
      </xsl:if>
      const result = await this._delete<xsl:if test="@tenant='Isolated'">Isolated</xsl:if><xsl:if test="@tenant='Shared' or @tenant='Route'">Shared</xsl:if>(<xsl:for-each select="field[@tenant='true']">actual.<xsl:value-of select="text()" />, </xsl:for-each>actual.<xsl:value-of select="field[1]/text()" />);
      if (result) {
         await this.postProcessMutationDocument(actual, DocumentOperation.delete);
      }
      <xsl:if test="count(field[string-length(@foreignKeyComputesMe)>0])>0">
      // Cascade computing entities
      await this.cascadeComputeSynchronizations(actual);
      </xsl:if>
      return result;
   }
   </xsl:if>

   <xsl:for-each select="field[string-length(@perspective)>0 and generate-id()=generate-id(key('perspectiveKey',concat(../@name, @perspective))[1])]"><xsl:variable name="perspective"><xsl:value-of select="@perspective" /></xsl:variable><xsl:variable name="perspective_lowered"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="@perspective"/></xsl:call-template></xsl:variable>
   async update<xsl:value-of select="@perspective"/>Perspective(perspective: <xsl:value-of select="../@name"/>.<xsl:value-of select="@perspective"/>Perspective<xsl:if test="count(../field[string-length(@foreignKeyComputesMe)>0])>0">, skipCascades:boolean = false</xsl:if>){
      const actual = perspective.getActual();

      await this.preProcessMutation<xsl:value-of select="$perspective"/>Perspective(perspective, DocumentOperation.updatePerspective);
      
      await this.sanitize<xsl:value-of select="$perspective"/>Perspective(perspective);
      <xsl:for-each select="../field[@perspective=$perspective and string-length(@extraValidation)>0]">
      await this.<xsl:value-of select="@extraValidation"/>(perspective);
      </xsl:for-each>
      await this.validate<xsl:value-of select="$perspective"/>Perspective(perspective);
      <xsl:if test="count(../field[@perspective=$perspective and @searchable='true'])>0">
      await this.calculateSearchable(actual);
      </xsl:if>
      <xsl:if test="count(../field[string-length(@calculated)>0])>0">
      <xsl:if test="count(../field[@perspective=$perspective and string-length(@recalculate)>0])>0">
      actual.calculationMarkDirty(this.defaultAgent, "update_<xsl:value-of select="@perspective"/>Perspective");
      </xsl:if></xsl:if>

      <xsl:for-each select="../field[@perspective=$perspective and string-length(@foreignKey)>0 and not(@fakeForeignKey='true')]">
      <xsl:choose>
      <xsl:when test="@isNullable='true'">
      if (perspective.<xsl:value-of select="text()"/> !== undefined) {
         await this.entities.<xsl:call-template name="Camel"><xsl:with-param name="inputString" select="@foreignKey"/></xsl:call-template>Manager.validateExistence(<xsl:if test="not(@detachedForeign='true')"><xsl:for-each select="../field[@tenant='true']">perspective.<xsl:value-of select="text()"/>, </xsl:for-each></xsl:if>perspective.<xsl:value-of select="text()"/>);
      }
      </xsl:when>
      <xsl:otherwise>
      await this.entities.<xsl:call-template name="Camel"><xsl:with-param name="inputString" select="@foreignKey"/></xsl:call-template>Manager.validateExistence(<xsl:if test="not(@detachedForeign='true')"><xsl:for-each select="../field[@tenant='true']">perspective.<xsl:value-of select="text()"/>, </xsl:for-each></xsl:if>perspective.<xsl:value-of select="text()"/>);
      </xsl:otherwise>
      </xsl:choose>
      </xsl:for-each>
      <xsl:choose>
      <xsl:when test="../@tenant='Isolated' and ../../@isolatedGetByIdUsesWorkspaceFilter='true' and count(../field[@tenant='true' and not(@isolated='true')])>0">const filter: <xsl:value-of select="$filterType"/>&lt;<xsl:value-of select="../@name"/>&gt; = { <xsl:value-of select="../field[@tenant='true' and not(@isolated='true')][1]/text()"/>: perspective.<xsl:value-of select="../field[@tenant='true' and not(@isolated='true')][1]/text()"/>, <xsl:value-of select="../field[1]/text()"/>: perspective.<xsl:value-of select="../field[1]/text()"/> };</xsl:when>
      <xsl:otherwise>const filter = { <xsl:value-of select="../field[1]/text()"/>: perspective.<xsl:value-of select="../field[1]/text()"/> };</xsl:otherwise>
      </xsl:choose>
      const update: UpdateQuery&lt;<xsl:value-of select="../@name"/>&gt;  = {
         $set: {
            updated_utc: new Date()<xsl:if test="count(../field[@perspective=$perspective and @calculated='true'])>0">,
            calculation_utc: actual.calculation_utc,
            calculation_agent: actual.calculation_agent</xsl:if><xsl:if test="count(../field[@perspective=$perspective and @searchable='true'])>0">,
            searchable: actual.searchable</xsl:if><xsl:for-each select="../field[@perspective=$perspective]">,
            <xsl:value-of select="text()"/>: perspective.<xsl:value-of select="text()"/></xsl:for-each>
         }
      };
      const removableFields = this.determineRemovableFields<xsl:value-of select="@perspective"/>Perspective(perspective);
      if (removableFields) {
         update.$unset = removableFields;
      }

      const result = await this._updatePartial<xsl:if test="../@tenant='Isolated'">Isolated</xsl:if><xsl:if test="../@tenant='Shared' or ../@tenant='Route'">Shared</xsl:if>(<xsl:for-each select="../field[@tenant='true']">perspective.<xsl:value-of select="text()" />, </xsl:for-each>filter, update);
      <xsl:if test="count(../field[string-length(@calculated)>0])>0">
      <xsl:choose><xsl:when test="count(../field[@perspective=$perspective and string-length(@recalculate)>0])=0">
      // Bypassing calculateAndPersist, no extral fields flagged for recalculate
      </xsl:when><xsl:otherwise>
      await this.calculateAndPersist(perspective.getActual());
      </xsl:otherwise></xsl:choose>
      </xsl:if>
      if (result.matchedCount &gt; 0) {
         await this.postProcessMutation<xsl:value-of select="$perspective"/>Perspective(perspective, DocumentOperation.updatePerspective);
      }
      <xsl:if test="count(../field[string-length(@foreignKeyComputesMe)>0])>0">
      // Cascade computing entities
      if (!skipCascades) {
         await this.cascadeComputeSynchronizations(actual);
      }
      </xsl:if>
      <xsl:variable name="root_name" select="../@name"/>
      <xsl:for-each select="../../item/field[@foreignKey=$root_name and contains(@foreignKeyInvalidatesMe, concat(':',$perspective))]">
      // Cascade perspective to <xsl:value-of select="../@name" />
      await this.entities.<xsl:call-template name="Camel"><xsl:with-param name="inputString" select="../@name"/></xsl:call-template>Manager.invalidateFor<xsl:value-of select="$root_name"/>(<xsl:for-each select="../field[@tenant='true']">perspective.<xsl:value-of select="text()" />, </xsl:for-each>perspective.<xsl:value-of select="@foreignKeyField"/>, '<xsl:value-of select="$root_name"/> changed');</xsl:for-each>
      return result.matchedCount &gt; 0;
   }

   protected determineRemovableFields<xsl:value-of select="@perspective"/>Perspective(perspective: <xsl:value-of select="../@name"/>.<xsl:value-of select="@perspective"/>Perspective): Record&lt;string, 1&gt; | undefined {
      if (!perspective){
         return; // sanity
      }

      // Check all nullable perspective fields for unset (handles both primitives and classes)
      const fieldsToRemove:string[] = [];
      <xsl:for-each select="../field[@perspective=$perspective and @isNullable='true' and string-length(@calculated)=0]">
      if (perspective.<xsl:value-of select="text()"/> === undefined) {
         fieldsToRemove.push("<xsl:value-of select="text()"/>");
      }</xsl:for-each>
      
      if (fieldsToRemove.length &gt; 0) {
         const unset = {} as Record&lt;string, 1&gt;;
         fieldsToRemove.forEach(field =&gt; {
            unset[field] = 1;
         });
         return unset;
      }

      return undefined;
   }
   </xsl:for-each>

   async ensureIndexes(<xsl:for-each select="field[@tenant='true']"><xsl:value-of select="text()"/>: <xsl:call-template name="NodeType"><xsl:with-param name="type" select="@type"/></xsl:call-template></xsl:for-each>): Promise&lt;void&gt; {
      const connection = await this.get<xsl:if test="@tenant='Isolated'">Isolated</xsl:if><xsl:if test="@tenant='Shared' or @tenant='Route'">Shared</xsl:if>Connection(<xsl:for-each select="field[@tenant='true']"><xsl:value-of select="text()"/></xsl:for-each>);
      const existing = await connection.<xsl:value-of select="$dbAccess"/>.listCollections({ name: this.collectionName }).toArray();
      if (existing.length == 0){
         return; // doesn't exist yet
      }
      
      const model = await this.get<xsl:if test="@tenant='Isolated'">Isolated</xsl:if><xsl:if test="@tenant='Shared' or @tenant='Route'">Shared</xsl:if>Model(<xsl:for-each select="field[@tenant='true']"><xsl:value-of select="text()"/></xsl:for-each>);
      const collection = model.db.collection(this.collectionName);
      const indexes = await collection.indexes();

      let match:Document | undefined = undefined;
      <xsl:if test="field[1]/text()!='_id'">
      // default_pkey_v1
      match = indexes.find(x =&gt; x.name == 'default_pkey_v1');
      if (!match) {
         const options = {
            unique: true, 
            name: 'default_pkey_v1'
         };
         const fields = { 
            <xsl:value-of select="field[1]/text()"/>: 1
         };
         await collection.createIndex(fields, options);
      }
      </xsl:if>

      <xsl:if test="field[string-length(@calculated)>0]">
      // default_sync_v1
      match = indexes.find(x =&gt; x.name == 'default_sync_v1');
      if (!match) {
         const options = {
            unique: false, 
            name: 'default_sync_v1'
         };
          const fields = {
            calculation_utc: 1,
            calculation_agent: 1
         };
         await collection.createIndex(fields, options);
      }
      </xsl:if>

      <xsl:if test="@tenant='Isolated' and count(field[@isolated='true'])=0">
      // default_pkey_routed_v1
      match = indexes.find(x =&gt; x.name == 'default_pkey_routed_v1');
      if (!match)
      {
         const options = {
            unique: false,
            name: 'default_pkey_routed_v1'
         };
         const fields = {
            <xsl:for-each select="field[@tenant='true' and not(@isolated='true')]"><xsl:value-of select="text()"/>: 1</xsl:for-each>,
            <xsl:value-of select="field[1]/text()"/>: 1
         };

         await collection.createIndex(fields, options);
      }
      </xsl:if>
      <xsl:for-each select="uniquekey">
      // <xsl:value-of select="@name"/><xsl:if test="@drop">
      // Drop superseded index: <xsl:value-of select="@drop"/>
      match = indexes.find(x =&gt; x.name == "<xsl:value-of select="@drop"/>");
      if (match) {
         await collection.dropIndex("<xsl:value-of select="@drop"/>");
         this.logger.log('Dropped superseded index: <xsl:value-of select="@drop"/>');
      }
      </xsl:if>
      match = indexes.find(x =&gt; x.name == "<xsl:value-of select="@name"/>");
      if (!match)
      {
         const options = {
            unique: true,
            name: '<xsl:value-of select="@name"/>'<xsl:if test="count(entry[@ignoreBlanks='true'])>0">,
            partialFilterExpression: {
               $and: [<xsl:for-each select="entry[@ignoreBlanks='true']">
                  { <xsl:value-of select="text()"/>: { $exists: true } },
                  { <xsl:value-of select="text()"/>: { $ne: null } },
                  { <xsl:value-of select="text()"/>: { $ne: '' } },</xsl:for-each>
               ]
            }
            </xsl:if>
         };
         const fields = {<xsl:for-each select="entry"><xsl:text>
            </xsl:text><xsl:value-of select="text()"/>: <xsl:choose><xsl:when test="@direction='Ascending'">1</xsl:when><xsl:otherwise>-1</xsl:otherwise></xsl:choose>,</xsl:for-each>
         };
         await collection.createIndex(fields, options);
      }
      </xsl:for-each>
      <xsl:for-each select="index">
      // <xsl:value-of select="@name"/><xsl:if test="@drop">
      // Drop superseded index: <xsl:value-of select="@drop"/>
      match = indexes.find(x =&gt; x.name == "<xsl:value-of select="@drop"/>");
      if (match) {
         await collection.dropIndex("<xsl:value-of select="@drop"/>");
         this.logger.log('Dropped superseded index: <xsl:value-of select="@drop"/>');
      }
      </xsl:if>
      match = indexes.find(x =&gt; x.name == '<xsl:value-of select="@name"/>');
      if (!match)
      {
         const options = {
            unique: false,
            name: '<xsl:value-of select="@name"/>'<xsl:if test="@ttl='true'">,
            expireAfterSeconds: 0, // TTL: delete after <xsl:value-of select="@name"/> + 0 seconds</xsl:if>
         };
         const fields = {<xsl:for-each select="entry"><xsl:text>
            </xsl:text><xsl:if test="contains(text(),'.')">'</xsl:if><xsl:value-of select="text()"/><xsl:if test="contains(text(),'.')">'</xsl:if>: <xsl:choose><xsl:when test="@direction='Ascending'">1</xsl:when><xsl:otherwise>-1</xsl:otherwise></xsl:choose>,</xsl:for-each>
         };
         await collection.createIndex(fields, options);
      }
      </xsl:for-each>
      <xsl:if test="count(shard/entry[@kind='hashed'])>0">
      // shard_key_hashed (pre-created for future sharding)
      match = indexes.find(x =&gt; x.name == 'shard_key_hashed');
      if (!match)
      {
         const options = {
            unique: false,
            name: 'shard_key_hashed'
         };
         const fields = {<xsl:for-each select="shard/entry[@kind='hashed']"><xsl:text>
            </xsl:text><xsl:value-of select="text()"/>: 'hashed' as const,</xsl:for-each>
         };
         await collection.createIndex(fields, options);
      }
      </xsl:if>
      <xsl:if test="count(field[@searchable='true'])>0 or count(indexfield[@searchable='true'])>0">
      // default_searchable
      match = indexes.find(x =&gt; x.name == "default_searchable_en_v1");
      if (match == null)
      {
         const options = {
            unique: false,
            name: 'default_searchable_en_v1',
            collation: {
               locale: 'en',
               strength: 1    // Case-insensitive, diacritic-insensitive
            }
         };
         const fields = {
            <xsl:for-each select="field[@tenant='true' and not(@isolated='true')]"><xsl:value-of select="text()"/>: 1,</xsl:for-each>
            searchable: 1,
         };
         await collection.createIndex(fields, options);
      }
      </xsl:if>
   }

   protected determineRemovableFieldsDocument(document: <xsl:value-of select="$name"/>): string[] | undefined {
      if (!document){
         return; // sanity
      }
      const fieldsToRemove:string[] = [];
      <xsl:if test="count(field[@isNullable='true' and string-length(@calculated)=0])>0">
      // Check all nullable fields for unset (handles both primitives and classes)
      <xsl:for-each select="field[@isNullable='true' and string-length(@calculated)=0]">if (document.<xsl:value-of select="text()"/> === undefined) {
         fieldsToRemove.push('<xsl:value-of select="text()"/>');
      }
      </xsl:for-each>
      </xsl:if>
      <xsl:if test="count(field[@isNullable='true' and @type='Uuid'])>0">
      // Empty Guids
      <xsl:for-each select="field[@isNullable='true' and @type='Uuid']">if (document.<xsl:value-of select="text()"/> === undefined || document.<xsl:value-of select="text()"/> === '') {
         fieldsToRemove.push('<xsl:value-of select="text()"/>');
      }
      </xsl:for-each>
      </xsl:if>
      return fieldsToRemove;
   }

   /**
    * Only allow sorting by known indexed fields
    */
   protected applySafeSort(sorts:SortInfo[]) : [string, SortOrder][] {
      const result: [string, SortOrder][] = [];

      const allowedFields = [<xsl:for-each select="field[not(@sdkHidden='true') and (@sortable='true' or @searchable='true' or @isEnum='true' or @type='int' or @type='decimal' or @type='Date')]"><xsl:if test="position()>1">, </xsl:if>'<xsl:value-of select="text()"/>'</xsl:for-each>
      <xsl:for-each select="field[string-length(@sortPath)>0]">, "<xsl:value-of select="@sortPath"/>"</xsl:for-each>];
      
      for (const item of sorts) {
         if (!isNullOrWhiteSpace(item.field)) {
            if (allowedFields.includes(item.field!)) {
               result.push([item.field!, item.descending === true ? 'desc' : 'asc']);
            }
         }
      }
      if (result.length === 0) {
         result.push(['<xsl:choose><xsl:when test="string-length(@uiDefaultSort)>0"><xsl:value-of select="@uiDefaultSort"/></xsl:when><xsl:otherwise><xsl:value-of select="field[1]/text()"/></xsl:otherwise></xsl:choose>', 'asc']);
      }

      return result;
   }

   protected async sanitize(document: <xsl:value-of select="@name" />) : Promise&lt;void&gt; {
      <xsl:value-of select="@name" />.sanitize(document);
   }
   <xsl:for-each select="field[string-length(@perspective)>0 and generate-id()=generate-id(key('perspectiveKey',concat(../@name, @perspective))[1])]"><xsl:variable name="targetPerspective"><xsl:value-of select="@perspective" /></xsl:variable>
      <xsl:if test="count(../field[@perspective=$targetPerspective])>0">
   protected async sanitize<xsl:value-of select="$targetPerspective"/>Perspective(perspective:<xsl:value-of select="../@name"/>.<xsl:value-of select="$targetPerspective"/>Perspective) {
      <xsl:for-each select="../field[@perspective=$targetPerspective and @type='string' and string-length(@maxLength)>0 and @truncateLog='true']">
      <xsl:if test="@maxLength!='none'">
      if (perspective.<xsl:value-of select="text()"/> &amp;&amp; perspective.<xsl:value-of select="text()"/>.length &gt; <xsl:value-of select="@maxLength"/>) {
         perspective.<xsl:value-of select="text()"/> = truncateStart(perspective.<xsl:value-of select="text()"/>, <xsl:value-of select="@maxLength"/>);
      }
      </xsl:if>
      </xsl:for-each>

      <xsl:for-each select="../field[@perspective=$targetPerspective and @type='string' and @forceLower='true']">
      perspective.<xsl:value-of select="text()" /> = perspective.<xsl:value-of select="text()" />?.toLowerCase();</xsl:for-each>

      <xsl:for-each select="../field[@perspective=$targetPerspective and @type='string' and @forceUpper='true']">
      perspective.<xsl:value-of select="text()" /> = perspective.<xsl:value-of select="text()" />?.toUpperCase();</xsl:for-each>

      <xsl:for-each select="../field[@perspective=$targetPerspective and @type='string' and not(@html='true')]">
      perspective.<xsl:value-of select="text()" /> = sanitizeHtml(perspective.<xsl:value-of select="text()" />, <xsl:choose><xsl:when test="contains(text(),'url')">true</xsl:when><xsl:otherwise>false</xsl:otherwise></xsl:choose>);</xsl:for-each>
   }
   </xsl:if></xsl:for-each>

   protected async validate(document: <xsl:value-of select="@name" />): Promise&lt;void&gt; {
      // Fields
      <xsl:for-each select="field[not(@isNullable='true') and string-length(@calculated)=0 and not(contains(@type,'.'))]">
      <xsl:choose>
      <xsl:when test="@type='string'">
      if (isNullOrWhiteSpace(document.<xsl:value-of select="text()"/>)) {
         throw new UIException(LocalizableString.General_FieldRequired("<xsl:value-of select="$name_lowered"/>.<xsl:value-of select="text()"/>"));
      }
      </xsl:when>
      <xsl:when test="@type='Uuid'">
      if (!document.<xsl:value-of select="text()"/> || !uuidValidate(document.<xsl:value-of select="text()"/>)) {
         throw new UIException(LocalizableString.General_FieldRequired("<xsl:value-of select="$name_lowered"/>.<xsl:value-of select="text()"/>"));
      }
      </xsl:when>
      <xsl:when test="@type='Date'">
      if (!document.<xsl:value-of select="text()"/> || document.<xsl:value-of select="text()"/>.getTime() == new Date(0).getTime()){
         throw new UIException(LocalizableString.General_FieldRequired("<xsl:value-of select="$name_lowered"/>.<xsl:value-of select="text()"/>"));
      }
      </xsl:when>
      <xsl:when test="contains(@type,'[]') or @type='boolean' or @type='int' or @type='decimal' or @isEnum='true'"/>
      <xsl:otherwise>
      if (!document.<xsl:value-of select="text()"/>) {
         throw new UIException(LocalizableString.General_FieldRequired("<xsl:value-of select="$name_lowered"/>.<xsl:value-of select="text()"/>"));
      }
      </xsl:otherwise>
      </xsl:choose>
      </xsl:for-each>

      <xsl:for-each select="field[string-length(@maxValue)>0]">
      <xsl:if test="@maxValue!='none' and string-length(@calculated)=0">
      if (document.<xsl:value-of select="text()"/> &gt; <xsl:value-of select="@maxValue"/>) {
         throw new UIException(LocalizableString.General_FieldMaxValue(<xsl:value-of select="@maxValue"/>, "<xsl:value-of select="$name_lowered"/>.<xsl:value-of select="text()"/>"));
      }
      </xsl:if>
      </xsl:for-each>

      <xsl:for-each select="field[string-length(@minValue)>0]">
      <xsl:if test="@minValue!='none' and string-length(@calculated)=0">
      if (document.<xsl:value-of select="text()"/> &lt; <xsl:value-of select="@minValue"/>) {
         throw new UIException(LocalizableString.General_FieldMinValue(<xsl:value-of select="@minValue"/>, "<xsl:value-of select="$name_lowered"/>.<xsl:value-of select="text()"/>"));
      }
      </xsl:if>
      </xsl:for-each>

      <xsl:for-each select="field[string-length(@minLength)>0]">
      <xsl:if test="@minLength!='none' and string-length(@calculated)=0">
      if (document.<xsl:value-of select="text()"/> &amp;&amp; document.<xsl:value-of select="text()"/>.length &lt; <xsl:value-of select="@minLength"/>) {
         throw new UIException(LocalizableString.General_FieldMinLength(<xsl:value-of select="@minLength"/>, "<xsl:value-of select="$name_lowered"/>.<xsl:value-of select="text()"/>"));
      }
      </xsl:if>
      </xsl:for-each>

      <xsl:for-each select="field[string-length(@maxLength)>0]">
      <xsl:if test="@maxLength!='none' and string-length(@calculated)=0">
      if (document.<xsl:value-of select="text()"/> &amp;&amp; document.<xsl:value-of select="text()"/>.length &gt; <xsl:value-of select="@maxLength"/>) {
         throw new UIException(LocalizableString.General_FieldMaxLength(<xsl:value-of select="@maxLength"/>, "<xsl:value-of select="$name_lowered"/>.<xsl:value-of select="text()"/>"));
      }
      </xsl:if>
      </xsl:for-each>

      <xsl:for-each select="field[@type='string' and string-length(@maxLength)=0 and string-length(@calculated)=0]">
      if (document.<xsl:value-of select="text()"/> &amp;&amp; document.<xsl:value-of select="text()"/>.length &gt; <xsl:value-of select="@maxLength"/>) {
         code-gen-error // You must provide a maxLength attribute for <xsl:value-of select="$name_lowered"/>.<xsl:value-of select="text()"/>
         //ie: maxLength="30" or maxLength="none"
      }
      </xsl:for-each>
   }

   <xsl:for-each select="field[string-length(@perspective)>0 and generate-id()=generate-id(key('perspectiveKey',concat(../@name, @perspective))[1])]">
   <xsl:variable name="targetPerspective"><xsl:value-of select="@perspective" /></xsl:variable>
   <xsl:if test="count(../field[@perspective=$targetPerspective])>0">
   protected async validate<xsl:value-of select="$targetPerspective"/>Perspective(document: <xsl:value-of select="../@name"/>.<xsl:value-of select="$targetPerspective"/>Perspective): Promise&lt;void&gt; {
      <xsl:for-each select="../field[@perspective=$targetPerspective and not(@isNullable='true')]">
      <xsl:choose>
      <xsl:when test="@type='string'">
      if (isNullOrWhiteSpace(document.<xsl:value-of select="text()"/>)) {
         throw new UIException(LocalizableString.General_FieldRequired("<xsl:value-of select="$name_lowered"/>.<xsl:value-of select="text()"/>"));
      }
      </xsl:when>
      <xsl:when test="@type='Uuid'">
      if (!document.<xsl:value-of select="text()"/>) {
         throw new UIException(LocalizableString.General_FieldRequired("<xsl:value-of select="$name_lowered"/>.<xsl:value-of select="text()"/>"));
      }
      </xsl:when>
      <xsl:when test="@type='Date'">
      if (!document.<xsl:value-of select="text()"/> || document.<xsl:value-of select="text()"/>.getTime() == new Date(0).getTime()){
         throw new UIException(LocalizableString.General_FieldRequired("<xsl:value-of select="$name_lowered"/>.<xsl:value-of select="text()"/>"));
      }
      </xsl:when>
      <xsl:when test="@type='boolean' or @type='int' or @type='decimal' or @isEnum='true'"/>
      <xsl:otherwise>
      if (!document.<xsl:value-of select="text()"/>) {
         throw new UIException(LocalizableString.General_FieldRequired("<xsl:value-of select="$name_lowered"/>.<xsl:value-of select="text()"/>"));
      }
      </xsl:otherwise>
      </xsl:choose>
      </xsl:for-each>
      <xsl:for-each select="../field[@perspective=$targetPerspective and string-length(@maxValue)>0]">
      <xsl:if test="@maxValue!='none' and string-length(@calculated)=0">
      if (document.<xsl:value-of select="text()"/> &gt; <xsl:value-of select="@maxValue"/>) {
         throw new UIException(LocalizableString.General_FieldMaxValue(<xsl:value-of select="@maxValue"/>, "<xsl:value-of select="$name_lowered"/>.<xsl:value-of select="text()"/>"));
      }
      </xsl:if>
      </xsl:for-each>

      <xsl:for-each select="../field[@perspective=$targetPerspective and string-length(@minValue)>0]">
      <xsl:if test="@minValue!='none' and string-length(@calculated)=0">
      if (document.<xsl:value-of select="text()"/> &lt; <xsl:value-of select="@minValue"/>) {
         throw new UIException(LocalizableString.General_FieldMinValue(<xsl:value-of select="@minValue"/>, "<xsl:value-of select="$name_lowered"/>.<xsl:value-of select="text()"/>"));
      }
      </xsl:if>
      </xsl:for-each>

      <xsl:for-each select="../field[@perspective=$targetPerspective and string-length(@minLength)>0]">
      <xsl:if test="@minLength!='none' and string-length(@calculated)=0">
      if (document.<xsl:value-of select="text()"/> &amp;&amp; document.<xsl:value-of select="text()"/>.length &lt; <xsl:value-of select="@minLength"/>) {
         throw new UIException(LocalizableString.General_FieldMinLength(<xsl:value-of select="@minLength"/>, "<xsl:value-of select="$name_lowered"/>.<xsl:value-of select="text()"/>"));
      }
      </xsl:if>
      </xsl:for-each>

      <xsl:for-each select="../field[@perspective=$targetPerspective and string-length(@maxLength)>0]">
      <xsl:if test="@maxLength!='none' and string-length(@calculated)=0">
      if (document.<xsl:value-of select="text()"/> &amp;&amp; document.<xsl:value-of select="text()"/>.length &gt; <xsl:value-of select="@maxLength"/>) {
         throw new UIException(LocalizableString.General_FieldMaxLength(<xsl:value-of select="@maxLength"/>, "<xsl:value-of select="$name_lowered"/>.<xsl:value-of select="text()"/>"));
      }
      </xsl:if>
      </xsl:for-each>

      <xsl:for-each select="../field[@perspective=$targetPerspective and @type='string' and string-length(@maxLength)=0 and string-length(@calculated)=0]">
      if (document.<xsl:value-of select="text()"/> &amp;&amp; document.<xsl:value-of select="text()"/>.length &gt; <xsl:value-of select="@maxLength"/>) {
         code-gen-error // You must provide a maxLength attribute for <xsl:value-of select="$name_lowered"/>.<xsl:value-of select="text()"/>
         //ie: maxLength="30" or maxLength="none"
      }
      </xsl:for-each>
   }
   </xsl:if>
   </xsl:for-each>

   <xsl:if test="count(../item[not(@classOnly='true')]/field[@foreignKey=$name and not(@fakeForeignKey='true')])>0">
   async validateNoReferences(<xsl:for-each select="field[@tenant='true' and not(@isolated='true')]"><xsl:value-of select="text()"/>: <xsl:call-template name="NodeType"><xsl:with-param name="type" select="@type"/></xsl:call-template>, </xsl:for-each><xsl:value-of select="field[1]/text()"/><xsl:if test="not(@tenant='Route') and not(@tenant='Isolated')">?</xsl:if><xsl:text> </xsl:text>: string, skip_entities?: string[]) : Promise&lt;void&gt; {
      <xsl:if test="not(@tenant='Route') and not(@tenant='Isolated')">if (<xsl:value-of select="field[1]/text()"/> === undefined) {
         return;
      }
      </xsl:if><xsl:variable name="parent_tenant"><xsl:value-of select="@tenant"/></xsl:variable><xsl:variable name="primary_field"><xsl:value-of select="field[1]/text()"/></xsl:variable>
      let hasReference = false;
      <xsl:for-each select="../item[not(@classOnly='true')]/field[@foreignKey=$name and not(@fakeForeignKey='true') and not(@detachedForeign='true') ]">
      if (!skip_entities || skip_entities.length == 0 || !skip_entities.includes('<xsl:value-of select="../@name"/>')){
         hasReference = await this.entities.<xsl:call-template name="Camel"><xsl:with-param name="inputString" select="../@name"/></xsl:call-template>Manager.anyWith<xsl:call-template name="Spaceless"><xsl:with-param name="text" select="@friendlyName"/></xsl:call-template>(<xsl:if test="$parent_tenant!='Route'"><xsl:for-each select="../field[@tenant='true']"><xsl:value-of select="text()"/>, </xsl:for-each></xsl:if><xsl:value-of select="$primary_field"/>);
         if (hasReference) {
            throw new UIException(LocalizableString.General_ReferenceInUse('<xsl:value-of select="../@name"/>'));
         }
      }</xsl:for-each>
   }
   </xsl:if>

   



   <xsl:if test="count(field[@searchable='true'])>0">
   protected async calculateSearchable(document: <xsl:value-of select="@name"/>) : Promise&lt;void&gt; {
      document.searchable = SEARCHABLE_DIVIDER;
      <xsl:for-each select="field[@searchable='true' and not(@encrypted='true')]">
      <xsl:choose>
      <xsl:when test="contains(@type, '.')">
      <xsl:variable name="current_nav" select="text()"/>
      <xsl:variable name="parent_entity"><xsl:call-template name="ExtractParent"><xsl:with-param name="text" select="@type" /></xsl:call-template></xsl:variable>
      <xsl:variable name="parent_projection"><xsl:call-template name="ExtractChild"><xsl:with-param name="text" select="@type" /></xsl:call-template></xsl:variable>
      <xsl:for-each select="../../item[@name=$parent_entity]/projection[@name=$parent_projection]">
      <xsl:for-each select="entry"><xsl:variable name="current_entry" select="text()"/>
      <xsl:for-each select="../../field[text()=$current_entry and @type='string']">
      if (!isNullOrWhiteSpace(document.<xsl:value-of select="$current_nav"/>?.<xsl:value-of select="text()"/>)) {
         document.searchable += document.<xsl:value-of select="$current_nav"/>!.<xsl:value-of select="text()"/>!.toLowerCase() + SEARCHABLE_DIVIDER;
      }
      </xsl:for-each></xsl:for-each>
      
      </xsl:for-each>
      </xsl:when>
      <xsl:otherwise>
      if (!isNullOrWhiteSpace(document.<xsl:value-of select="text()"/>)) {
         document.searchable += document.<xsl:value-of select="text()"/>!.toLowerCase() + SEARCHABLE_DIVIDER;
      }</xsl:otherwise></xsl:choose>
      </xsl:for-each>
   }
   </xsl:if>

   <xsl:if test="count(field[string-length(@calculated)>0])>0">
   async synchronizeDirtyItems(<xsl:for-each select="field[@tenant='true']">tenant_code:string, </xsl:for-each>agent_name: string, shouldStop: () =&gt; boolean): Promise&lt;number&gt; {
      let processed = 0;
      const items = await this.getForSynchronization(<xsl:for-each select="field[@tenant='true']">tenant_code, </xsl:for-each>agent_name);
      for (const item of items) {
         if (shouldStop()) {
            return processed;
         }
         try {
            const entity = await this.getById(<xsl:for-each select="field[@tenant='true']">item.<xsl:value-of select="text()"/>, </xsl:for-each>item.<xsl:value-of select="field[1]"/>);
            if (entity) {
               await this.calculateAndPersist(entity);
            }
            processed++;
         } catch (error) {
            this.logger.error('<xsl:value-of select="@name"/> Sync Error', error);
         }
      }
      return processed;
   }

   async invalidate(<xsl:for-each select="field[@tenant='true']"><xsl:value-of select="text()"/>: <xsl:call-template name="NodeType"><xsl:with-param name="type" select="@type"/></xsl:call-template>, </xsl:for-each><xsl:value-of select="field[1]/text()" />: <xsl:call-template name="NodeType"><xsl:with-param name="type" select="field[1]/@type"/></xsl:call-template>, agent_name?: string): Promise&lt;void&gt; {
      const filter: <xsl:value-of select="$filterType"/>&lt;<xsl:value-of select="@name"/>&gt; = {
         calculation_utc: { $ne: null },
         <xsl:if test="@tenant='Isolated' and ../@isolatedGetByIdUsesWorkspaceFilter='true' and count(field[@tenant='true' and not(@isolated='true')])>0"><xsl:value-of select="field[@tenant='true' and not(@isolated='true')][1]/text()"/>: <xsl:value-of select="field[@tenant='true' and not(@isolated='true')][1]/text()"/>,
         </xsl:if><xsl:value-of select="field[1]/text()"/>: <xsl:value-of select="field[1]/text()"/>
      };
      const update: UpdateQuery&lt;<xsl:value-of select="@name"/>&gt; = {
         $set: {
            calculation_utc: null,
            calculation_agent: agent_name,
         },
      };
      await this._updateManyPartial<xsl:if test="@tenant='Isolated'">Isolated</xsl:if><xsl:if test="@tenant='Shared' or @tenant='Route'">Shared</xsl:if>(<xsl:for-each select="field[@tenant='true']"><xsl:value-of select="text()"/>, </xsl:for-each>filter, update);
   }

   async invalidateAll(<xsl:for-each select="field[@tenant='true']"><xsl:value-of select="text()"/>: <xsl:call-template name="NodeType"><xsl:with-param name="type" select="@type"/></xsl:call-template>, </xsl:for-each>agent_name: string): Promise&lt;void&gt; {
      const filter: <xsl:value-of select="$filterType"/>&lt;<xsl:value-of select="@name"/>&gt; = {
         calculation_utc: { $ne: null },
         <xsl:if test="@tenant='Isolated' and ../@isolatedGetByIdUsesWorkspaceFilter='true' and count(field[@tenant='true' and not(@isolated='true')])>0"><xsl:value-of select="field[@tenant='true' and not(@isolated='true')][1]/text()"/>: <xsl:value-of select="field[@tenant='true' and not(@isolated='true')][1]/text()"/>,
         </xsl:if>
      };
      const update: UpdateQuery&lt;<xsl:value-of select="@name"/>&gt; = {
         $set: {
            calculation_utc: null,
            calculation_agent: agent_name,
         },
      };
      await this._updateManyPartial<xsl:if test="@tenant='Isolated'">Isolated</xsl:if><xsl:if test="@tenant='Shared' or @tenant='Route'">Shared</xsl:if>(<xsl:for-each select="field[@tenant='true']"><xsl:value-of select="text()"/>, </xsl:for-each>filter, update);
   }

   async calculateAndPersist(document:<xsl:value-of select="@name"/>): Promise&lt;void&gt; {
      const utcNow = new Date();

      const calculations:<xsl:value-of select="@name"/>.CalculationsPerspective = await this.calculate(document);
      <xsl:if test="count(field[@searchable='true'])>0">
      await this.calculateSearchable(document);
      </xsl:if>
      calculations.calculationMarkClean(utcNow);
      try
      {
         <xsl:choose>
         <xsl:when test="@tenant='Isolated' and ../@isolatedGetByIdUsesWorkspaceFilter='true' and count(field[@tenant='true' and not(@isolated='true')])>0">const filter: <xsl:value-of select="$filterType"/>&lt;<xsl:value-of select="@name"/>&gt; = { <xsl:value-of select="field[@tenant='true' and not(@isolated='true')][1]/text()"/>: calculations.<xsl:value-of select="field[@tenant='true' and not(@isolated='true')][1]/text()"/>, <xsl:value-of select="field[1]/text()"/>: calculations.<xsl:value-of select="field[1]/text()"/> };</xsl:when>
         <xsl:otherwise>const filter = { <xsl:value-of select="field[1]/text()"/>: calculations.<xsl:value-of select="field[1]/text()"/> };</xsl:otherwise>
         </xsl:choose>
         const update = {
            $set: {<xsl:for-each select="field[string-length(@calculated)>0]">
               <xsl:value-of select="text()"/>: calculations.<xsl:value-of select="text()"/>,</xsl:for-each>
               calculation_utc: calculations.calculation_utc,
               calculation_agent: calculations.calculation_agent,<xsl:if test="count(field[@searchable='true'])>0">
               searchable: document.searchable,</xsl:if>
            }
         };

         await this._updatePartial<xsl:if test="@tenant='Isolated'">Isolated</xsl:if><xsl:if test="@tenant='Shared' or @tenant='Route'">Shared</xsl:if>(<xsl:for-each select="field[@tenant='true']">calculations.<xsl:value-of select="text()" />, </xsl:for-each>filter, update);
         
         <xsl:variable name="currentCascade" select="@name"/><xsl:if test="count(../item/field[@foreignKey=$currentCascade and @foreignKeyInvalidationCascadesToMe='true'])>0">
         // Cascade Invalidations
         <xsl:for-each select="../item/field[@foreignKey=$currentCascade and @foreignKeyInvalidationCascadesToMe='true']">
         await this.entities.<xsl:value-of select="../@name"/>Manager.invalidateFor<xsl:value-of select="$currentCascade"/>(<xsl:for-each select="../field[@tenant='true']">document.<xsl:value-of select="text()"/>, </xsl:for-each>document.<xsl:value-of select="text()"/>, "InvalidationCascade");
         </xsl:for-each>
         </xsl:if>
      }
      catch(exception: unknown) {
         calculations.calculationMarkDirty(this.defaultAgent, "calc_fail"); // don't allow callers to think we succeeded
         throw exception;
      }
   }

   private async getForSynchronization(<xsl:for-each select="field[@tenant='true']">tenant_code:string, </xsl:for-each>agent_name:string):Promise&lt;<xsl:value-of select="@name"/>.Synchronization[]&gt; {
      
      const filter: <xsl:value-of select="$filterType"/>&lt;<xsl:value-of select="@name"/>&gt; = {
         calculation_utc: null,
      };

      if (isNullOrWhiteSpace(agent_name)) {
         filter.calculation_agent = { $in: [null, ''] };
      } else {
         filter.calculation_agent = agent_name;
      }

      const data = await this._find<xsl:if test="@tenant='Isolated'">Tenant</xsl:if><xsl:if test="@tenant='Shared' or @tenant='Route'">Shared</xsl:if>&lt;<xsl:value-of select="@name"/>.Synchronization&gt;(<xsl:value-of select="@name"/>.Synchronization, <xsl:for-each select="field[@tenant='true']">tenant_code, </xsl:for-each>filter, <xsl:value-of select="@name"/>.Synchronization.Projection, 0, MAX_INT_32);
      
      return data.items;
   }

   private async calculate(document:<xsl:value-of select="@name"/>): Promise&lt;<xsl:value-of select="@name"/>.CalculationsPerspective&gt; {
      const calculationSource:<xsl:value-of select="@name"/>.CalculationSource = document.forCalculation();
      const calculations:<xsl:value-of select="@name"/>.CalculationsPerspective = document.asCalculationsPerspective();

      await this.applyCalculations(calculationSource, calculations);
      
      return calculations;
   }
   </xsl:if>

   <xsl:if test="count(../item/field[@foreignKey=$name and string-length(@foreignKeyComputesMe)>0])>0">
   async cascadeSynchronize(<xsl:for-each select="field[@tenant='true']"><xsl:value-of select="text()" />: <xsl:call-template name="NodeType"><xsl:with-param name="type" select="@type"/></xsl:call-template>, </xsl:for-each><xsl:value-of select="field[1]/text()" />: <xsl:call-template name="NodeType"><xsl:with-param name="type" select="field[1]/@type"/></xsl:call-template>, chain?: Set&lt;string&gt;) {
      if(chain == null) { chain = new Set&lt;string&gt;(); }

      // sync self
      const self = await this.entities.<xsl:call-template name="Camel"><xsl:with-param name="inputString" select="@name"/></xsl:call-template>Manager.getById(<xsl:for-each select="field[@tenant='true']"><xsl:value-of select="text()"/>, </xsl:for-each><xsl:value-of select="field[1]/text()" />);
      if (self) {
         await this.entities.<xsl:call-template name="Camel"><xsl:with-param name="inputString" select="@name"/></xsl:call-template>Manager.calculateAndPersist(self);
      }
      
      if(chain.has("<xsl:value-of select="@name"/>")) {
         return; // no circular references
      }

      chain.add("<xsl:value-of select="@name"/>");
   
      <xsl:if test="count(field[@foreignKeyComputesMe='true'])>0">
      if (self) {
         <xsl:for-each select="field[@foreignKeyComputesMe='true']">// Cascade To <xsl:value-of select="@foreignKey"/>
         <xsl:choose>
         <xsl:when test="@isNullable='true'">
         if (self.<xsl:value-of select="@foreignKeyField"/>) {
            await this.entities.<xsl:call-template name="Camel"><xsl:with-param name="inputString" select="@foreignKey"/></xsl:call-template>Manager.cascadeSynchronize(<xsl:for-each select="../field[@tenant='true']">self.<xsl:value-of select="text()" />, </xsl:for-each>self.<xsl:value-of select="@foreignKeyField"/>, chain);
         }
         </xsl:when>
         <xsl:otherwise>
         await this.entities.<xsl:call-template name="Camel"><xsl:with-param name="inputString" select="@foreignKey"/></xsl:call-template>Manager.cascadeSynchronize(<xsl:for-each select="../field[@tenant='true']">self.<xsl:value-of select="text()" />, </xsl:for-each>self.<xsl:value-of select="@foreignKeyField"/>, chain);
         </xsl:otherwise>
         </xsl:choose>
         </xsl:for-each>
      }
      </xsl:if>
   }

   </xsl:if>

   <xsl:if test="count(field[string-length(@foreignKeyComputesMe)>0])>0">
   protected async cascadeComputeSynchronizations(document: <xsl:value-of select="@name"/>): Promise&lt;void&gt; {
      <xsl:for-each select="field[string-length(@foreignKeyComputesMe)>0]"><xsl:variable name="current_fk"><xsl:value-of select="text()"/></xsl:variable>
      // Compute Cascade to <xsl:value-of select="@foreignKey" />
      <xsl:choose>
      <xsl:when test="@isNullable='true'">
      if (document.<xsl:value-of select="text()"/>) {
         await this.entities.<xsl:call-template name="Camel"><xsl:with-param name="inputString" select="@foreignKey"/></xsl:call-template>Manager.cascadeSynchronize(<xsl:if test="not(@detachedForeign='true')"><xsl:for-each select="../field[@tenant='true' and text()!=$current_fk]">document.<xsl:value-of select="text()" />, </xsl:for-each></xsl:if>document.<xsl:value-of select="text()"/>);
      }
      </xsl:when>
      <xsl:otherwise>
      await this.entities.<xsl:call-template name="Camel"><xsl:with-param name="inputString" select="@foreignKey"/></xsl:call-template>Manager.cascadeSynchronize(<xsl:if test="not(@detachedForeign='true')"><xsl:for-each select="../field[@tenant='true' and text()!=$current_fk]">document.<xsl:value-of select="text()" />, </xsl:for-each></xsl:if>document.<xsl:value-of select="text()"/>);</xsl:otherwise>
      </xsl:choose>
      </xsl:for-each>
   }

   </xsl:if>

   protected async postProcessFindAs&lt;TProjection&gt;(data: ListResult&lt;TProjection&gt;) : Promise&lt;ListResult&lt;TProjection&gt;&gt; {
      return data;
   }
   protected async preProcessMutationDocument(document: <xsl:value-of select="@name"/>, documentOperation: DocumentOperation): Promise&lt;void&gt; {
      // for override customization
   }
   protected async postProcessMutationDocument(document: <xsl:value-of select="@name"/>, documentOperation: DocumentOperation): Promise&lt;void&gt; {
      // for override customization
   }
   <xsl:for-each select="field[string-length(@perspective)>0 and generate-id()=generate-id(key('perspectiveKey',concat(../@name, @perspective))[1])]">
   <xsl:variable name="targetPerspective"><xsl:value-of select="@perspective" /></xsl:variable>
   protected async preProcessMutation<xsl:value-of select="@perspective"/>Perspective(perspective: <xsl:value-of select="../@name"/>.<xsl:value-of select="@perspective"/>Perspective, documentOperation: DocumentOperation): Promise&lt;void&gt; {
      // for override customization
   }
   protected async postProcessMutation<xsl:value-of select="@perspective"/>Perspective(perspective: <xsl:value-of select="../@name"/>.<xsl:value-of select="@perspective"/>Perspective, documentOperation: DocumentOperation): Promise&lt;void&gt; {
      // for override customization
   }
   </xsl:for-each>
   <xsl:if test="count(field[string-length(@calculated)>0])>0">
   protected async applyCalculations(source: <xsl:value-of select="@name"/>.CalculationSource, destination:<xsl:value-of select="@name"/>.CalculationsPerspective): Promise&lt;void&gt; {
      // for override customization
      // IMPORTANT: Use source.field for all calculation inputs. Do NOT use source.getActual()
      // to read fields — that bypasses change detection. If you need a field, add recalculate="true" in the XML.

      <xsl:for-each select="field[@tenant='true']">// Use the following ONLY to retrieve routing fields like <xsl:value-of select="text()"/>
      // const <xsl:value-of select="text()"/>:string = source.getActual().<xsl:value-of select="text()"/>;</xsl:for-each>
   }
   </xsl:if>

   <xsl:for-each select="field[string-length(@extraValidation)>0 and generate-id()=generate-id(key('extraValidationKey',concat(../@name, @extraValidation))[1])]">
   protected async <xsl:value-of select="@extraValidation"/>(document) {
      // for override customization
   }
   protected async applyCalculations(source: <xsl:value-of select="@name"/>.CalculationSource, destination: <xsl:value-of select="@name"/>.CalculationsPerspective): Promise&lt;void&gt; {
      // for override customization
      // IMPORTANT: Use source.field for all calculation inputs. Do NOT use source.getActual()
      // to read fields — that bypasses change detection. If you need a field, add recalculate="true" in the XML.

      <xsl:for-each select="field[@tenant='true']">// Use the following ONLY to retrieve routing fields like <xsl:value-of select="text()"/>
      // const <xsl:value-of select="text()"/>:string = source.getActual().<xsl:value-of select="text()"/>;</xsl:for-each>
   }
   </xsl:for-each>
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
<xsl:template name="Camel">
   <xsl:param name="inputString"/>
   <xsl:choose>
      <xsl:when test="string-length($inputString) = 0"></xsl:when>
      <xsl:otherwise>
      <xsl:variable name="lowered"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="$inputString"/></xsl:call-template></xsl:variable>
      <xsl:value-of select="concat(substring($lowered, 1, 1), substring($inputString, 2))"/>
      </xsl:otherwise>
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
<xsl:template name="Spaceless">
   <xsl:param name="text" />
   <xsl:call-template name="Replace">
      <xsl:with-param name="text" select="$text" />
      <xsl:with-param name="replace" select="' '" />
      <xsl:with-param name="by" select="''" />
   </xsl:call-template>
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