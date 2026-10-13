import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { ChunkRule } from './chunk';

export interface DocumentRecord {
  readonly id: string;
  readonly path: string;
  readonly sha256: string;
  readonly lengthChars: number;
}

export interface IndexedChunk {
  readonly id: string;
  readonly docId: string;
  readonly heading: string;
  readonly start: number;
  readonly end: number;
  readonly text: string;
  readonly vector: number[];
}

export interface IndexFile {
  readonly version: 'v1';
  readonly embedder: string;
  readonly dimensions: number;
  readonly rule: ChunkRule;
  readonly documents: DocumentRecord[];
  readonly chunks: IndexedChunk[];
  readonly createdAt: string;
}

export function sha256(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

export function saveIndex(file: string, index: IndexFile): void {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(index, null, 2), 'utf8');
}

export function loadIndex(file: string, expectedEmbedder?: string): IndexFile {
  const index = JSON.parse(readFileSync(file, 'utf8')) as IndexFile;
  if (expectedEmbedder && index.embedder !== expectedEmbedder) {
    throw new Error(`Невідповідність ембедера: індекс побудовано ${index.embedder}, очікувався ${expectedEmbedder}`);
  }
  return index;
}