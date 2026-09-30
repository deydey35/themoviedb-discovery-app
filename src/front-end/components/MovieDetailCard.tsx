import type { Movie } from '../../back-end/schemas/MoviesTypes';
import './MovieDetailCard.css';

type MovieDetailCardProps = {
  movie: Movie;
};

export default function MovieDetailCard({ movie }: MovieDetailCardProps) {
  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : null;
  const genres = movie.genre_ids.map((genreId) => `Genre ${genreId}`);

  return (
    <article className="movie-detail-card">
      <figure className="movie-detail-hero-container">
        {posterUrl ? (
          <img
            className="movie-detail-hero"
            src={posterUrl}
            alt={`Affiche de ${movie.title}`}
          />
        ) : (
          <div
            className="movie-detail-hero movie-detail-hero-placeholder"
            role="img"
            aria-label={`Affiche indisponible pour ${movie.title}`}
          />
        )}
      </figure>
      <div className="movie-detail-copy">
        <p className="movie-detail-kicker">Film</p>
        <h1>{movie.title}</h1>
        {movie.original_title !== movie.title && (
          <p className="movie-detail-tagline">{movie.original_title}</p>
        )}
        <dl className="movie-detail-meta">
          <div>
            <dt>Sortie</dt>
            <dd>{movie.release_date || 'Inconnue'}</dd>
          </div>
          <div>
            <dt>Note</dt>
            <dd>{movie.vote_average.toFixed(1)} / 10</dd>
          </div>
          <div>
            <dt>Votes</dt>
            <dd>{movie.vote_count}</dd>
          </div>
        </dl>
        <ul className="movie-detail-genres">
          {genres.map((genre) => (
            <li key={genre}>{genre}</li>
          ))}
        </ul>
        <section className="movie-detail-section">
          <h2>Synopsis</h2>
          <p>{movie.overview || 'Aucun synopsis disponible.'}</p>
        </section>
      </div>
    </article>
  );
}
