import {AfterViewInit, Component, effect, ElementRef, input, model, OnDestroy, signal, viewChild} from '@angular/core';
import {TransformerView} from '../../util/transformer-view';
import {XY} from '../../util/xy';
import {identityMatrix, TransformMatrix} from '../../util/homography';

@Component({
  selector: 'app-canvas-view',
  imports: [],
  templateUrl: './canvas-view.component.html',
  styleUrl: './canvas-view.component.css'
})
export class CanvasViewComponent implements AfterViewInit, OnDestroy {

  viewContainer = viewChild.required<ElementRef<HTMLElement>>('viewContainer')
  transformerView: TransformerView | undefined;

  srcPoints = model<XY[]>([])
  destPoints = model<XY[]>([])
  transform = input<TransformMatrix>(identityMatrix)

  constructor() {

    effect(() => {
      const src = this.srcPoints()
      this.transformerView?.updateSrcPoints(src)
    })

    effect(() => {
      const dest = this.destPoints()
      this.transformerView?.updateDestPoints(dest)
    })

    // render the display when the transformationMatrix changes
    effect(() => {
      const tm = this.transform()
      this.transformerView?.applyTransformation(tm)
    });

  }

  ngAfterViewInit(): void {

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

  ngOnDestroy(): void {
    this.transformerView?.destroy()
  }

}
