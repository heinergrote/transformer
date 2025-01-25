import { Injectable } from '@angular/core';
import {Point} from 'fabric';

@Injectable({
  providedIn: 'root'
})
export class HomographyFinderService {

  constructor() { }

  /**
   * Solves a system M * x = B using Gauss-Jordan elimination.
   * M is an n x n matrix, B is length n vector. Both are arrays of numbers.
   * Returns an array 'x' of length n.
   */
  private gaussJordanSolve(M:number[][], B:number[]) {
    const n = M.length;

    // Copy M to a new matrix (to avoid mutating original)
    let A = new Array<number[]>(n);
    for (let i = 0; i < n; i++) {
      A[i] = M[i].slice(); // shallow copy row
    }

    // Copy B to a new array
    let b = B.slice();

    // For each column, pivot and eliminate
    for (let col = 0; col < n; col++) {
      // Find pivot row
      let pivot = col;
      let maxAbs = Math.abs(A[col][col]);
      for (let r = col + 1; r < n; r++) {
        if (Math.abs(A[r][col]) > maxAbs) {
          pivot = r;
          maxAbs = Math.abs(A[r][col]);
        }
      }
      if (pivot !== col) {
        // swap row pivot and col
        [A[col], A[pivot]] = [A[pivot], A[col]];
        [b[col], b[pivot]] = [b[pivot], b[col]];
      }

      // Pivot value
      const pivotVal = A[col][col];
      if (Math.abs(pivotVal) < 1e-12) {
        throw new Error("Matrix is singular or nearly singular.");
      }

      // Normalize pivot row
      for (let c = col; c < n; c++) {
        A[col][c] /= pivotVal;
      }
      b[col] /= pivotVal;

      // Eliminate below and above
      for (let r = 0; r < n; r++) {
        if (r !== col) {
          const factor = A[r][col];
          for (let c = col; c < n; c++) {
            A[r][c] -= factor * A[col][c];
          }
          b[r] -= factor * b[col];
        }
      }
    }
    return b; // now b is the solution
  }

  /**
   * Computes the 3x3 projective transform that maps each of the four src points
   * to the corresponding dst point. Each is an array of four [x, y] pairs.
   * Returns a 3x3 matrix H as a 2D array:
   *   [ [a, b, c],
   *     [d, e, f],
   *     [g, h, 1] ]
   */
  findHomography(srcPoints: Point[], dstPoints: Point[]) {
    // Build the 8x8 matrix M and 8x1 vector B
    const M:number[][] = []
    const B:number[] = []

    for (let i = 0; i < 4; i++) {
      const [x, y] = [srcPoints[i].x, srcPoints[i].y]
      const [X, Y] = [dstPoints[i].x, dstPoints[i].y]
      // First row (for X)
      M.push([x, y, 1, 0, 0, 0, -X * x, -X * y]);
      B.push(X);
      // Second row (for Y)
      M.push([0, 0, 0, x, y, 1, -Y * x, -Y * y]);
      B.push(Y);
    }

    // Solve M * h = B for h = [a, b, c, d, e, f, g, h]
    const h = this.gaussJordanSolve(M, B);

    // Construct the homography matrix. We fix the last entry to 1.
    return [
      [h[0], h[1], h[2]],
      [h[3], h[4], h[5]],
      [h[6], h[7], 1]
    ];
  }



}
