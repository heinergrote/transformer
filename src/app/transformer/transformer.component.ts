import {Component, computed, signal} from '@angular/core';
import {findHomographyMatrix, TransformType} from '../util/homography';
import {MatrixComponent} from './matrix/matrix.component';
import {XY} from '../util/xy';
import {PointsFormComponent} from './points-form/points-form.component';
import {CssViewComponent} from './css-view/css-view.component';
import {SvgViewComponent} from './svg-view/svg-view.component';
import {CanvasViewComponent} from './canvas-view/canvas-view.component';
import {TypeSelectComponent} from './type-select/type-select.component';

@Component({
  selector: 'app-transformer',
  imports: [
    MatrixComponent,
    PointsFormComponent,
    CssViewComponent,
    SvgViewComponent,
    CanvasViewComponent,
    TypeSelectComponent,
  ],
  templateUrl: './transformer.component.html',
  styleUrl: './transformer.component.css'
})
export class TransformerComponent  {

  transformType = signal<TransformType>("perspective")
  srcPoints = signal<XY[]>([])
  destPoints = signal<XY[]>([])

  transform = computed(() => {
    return findHomographyMatrix(this.transformType(), this.srcPoints(), this.destPoints())
  })

  constructor() {
    this.srcPoints.set(this.getDefaultPoints(this.transformType()))
    this.destPoints.set(this.getDefaultPoints(this.transformType()))
  }

  getDefaultPoints(type: TransformType) : XY[] {

    const padding = 0
    const size = 400

    switch (type) {
      case "perspective":
        return [
          {x: padding, y: padding},
          {x: size-padding, y: padding},
          {x: size-padding, y: size-padding},
          {x: padding, y: size-padding}
        ]
      case "affine":
        return [
          {x: size/2, y: padding},
          {x: size-padding, y: size-padding},
          {x: padding, y: size-padding}
        ]
      case "partialAffine":
        return [
          {x: padding, y: size/2},
          {x: size-padding, y: size/2}
        ]
    }

  }

  onTransformType(type: TransformType) {
    this.transformType.set(type)
    this.srcPoints.set(this.getDefaultPoints(type))
    this.destPoints.set(this.getDefaultPoints(type))
  }

}


