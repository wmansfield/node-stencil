import { Module } from '@nestjs/common';
import { AppConfigModule } from 'src/config/config.module';
import { UserModule } from 'src/features/user/user.module';
import { McpConfig } from './mcp.config';
import { McpController } from './mcp.controller';
import { McpDispatcher } from './mcp.dispatcher';
import { McpIdentityKeys, McpIdentityVerifier, RemoteMcpIdentityKeys } from './mcp-identity.verifier';
import { McpReplayStore } from './mcp-replay.store';
import { McpServerHandler } from './mcp.server';

/** Serves generated feature tools (features/mcp.registry.ts) at /api/mcp. */
@Module({
   imports: [AppConfigModule, UserModule],
   controllers: [McpController],
   providers: [
      McpConfig,
      McpReplayStore,
      { provide: McpIdentityKeys, useClass: RemoteMcpIdentityKeys },
      McpIdentityVerifier,
      McpDispatcher,
      McpServerHandler,
   ],
})
export class McpModule {}
