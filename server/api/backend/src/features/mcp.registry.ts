import { bindMcpFeature, McpFeatureBinding } from 'src/shared/mcp/mcp.types';
import { ProfileController } from './user/profile/profile.controller';
import { PROFILE_MCP_TOOLS } from './user/profile/profile.mcp.base';

/** Every feature with MCP-enabled operations, in schema order. */
export const MCP_FEATURE_BINDINGS: McpFeatureBinding[] = [
   bindMcpFeature('profile', ProfileController, PROFILE_MCP_TOOLS),
];