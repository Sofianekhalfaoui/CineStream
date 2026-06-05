import Dexie, { Table } from 'dexie';
import { Movie } from '../types';

export interface DownloadItem extends Omit<Movie, 'id'> {
  id: string | number;
  movieId: number;
  status: 'pending' | 'downloading' | 'completed';
  progress: number;
  quality: string;
  size: string;
  downloadDate: string;
  season_number?: number;
  episode_number?: number;
  episode_name?: string;
  videoBlob?: Blob; // Future-proofing for real blobs
}

export class FalakPlayDB extends Dexie {
  downloads!: Table<DownloadItem>;

  constructor() {
    super('FalakPlayDB');
    this.version(1).stores({
      downloads: 'id, status, downloadDate'
    });
  }
}

export const db = new FalakPlayDB();
