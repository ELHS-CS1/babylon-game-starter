// ============================================================================
// STATIC FILE SERVER - Asset and static file serving management
// ============================================================================

import type { IncomingMessage, ServerResponse } from 'http';
import { join } from 'path';
import { readFileSync } from 'fs';

export class StaticFileServer {
  private clientPath: string;

  constructor(clientPath: string) {
    this.clientPath = clientPath;
  }

  private serveFile(
    _req: IncomingMessage,
    res: ServerResponse,
    filePath: string,
    contentType: string
  ): void {
    try {
      const content = readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    } catch (error) {
      res.writeHead(404);
      res.end('Not Found');
    }
  }

  private getContentType(ext?: string): string {
    switch (ext) {
      case 'js': return 'application/javascript';
      case 'css': return 'text/css';
      case 'html': return 'text/html';
      case 'json': return 'application/json';
      case 'png': return 'image/png';
      case 'jpg':
      case 'jpeg': return 'image/jpeg';
      case 'gif': return 'image/gif';
      case 'svg': return 'image/svg+xml';
      case 'ico': return 'image/x-icon';
      case 'woff': return 'font/woff';
      case 'woff2': return 'font/woff2';
      case 'ttf': return 'font/ttf';
      case 'webp': return 'image/webp';
      case 'glb': return 'model/gltf-binary';
      case 'gltf': return 'model/gltf+json';
      case 'mp3': return 'audio/mpeg';
      case 'wav': return 'audio/wav';
      case 'ogg': return 'audio/ogg';
      default: return 'application/octet-stream';
    }
  }

  public handleServiceWorker(req: IncomingMessage, res: ServerResponse): void {
    this.serveFile(req, res, join(this.clientPath, 'sw.js'), 'application/javascript');
  }

  public handleManifest(req: IncomingMessage, res: ServerResponse): void {
    this.serveFile(req, res, join(this.clientPath, 'manifest.json'), 'application/json');
  }

  public handleFavicon(req: IncomingMessage, res: ServerResponse): void {
    const faviconPath = join(this.clientPath, 'icons', 'favicon.png');
    this.serveFile(req, res, faviconPath, 'image/png');
  }

  public handleIcon(req: IncomingMessage, res: ServerResponse, pathname: string): void {
    const iconPath = join(this.clientPath, pathname);
    const ext = pathname.split('.').pop()?.toLowerCase();
    const contentType = this.getContentType(ext);
    this.serveFile(req, res, iconPath, contentType);
  }

  public handleAsset(req: IncomingMessage, res: ServerResponse, pathname: string): void {
    const assetPath = join(this.clientPath, pathname);
    const ext = pathname.split('.').pop()?.toLowerCase();
    const contentType = this.getContentType(ext);
    this.serveFile(req, res, assetPath, contentType);
  }

  public handleIndex(req: IncomingMessage, res: ServerResponse): void {
    this.serveFile(req, res, join(this.clientPath, 'index.html'), 'text/html');
  }

  public handleStaticFile(req: IncomingMessage, res: ServerResponse, pathname: string): void {
    const filePath = join(this.clientPath, pathname);
    const ext = pathname.split('.').pop()?.toLowerCase();
    const contentType = this.getContentType(ext);
    this.serveFile(req, res, filePath, contentType);
  }
}
