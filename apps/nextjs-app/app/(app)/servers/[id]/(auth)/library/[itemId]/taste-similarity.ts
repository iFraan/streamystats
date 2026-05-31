export interface TasteSimilarityBadge {
  label: string;
  className: string;
}

export function getTasteSimilarityBadge(
  similarity: number | null,
): TasteSimilarityBadge | null {
  if (similarity === null) {
    return null;
  }

  const className =
    similarity >= 0.8
      ? "text-green-500"
      : similarity >= 0.6
        ? "text-blue-500"
        : "text-yellow-500";

  return {
    label: `${Math.round(similarity * 100)}% vs user taste`,
    className,
  };
}
