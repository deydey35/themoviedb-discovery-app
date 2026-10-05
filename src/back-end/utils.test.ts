import { describe, expect, it } from 'vitest';
import { toSupportedMovie, toSupportedMovieDetails } from './utils';

const rawMovie = {
  adult: false,
  backdrop_path: '/backdrop.jpg',
  genre_ids: [18, 35],
  id: 42,
  original_language: 'en',
  original_title: 'The Answer',
  overview: 'A movie overview',
  popularity: 12.5,
  poster_path: '/poster.jpg',
  release_date: '2026-01-01',
  title: 'La réponse',
  video: false,
  vote_average: 8.2,
  vote_count: 100,
};

describe('movie response transformations', () => {
  it('removes unsupported fields from a movie response', () => {
    expect(toSupportedMovie(rawMovie)).toEqual({
      backdrop_path: '/backdrop.jpg',
      genre_ids: [18, 35],
      id: 42,
      original_language: 'en',
      original_title: 'The Answer',
      overview: 'A movie overview',
      popularity: 12.5,
      poster_path: '/poster.jpg',
      release_date: '2026-01-01',
      title: 'La réponse',
      vote_average: 8.2,
      vote_count: 100,
    });
  });

  it('converts detail genres to genre ids', () => {
    const {
      adult: _adult,
      genre_ids: _genreIds,
      video: _video,
      ...details
    } = rawMovie;

    expect(
      toSupportedMovieDetails({
        ...details,
        adult: rawMovie.adult,
        video: rawMovie.video,
        genres: [
          { id: 18, name: 'Drama' },
          { id: 35, name: 'Comedy' },
        ],
      }),
    ).toEqual({
      ...details,
      genre_ids: [18, 35],
    });
  });
});
