import {Component, computed, effect, inject, NgZone, OnInit, signal} from '@angular/core';
import {BaseFabricObject, Canvas, Circle, Point} from 'fabric';
import {DecimalPipe} from '@angular/common';

@Component({
  selector: 'app-canvas',
  imports: [
    DecimalPipe
  ],
  templateUrl: './canvas.component.html',
  styleUrl: './canvas.component.css'
})
export class CanvasComponent implements OnInit {
  private zone = inject(NgZone)

  s1 = signal<Point>(new Point(0, 0));
  s2 = signal<Point>(new Point(400, 0));
  s3 = signal<Point>(new Point(400, 400));
  s4 = signal<Point>(new Point(0, 400));

  d1 = signal<Point>(new Point(0, 0));
  d2 = signal<Point>(new Point(400, 0));
  d3 = signal<Point>(new Point(400, 400));
  d4 = signal<Point>(new Point(0, 400));


  homography = computed(() => {
    console.log("Computing homography")
    return this.findHomography([this.s1(), this.s2(), this.s3(), this.s4()], [this.d1(), this.d2(), this.d3(), this.d4()])
  });

  inputs : Point[] = []

  outputs = computed(() => {
    console.log("Computing outputs")
    return this.inputs.map((input) => {
      const [x, y] = [input.x, input.y]
      const h = this.homography()
      const d = h[2][0] * x + h[2][1] * y + h[2][2]
      return new Point(
        (h[0][0] * x + h[0][1] * y + h[0][2]) / d,
        (h[1][0] * x + h[1][1] * y + h[1][2]) / d
      )
    })
  });

  c1: Circle
  c2: Circle
  c3: Circle
  c4: Circle

  outputCircles: Circle[] = []

  protected canvas?: Canvas;

  constructor() {
    BaseFabricObject.ownDefaults.originX = 'center'
    BaseFabricObject.ownDefaults.originY = 'center'

    this.c1 = this.createCircle(this.d1().x, this.d1().y, 20, false);
    this.c1.on("moving", (_) => this.d1.set(this.c1.getXY()));
    this.c2 = this.createCircle(this.d2().x, this.d2().y, 20, false);
    this.c2.on("moving", (_) => this.d2.set(this.c2.getXY()));
    this.c3 = this.createCircle(this.d3().x, this.d3().y, 20, false );
    this.c3.on("moving", (_) => this.d3.set(this.c3.getXY()));
    this.c4 = this.createCircle(this.d4().x, this.d4().y, 20, false);
    this.c4.on("moving", (_) => this.d4.set(this.c4.getXY()));

    for (let x = 0; x <= 400; x+=20) {
      for (let y = 0; y <= 400; y+=20) {
        this.inputs.push(new Point(x, y))
      }
    }

    this.outputs().length
    for (let i = 0; i < this.outputs().length; i++) {
      this.outputCircles.push(this.createCircle(1,1, 1, true))
    }

    effect(() => {
      console.log("Updating circles")
      for (let i = 0; i < this.outputs().length; i++) {
        this.outputCircles[i].setXY(this.outputs()[i])
      }
      this.canvas?.renderAll()
    });

  }

  public ngOnInit(): void {

    this.zone.runOutsideAngular( () => {
      this.canvas = new Canvas('fabricSurface', {
        backgroundColor: '#ebebef',
        selection: true,
        preserveObjectStacking: true,
      });

      this.canvas.add(this.c1);
      this.canvas.add(this.c2);
      this.canvas.add(this.c3);
      this.canvas.add(this.c4);
      for (let i = 0; i < this.outputs().length; i++) {
        this.canvas.add(this.outputCircles[i])
      }

    });
  }


  createCircle(x:number, y:number, radius: number, filled: boolean) : Circle {
    return new Circle({
      left: x,
      top: y,
      stroke: "#000000",
      fill: filled ? "#000000" : "transparent",
      radius: radius,
      lockRotation: true,
      lockScalingX: true,
      lockScalingY: true,
      hasControls: false
    })
  }



  /**
   * Solves a system M * x = B using Gauss-Jordan elimination.
   * M is an n x n matrix, B is length n vector. Both are arrays of numbers.
   * Returns an array 'x' of length n.
   */
  gaussJordanSolve(M:number[][], B:number[]) {
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
