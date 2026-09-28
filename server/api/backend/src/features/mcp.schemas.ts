import { JsonSchema, McpSchemaMode } from 'src/shared/mcp/mcp.types';
import { objectSchema, schemaProperty } from 'src/shared/mcp/mcp.schema';

export function itemSchema_LocalizedText(mode: McpSchemaMode): JsonSchema {
   return objectSchema(mode, {
      language_code: schemaProperty(mode, { type: 'string', title: 'Language Code' }, true),
      text: schemaProperty(mode, { type: 'string', title: 'text' }, true),
      ui_hash: schemaProperty(mode, { type: 'string', title: 'UI Hash' }, true),
   }, []);
}

export function itemSchema_ContentSection(mode: McpSchemaMode): JsonSchema {
   return objectSchema(mode, {
      section_kind: schemaProperty(mode, { type: 'integer', oneOf: [{ const: 0, title: 'markdown' }, { const: 1, title: 'spacer' }, { const: 2, title: 'header' }, { const: 3, title: 'image' }, { const: 4, title: 'button' }], title: 'Content Section Kind' }, false),
      markdown: schemaProperty(mode, { type: 'string', title: 'Markdown' }, true),
      text: schemaProperty(mode, { type: 'string', title: 'Text' }, true),
      target: schemaProperty(mode, { type: 'string', title: 'Target' }, true),
      sequence: schemaProperty(mode, { type: 'integer', title: 'Sequence' }, true),
      asset_id: schemaProperty(mode, { type: 'string', format: 'uuid', title: 'Asset' }, true),
      ui_tag: schemaProperty(mode, { type: 'string', title: 'UI Tag' }, true),
      ui_text: schemaProperty(mode, { type: 'string', title: 'UI Text' }, true),
      photo: schemaProperty(mode, { ...itemSchema_MediaInfo(mode), title: 'Photo' }, true),
      upload_info: schemaProperty(mode, { ...itemSchema_PreSignedUrl(mode), title: 'Upload Info' }, true),
   }, ['section_kind']);
}

export function itemSchema_LocalizedContent(mode: McpSchemaMode): JsonSchema {
   return objectSchema(mode, {
      language_code: schemaProperty(mode, { type: 'string', title: 'Language Code' }, true),
      contents: schemaProperty(mode, { type: 'array', items: { ...itemSchema_ContentSection(mode) }, title: 'Contents' }, true),
      ui_hash: schemaProperty(mode, { type: 'string', title: 'UI Hash' }, true),
   }, []);
}

export function itemSchema_Dimension(mode: McpSchemaMode): JsonSchema {
   return objectSchema(mode, {
      width: schemaProperty(mode, { type: 'integer', title: 'Width' }, false),
      height: schemaProperty(mode, { type: 'integer', title: 'Height' }, false),
   }, ['width', 'height']);
}

export function itemSchema_FullDate(mode: McpSchemaMode): JsonSchema {
   return objectSchema(mode, {
      utc: schemaProperty(mode, { type: 'string', format: 'date-time', title: 'Utc' }, true),
      local: schemaProperty(mode, { type: 'string', title: 'Local' }, true),
      literal: schemaProperty(mode, { type: 'string', title: 'Literal' }, false),
      iana_zone: schemaProperty(mode, { type: 'string', title: 'Timezone' }, false),
   }, ['literal', 'iana_zone']);
}

export function itemSchema_MediaInfo(mode: McpSchemaMode): JsonSchema {
   return objectSchema(mode, {
      _id: schemaProperty(mode, { type: 'string', format: 'uuid', title: 'Id' }, true),
      asset_kind: schemaProperty(mode, { type: 'integer', oneOf: [{ const: 0, title: 'image' }, { const: 1, title: 'audio' }, { const: 2, title: 'avatar' }], title: 'asset_kind' }, true),
      jurisdiction_id: schemaProperty(mode, { type: 'string', title: 'Jurisdiction' }, true),
      storage_key: schemaProperty(mode, { type: 'string', title: 'Storage Key' }, true),
      thumb_small_key: schemaProperty(mode, { type: 'string', title: 'Thumb Key' }, true),
      thumb_small_url: schemaProperty(mode, { type: 'string', title: 'Small Url' }, true),
      thumb_small_dimensions: schemaProperty(mode, { ...itemSchema_Dimension(mode), title: 'Thumb Dimensions' }, true),
      thumb_large_key: schemaProperty(mode, { type: 'string', title: 'Large Key' }, true),
      thumb_large_url: schemaProperty(mode, { type: 'string', title: 'Large Url' }, true),
      thumb_large_dimensions: schemaProperty(mode, { ...itemSchema_Dimension(mode), title: 'Large Dimensions' }, true),
      raw_url: schemaProperty(mode, { type: 'string', title: 'Raw Url' }, true),
   }, []);
}

export function itemSchema_IDPair(mode: McpSchemaMode): JsonSchema {
   return objectSchema(mode, {
      _id: schemaProperty(mode, { type: 'string', title: 'Id' }, false),
      text: schemaProperty(mode, { type: 'string', title: 'Text' }, false),
   }, ['_id', 'text']);
}

export function itemSchema_PreSignedUrl(mode: McpSchemaMode): JsonSchema {
   return objectSchema(mode, {
      id: schemaProperty(mode, { type: 'string', title: 'id' }, false),
      url: schemaProperty(mode, { type: 'string', title: 'url' }, false),
      signed_url: schemaProperty(mode, { type: 'string', title: 'signed_url' }, false),
      mime_type: schemaProperty(mode, { type: 'string', title: 'mime_type' }, false),
      asset_kind: schemaProperty(mode, { type: 'integer', oneOf: [{ const: 0, title: 'image' }, { const: 1, title: 'audio' }, { const: 2, title: 'avatar' }], title: 'asset_kind' }, false),
      dependency: schemaProperty(mode, { type: 'integer', oneOf: [{ const: 0, title: 'account' }, { const: 1, title: 'widget' }], title: 'Dependencies' }, true),
      dependency_id: schemaProperty(mode, { type: 'string', format: 'uuid', title: 'Dependency ID' }, true),
   }, ['id', 'url', 'signed_url', 'mime_type', 'asset_kind']);
}

export function itemSchema_Timezone_Public(mode: McpSchemaMode): JsonSchema {
   return objectSchema(mode, {
      _id: schemaProperty(mode, { type: 'string', maxLength: 100, title: 'Id' }, false),
      iana_zone: schemaProperty(mode, { type: 'string', maxLength: 100, title: 'Zone' }, false),
      ui_sort: schemaProperty(mode, { type: 'string', maxLength: 100, title: 'Sort' }, false),
      display_name: schemaProperty(mode, { type: 'string', maxLength: 100, title: 'Display Name' }, false),
   }, ['_id', 'iana_zone', 'display_name', 'ui_sort']);
}

export function itemSchema_Jurisdiction_Public(mode: McpSchemaMode): JsonSchema {
   return objectSchema(mode, {
      _id: schemaProperty(mode, { type: 'string', maxLength: 10, title: 'Id' }, false),
   }, ['_id']);
}

export function itemSchema_JurisdictionAsset_Info(mode: McpSchemaMode): JsonSchema {
   return objectSchema(mode, {
      _id: schemaProperty(mode, { type: 'string', format: 'uuid', title: 'Id' }, false),
      jurisdiction_id: schemaProperty(mode, { type: 'string', maxLength: 10, title: 'Jurisdiction' }, false),
      asset_kind: schemaProperty(mode, { type: 'integer', oneOf: [{ const: 0, title: 'image' }, { const: 1, title: 'audio' }, { const: 2, title: 'avatar' }], title: 'Asset kind' }, false),
      storage_key: schemaProperty(mode, { type: 'string', maxLength: 512, title: 'Storage Key' }, false),
      thumb_dimensions: schemaProperty(mode, { ...itemSchema_Dimension(mode), title: 'Thumb Dimensions' }, true),
      large_dimensions: schemaProperty(mode, { ...itemSchema_Dimension(mode), title: 'Large Dimensions' }, true),
      thumb_small_key: schemaProperty(mode, { type: 'string', maxLength: 512, title: 'Thumb Key' }, true),
      thumb_large_key: schemaProperty(mode, { type: 'string', maxLength: 512, title: 'Large Key' }, true),
      duration_secs: schemaProperty(mode, { type: 'integer', title: 'Duraction Secs' }, true),
      size_kb: schemaProperty(mode, { type: 'integer', title: 'Size KB' }, true),
      thumb_small_url: schemaProperty(mode, { type: 'string', title: 'Thumb Url' }, true),
      thumb_large_url: schemaProperty(mode, { type: 'string', title: 'Large Url' }, true),
      raw_url: schemaProperty(mode, { type: 'string', title: 'Raw Url' }, true),
   }, ['_id', 'jurisdiction_id', 'asset_kind', 'storage_key']);
}

export function itemSchema_Account_Internal(mode: McpSchemaMode): JsonSchema {
   return objectSchema(mode, {
      _id: schemaProperty(mode, { type: 'string', format: 'uuid', title: 'Id' }, false),
      email: schemaProperty(mode, { type: 'string', maxLength: 128, title: 'E-mail' }, false),
   }, ['_id', 'email']);
}

export function itemSchema_Account_Public(mode: McpSchemaMode): JsonSchema {
   return objectSchema(mode, {
      _id: schemaProperty(mode, { type: 'string', format: 'uuid', title: 'Id' }, false),
      jurisdiction_id: schemaProperty(mode, { type: 'string', maxLength: 10, title: 'Jurisdiction' }, false),
      display_name: schemaProperty(mode, { type: 'string', maxLength: 150, title: 'Display Name' }, true),
      avatar: schemaProperty(mode, { ...itemSchema_MediaInfo(mode), title: 'Avatar' }, true),
   }, ['_id', 'jurisdiction_id']);
}

export function itemSchema_Account_Connection(mode: McpSchemaMode): JsonSchema {
   return objectSchema(mode, {
      _id: schemaProperty(mode, { type: 'string', format: 'uuid', title: 'Id' }, false),
      jurisdiction_id: schemaProperty(mode, { type: 'string', maxLength: 10, title: 'Jurisdiction' }, false),
      display_name: schemaProperty(mode, { type: 'string', maxLength: 150, title: 'Display Name' }, true),
      avatar: schemaProperty(mode, { ...itemSchema_MediaInfo(mode), title: 'Avatar' }, true),
   }, ['_id', 'jurisdiction_id']);
}

export function itemSchema_Account_Self(mode: McpSchemaMode): JsonSchema {
   return objectSchema(mode, {
      _id: schemaProperty(mode, { type: 'string', format: 'uuid', title: 'Id' }, false),
      email: schemaProperty(mode, { type: 'string', maxLength: 128, title: 'E-mail' }, false),
      joined_utc: schemaProperty(mode, { type: 'string', format: 'date-time', title: 'Joined' }, false),
      display_name: schemaProperty(mode, { type: 'string', maxLength: 150, title: 'Display Name' }, true),
      roles: schemaProperty(mode, { type: 'array', items: { type: 'string' }, title: 'Roles' }, true),
      account_status: schemaProperty(mode, { type: 'integer', oneOf: [{ const: -1, title: 'disabled' }, { const: 0, title: 'enabled' }], title: 'Status' }, false),
      avatar: schemaProperty(mode, { ...itemSchema_MediaInfo(mode), title: 'Avatar' }, true),
      jurisdiction_id: schemaProperty(mode, { type: 'string', maxLength: 10, title: 'Jurisdiction' }, false),
      auth_provider: schemaProperty(mode, { type: 'string', maxLength: 150, title: 'Auth Provider' }, false),
      token: schemaProperty(mode, { type: 'string', title: 'Token' }, false),
      impersonated: schemaProperty(mode, { type: 'boolean', title: 'Impersonated' }, false),
   }, ['_id', 'jurisdiction_id', 'email', 'auth_provider', 'joined_utc', 'account_status', 'token', 'impersonated']);
}

export function itemSchema_Account_Identity(mode: McpSchemaMode): JsonSchema {
   return objectSchema(mode, {
      _id: schemaProperty(mode, { type: 'string', format: 'uuid', title: 'Id' }, false),
      auth_identifier: schemaProperty(mode, { type: 'string', maxLength: 150, title: 'Auth Identifier' }, false),
   }, ['_id', 'auth_identifier']);
}

export function itemSchema_Widget_Public(mode: McpSchemaMode): JsonSchema {
   return objectSchema(mode, {
      _id: schemaProperty(mode, { type: 'string', format: 'uuid', title: 'Id' }, false),
      jurisdiction_id: schemaProperty(mode, { type: 'string', maxLength: 10, title: 'Jurisdiction' }, false),
      title: schemaProperty(mode, { type: 'string', maxLength: 200, title: 'Title' }, false),
      description: schemaProperty(mode, { type: 'array', items: { ...itemSchema_ContentSection(mode) }, title: 'Description' }, true),
      media: schemaProperty(mode, { ...itemSchema_MediaInfo(mode), title: 'Media' }, true),
      avatar: schemaProperty(mode, { ...itemSchema_MediaInfo(mode), title: 'Avatar' }, true),
      published_date: schemaProperty(mode, { ...itemSchema_FullDate(mode), title: 'Published Date' }, true),
   }, ['_id', 'jurisdiction_id', 'title']);
}