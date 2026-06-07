export interface UserTasteEmbeddingInput {
  userId: string;
  userName: string;
  embedding: number[];
  itemCount: number;
  lastCalculatedAt: Date;
}

export interface UserTasteSimilarityCell {
  userId: string;
  userName: string;
  similarity: number | null;
}

export interface UserTasteSimilarityRow {
  userId: string;
  userName: string;
  itemCount: number;
  lastCalculatedAt: Date;
  cells: UserTasteSimilarityCell[];
}

export interface UserTasteSimilarityPair {
  leftUserId: string;
  leftUserName: string;
  rightUserId: string;
  rightUserName: string;
  similarity: number;
}

export interface UserTasteSimilarityResult {
  users: UserTasteEmbeddingInput[];
  matrix: UserTasteSimilarityRow[];
  pairs: UserTasteSimilarityPair[];
}

export function calculateCosineSimilarity(
  left: number[],
  right: number[],
): number | null {
  if (left.length === 0 || left.length !== right.length) {
    return null;
  }

  let dotProduct = 0;
  let leftNorm = 0;
  let rightNorm = 0;

  for (let index = 0; index < left.length; index++) {
    const leftValue = left[index];
    const rightValue = right[index];
    dotProduct += leftValue * rightValue;
    leftNorm += leftValue * leftValue;
    rightNorm += rightValue * rightValue;
  }

  if (leftNorm === 0 || rightNorm === 0) {
    return null;
  }

  const rawSimilarity =
    dotProduct / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
  if (Math.abs(rawSimilarity - 1) < 1e-12) {
    return 1;
  }
  if (Math.abs(rawSimilarity) < 1e-12) {
    return 0;
  }

  return Math.max(0, Math.min(1, rawSimilarity));
}

export function buildUserTasteSimilarity(
  users: UserTasteEmbeddingInput[],
): UserTasteSimilarityResult {
  const pairs: UserTasteSimilarityPair[] = [];
  const matrix: UserTasteSimilarityRow[] = [];

  for (let leftIndex = 0; leftIndex < users.length; leftIndex++) {
    const leftUser = users[leftIndex];
    const cells: UserTasteSimilarityCell[] = [];

    for (let rightIndex = 0; rightIndex < users.length; rightIndex++) {
      const rightUser = users[rightIndex];
      let similarity: number | null;

      if (leftIndex === rightIndex) {
        similarity = 1;
      } else if (leftIndex > rightIndex) {
        similarity = matrix[rightIndex]?.cells[leftIndex]?.similarity ?? null;
      } else {
        similarity = calculateCosineSimilarity(
          leftUser.embedding,
          rightUser.embedding,
        );
      }

      if (rightIndex > leftIndex && similarity !== null) {
        pairs.push({
          leftUserId: leftUser.userId,
          leftUserName: leftUser.userName,
          rightUserId: rightUser.userId,
          rightUserName: rightUser.userName,
          similarity,
        });
      }

      cells.push({
        userId: rightUser.userId,
        userName: rightUser.userName,
        similarity,
      });
    }

    matrix.push({
      userId: leftUser.userId,
      userName: leftUser.userName,
      itemCount: leftUser.itemCount,
      lastCalculatedAt: leftUser.lastCalculatedAt,
      cells,
    });
  }

  pairs.sort((leftPair, rightPair) => {
    if (rightPair.similarity !== leftPair.similarity) {
      return rightPair.similarity - leftPair.similarity;
    }

    const leftNames = `${leftPair.leftUserName} ${leftPair.rightUserName}`;
    const rightNames = `${rightPair.leftUserName} ${rightPair.rightUserName}`;
    return leftNames.localeCompare(rightNames);
  });

  return {
    users,
    matrix,
    pairs,
  };
}
