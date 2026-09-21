<<<<<<< Updated upstream
import type { Movie } from '../../back-end/schemas/MoviesTypes';
=======
import type { Movie } from "../../back-end/schemas/MoviesTypes";
>>>>>>> Stashed changes

type MovieItemProps = {
  movie: Movie;
};

export default function MovieItem({ movie }: MovieItemProps) {
  const releaseYear = movie.release_date.slice(0, 4);
<<<<<<< Updated upstream
  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w185${movie.poster_path}`
    : null;
=======
  const posterUrl = movie.poster_path ? `https://image.tmdb.org/t/p/w185${movie.poster_path}` : null;
>>>>>>> Stashed changes
  const rating = movie.vote_average.toFixed(1);

  return (
    <div className="movie-card">
<<<<<<< Updated upstream
      {posterUrl ? (
        <img
          className="movie-poster"
          src={posterUrl}
          alt={`Affiche de ${movie.title}`}
        />
      ) : (
        <div />
      )}
=======
      {posterUrl ? <img className="movie-poster" src={posterUrl} alt={`Affiche de ${movie.title}`} /> : <div />}
>>>>>>> Stashed changes
      <div className="movie-card__content">
        <h2>{movie.title}</h2>
        <p>
          {releaseYear} · Note {rating}
        </p>
      </div>
    </div>
  );
<<<<<<< Updated upstream
}
=======
}
>>>>>>> Stashed changes
