import {Component, computed, input} from '@angular/core';
import {findHomographyMatrix, identityMatrix, TransformMatrix} from '../../util/homography';
import {DecimalPipe} from '@angular/common';

@Component({
  selector: 'app-matrix',
  imports: [
    DecimalPipe
  ],
  templateUrl: './matrix.component.html',
  styleUrl: './matrix.component.css'
})
export class MatrixComponent {

  transform = input.required<TransformMatrix>()

}
