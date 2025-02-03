import {Component, input, Input, output, signal} from '@angular/core';
import {TransformType} from '../../util/homography';

@Component({
  selector: 'app-type-select',
  imports: [],
  templateUrl: './type-select.component.html',
  styleUrl: './type-select.component.css'
})
export class TypeSelectComponent {

  transformType = input.required<TransformType>()
  types: TransformType[] = ["perspective", "affine", "partialAffine"];

  transformTypeSelect = output<TransformType>()

}
