import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { UIException } from './friendly-exception';
import { formatString } from '../utils/string.utils';

@Catch()
export class FriendlyExceptionFilter implements ExceptionFilter {
   catch(exception: unknown, host: ArgumentsHost) {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse();
      const request = ctx.getRequest();

      let status = HttpStatus.INTERNAL_SERVER_ERROR;
      let message = 'An unexpected error occurred.';

      if (exception instanceof UIException) {
         status = HttpStatus.OK;
         message = exception.localizableString.default_text; //TODO:MUST:Localize this default_text
         if (exception.localizableString.args) {
            message = formatString(message, exception.localizableString.args);
         }
      } else if (exception instanceof HttpException) {
         status = exception.getStatus();
         const responseBody = exception.getResponse();
         message = typeof responseBody === 'string' ? responseBody : (responseBody as any).message || message;
      }

      // Log only for non-UI exceptions (unexpected errors)
      if (!(exception instanceof UIException)) {
         console.error('Internal Error:', {
            url: request.url,
            method: request.method,
            message: message,
            exception,
         });
      }

      // Send sanitized response
      response.status(status).json({
         statusCode: status,
         timestamp: new Date().toISOString(),
         path: request.url,
         message, // sanitized message
      });
   }
}
