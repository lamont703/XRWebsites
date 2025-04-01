declare module 'stream-browserify' {
  import { Stream } from 'stream';
  
  export class Readable extends Stream implements NodeJS.ReadableStream {
    readable: boolean;
    read(size?: number): string | Buffer | null;
    setEncoding(encoding: string): this;
    pause(): this;
    resume(): this;
    isPaused(): boolean;
    pipe<T extends NodeJS.WritableStream>(destination: T, options?: { end?: boolean }): T;
    unpipe(destination?: NodeJS.WritableStream): this;
    unshift(chunk: any, encoding?: BufferEncoding): void;
    wrap(oldStream: NodeJS.ReadableStream): this;
    push(chunk: any, encoding?: string): boolean;
    _read(size: number): void;
    destroy(error?: Error): void;
  }

  export class PassThrough extends Stream implements NodeJS.ReadWriteStream {
    readable: boolean;
    writable: boolean;
    write(chunk: any, encoding?: string, callback?: (error?: Error | null) => void): boolean;
    end(chunk?: any, encoding?: string, callback?: () => void): void;
    read(size?: number): any;
    setEncoding(encoding: string): this;
    pause(): this;
    resume(): this;
    pipe<T extends NodeJS.WritableStream>(destination: T, options?: { end?: boolean }): T;
    unpipe(destination?: NodeJS.WritableStream): this;
    unshift(chunk: any, encoding?: BufferEncoding): void;
    wrap(oldStream: NodeJS.ReadableStream): this;
    push(chunk: any, encoding?: string): boolean;
    _read(size: number): void;
    destroy(error?: Error): void;
  }
}

declare module 'stream-http' {
  export const STATUS_CODES: { [key: string]: string };
} 