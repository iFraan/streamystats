"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeVector = normalizeVector;
exports.toPgVectorLiteral = toPgVectorLiteral;
/**
 * Normalize a vector to unit length.
 * Returns the original vector if the norm is near-zero (< 1e-10).
 */
function normalizeVector(vec) {
    let norm = 0;
    for (const v of vec)
        norm += v * v;
    norm = Math.sqrt(norm);
    if (norm < 1e-10)
        return vec;
    return vec.map((v) => v / norm);
}
/**
 * Convert a number array to a pgvector literal string, e.g. `[0.1,0.2,0.3]`.
 */
function toPgVectorLiteral(value) {
    return `[${value.join(",")}]`;
}
//# sourceMappingURL=vector.js.map