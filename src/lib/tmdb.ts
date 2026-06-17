import axios from 'axios';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const tmdb = axios.create({
  baseURL: TMDB_BASE_URL,
  params: {
    api_key: TMDB_API_KEY,
  },
});

export const getTrending = async (type: 'movie' | 'tv' | 'all' = 'all') => {
  const { data } = await tmdb.get(`/trending/${type}/week`);
  return data.results;
};

export const getMovieDetails = async (id: string) => {
  const { data } = await tmdb.get(`/movie/${id}`, {
    params: { append_to_response: 'videos,credits,similar,recommendations' }
  });
  return data;
};

export const getTvDetails = async (id: string) => {
  const { data } = await tmdb.get(`/tv/${id}`, {
    params: { append_to_response: 'videos,credits,similar,recommendations' }
  });
  return data;
};

export const getDiscover = async (params: any) => {
  const { data } = await tmdb.get(`/discover/movie`, { params });
  return data.results;
};

export const getPersonDetails = async (id: string) => {
  const { data } = await tmdb.get(`/person/${id}`);
  return data;
};

export const getPersonCredits = async (id: string) => {
  const { data } = await tmdb.get(`/person/${id}/combined_credits`);
  return data.cast;
};

export const searchMulti = async (query: string) => {
  const { data } = await tmdb.get('/search/multi', { params: { query } });
  return data.results;
};

export const getImageUrl = (path: string, size: string = 'original') => {
  if (!path) return 'https://picsum.photos/seed/placeholder/1920/1080?blur=10';
  return `https://image.tmdb.org/t/p/${size}${path}`;
};
