export interface Movie {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  genre_ids: number[];
  media_type?: "movie" | "tv";
}

export interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
}

export interface MovieRowProps {
  title: string;
  fetchUrl: string;
  isLargeRow?: boolean;
  isTop10?: boolean;
}

export interface Genre {
  id: number;
  name: string;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export interface Episode {
  id: number;
  name: string;
  overview: string;
  still_path: string | null;
  episode_number: number;
}

export interface Season {
  id: number;
  name: string;
  season_number: number;
  episode_count?: number;
  episodes?: Episode[];
  poster_path: string | null;
}

export interface MovieDetailsData extends Movie {
  runtime?: number;
  number_of_seasons?: number;
  genres: Genre[];
  seasons?: Season[];
}

export interface PersonDetails {
  id: number;
  name: string;
  biography: string;
  birthday: string | null;
  place_of_birth: string | null;
  profile_path: string | null;
  combined_credits?: {
    cast: Movie[];
  };
}
