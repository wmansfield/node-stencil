<?xml version="1.0" encoding="UTF-8" ?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
<xsl:key name="perspectiveKey" match="items/item/field[string-length(@perspective)>0]" use="concat(../@name, @perspective)" />

<xsl:template match="/">

'''[STARTFILE:<xsl:value-of select="items/@backendPrefix"/>entities\entity.module.ts]
import { forwardRef, DynamicModule, Module } from '@nestjs/common';
import { MongoModule } from 'src/shared/mongo/mongo.module';
import { AppConfigModule } from 'src/config/config.module';

<xsl:for-each select="items/item[not(@classOnly='true')]">
   <xsl:variable name="name_lowered"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="@name"/></xsl:call-template></xsl:variable>
   <xsl:variable name="name"><xsl:value-of select="@name"/></xsl:variable>
import { <xsl:value-of select="$name"/>Module } from './<xsl:value-of select="$name_lowered"/>/<xsl:value-of select="$name_lowered"/>.module';</xsl:for-each>

const ENTITY_MODULES = [<xsl:for-each select="items/item[not(@classOnly='true')]">
   <xsl:variable name="name_lowered"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="@name"/></xsl:call-template></xsl:variable>
   <xsl:variable name="name"><xsl:value-of select="@name"/></xsl:variable><xsl:text>
   </xsl:text><xsl:value-of select="$name"/>Module,</xsl:for-each>
];

@Module({})
export class EntitiesModule {
   static forRoot(): DynamicModule {
      return {
         module: EntitiesModule,
         imports: [
            // standard
            forwardRef(() =&gt; AppConfigModule),
            forwardRef(() =&gt; MongoModule),
            // entities
            ...ENTITY_MODULES.map(module =&gt; forwardRef(() =&gt; module)),
         ],
         exports: [...ENTITY_MODULES],
         providers: [],
      };
   }
}

'''[ENDFILE]



'''[STARTFILE:<xsl:value-of select="items/@backendPrefix"/>entities\entity.registry.ts]
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { SynchronizableEntityIsolated, SynchronizableEntityShared } from 'src/shared/managers/synchronized-entity';
<xsl:for-each select="items/item[not(@classOnly='true')]">
   <xsl:variable name="name_lowered"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="@name"/></xsl:call-template></xsl:variable>
   <xsl:variable name="name"><xsl:value-of select="@name"/></xsl:variable>
import type { <xsl:value-of select="$name"/>Manager } from './<xsl:value-of select="$name_lowered"/>/<xsl:value-of select="$name_lowered"/>.manager';</xsl:for-each>


@Injectable()
export class EntityRegistry implements OnModuleInit {
   constructor(private moduleRef: ModuleRef) {}
   <xsl:for-each select="items/item[not(@classOnly='true')]">
   <xsl:variable name="name_camel"><xsl:call-template name="Camel"><xsl:with-param name="inputString" select="@name"/></xsl:call-template></xsl:variable>
   <xsl:variable name="name"><xsl:value-of select="@name"/></xsl:variable>
   private _<xsl:value-of select="$name_camel"/>Manager!: <xsl:value-of select="$name"/>Manager;</xsl:for-each>

   onModuleInit() {
      // Optionally, eagerly resolve all managers here if you want
   }

   <xsl:for-each select="items/item[not(@classOnly='true')]">
   <xsl:variable name="name_camel"><xsl:call-template name="Camel"><xsl:with-param name="inputString" select="@name"/></xsl:call-template></xsl:variable>
   <xsl:variable name="name"><xsl:value-of select="@name"/></xsl:variable>
   get <xsl:value-of select="$name_camel"/>Manager(): <xsl:value-of select="$name"/>Manager {
      if (!this._<xsl:value-of select="$name_camel"/>Manager) {
         try {
            this._<xsl:value-of select="$name_camel"/>Manager = this.moduleRef.get('<xsl:value-of select="$name"/>Manager', { strict: false });
         } catch (error) {
            throw new Error(`<xsl:value-of select="$name"/>Manager not available: ${error.message}`);
         }
      }
      return this._<xsl:value-of select="$name_camel"/>Manager;
   }
   </xsl:for-each>

   getSharedSynchronizers(): SynchronizableEntityShared[] {
      return [<xsl:for-each select="items/item[not(@classOnly='true')]">
         <xsl:if test="count(field[string-length(@calculated)>0])>0 and count(field[@tenant='true'])=0">
         this.<xsl:call-template name="Camel"><xsl:with-param name="inputString" select="@name"/></xsl:call-template>Manager,</xsl:if></xsl:for-each>
      ];
   }

   getIsolatedSynchronizers(): SynchronizableEntityIsolated[] {
      return [<xsl:for-each select="items/item[not(@classOnly='true')]">
         <xsl:if test="count(field[string-length(@calculated)>0])>0 and count(field[@tenant='true'])>0">
         this.<xsl:call-template name="Camel"><xsl:with-param name="inputString" select="@name"/></xsl:call-template>Manager,</xsl:if></xsl:for-each>
      ];
   }
}


'''[ENDFILE]



<xsl:for-each select="items/item">
   <xsl:variable name="name_lowered"><xsl:call-template name="ToLower"><xsl:with-param name="inputString" select="@name"/></xsl:call-template></xsl:variable>
   <xsl:variable name="name"><xsl:value-of select="@name"/></xsl:variable>


'''[STARTFILE:<xsl:value-of select="../@backendPrefix"/>entities\<xsl:value-of select="$name_lowered"/>\<xsl:value-of select="$name_lowered"/>.module.ts]
import { forwardRef, Module } from '@nestjs/common';
import { registerSchema } from 'src/shared/managers/schema-registry';
import { SchemaFactory } from '@nestjs/mongoose';<xsl:if test="not(@classOnly='true')">
import { MongoModule } from 'src/shared/mongo/mongo.module';<xsl:if test="@tenant='isolated'">
import { TenantModule } from 'src/tenant/tenant.module';</xsl:if>
import { <xsl:value-of select="$name"/>Controller } from './<xsl:value-of select="$name_lowered"/>.controller';
import { <xsl:value-of select="$name"/>Manager } from './<xsl:value-of select="$name_lowered"/>.manager';</xsl:if>
import { COLLECTION_NAME, <xsl:value-of select="$name"/> } from './<xsl:value-of select="$name_lowered"/>.schema';
import { EntitiesModule } from 'src/entities/entity.module';
<xsl:if test="count(field[string-length(@uiUploadAvatar)>0])>0">import { StorageModule } from 'src/features/platform/storage';
</xsl:if>
@Module({<xsl:if test="not(@classOnly='true')">
   imports: [MongoModule, forwardRef(() =&gt; EntitiesModule)<xsl:if test="count(field[string-length(@uiUploadAvatar)>0])>0">, StorageModule</xsl:if>],
   controllers: [<xsl:value-of select="$name"/>Controller],
   providers: [
      <xsl:value-of select="$name"/>Manager,
      {
         provide: '<xsl:value-of select="$name"/>Manager', // For dynamic resolution
         useClass: <xsl:value-of select="$name"/>Manager,
      },
   ],
   exports: [
      <xsl:value-of select="$name"/>Manager,
      {
         provide: '<xsl:value-of select="$name"/>Manager', // For dynamic resolution
         useClass: <xsl:value-of select="$name"/>Manager,
      },
   ]
</xsl:if>})
export class <xsl:value-of select="$name"/>Module {
   constructor() {
      registerSchema({
         name: COLLECTION_NAME,
         schema: <xsl:value-of select="$name"/>.<xsl:value-of select="$name"/>Schema,<xsl:if test="count(field[@encrypted='true'])>0">
         encryptedFields: [<xsl:for-each select="field[@encrypted='true']">
            {
               path: '<xsl:value-of select="text()"/>',
               bsonType: 'string',
            },</xsl:for-each>
         ],
         </xsl:if>
      });
   }
}
'''[ENDFILE]

</xsl:for-each>

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