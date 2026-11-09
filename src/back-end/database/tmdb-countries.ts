import type { Country } from './country-repository';

type TmdbCountry = {
  iso_3166_1: string;
  english_name: string;
};

export async function fetchTmdbCountries(
  accessToken: string,
): Promise<Country[]> {
  const response = await fetch(
    'https://api.themoviedb.org/3/configuration/countries',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json;charset=utf-8',
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `TMDB countries request failed with status ${response.status}`,
    );
  }

  const countries = (await response.json()) as TmdbCountry[];
  return countries.map(({ iso_3166_1, english_name }) => ({
    code: iso_3166_1,
    name: english_name,
  }));
}
