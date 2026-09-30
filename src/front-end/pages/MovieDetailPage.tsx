import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import type { Movie } from '../../back-end/schemas/MoviesTypes';
import MovieDetailCard from '../components/MovieDetailCard';

export default function MovieDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) {
      return;
    }

    fetch(`/api/movies/${encodeURIComponent(id)}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to fetch movie details');
        }
        return response.json() as Promise<Movie>;
      })
      .then(setMovie)
      .catch(() => setError(true));
  }, [id]);

  return (
    <main className="app-shell">
      <header className="app-header">
        <h1>Détail du film</h1>
      </header>
      {error ? (
        <p className="status-message">Impossible de charger ce film.</p>
      ) : movie ? (
        <MovieDetailCard movie={movie} />
      ) : (
        <p className="status-message">Chargement...</p>
      )}
    </main>
  );
}
