import { useEffect, useState } from 'react';
import type { Movie } from '../back-end/schemas/MoviesTypes';
import { DEFAULT_LANGUAGE, DEFAULT_PAGE, DEFAULT_REGION } from '../back-end/constants';
import MovieItem from './components/MovieItem';

export default function App() {
  const [movies, setMovies] = useState<Movie[] | null>(null);
  const queryParams = new URLSearchParams(window.location.search);
  const language = queryParams.get('language') || DEFAULT_LANGUAGE;
  const page = queryParams.get('page') || DEFAULT_PAGE;
  const region = queryParams.get('region') || DEFAULT_REGION;
  const title = language.startsWith('fr')
    ? 'Films Populaires'
    : 'Popular Movies';
  // useEffect hook to fetch data from an API when the component mounts
  useEffect(() => {

    // 2. Construire la query string pour le back-end
    const apiParams = new URLSearchParams({
      language,
      page,
      region,
    });
    // fetch data from an API /api/movies/popular
    fetch(`/api/movies/popular?language=${language}&page=${page}&region=${region}`)
      .then((response) => response.json())
      .then((data) => {
        console.log('Fetched movies data:', data); // Log the fetched data for debugging
        setMovies(data.results); // Update the state with the fetched movies data
      });
  }, []);

  return (
    <div>
      <h1>{title}</h1>
      {movies ? (
        <ul>
          {movies.map((movie) => (
            <MovieItem key={movie.id} movie={movie} />
          ))}
        </ul>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}
