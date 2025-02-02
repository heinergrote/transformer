import {
  AfterViewInit,
  Component, computed, effect,
  ElementRef,
  signal, viewChild,
} from '@angular/core';
import {DecimalPipe, NgStyle} from '@angular/common';
import {
  findHomographyMatrix,
  TransformType
} from '../util/homography';
import {FormControl, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {TransformerView} from '../util/transformer-view';

interface XY {x:number, y:number}

@Component({
  selector: 'app-transformer',
  imports: [
    DecimalPipe,
    NgStyle,
    ReactiveFormsModule,
  ],
  templateUrl: './transformer.component.html',
  styleUrl: './transformer.component.css'
})
export class TransformerComponent implements AfterViewInit {

  viewContainer = viewChild.required<ElementRef<HTMLElement>>('viewContainer')
  transformerView: TransformerView | undefined;

  transformType = signal<TransformType>("perspective")
  types: TransformType[] = ["perspective", "affine", "partialAffine"];

  srcPoints = signal<XY[]>([])
  destPoints = signal<XY[]>([])

  transform = computed(() => {
    return findHomographyMatrix(this.transformType(), this.srcPoints(), this.destPoints())
  })

  cssTransformMatrix3d = computed(() => "matrix3d(" +
    this.transform().a + ',' + this.transform().d + ',0,' + this.transform().g + ',' +
    this.transform().b + ',' + this.transform().e + ',0,' + this.transform().h + ',' +
    '0,0,1,0,' +
    this.transform().c + ',' + this.transform().f + ',0,' + this.transform().i +")")

  svgTransformMatrix = computed(() => "matrix(" +
    this.transform().a + " " + this.transform().d + " " + this.transform().b + " " +
    this.transform().e + " " + this.transform().c + " " + this.transform().f + ")")

  srcPointsForm: FormGroup  = new FormGroup({
    sx1: new FormControl(0),
    sy1: new FormControl(0),
    sx2: new FormControl(0),
    sy2: new FormControl(0),
    sx3: new FormControl(0),
    sy3: new FormControl(0),
    sx4: new FormControl(0),
    sy4: new FormControl(0),
  });

  destPointsForm: FormGroup  = new FormGroup({
    dx1: new FormControl(0),
    dy1: new FormControl(0),
    dx2: new FormControl(0),
    dy2: new FormControl(0),
    dx3: new FormControl(0),
    dy3: new FormControl(0),
    dx4: new FormControl(0),
    dy4: new FormControl(0),
  });

  constructor() {

    this.srcPointsForm.valueChanges.subscribe(() => {
      this.srcPoints.set(this.srcPoints().map((_, i) => ({
        x: this.srcPointsForm.get(`sx${i + 1}`)?.value,
        y: this.srcPointsForm.get(`sy${i + 1}`)?.value
      })))
    })

    this.destPointsForm.valueChanges.subscribe(() => {
      this.destPoints.set(this.destPoints().map((_, i) => ({
        x: this.destPointsForm.get(`dx${i + 1}`)?.value,
        y: this.destPointsForm.get(`dy${i + 1}`)?.value
      })))
    })

    effect(() => {
      const src = this.srcPoints()
      this.srcPoints().forEach((point, i) => {
        this.srcPointsForm.controls[`sx${i+1}`].setValue(point.x, {emitEvent: false})
        this.srcPointsForm.controls[`sy${i+1}`].setValue(point.y, {emitEvent: false})
      });
      this.transformerView?.updateSrcPoints(src)
    })

    effect(() => {
      const dest = this.destPoints()
      this.destPoints().forEach((point, i) => {
        this.destPointsForm.controls[`dx${i+1}`].setValue(point.x, {emitEvent: false})
        this.destPointsForm.controls[`dy${i+1}`].setValue(point.y, {emitEvent: false})
      });
      this.transformerView?.updateDestPoints(dest)
    })

    // render the display when the transformationMatrix changes
    effect(() => {
      const tm = this.transform()
      this.transformerView?.applyTransformation(tm)
    });

  }

  ngAfterViewInit(): void {

    this.srcPoints.set(this.getDefaultPoints(this.transformType()))
    this.destPoints.set(this.getDefaultPoints(this.transformType()))

    const transformerView = new TransformerView(
      (points: XY[]) => this.srcPoints.set(points),
      (points: XY[]) => this.destPoints.set(points)
    )
    this.transformerView = transformerView

    transformerView.ready.then(() => {
      transformerView.appendTo(this.viewContainer().nativeElement)
      transformerView.initPoints(this.srcPoints(), this.destPoints())
    })
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

  onResetSrc() {
    this.srcPoints.set(this.getDefaultPoints(this.transformType()))
  }
  onResetDest() {
    this.destPoints.set(this.getDefaultPoints(this.transformType()))
  }

}


