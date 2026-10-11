import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { Prisma } from '../generated/prisma/client.js';

/**
 * Turns known Prisma errors into meaningful HTTP responses instead of a generic 500:
 * P2002 unique violation → 409, P2025 record not found → 404, P2003 bad reference → 400.
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(error: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    const [status, message] = this.map(error);
    res.status(status).json({ statusCode: status, code: error.code, message });
  }

  private map(error: Prisma.PrismaClientKnownRequestError): [number, string] {
    switch (error.code) {
      case 'P2002': {
        const fields = this.uniqueFields(error);
        return [HttpStatus.CONFLICT, fields ? `Already exists: ${fields}` : 'Already exists'];
      }
      case 'P2025':
        return [HttpStatus.NOT_FOUND, 'Not found'];
      case 'P2003':
        return [HttpStatus.BAD_REQUEST, 'Referenced record does not exist'];
      default:
        return [HttpStatus.INTERNAL_SERVER_ERROR, 'Database error'];
    }
  }

  /** Field names from the error: `target` (classic engine) or the index name `<table>_<field>_key` (driver adapter). */
  private uniqueFields(error: Prisma.PrismaClientKnownRequestError) {
    const meta = error.meta as Record<string, any> | undefined;
    if (Array.isArray(meta?.target)) return meta.target.join(', ');
    const cause = meta?.driverAdapterError?.cause;
    const index: string | undefined = cause?.constraint?.index;
    if (index && cause?.table) return index.replace(`${cause.table}_`, '').replace(/_key$/, '');
    return '';
  }
}
