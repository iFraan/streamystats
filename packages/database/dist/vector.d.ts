/**
 * Normalize a vector to unit length.
 * Returns the original vector if the norm is near-zero (< 1e-10).
 */
export declare function normalizeVector(vec: number[]): number[];
/**
 * Convert a number array to a pgvector literal string, e.g. `[0.1,0.2,0.3]`.
 */
export declare function toPgVectorLiteral(value: number[]): string;
//# sourceMappingURL=vector.d.ts.map