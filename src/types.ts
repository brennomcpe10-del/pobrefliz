export interface Series {
  id: string;
  title: string;
  synopsis: string;
  genre: string;
  year: string;
  bannerUrl?: string;
  rating?: string;
  createdAt: number;
}

export type SeriesInfo = Series;

export interface Episode {
  id: string;
  seriesId: string; // ID da série à qual o episódio pertence
  title: string;
  season: number;
  episodeNumber: number;
  description: string;
  duration?: number; // duração em segundos
  thumbnailUrl?: string; // base64 ou url da imagem
  videoBlob?: Blob; // blob local se armazenado no cliente
  videoUrl?: string; // URL do stream ou arquivo no servidor (/uploads/... ou web)
  fileName?: string;
  fileSize?: number; // tamanho em bytes
  fileType?: string; // tipo mime (video/mp4, video/mkv, etc)
  createdAt: number;
  watched?: boolean;
}
